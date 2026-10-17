import os
import glob
import hashlib
import numpy as np
import pandas as pd
import networkx as nx

FEATURE_COLS = [
    "f_tx_amount_log", "f_tx_balance_depletion", "f_tx_velocity_ratio", "f_tx_merchant_entropy",
    "f_gr_shared_device_deg", "f_gr_ego_density", "f_gr_pagerank_score", "f_gr_mule_ring_flag",
    "f_tm_inter_arrival_inv", "f_tm_burst_intensity", "f_tm_hourly_zscore", "f_tm_seq_reversal",
    "f_of_sync_delay_log", "f_of_nonce_collision_risk", "f_of_clock_skew", "f_of_double_spend_ratio"
]

def build_unified_dataset(raw_dir="data/raw", num_samples_per_source=15000, seed=42):
    np.random.seed(seed)
    os.makedirs("data/synthetic", exist_ok=True)
    os.makedirs("Backend/artifacts", exist_ok=True)

    csv_files = glob.glob(os.path.join(raw_dir, "**", "*.csv"), recursive=True)
    all_amounts = []
    
    print(f"[DataEngine] Scanning {raw_dir} for real datasets...")
    
    if csv_files:
        for file in csv_files:
            print(f" -> Loading subset from {os.path.basename(file)}...")
            try:
                df_temp = pd.read_csv(file, nrows=num_samples_per_source)
                amt_col = next((c for c in df_temp.columns if "amount" in c.lower() or "amt" in c.lower()), None)
                if amt_col:
                    all_amounts.extend(df_temp[amt_col].abs().tolist())
            except Exception as e:
                print(f"    Error reading {file}: {e}")
                
    if len(all_amounts) > 1000:
        amounts = np.array(all_amounts)
        print(f"[DataEngine] Harmonized {len(amounts)} real transaction amounts.")
    else:
        print("[DataEngine] No valid CSVs found. Generating synthetic amounts...")
        amounts = np.random.exponential(scale=150.0, size=num_samples_per_source * 3)
    
    num_samples = len(amounts)

    # 0: Normal, 1: Honest Sync, 2: Double-Spend, 3: Sybil Mule Ring
    scenarios = np.random.choice([0, 1, 2, 3], size=num_samples, p=[0.75, 0.15, 0.05, 0.05])
    labels = np.where(scenarios >= 2, 1, 0)
    labels[(scenarios == 0) & (np.random.rand(num_samples) < 0.015)] = 1

    accounts = np.random.randint(1000, 5000, size=num_samples)
    merchants = np.random.randint(500, 1200, size=num_samples)
    devices = np.random.randint(200, 2500, size=num_samples)

    # Force Sybil rings
    sybil_mask = (scenarios == 3)
    devices[sybil_mask] = np.random.choice([9991, 9992, 9993], size=sybil_mask.sum())

    G = nx.Graph()
    for a, d, m in zip(accounts[:10000], devices[:10000], merchants[:10000]):
        G.add_edge(f"ACC_{a}", f"DEV_{d}")
        G.add_edge(f"ACC_{a}", f"MER_{m}")
    deg_map = dict(G.degree())

    amounts[labels == 1] *= np.random.uniform(2.5, 7.0, size=labels.sum())
    wallet_limit = amounts + np.random.uniform(100, 5000, size=num_samples)
    wallet_limit[scenarios == 2] = amounts[scenarios == 2] * np.random.uniform(0.1, 0.4, size=(scenarios == 2).sum())

    # Features
    f_tx_amount_log = np.log1p(amounts) / 10.0
    f_tx_balance_depletion = np.clip(amounts / (wallet_limit + 1.0), 0, 5.0) / 5.0
    f_tx_velocity_ratio = np.clip(np.random.gamma(2.0, 0.15, num_samples) + labels * 0.45, 0, 1.0)
    f_tx_merchant_entropy = np.clip(np.random.beta(2, 6, num_samples) + (scenarios >= 2) * 0.4, 0, 1.0)

    dev_degrees = np.array([deg_map.get(f"DEV_{d}", 1) for d in devices], dtype=np.float32)
    f_gr_shared_device_deg = np.clip(dev_degrees / 20.0, 0, 1.0)
    f_gr_ego_density = np.clip(np.random.normal(0.15, 0.07, num_samples) + sybil_mask * 0.65, 0, 1.0)
    f_gr_pagerank_score = np.clip(np.random.exponential(0.1, num_samples) + labels * 0.5, 0, 1.0)
    f_gr_mule_ring_flag = np.where(dev_degrees > 6, 1.0, 0.0)

    time_gaps = np.clip(np.random.exponential(300, num_samples) / (1 + labels * 12), 0.1, 3600)
    f_tm_inter_arrival_inv = 1.0 / (1.0 + time_gaps / 60.0)
    f_tm_burst_intensity = np.where(scenarios >= 1, np.random.uniform(0.6, 0.99, num_samples), np.random.uniform(0.01, 0.2, num_samples))
    f_tm_hourly_zscore = np.clip(np.abs(np.random.normal(0, 0.25, num_samples)) + labels * 0.55, 0, 1.0)
    f_tm_seq_reversal = np.clip(np.random.uniform(0, 0.15, num_samples) + (scenarios == 2) * 0.7, 0, 1.0)

    sync_delay = np.where(scenarios >= 1, np.random.uniform(120, 14400, num_samples), np.random.uniform(0.1, 1.5, num_samples))
    f_of_sync_delay_log = np.log1p(sync_delay) / 10.0
    f_of_nonce_collision_risk = np.clip(np.random.beta(1.2, 15, num_samples) + (scenarios == 2) * np.random.uniform(0.7, 0.99, num_samples), 0, 1.0)
    f_of_clock_skew = np.clip(np.abs(np.random.normal(0.02, 0.03, num_samples)) + (scenarios >= 2) * 0.6, 0, 1.0)
    f_of_double_spend_ratio = np.clip((amounts / (wallet_limit + 1.0)) * (scenarios >= 1), 0, 3.0) / 3.0

    crypto_hashes = [hashlib.sha256(f"{a}_{d}_{s}".encode()).hexdigest()[:12] for a, d, s in zip(accounts, devices, scenarios)]

    df = pd.DataFrame({
        "tx_id": [f"TX-{100000 + i}" for i in range(num_samples)],
        "account_id": [f"ACC-{a}" for a in accounts],
        "device_id": [f"DEV-{d}" for d in devices],
        "merchant_id": [f"MER-{m}" for m in merchants],
        "crypto_nonce_hash": crypto_hashes,
        "scenario": pd.Series(scenarios).map({
            0: "Online_Standard", 1: "Offline_NFC_Honest_Sync",
            2: "Offline_Nonce_DoubleSpend", 3: "Sybil_Mule_Ring_Burst"
        }),
        "raw_amount": np.round(amounts, 2),
        "f_tx_amount_log": f_tx_amount_log,
        "f_tx_balance_depletion": f_tx_balance_depletion,
        "f_tx_velocity_ratio": f_tx_velocity_ratio,
        "f_tx_merchant_entropy": f_tx_merchant_entropy,
        "f_gr_shared_device_deg": f_gr_shared_device_deg,
        "f_gr_ego_density": f_gr_ego_density,
        "f_gr_pagerank_score": f_gr_pagerank_score,
        "f_gr_mule_ring_flag": f_gr_mule_ring_flag,
        "f_tm_inter_arrival_inv": f_tm_inter_arrival_inv,
        "f_tm_burst_intensity": f_tm_burst_intensity,
        "f_tm_hourly_zscore": f_tm_hourly_zscore,
        "f_tm_seq_reversal": f_tm_seq_reversal,
        "f_of_sync_delay_log": f_of_sync_delay_log,
        "f_of_nonce_collision_risk": f_of_nonce_collision_risk,
        "f_of_clock_skew": f_of_clock_skew,
        "f_of_double_spend_ratio": f_of_double_spend_ratio,
        "label": labels
    })

    out_file = "data/synthetic/unified_enriched_transactions.csv"
    df.to_csv(out_file, index=False)
    print(f"[DataEngine] Saved {len(df)} records -> {out_file} (Fraud: {df['label'].mean()*100:.2f}%)")
    return df

if __name__ == "__main__":
    build_unified_dataset()