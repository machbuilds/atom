## Quick start

```bash
# 1. Create a virtualenv and install (Python 3.12+)
python -m venv .venv
source .venv/bin/activate
pip install -e '.[dev]'

# 2. Copy env file
cp .env.example .env

# 3. Run the server
uvicorn app.main:app --reload

# Health check
curl http://localhost:8000/healthz
```

## Project layout

```
app/
├── __init__.py
└── main.py          FastAPI app, /healthz, lifespan hook
pyproject.toml       Dependencies + ruff + pytest config
Dockerfile           Multi-stage, non-root, healthchecked
.env.example         Environment contract
DEPLOY.md            Railway deploy notes
```

## Common commands

| Task | Command |
|---|---|
| Run dev server | `uvicorn app.main:app --reload` |
| Run tests | `pytest` |
| Lint + format | `ruff check . && ruff format .` |
| Build container | `docker build -t app .` |
| Run container | `docker run -p 8000:8000 --env-file .env app` |
