#!/usr/bin/env bash
# Deploys the API proxy to Cloudflare Workers and sets its secrets from tools/proxy.env.
# Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in tools/proxy.env (token template: "Edit Cloudflare Workers").
set -e
cd "$(dirname "$0")"
set -a; . ./proxy.env; set +a
[ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ACCOUNT_ID" ] || { echo "CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID missing in tools/proxy.env"; exit 1; }
npx --yes wrangler@4 deploy -c wrangler.toml
for k in NETHER_KEY HYPIXEL_KEY BORDIC_KEY URCHIN_KEY; do v="${!k}"; [ -n "$v" ] && printf '%s' "$v" | npx --yes wrangler@4 secret put "$k" -c wrangler.toml --name waish-proxy >/dev/null && echo "secret $k set"; done
echo "worker URL:"; npx --yes wrangler@4 deployments list -c wrangler.toml 2>/dev/null | head -3 || true
