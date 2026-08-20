#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
TEMPLATE_FILE="$SCRIPT_DIR/global.env.example"
TARGET_FILE="$SCRIPT_DIR/global.env"
LOCK_DIR="$SCRIPT_DIR/.global-env-init.lock"
TEMP_FILE=""

if [ ! -f "$TEMPLATE_FILE" ]; then
  echo "Missing template: $TEMPLATE_FILE" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL is required to generate deployment secrets." >&2
  exit 1
fi

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Another Global environment initialization is already running." >&2
  exit 1
fi

cleanup() {
  if [ -n "$TEMP_FILE" ]; then rm -f "$TEMP_FILE"; fi
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup 0 HUP INT TERM

SOURCE_FILE="$TEMPLATE_FILE"
if [ -e "$TARGET_FILE" ]; then SOURCE_FILE="$TARGET_FILE"; fi

for required_key in JWT_SECRET POSTGRES_PASSWORD DATABASE_URL; do
  if ! grep -q "^${required_key}=" "$SOURCE_FILE"; then
    echo "Missing $required_key in $SOURCE_FILE; refusing to rewrite the file." >&2
    exit 1
  fi
done

CURRENT_JWT=$(awk -F= '$1 == "JWT_SECRET" { print substr($0, index($0, "=") + 1); exit }' "$SOURCE_FILE")
CURRENT_POSTGRES_PASSWORD=$(awk -F= '$1 == "POSTGRES_PASSWORD" { print substr($0, index($0, "=") + 1); exit }' "$SOURCE_FILE")

GENERATE_JWT=false
case "$CURRENT_JWT" in
  ""|replace-with-*) GENERATE_JWT=true ;;
esac

GENERATE_POSTGRES_PASSWORD=false
case "$CURRENT_POSTGRES_PASSWORD" in
  ""|replace-with-*) GENERATE_POSTGRES_PASSWORD=true ;;
esac

if [ "$GENERATE_JWT" = false ] && [ "$GENERATE_POSTGRES_PASSWORD" = false ]; then
  chmod 600 "$TARGET_FILE"
  echo "deploy/global.env already contains initialized secrets; keeping it unchanged."
  echo "Only edit the OSS_* values when the OSS bucket or credentials change."
  exit 0
fi

# Hex output is strong and URL-safe, so it can be embedded in DATABASE_URL
# without additional escaping. Secrets are generated once and never printed.
JWT_SECRET="$CURRENT_JWT"
if [ "$GENERATE_JWT" = true ]; then JWT_SECRET=$(openssl rand -hex 32); fi

POSTGRES_PASSWORD="$CURRENT_POSTGRES_PASSWORD"
if [ "$GENERATE_POSTGRES_PASSWORD" = true ]; then POSTGRES_PASSWORD=$(openssl rand -hex 24); fi

TEMP_FILE=$(mktemp "$SCRIPT_DIR/.global.env.XXXXXX")

umask 077
awk \
  -v jwt_secret="$JWT_SECRET" \
  -v postgres_password="$POSTGRES_PASSWORD" \
  -v replace_jwt="$GENERATE_JWT" \
  -v replace_postgres_password="$GENERATE_POSTGRES_PASSWORD" '
    replace_jwt == "true" && /^JWT_SECRET=/ {
      print "JWT_SECRET=" jwt_secret
      next
    }
    replace_postgres_password == "true" && /^DATABASE_URL=/ {
      print "DATABASE_URL=postgresql://creator:" postgres_password "@postgres:5432/creator_tools"
      next
    }
    replace_postgres_password == "true" && /^POSTGRES_PASSWORD=/ {
      print "POSTGRES_PASSWORD=" postgres_password
      next
    }
    { print }
  ' "$SOURCE_FILE" > "$TEMP_FILE"

chmod 600 "$TEMP_FILE"
mv "$TEMP_FILE" "$TARGET_FILE"
TEMP_FILE=""

echo "Created deploy/global.env with one-time JWT and PostgreSQL secrets."
echo "Next, edit only OSS_REGION, OSS_BUCKET, OSS_ACCESS_KEY_ID,"
echo "OSS_ACCESS_KEY_SECRET, and OSS_INTERNAL_ENDPOINT."
