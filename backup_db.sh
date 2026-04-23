#!/bin/bash

set -euo pipefail

# Resolve project root from script location (portable across machines).
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from local .env.
if [[ ! -f ".env" ]]; then
  echo "Error: .env file not found in $SCRIPT_DIR" >&2
  exit 1
fi
set -a
source ".env"
set +a

if [[ -z "${DATABASE_URL_PROD:-}" ]]; then
  echo "Error: DATABASE_URL_PROD is not set in .env" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Error: pg_dump not found in PATH." >&2
  echo "Install PostgreSQL client tools or set PATH to include pg_dump." >&2
  exit 1
fi

# Create backup directory and timestamped filename
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"

# Backup database
# Note: pg_dump major version must be compatible with the PostgreSQL server major version.
# If you see a version mismatch error, install/use the matching PostgreSQL client tools.
# As of 2026-04-22, the pg_dump version is 18.3 (Ubuntu 18.3-1.pgdg24.04+1) and the PostgreSQL server version is 17.8 (a48d9ca)
echo "Using pg_dump: $(command -v pg_dump)"
pg_dump --version
pg_dump "$DATABASE_URL_PROD" --clean --no-owner --no-acl -f "$BACKUP_DIR/backup_${TIMESTAMP}.sql"

echo "Backup created at: $BACKUP_DIR/backup_${TIMESTAMP}.sql"
