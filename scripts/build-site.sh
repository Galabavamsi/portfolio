#!/usr/bin/env bash
# Build step for Cloudflare Pages: copy the static site into dist/, leaving out
# drafts, server code and repo tooling (the same files .vercelignore excludes).
# Cloudflare Pages settings: build command `bash scripts/build-site.sh`,
# output directory `dist`.
set -euo pipefail
rm -rf dist
mkdir dist
tar --exclude=./dist --exclude=./.git --exclude=./.github --exclude=./experiments \
    --exclude=./supabase --exclude=./applications --exclude=./node_modules \
    --exclude=./scripts --exclude=./resumes --exclude=./functions \
    --exclude=./vercel.json --exclude=./.vercelignore --exclude=./package.json \
    --exclude=./package-lock.json -cf - . | tar -xf - -C dist
echo "dist/: $(find dist -type f | wc -l) files"
