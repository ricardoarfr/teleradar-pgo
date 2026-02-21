#!/usr/bin/env bash
set -o errexit

echo "🗄 Running database migrations..."
alembic upgrade head

echo "🚀 Starting FastAPI..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
