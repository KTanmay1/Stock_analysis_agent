#!/bin/bash
# Railway start script - properly expand PORT variable
PORT=${PORT:-8000}
exec uvicorn main:app --host 0.0.0.0 --port "$PORT" --workers 1
