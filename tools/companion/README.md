# Waish Companion — first connection test

The website owns the account controls. The Windows app has Start, Stop, a pairing-code button, and logs. It listens only on `127.0.0.1:47836` and requires a random per-launch pairing key. The website must be opened on the same PC as the app. No Cloudflare backend changes, VPS, public tunnel, or port forwarding are required.

## Run

1. Extract the complete companion ZIP to a folder, then open `WaishCompanion.exe`.
2. Press **Start** and **Copy pairing code**.
3. Log into `https://waish.ir/admin`, choose **Botting**, paste the pairing code, and press **Connect app**. Allow the website to access the local network if the browser asks. Use current Edge or Chrome; other browsers may block HTTPS-to-loopback requests.
4. Paste one **Minecraft Java access token** per account. This is not a Microsoft OAuth refresh token, browser cookie, or Cloudflare token. The application accepts only existing sessions and does not obtain or refresh them. Use accounts you control and do not log a test account into another client simultaneously.
5. Add up to three accounts. A pending state remains pending until it succeeds or fails. **Connected** requires a Minecraft spawn event. Same-instance status requires fresh matching location reports.
6. Stop or close the app to disconnect every test account and erase its tokens from memory. Reopening the app creates a new pairing key. Reloading the dashboard requires pairing again. Closing the website alone does not stop the accounts.

## Automatic tracking with Lunar 1.8.9

Install `WaishTracker-1.8.9.jar` through Lunar's **1.8.9 Forge profile → Settings → Mods** and enable it. Restart Minecraft after adding the mod. Custom Forge mod loading requires a recent Lunar version. The tracker is client-side only; do not put it on a server.

The tracker observes the client world and requests `/locraw` after world changes and every 15 seconds on `hypixel.net` hosts. It writes only `server`, `gametype`, `mode`, `map`, and a timestamp to `%USERPROFILE%\.waish-companion\location.json`. The companion reads that file; it never reads Minecraft account databases or launcher credentials. Disconnecting or changing worlds clears the old report. Reports expire after 45 seconds if the game stops responding or closes.

The tracker's Forge API compilation is checked, but actual behavior inside Lunar and on Hypixel must be verified with the user's client. If no report arrives, the dashboard displays unknown. It does not invent a location.

## Queues and limits

- **Bed Wars lobby** sends `/lobby bedwars`.
- **Accept my invite** sends `/party accept <your username>` after you invite the test account in Minecraft. The party and game must support that combination of players.
- **Queue Solo** sends `/play bedwars_eight_one` for that one account. This does not select your current queue or force an account into an instance.
- **Refresh location** requests `/locraw`.
- Command acceptance is determined by Hypixel. A sent command is logged as sent, not as successful.
- Hypixel controls matchmaking. An identifier such as `mini156H` cannot be treated as a direct-join address. Same-instance detection does not make matching possible.
- This version does not automate movement, combat, block placement, bridging, queue scanning, or retries after a kick. Hypixel prohibits scripting/boosting and may ban accounts.

## Privacy and security

Tokens are retained only in the Node process's memory while accounts are present. They are sent to Minecraft's authentication services and used for the Minecraft connection. The website sends them directly to the loopback companion, not to GitHub or Cloudflare. They are not placed in URLs, browser storage, logs, or files. No automatic token refresh is attempted. Logs hold a bounded list of status events in memory.

Only `https://waish.ir` and `https://www.waish.ir` are permitted website origins. Requests must include the per-launch key, and unexpected Host headers are rejected. Start and Stop are desktop-only endpoints. Closing the app terminates the service; a parent-process check also exits if the launcher disappears unexpectedly.

## Build from source (Windows)

Requires Node.js 22+, .NET Framework 4.x compiler, and PowerShell. From this directory:

```powershell
npm.cmd ci --ignore-scripts
npm.cmd test
& "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe" /nologo /target:winexe /out:WaishCompanion.exe /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll .\Companion.cs
```

The launcher looks first for `runtime\node.exe`, then the standard Node installation in Program Files. The provided bundle uses the already installed Node.js on this PC. Distribute `server.mjs`, `accounts.mjs`, `node_modules`, and the executable together. Do not distribute account sessions or pairing keys.

The tracker source is in `../tracker`. Compile it for Java 8 against Forge `1.8.9-11.15.1.2318-1.8.9` and Gson `2.2.4`, then package the resulting classes and `mcmod.info` in a JAR. Its Minecraft access uses both development and runtime SRG reflection names, so no Minecraft jars or reobfuscation are needed at compile time.

## Verification

`npm test` covers async validation/cancellation, duplicate accounts, secret exclusion, connection and stale-location status, origin/key/Host checks, Start/Stop boundaries, and a real local Minecraft 1.8.9 protocol handshake and location response. It uses fake sessions on a local test server; it does not authenticate to Hypixel. Live Hypixel and Lunar validation remain necessary.

The `uuid` override pins the compatible v4/v5 API to 11.1.1 to resolve the dependency audit finding in the upstream authentication dependency tree.
