# Aegis-MoE Frontend

React/Vite dashboard for the Aegis-MoE prototype.

## Run locally

From the repository root, start the real FastAPI backend in one terminal:

```bash
python -m uvicorn Backend.server:app --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd Frontend
npm ci
npm run dev
```

Open `http://localhost:3000`. The UI uses the backend at `http://localhost:8000` by default. The backend needs the tracked files under `Backend/artifacts/`.

## Use a remote backend

Set `VITE_API_BASE_URL` to a browser-reachable backend URL before building the frontend, then serve the generated `dist/` directory. This value is public configuration, not a secret. The browser must be able to reach the backend port, and the backend must allow the frontend origin.

The dashboard is a prototype. Do not present its static telemetry cards or synthetic scenario labels as measured LinuxONE performance or real payment data.