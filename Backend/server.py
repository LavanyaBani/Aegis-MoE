import os
import json
import time
import platform
import uuid
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import pandas as pd
import torch

try:
    import onnxruntime as ort
except ImportError:
    ort = None

from Backend.moe_architecture import AegisMoEModel
from Backend.data_engine import FEATURE_COLS

WEIGHTS_PATH = "Backend/artifacts/aegis_moe_weights.pt"
ONNX_PATH = "Backend/artifacts/aegis_moe.onnx"
DEMO_STREAM_PATH = "Backend/artifacts/demo_burst_stream.csv"
METRICS_PATH = "Backend/artifacts/benchmark_metrics.json"
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

MODEL = None
ORT_SESSION = None
ACTIVE_ENGINE = "NONE"
DEMO_DF = None
QUARANTINED_ENTITIES = set()

def generate_reason_signals(row):
    reasons = []
    if row.get("f_of_nonce_collision_risk", 0) > 0.5:
        reasons.append("Cryptographic Nonce Collision in Offline Batch")
    if row.get("f_of_clock_skew", 0) > 0.4:
        reasons.append("Hardware Secure-Element Clock Skew Detected")
    if row.get("f_gr_mule_ring_flag", 0) > 0.5 or row.get("f_gr_ego_density", 0) > 0.45:
        reasons.append("High-Density Sybil Device Cluster Link")
    if row.get("f_tx_balance_depletion", 0) > 0.65:
        reasons.append("Rapid Offline Wallet Limit Depletion (>65%)")
    if row.get("f_tm_burst_intensity", 0) > 0.7:
        reasons.append("Abnormal Deferred Reconnect Sync Velocity")
    if not reasons:
        reasons.append("Routine Multi-Expert Verification Passed")
    return reasons[:3]

def run_inference(X_batch: np.ndarray, engine_pref: str = "AUTO"):
    """Runs inference via ONNX Runtime (preferred for s390x/Telum) or PyTorch fallback."""
    normalized_engine = engine_pref.strip().upper()
    use_onnx = (ORT_SESSION is not None) and (
        normalized_engine in ["AUTO", "ONNX"] or normalized_engine.startswith("AUTO (")
    )
    t0 = time.perf_counter()

    if use_onnx:
        ort_inputs = {ORT_SESSION.get_inputs()[0].name: X_batch}
        available_outputs = {output.name for output in ORT_SESSION.get_outputs()}
        routing_name = next(
            (name for name in ("routing_weights", "expert_routing") if name in available_outputs),
            None,
        )
        if "logits" not in available_outputs or routing_name is None:
            raise RuntimeError(f"Unexpected ONNX outputs: {sorted(available_outputs)}")
        logits, routing = ORT_SESSION.run(["logits", routing_name], ort_inputs)
        probs = 1.0 / (1.0 + np.exp(-logits))
        engine_used = "ONNX_Runtime"
    else:
        with torch.no_grad():
            tensor_in = torch.tensor(X_batch, dtype=torch.float32).to(DEVICE)
            logits, routing_weights, _ = MODEL(tensor_in)
            probs = torch.sigmoid(logits).cpu().numpy()
            routing = routing_weights.cpu().numpy()
        engine_used = f"PyTorch_{DEVICE.upper()}"

    inference_ms = (time.perf_counter() - t0) * 1000.0
    return probs, routing, inference_ms, engine_used

@asynccontextmanager
async def lifespan(app: FastAPI):
    global MODEL, ORT_SESSION, ACTIVE_ENGINE, DEMO_DF
    if os.path.exists(WEIGHTS_PATH):
        MODEL = AegisMoEModel().to(DEVICE)
        MODEL.load_state_dict(torch.load(WEIGHTS_PATH, map_location=DEVICE))
        MODEL.eval()
        ACTIVE_ENGINE = f"PyTorch ({DEVICE.upper()})"

    if ort is not None and os.path.exists(ONNX_PATH):
        providers = ["CPUExecutionProvider"]
        if "CUDAExecutionProvider" in ort.get_available_providers():
            providers.insert(0, "CUDAExecutionProvider")
        ORT_SESSION = ort.InferenceSession(ONNX_PATH, providers=providers)
        ACTIVE_ENGINE = f"ONNX Runtime ({providers[0]}) + PyTorch"
        print(f"[Aegis-MoE Server] ONNX Engine Initialized: {ONNX_PATH}")

    if os.path.exists(DEMO_STREAM_PATH):
        DEMO_DF = pd.read_csv(DEMO_STREAM_PATH)
    yield

app = FastAPI(title="Aegis-MoE Enterprise Fraud & Offline-Sync Defense API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "online",
        "service": "Aegis-MoE",
        "model_loaded": MODEL is not None or ORT_SESSION is not None,
        "demo_stream_loaded": DEMO_DF is not None,
        "active_engine": ACTIVE_ENGINE,
    }

@app.get("/")
def root_status():
    return {
        "service": "Aegis-MoE Real-Time Fraud & Offline-Sync Engine",
        "status": "ONLINE",
        "architecture": platform.machine(),
        "active_engine": ACTIVE_ENGINE,
        "onnx_loaded": ORT_SESSION is not None,
        "pytorch_loaded": MODEL is not None,
        "quarantined_entities_count": len(QUARANTINED_ENTITIES)
    }

