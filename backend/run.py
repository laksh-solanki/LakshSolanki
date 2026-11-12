from __future__ import annotations

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import socket
import uvicorn

from app.config import settings


def get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def print_server_banner(host: str, port: int) -> None:
    local_ip = get_local_ip()
    print("\n" + "=" * 50)
    print("  🚀 LakshSolanki Backend Server")
    print("=" * 50)
    print(f"  ➜  Local:   http://localhost:{port}")
    if host in {"0.0.0.0", "::"}:
        print(f"  ➜  Network: http://{local_ip}:{port}")
    else:
        print(f"  ➜  Host:    http://{host}:{port}")
    print(f"  ➜  Docs:    http://localhost:{port}/docs")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    print_server_banner(settings.host, settings.port)
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
