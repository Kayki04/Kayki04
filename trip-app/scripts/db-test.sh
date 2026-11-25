#!/usr/bin/env bash
# Roda os testes pgTAP de supabase/tests direto no banco local (sem baixar imagem extra).
set -uo pipefail
DB="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
fail=0
for f in "$(dirname "$0")"/../supabase/tests/*.sql; do
  out=$(psql "$DB" -X -q -t -A -v ON_ERROR_STOP=1 -f "$f" 2>&1); code=$?
  bad=$(echo "$out" | grep -E '^not ok|ERROR|Looks like' || true)
  if [ $code -ne 0 ] || [ -n "$bad" ]; then fail=1; echo "FAIL $(basename "$f")"; echo "$bad" | head -20; [ $code -ne 0 ] && echo "$out" | tail -5
  else echo "ok   $(basename "$f") ($(echo "$out" | grep -c '^ok') asserts)"; fi
done
[ $fail -eq 0 ] && echo "db: todos ok" || { echo "db: falhou"; exit 1; }
