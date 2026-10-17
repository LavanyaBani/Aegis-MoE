import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class GroupedQueryAttention(nn.Module):
    def __init__(self, embed_dim=512, num_q_heads=8, num_kv_heads=2):
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
        K = self.w_k(x).view(B, S, self.num_kv_heads, self.head_dim).transpose(1, 2)
        V = self.w_v(x).view(B, S, self.num_kv_heads, self.head_dim).transpose(1, 2)

        K = K.repeat_interleave(self.num_groups, dim=1) 
        V = V.repeat_interleave(self.num_groups, dim=1)

        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.head_dim)
        
        causal_mask = torch.ones(S, S, device=x.device, dtype=torch.bool).tril()
        causal_mask = causal_mask.unsqueeze(0).unsqueeze(0)
        scores = scores.masked_fill(~causal_mask, torch.finfo(scores.dtype).min)

        attn_weights = F.softmax(scores, dim=-1)
        output = torch.matmul(attn_weights, V)

        output = output.transpose(1, 2).contiguous().view(B, S, D)
        return self.out_proj(output)

class Expert(nn.Module):
    def __init__(self, embed_dim, hidden_dim):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(embed_dim, hidden_dim),
            nn.SiLU(),
            nn.Linear(hidden_dim, embed_dim)
        )

    def forward(self, x):
        return self.net(x)

class MoELayer(nn.Module):
    def __init__(self, embed_dim, num_experts=4, top_k=2):
        super().__init__()
        self.num_experts = num_experts
        self.top_k = top_k
        self.gate = nn.Linear(embed_dim, num_experts, bias=False)
        self.experts = nn.ModuleList([
            Expert(embed_dim, embed_dim * 4) for _ in range(num_experts)
        ])

    def forward(self, x):
        B, S, D = x.shape
        x_flat = x.view(-1, D)
        
        router_logits = self.gate(x_flat)
        routing_weights = F.softmax(router_logits, dim=-1)
        
        top_k_weights, top_k_indices = torch.topk(routing_weights, self.top_k, dim=-1)
        top_k_weights = top_k_weights / top_k_weights.sum(dim=-1, keepdim=True)
        
        final_output = torch.zeros_like(x_flat)
        
        for i in range(self.top_k):
            expert_idx = top_k_indices[:, i]
            expert_weight = top_k_weights[:, i].unsqueeze(-1)
            
            for exp_id, expert in enumerate(self.experts):
                token_mask = (expert_idx == exp_id)
                if token_mask.any():
                    expert_input = x_flat[token_mask]
                    expert_out = expert(expert_input)
                    final_output[token_mask] += expert_out * expert_weight[token_mask]
                    
        return final_output.view(B, S, D)

class RMSNorm(nn.Module):
    def __init__(self, dim, eps=1e-6):
        super().__init__()
        self.eps = eps
        self.weight = nn.Parameter(torch.ones(dim))

    def _norm(self, x):
        return x * torch.rsqrt(x.pow(2).mean(-1, keepdim=True) + self.eps)

    def forward(self, x):
        return self.weight * self._norm(x.float()).type_as(x)

class MoETransformerBlock(nn.Module):
    def __init__(self, embed_dim=512, num_q_heads=8, num_kv_heads=2, num_experts=4, top_k=2):
        super().__init__()
        self.attention_norm = RMSNorm(embed_dim)
        self.ffn_norm = RMSNorm(embed_dim)
        
        self.attention = GroupedQueryAttention(embed_dim, num_q_heads, num_kv_heads)
        self.moe = MoELayer(embed_dim, num_experts, top_k)

    def forward(self, x):
        h = x + self.attention(self.attention_norm(x))
        out = h + self.moe(self.ffn_norm(h))        
        return out

class MoE_LLM(nn.Module):
    def __init__(self, vocab_size=32000, embed_dim=768, max_seq_len=1024, num_layers=12, 
                 num_q_heads=12, num_kv_heads=4, num_experts=8, top_k=2):
        super().__init__()
        
        self.tok_embeddings = nn.Embedding(vocab_size, embed_dim)
        self.pos_embeddings = nn.Embedding(max_seq_len, embed_dim)
        
        self.layers = nn.ModuleList([
            MoETransformerBlock(embed_dim, num_q_heads, num_kv_heads, num_experts, top_k)
            for _ in range(num_layers)
        ])
        
        self.norm = RMSNorm(embed_dim)
        self.output = nn.Linear(embed_dim, vocab_size, bias=False)
        
        self.output.weight = self.tok_embeddings.weight
        
    def forward(self, tokens):
        B, S = tokens.shape
        positions = torch.arange(0, S, dtype=torch.long, device=tokens.device)
        h = self.tok_embeddings(tokens) + self.pos_embeddings(positions)
        
        for layer in self.layers:
            h = layer(h)
            
        h = self.norm(h)
        logits = self.output(h) 
        return logits

if __name__ == "__main__":
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Running on engine: {device.upper()}")
    
    dummy_tokens = torch.randint(0, 32000, (1, 10)).to(device)
    
    d_one_model = MoE_LLM(
        vocab_size=32000, 
        embed_dim=768,
        num_layers=12,
        num_q_heads=12, 
        num_kv_heads=4, 
        num_experts=8,
        top_k=2
    ).to(device)
    
    # Forward Pass
    logits = d_one_model(dummy_tokens)
    print("Final Model Output Shape:", logits.shape)
    total_params = sum(p.numel() for p in d_one_model.parameters())
    print(f"Total Parameters: {total_params / 1e6:.2f} Million")