@app.get("/metrics")
def get_benchmark_metrics():
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            data = json.load(f)
        data["live_runtime_arch"] = platform.machine()
        data["onnx_loaded"] = ORT_SESSION is not None
        return data
    raise HTTPException(status_code=404, detail="Benchmark metrics not found.")

@app.get("/simulate-burst")
def simulate_sync_burst(
    batch_size: int = Query(40, ge=5, le=200),
    scenario_filter: str = Query("ALL"),
    engine: str = Query("AUTO", description="AUTO, ONNX, or PYTORCH")
):
    if (MODEL is None and ORT_SESSION is None) or DEMO_DF is None:
        raise HTTPException(status_code=500, detail="Model or Demo Stream not initialized.")

    df_pool = DEMO_DF if scenario_filter == "ALL" else DEMO_DF[DEMO_DF["scenario"] == scenario_filter]
    if len(df_pool) == 0:
        df_pool = DEMO_DF

    sampled = df_pool.sample(n=min(batch_size, len(df_pool)), replace=False)
    X_batch = sampled[FEATURE_COLS].values.astype(np.float32)

    probs, routing, inference_ms, engine_used = run_inference(X_batch, engine.upper())
    expert_names = ["Transaction_Expert", "Graph_Expert", "Temporal_Expert", "Offline_Anomaly_Expert"]

    alerts = []
    device_account_counts = DEMO_DF.groupby("device_id")["account_id"].nunique().to_dict()
    for idx, (_, row) in enumerate(sampled.iterrows()):
        score = float(probs[idx])
        r_weights = routing[idx]
        top_2_indices = np.argsort(r_weights)[::-1][:2]

        risk_band = "CRITICAL" if score >= 0.80 else ("MEDIUM" if score >= 0.40 else "LOW")
        is_quarantined = (row["device_id"] in QUARANTINED_ENTITIES) or (row["account_id"] in QUARANTINED_ENTITIES)

        alerts.append({
            "tx_id": row["tx_id"],
            "account_id": row["account_id"],
            "device_id": row["device_id"],
            "merchant_id": row["merchant_id"],
            "crypto_nonce_hash": row["crypto_nonce_hash"],
            "scenario": row["scenario"],
            "amount": float(row["raw_amount"]),
            "linked_mule_count": int(device_account_counts.get(row["device_id"], 0)),
            "sync_delay_seconds": float(row.get("raw_sync_delay_sec", 0.0)),
            "risk_score": round(score, 4),
            "risk_band": risk_band,
            "top_experts": [expert_names[i] for i in top_2_indices],
            "expert_contributions": {
                "Transaction_Expert": round(float(r_weights[0]), 3),
                "Graph_Expert": round(float(r_weights[1]), 3),
                "Temporal_Expert": round(float(r_weights[2]), 3),
                "Offline_Anomaly_Expert": round(float(r_weights[3]), 3),
            },
            "reason_signals": generate_reason_signals(row),
            "is_quarantined": bool(is_quarantined),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "ground_truth_label": int(row["label"])
        })

    alerts.sort(key=lambda x: x["risk_score"], reverse=True)

    return {
        "batch_summary": {
            "total_transactions": len(alerts),
            "critical_alerts": sum(1 for a in alerts if a["risk_band"] == "CRITICAL"),
            "medium_alerts": sum(1 for a in alerts if a["risk_band"] == "MEDIUM"),
            "low_alerts": sum(1 for a in alerts if a["risk_band"] == "LOW"),
            "quarantined_alerts": sum(1 for a in alerts if a["risk_band"] == "QUARANTINED"),
            "batch_inference_latency_ms": round(inference_ms, 3),
            "per_tx_latency_ms": round(inference_ms / max(len(alerts), 1), 4),
            "inference_engine": engine_used,
            "hardware_arch": platform.machine()
        },
        "triage_queue": alerts
    }

class QuarantineRequest(BaseModel):
    device_id: str

@app.post("/quarantine-ring")
def quarantine_sybil_ring(req: QuarantineRequest):
    if DEMO_DF is None:
        raise HTTPException(status_code=500, detail="Stream not loaded.")

    linked_rows = DEMO_DF[DEMO_DF["device_id"] == req.device_id]
    affected_accounts = linked_rows["account_id"].unique().tolist()
    affected_merchants = linked_rows["merchant_id"].unique().tolist()

    QUARANTINED_ENTITIES.add(req.device_id)
    for acc in affected_accounts:
        QUARANTINED_ENTITIES.add(acc)

    affected_tx_ids = linked_rows["tx_id"].astype(str).tolist() if "tx_id" in linked_rows else []
    return {
        "status": "SUCCESS",
        "device_id": req.device_id,
        "quarantined_accounts": len(affected_accounts),
        "cluster_id": f"ENC-Z17-{req.device_id[-4:].upper()}",
        "hsm_revocation_id": f"HSM-0x{uuid.uuid4().hex[:6].upper()}",
        "action_timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "affected_tx_ids": affected_tx_ids
    }

@app.post("/reset-quarantine")
def reset_quarantine():
    QUARANTINED_ENTITIES.clear()
    return {"status": "QUARANTINE_CLEARED", "total_entities_quarantined": 0}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
