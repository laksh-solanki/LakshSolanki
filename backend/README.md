# LakshSolanki Python Backend

The main site API lives in one FastAPI service.

## Run locally

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe run.py
```

Default URL: `http://localhost:5001`

## Deploy on Vercel

This backend is Vercel-ready from the `backend/` directory:

- `server.py` exposes the FastAPI `app` entrypoint Vercel expects.
- `requirements.txt` contains the Python dependencies.
- `.vercelignore` keeps old local/runtime baggage out of deployments.

```powershell
cd backend
pnpm dlx vercel@latest --prod --yes
```

## Preserved API groups

- `/api/courses`
- `/api/media`
- `/api/subscribe`
- `/api/tts/snippets`
- `/api/ai/chat`
- `/api/ai/history`
