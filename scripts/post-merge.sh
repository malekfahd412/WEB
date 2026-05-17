#!/bin/bash
# Runs after a task agent merges into main. Re-installs deps, builds shared
# libs so leaf packages can typecheck, regenerates the OpenAPI client/zod
# bindings, and pushes any new database schema changes.
set -euo pipefail

echo "[post-merge] installing workspace dependencies"
pnpm install --frozen-lockfile

echo "[post-merge] building composite TypeScript libs"
pnpm run typecheck:libs

echo "[post-merge] regenerating OpenAPI client + zod bindings"
pnpm --filter @workspace/api-spec run codegen || {
  echo "[post-merge] codegen skipped or failed (non-fatal)" >&2
}

echo "[post-merge] pushing database schema"
pnpm --filter @workspace/db run push

echo "[post-merge] done"
