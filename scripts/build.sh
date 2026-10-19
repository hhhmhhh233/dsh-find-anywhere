#!/bin/bash
# Build dsh-find-anywhere (hand-authored client + host; no compiler needed).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node scripts/build.mjs
