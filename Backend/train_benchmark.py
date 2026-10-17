import os
import json
import time
import platform
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from sklearn.model_selection import train_test_split
from sklearn.metrics import average_precision_score, confusion_matrix

from Backend.data_engine import FEATURE_COLS, build_unified_dataset as build_dataset
from Backend.moe_architecture import AegisMoEModel, SingleDenseBaseline

def precision_recall_at_k(y_true, y_scores, k=100):
    top_k_idx = np.argsort(y_scores)[::-1][:k]
    prec = np.mean(y_true[top_k_idx])
    rec = np.sum(y_true[top_k_idx]) / max(np.sum(y_true), 1)
    return float(prec), float(rec)

def run_training_and_benchmark(epochs=8, batch_size=256):
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Benchmark] Running on device: {device.upper()} | Arch: {platform.machine()}")

    csv_path = "data/synthetic/unified_enriched_transactions.csv"
    df = pd.read_csv(csv_path) if os.path.exists(csv_path) else build_dataset()

    X = df[FEATURE_COLS].values.astype(np.float32)
    y = df["label"].values.astype(np.float32)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    train_ds = torch.utils.data.TensorDataset(torch.tensor(X_train), torch.tensor(y_train))
    train_loader = torch.utils.data.DataLoader(train_ds, batch_size=batch_size, shuffle=True)

    # 1. Train Aegis-MoE
    moe_model = AegisMoEModel().to(device)
    opt_moe = torch.optim.AdamW(moe_model.parameters(), lr=3e-3, weight_decay=1e-4)
    pos_weight = torch.tensor([(len(y_train) - y_train.sum()) / max(y_train.sum(), 1)]).to(device)
    criterion = nn.BCEWithLogitsLoss(pos_weight=pos_weight)

    moe_model.train()
    for ep in range(epochs):
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            opt_moe.zero_grad()
            logits, _, aux_loss = moe_model(bx)
            loss = criterion(logits, by) + 0.02 * aux_loss
            loss.backward()
            opt_moe.step()

    # 2. Train Baseline
    base_model = SingleDenseBaseline().to(device)
    opt_base = torch.optim.AdamW(base_model.parameters(), lr=3e-3)
    base_model.train()
    for ep in range(epochs):
        for bx, by in train_loader:
            bx, by = bx.to(device), by.to(device)
            opt_base.zero_grad()
            loss = criterion(base_model(bx), by)
            loss.backward()
            opt_base.step()

    # 3. Evaluate & Latency Benchmark
    moe_model.eval()
    base_model.eval()
    X_test_t = torch.tensor(X_test).to(device)

    latencies_ms = []
    with torch.no_grad():
        for i in range(min(200, len(X_test_t))):
            sample = X_test_t[i:i+1]
            t0 = time.perf_counter()
            _ = moe_model(sample)
            latencies_ms.append((time.perf_counter() - t0) * 1000.0)

        t_batch_start = time.perf_counter()
        moe_logits, moe_routing, _ = moe_model(X_test_t)
        batch_elapsed = time.perf_counter() - t_batch_start
        moe_probs = torch.sigmoid(moe_logits).cpu().numpy()
        base_probs = torch.sigmoid(base_model(X_test_t)).cpu().numpy()

    pr_auc_moe = float(average_precision_score(y_test, moe_probs))
    pr_auc_base = float(average_precision_score(y_test, base_probs))
    p_at_100, r_at_100 = precision_recall_at_k(y_test, moe_probs, k=100)
    tn, fp, fn, tp = confusion_matrix(y_test, (moe_probs >= 0.5).astype(int)).ravel()

    os.makedirs("Backend/artifacts", exist_ok=True)
    pt_path = "Backend/artifacts/aegis_moe_weights.pt"
    onnx_path = "Backend/artifacts/aegis_moe.onnx"
    torch.save(moe_model.state_dict(), pt_path)

    # 4. Export Portable ONNX Graph for IBM Z17 Telum / s390x Acceleration
    onnx_exported = False
    try:
        moe_cpu = AegisMoEModel().to("cpu")
        moe_cpu.load_state_dict(torch.load(pt_path, map_location="cpu"))
        moe_cpu.eval()
        dummy_in = torch.randn(1, 16, dtype=torch.float32)
        torch.onnx.export(
            moe_cpu,
            dummy_in,
            onnx_path,
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["features"],
            output_names=["logits", "expert_routing", "aux_loss"],
            dynamic_axes={"features": {0: "batch_size"}, "logits": {0: "batch_size"}, "expert_routing": {0: "batch_size"}},
            dynamo=False
        )
        onnx_exported = True
        print(f"[Benchmark] ONNX model successfully exported -> {onnx_path}")
    except Exception as e:
        print(f"[Benchmark] ONNX export skipped (install onnxscript/onnx if needed): {e}")

    # Save a lightweight 300-row sample batch for instant API/LinuxONE simulation without needing the huge CSV
    sample_df = df.sample(n=min(300, len(df)), random_state=42)
    sample_df.to_csv("Backend/artifacts/demo_burst_stream.csv", index=False)

    metrics = {
        "hardware_arch": platform.machine(),
        "device": device,
        "onnx_ready": onnx_exported,
        "aegis_moe": {
            "pr_auc": round(pr_auc_moe, 4),
            "precision_at_100": round(p_at_100, 4),
            "recall_at_100": round(r_at_100, 4),
            "p50_latency_ms": round(float(np.percentile(latencies_ms, 50)), 3),
            "p95_latency_ms": round(float(np.percentile(latencies_ms, 95)), 3),
            "throughput_tx_per_sec": round(len(X_test) / max(batch_elapsed, 1e-6), 1),
            "confusion_matrix": {"tp": int(tp), "fp": int(fp), "tn": int(tn), "fn": int(fn)},
            "mean_expert_routing": {
                "Transaction_Expert": round(float(moe_routing[:, 0].mean()), 3),
                "Graph_Expert": round(float(moe_routing[:, 1].mean()), 3),
                "Temporal_Expert": round(float(moe_routing[:, 2].mean()), 3),
                "Offline_Anomaly_Expert": round(float(moe_routing[:, 3].mean()), 3)
            }
        },
        "single_model_baseline": {
            "pr_auc": round(pr_auc_base, 4)
        }
    }

    with open("Backend/artifacts/benchmark_metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)

    print("[Benchmark] Completed! Metrics saved to Backend/artifacts/benchmark_metrics.json")
    return metrics

if __name__ == "__main__":
    run_training_and_benchmark()