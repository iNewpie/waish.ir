#!/usr/bin/env bash
# Registers the bot's slash commands (tools/discord-commands.json) with Discord — run once, and again whenever the list changes.
# Global commands; Discord applies them within a minute. Needs DISCORD_APP_ID + DISCORD_BOT_TOKEN in tools/proxy.env.
set -e
cd "$(dirname "$0")"
set -a; . ./proxy.env; set +a
[ -n "$DISCORD_APP_ID" ] && [ -n "$DISCORD_BOT_TOKEN" ] || { echo "DISCORD_APP_ID / DISCORD_BOT_TOKEN missing in tools/proxy.env"; exit 1; }
code=$(curl -s -o /tmp/discord-register.out -w '%{http_code}' -X PUT "https://discord.com/api/v10/applications/$DISCORD_APP_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" -H "Content-Type: application/json" --data @discord-commands.json)
if [ "$code" = "200" ]; then
  echo "registered: $(python3 -c "import json; print(', '.join('/' + c['name'] for c in json.load(open('/tmp/discord-register.out'))))")"
  echo "invite the bot: https://discord.com/oauth2/authorize?client_id=$DISCORD_APP_ID&scope=applications.commands"
else
  echo "Discord answered $code:"; cat /tmp/discord-register.out; echo; exit 1
fi
