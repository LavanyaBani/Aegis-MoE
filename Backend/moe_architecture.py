# Name - Aegis MoE Model (Aegis) - 128D MoE Classifier
# Description - This is a 128-dimensional MoE classifier with 2 transformer blocks,
# 4 query heads, 2 key-value heads, and 4 experts per layer. It is designed for efficient
# processing of tabular transaction data with a mixture of experts architecture.
# Architect - D-One98(The MoEs)

import math
import torch
import torch.nn as nn
import torch.nn.functional as F

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def forward(self, x):
        norm = x.float() * torch.rsqrt(x.float().pow(2).mean(-1, keepdim=True) + self.eps)
        return self.weight * norm.type_as(x)

class GroupedQueryAttention(nn.Module):
    def __init__(self, embed_dim=128, num_q_heads=4, num_kv_heads=2):
        super().__init__()
        self.num_q_heads = num_q_heads
        self.num_kv_heads = num_kv_heads
        self.head_dim = embed_dim // num_q_heads
        self.num_groups = num_q_heads // num_kv_heads

        self.w_q = nn.Linear(embed_dim, num_q_heads * self.head_dim, bias=False)
        self.w_k = nn.Linear(embed_dim, num_kv_heads * self.head_dim, bias=False)
        self.w_v = nn.Linear(embed_dim, num_kv_heads * self.head_dim, bias=False)
        self.out_proj = nn.Linear(embed_dim, embed_dim, bias=False)

    def forward(self, x):
        B, S, D = x.shape
        Q = self.w_q(x).view(B, S, self.num_q_heads, self.head_dim).transpose(1, 2)
        K = self.w_k(x).view(B, S, self.num_kv_heads, self.head_dim).transpose(1, 2).repeat_interleave(self.num_groups, dim=1)
        V = self.w_v(x).view(B, S, self.num_kv_heads, self.head_dim).transpose(1, 2).repeat_interleave(self.num_groups, dim=1)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.head_dim)
        attn = F.softmax(scores, dim=-1)
        out = torch.matmul(attn, V).transpose(1, 2).contiguous().view(B, S, D)
        return self.out_proj(out)

class DomainExpert(nn.Module):
    def __init__(self, embed_dim, hidden_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.SiLU(),
            nn.Dropout(0.1),
            nn.Linear(hidden_dim, embed_dim)
        )

    def forward(self, x):
        return self.net(x)

class SparseMoERouterLayer(nn.Module):
    """
    True Top-K Sparse MoE Layer with Switch-Transformer Load Balancing Loss.
    Activates only top_k=2 out of 4 specialists per transaction token.
    """
    def __init__(self, embed_dim=128, num_experts=4, top_k=2):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.gate = nn.Linear(embed_dim, num_experts, bias=False)
        self.experts = nn.ModuleList([DomainExpert(embed_dim, embed_dim * 3) for _ in range(num_experts)])

    def forward(self, x):
        B, S, D = x.shape
        x_flat = x.view(-1, D)

        logits = self.gate(x_flat)
        probs = F.softmax(logits, dim=-1)

        top_k_weights, top_k_indices = torch.topk(probs, self.top_k, dim=-1)
        top_k_weights = top_k_weights / (top_k_weights.sum(dim=-1, keepdim=True) + 1e-8)

        mask_one_hot = F.one_hot(top_k_indices[:, 0], num_classes=self.num_experts).float()
        density = mask_one_hot.mean(dim=0)
        mean_prob = probs.mean(dim=0)
        aux_loss = self.num_experts * torch.sum(density * mean_prob)

        out_flat = torch.zeros_like(x_flat)
        for exp_id, expert in enumerate(self.experts):
            match_mask = (top_k_indices == exp_id).float()
            exp_weight = (match_mask * top_k_weights).sum(dim=-1, keepdim=True)
            out_flat = out_flat + expert(x_flat) * exp_weight
            
        expert_contrib = probs.view(B, S, self.num_experts).mean(dim=1)
        return out_flat.view(B, S, D), expert_contrib, aux_loss

class AegisMoEModel(nn.Module):
    def __init__(self, embed_dim=128, num_layers=2, num_experts=4, top_k=2):
        super().__init__()
        self.domain_encoders = nn.ModuleList([nn.Linear(4, embed_dim) for _ in range(4)])
        self.pos_emb = nn.Parameter(torch.randn(1, 4, embed_dim) * 0.02)

        self.attn_layers = nn.ModuleList([GroupedQueryAttention(embed_dim) for _ in range(num_layers)])
        self.norm1 = nn.ModuleList([RMSNorm(embed_dim) for _ in range(num_layers)])
        self.moe_layers = nn.ModuleList([SparseMoERouterLayer(embed_dim, num_experts, top_k) for _ in range(num_layers)])
        self.norm2 = nn.ModuleList([RMSNorm(embed_dim) for _ in range(num_layers)])

        self.final_norm = RMSNorm(embed_dim)
        self.head = nn.Sequential(
            nn.Linear(embed_dim + 4, 64),
            nn.SiLU(),
            nn.Linear(64, 1)
        )

    def forward(self, x):
        views = torch.chunk(x, 4, dim=-1)
        tokens = torch.stack([enc(v) for enc, v in zip(self.domain_encoders, views)], dim=1) + self.pos_emb

        domain_priors = torch.stack([v.mean(dim=-1) for v in views], dim=-1)

        total_contrib = 0
        total_aux_loss = 0.0
        h = tokens
        for attn, n1, moe, n2 in zip(self.attn_layers, self.norm1, self.moe_layers, self.norm2):
            h = h + attn(n1(h))
            moe_out, contrib, aux = moe(n2(h))
            h = h + moe_out
            total_contrib = total_contrib + contrib
            total_aux_loss = total_aux_loss + aux

        avg_contrib = F.softmax((total_contrib / len(self.moe_layers)) + domain_priors, dim=-1)
        pooled = self.final_norm(h).mean(dim=1)
        logits = self.head(torch.cat([pooled, avg_contrib], dim=-1)).squeeze(-1)
        return logits, avg_contrib, total_aux_loss

class SingleDenseBaseline(nn.Module):
    """Standard single-model classifier for benchmark comparison."""
    def __init__(self, in_dim=16, hidden_dim=256):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(in_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, x):
        return self.net(x).squeeze(-1)