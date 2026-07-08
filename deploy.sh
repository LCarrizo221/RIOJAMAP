#!/usr/bin/env bash
# deploy.sh — Deploy RIOJAMAP a VPS DevLab1
# Uso: bash deploy.sh [frontend|backend|full]

set -euo pipefail

SSH_HOST="179.43.127.166"
SSH_PORT="5008"
SSH_USER="root"
SSH_PASS="58%ExY1w0y.nry"
VPS_PATH="/var/www/RIOJAMAP"
LOCAL_PATH="/home/lucas/docs/Code/RIOJAMAP"
PM2_NAME="riojamap-backend"
BACKEND_PORT="3003"

deploy_frontend() {
  echo "→ Build frontend..."
  cd "$LOCAL_PATH"
  npm run build:client

  echo "→ Rsync dist/ a VPS..."
  sshpass -p "$SSH_PASS" rsync -avz --delete \
    -e "ssh -p$SSH_PORT -o StrictHostKeyChecking=no" \
    "$LOCAL_PATH/client/dist/" \
    "$SSH_USER@$SSH_HOST:$VPS_PATH/client/dist/"

  echo "✅ Frontend deployado"
}

deploy_backend() {
  echo "→ Commit local (si hay cambios)..."
  cd "$LOCAL_PATH"
  if ! git diff --quiet HEAD; then
    git add -A
    git commit -m "chore: deploy $(date +%Y-%m-%d_%H:%M)"
    git push
  fi

  echo "→ Pull + build + restart en VPS..."
  sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no \
    -p"$SSH_PORT" "$SSH_USER@$SSH_HOST" "
    cd $VPS_PATH
    git pull
    cd server && npm run build
    pm2 restart $PM2_NAME
  "

  echo "✅ Backend deployado"
}

verify() {
  echo "→ Verificando..."
  sleep 2
  local health
  health=$(sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no \
    -p"$SSH_PORT" "$SSH_USER@$SSH_HOST" "curl -s http://localhost:$BACKEND_PORT/health")
  
  if echo "$health" | grep -q '"ok"'; then
    echo "✅ Health check: OK"
  else
    echo "❌ Health check: FAIL ($health)"
    return 1
  fi

  local api_status
  api_status=$(curl -s -o /dev/null -w '%{http_code}' "https://riojamap.devlab1.online/api/obras" 2>/dev/null || echo "000")
  if [ "$api_status" = "200" ]; then
    echo "✅ API: OK (HTTP $api_status)"
  else
    echo "❌ API: FAIL (HTTP $api_status)"
  fi

  local frontend_status
  frontend_status=$(curl -s -o /dev/null -w '%{http_code}' "https://riojamap.devlab1.online/" 2>/dev/null || echo "000")
  if [ "$frontend_status" = "200" ]; then
    echo "✅ Frontend: OK (HTTP $frontend_status)"
  else
    echo "❌ Frontend: FAIL (HTTP $frontend_status)"
  fi
}

case "${1:-full}" in
  frontend)
    deploy_frontend
    verify
    ;;
  backend)
    deploy_backend
    verify
    ;;
  full)
    deploy_frontend
    deploy_backend
    verify
    ;;
  *)
    echo "Uso: bash deploy.sh [frontend|backend|full]"
    exit 1
    ;;
esac
