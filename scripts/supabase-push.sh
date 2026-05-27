#!/usr/bin/env bash
# Push migrations lên Supabase cloud (project cdqhcxubloteojfiipsd, Tokyo)
set -euo pipefail

export PATH="${HOME}/.local/share/supabase:${PATH}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT_REF="cdqhcxubloteojfiipsd"
POOLER_HOST="aws-1-ap-northeast-1.pooler.supabase.com"
POOLER_PORT="5432"

# Đọc mật khẩu từ .env.local hoặc biến môi trường
if [[ -f .env.local ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env.local
  set +a
fi

DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [[ -z "${DB_PASSWORD}" ]]; then
  echo "Thiếu SUPABASE_DB_PASSWORD."
  echo "Thêm vào .env.local (Dashboard → Project Settings → Database):"
  echo "  SUPABASE_DB_PASSWORD=your-database-password"
  echo ""
  echo "Hoặc chạy: SUPABASE_DB_PASSWORD='...' ./scripts/supabase-push.sh"
  exit 1
fi

# URL-encode password (ký tự đặc biệt trong mật khẩu)
ENC_PASS=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=''))" "$DB_PASSWORD")

DB_URL="postgresql://postgres.${PROJECT_REF}:${ENC_PASS}@${POOLER_HOST}:${POOLER_PORT}/postgres"

echo "Pushing migrations to ${PROJECT_REF} (${POOLER_HOST})..."
supabase db push --db-url "$DB_URL" --yes

echo "Done. Kiểm tra Dashboard → Table Editor."
