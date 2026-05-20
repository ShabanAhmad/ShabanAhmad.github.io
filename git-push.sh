#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ] || [ -z "${1// }" ]; then
  echo "Usage: ./git-push.sh \"Commit message\"" >&2
  exit 1
fi

git status --short

if [ -z "$(git status --porcelain)" ]; then
  echo "No changes to commit."
  exit 0
fi

git add .
git commit -m "$1"
git push origin main
