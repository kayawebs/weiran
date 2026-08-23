#!/usr/bin/env sh

set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SSH_TARGET=${DEPLOY_SSH_TARGET:-contabo}
REMOTE_DIR=${DEPLOY_REMOTE_DIR:-weiran}

case "$SSH_TARGET" in
  *[!A-Za-z0-9._@-]*|'')
    echo "DEPLOY_SSH_TARGET contains unsupported characters." >&2
    exit 1
    ;;
esac

case "$REMOTE_DIR" in
  *[!A-Za-z0-9._/-]*|''|/*|*..*)
    echo "DEPLOY_REMOTE_DIR must be a safe path relative to the remote home directory." >&2
    exit 1
    ;;
esac

cd "$PROJECT_DIR"

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "Global deployment must run from main, but the current branch is $CURRENT_BRANCH." >&2
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Commit or discard local changes before deploying." >&2
  exit 1
fi

EXPECTED_COMMIT=$(git rev-parse HEAD)

echo "Pushing main at $EXPECTED_COMMIT..."
git push origin main

echo "Deploying to $SSH_TARGET:~/$REMOTE_DIR..."
ssh -o BatchMode=yes "$SSH_TARGET" sh -s -- "$REMOTE_DIR" "$EXPECTED_COMMIT" <<'REMOTE_SCRIPT'
set -eu

REMOTE_DIR=$1
EXPECTED_COMMIT=$2
cd "$HOME/$REMOTE_DIR"

if [ -n "$(git status --porcelain)" ]; then
  echo "The server worktree contains uncommitted changes; deployment stopped." >&2
  exit 1
fi

CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "The server must be on main, but is currently on $CURRENT_BRANCH." >&2
  exit 1
fi

git fetch origin main
git pull --ff-only origin main

CURRENT_COMMIT=$(git rev-parse HEAD)
if [ "$CURRENT_COMMIT" != "$EXPECTED_COMMIT" ]; then
  echo "Server commit $CURRENT_COMMIT does not match pushed commit $EXPECTED_COMMIT." >&2
  exit 1
fi

EXPECTED_COMMIT="$EXPECTED_COMMIT" ./deploy/remote-global-deploy.sh
REMOTE_SCRIPT
