#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
ENV_PATH="$PROJECT_DIR/deploy/global.env"

cd "$PROJECT_DIR"

if [ ! -f "$ENV_PATH" ]; then
  echo "Missing $ENV_PATH. Run ./deploy/init-global-env.sh first." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "The server worktree contains uncommitted changes; deployment stopped." >&2
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "The server must deploy from main, but is currently on $CURRENT_BRANCH." >&2
  exit 1
fi

CURRENT_COMMIT=$(git rev-parse HEAD)
if [ -n "${EXPECTED_COMMIT:-}" ] && [ "$CURRENT_COMMIT" != "$EXPECTED_COMMIT" ]; then
  echo "Server commit $CURRENT_COMMIT does not match requested commit $EXPECTED_COMMIT." >&2
  exit 1
fi

chmod 600 "$ENV_PATH"

compose() {
  ENV_FILE="$ENV_PATH" docker compose --env-file "$ENV_PATH" "$@"
}

echo "Deploying Weiran Global at commit $CURRENT_COMMIT..."
compose up -d --build --remove-orphans

compose exec -T api node -e \
  "fetch('http://127.0.0.1:3000/health').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1))"
compose exec -T web wget -q -O /dev/null http://127.0.0.1/healthz

compose ps
echo "Weiran Global deployment succeeded at commit $CURRENT_COMMIT."
