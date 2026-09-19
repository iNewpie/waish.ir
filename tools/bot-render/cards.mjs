/* ============================================================
   CARD TEMPLATES — the HTML the Discord bot's image replies are drawn from (server.mjs screenshots them).
   Same look as waish.ir: near-black background, thin #1c2029 lines, the red accent, Inter + JetBrains Mono.
   Every template takes plain data the worker already computed (tools/discord.bot.js → cardData) and returns HTML.
   ============================================================ */
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const SIZE = { user: [1100, 520], check: [1100, 400], stats: [1100, 560], skin: [1100, 560], guild: [1100, 460], compare: [1100, 620], prestige: [1100, 520], ratio: [1100, 560], status: [1100, 440], leaderboard: [1100, 620] };   // [width, MIN height] — server.mjs measures the real height

const BASE = `
@font-face { font-family: 'Inter'; font-weight: 400; src: url('fonts/Inter-Regular.woff2') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 600; src: url('fonts/Inter-SemiBold.woff2') format('woff2'); }
@font-face { font-family: 'Inter'; font-weight: 800; src: url('fonts/Inter-Bold.woff2') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 400; src: url('fonts/JetBrainsMono-Regular.woff2') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 700; src: url('fonts/JetBrainsMono-Bold.woff2') format('woff2'); }
:root { --bg: #0a0b0e; --bg-2: #0f1116; --ink: #eef1f6; --muted: #8b93a3; --line: #1c2029; --card: #101319; --accent: #ff3b3b; --accent-soft: #ff6a6a;
  --green: #3fb950; --blue: #58a6ff; --yellow: #e3b341; --cyan: #2ee6ff; --mono: 'JetBrains Mono', monospace; --sans: 'Inter', sans-serif; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html { background: var(--bg); } body { width: 100%; min-height: 100%; background: var(--bg); color: var(--ink); font-family: var(--sans); -webkit-font-smoothing: antialiased; overflow: hidden; }
.card { position: relative; width: 100%; min-height: var(--min-h); padding: 40px 44px 34px; display: flex; flex-direction: column; overflow: hidden;
  background:
    radial-gradient(900px 420px at 88% -20%, rgba(255,59,59,.16), transparent 60%),
    radial-gradient(600px 300px at 0% 110%, rgba(46,230,255,.07), transparent 60%),
    linear-gradient(180deg, #0c0e13, #0a0b0e); }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
  background-size: 44px 44px; mask-image: radial-gradient(800px 500px at 30% 30%, #000 20%, transparent 75%); pointer-events: none; }
.topline { position: absolute; left: 0; right: 0; top: 0; height: 4px; background: linear-gradient(90deg, var(--accent), var(--accent-soft) 40%, transparent); }
.topline.green { background: linear-gradient(90deg, var(--green), #7ee2a0 40%, transparent); }
.topline.red { background: linear-gradient(90deg, var(--accent), #ff9a9a 40%, transparent); }
.topline.yellow { background: linear-gradient(90deg, var(--yellow), #f4d98a 40%, transparent); }
.topline.blue { background: linear-gradient(90deg, var(--blue), #9dc7ff 40%, transparent); }
.head { display: flex; align-items: center; gap: 14px; margin-bottom: 26px; font-family: var(--mono); font-size: 17px; color: var(--muted); }
.head .brand { color: var(--ink); font-weight: 700; letter-spacing: -.3px; } .head .brand b { color: var(--accent); }
.head .cmd { margin-left: auto; color: var(--muted); } .head .cmd b { color: var(--yellow); font-weight: 400; }
.body { display: flex; gap: 40px; flex: 1; min-height: 0; }
.figure { width: 250px; flex: none; display: flex; align-items: center; justify-content: center; position: relative; }
.figure::before { content: ''; position: absolute; inset: 18% 8% 6%; border-radius: 40%; background: radial-gradient(closest-side, rgba(255,59,59,.22), transparent 70%); filter: blur(10px); }
.figure img { position: relative; max-height: 100%; max-width: 100%; image-rendering: pixelated; filter: drop-shadow(0 18px 24px rgba(0,0,0,.6)); }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.name { display: flex; align-items: baseline; gap: 14px; flex-wrap: wrap; }
.name .ign { font-size: 54px; font-weight: 800; letter-spacing: -1.5px; line-height: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pill { font-family: var(--mono); font-weight: 700; font-size: 20px; padding: 6px 12px; border-radius: 8px; background: rgba(255,255,255,.06); border: 1px solid var(--line); line-height: 1; }
.uuid { font-family: var(--mono); font-size: 17px; color: var(--muted); margin-top: 12px; letter-spacing: .2px; }
.tiles { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 26px; }
.tile { background: rgba(16,19,25,.85); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; min-width: 0; }
.tile .k { font-family: var(--mono); font-size: 13px; color: var(--muted); text-transform: uppercase; letter-spacing: .8px; }
.tile .v { font-size: 28px; font-weight: 800; letter-spacing: -.6px; margin-top: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tile .v small { font-size: 14px; font-weight: 600; color: var(--muted); letter-spacing: 0; margin-left: 4px; }
.tile.wide { grid-column: span 2; }
.badges { display: flex; gap: 12px; margin-top: auto; padding-top: 22px; }
/* blacklist blocks: one per source, every report on its own row with the tag as a chip, the full message, and who/when */
.bls { display: flex; flex-direction: column; gap: 12px; margin-top: auto; padding-top: 22px; }
.bl { border: 1px solid var(--line); border-radius: 14px; background: rgba(16,19,25,.85); padding: 16px 18px 16px 20px; position: relative; overflow: hidden; }
.bl::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--muted); }
.bl.clean::before { background: var(--green); box-shadow: 0 0 18px rgba(63,185,80,.8); } .bl.clean { border-color: rgba(63,185,80,.35); }
.bl.bad::before { background: var(--accent); box-shadow: 0 0 18px rgba(255,59,59,.9); } .bl.bad { border-color: rgba(255,59,59,.55); background: rgba(255,59,59,.09); }
.bl.warn::before { background: var(--yellow); } .bl.warn { border-color: rgba(227,179,65,.45); }
.bl-head { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.bl-head .src { font-family: var(--mono); font-size: 14px; letter-spacing: 1px; text-transform: uppercase; color: var(--muted); min-width: 78px; }
.bl-head .verdict { font-size: 21px; font-weight: 800; letter-spacing: -.3px; }
.bl.bad .verdict { color: #ff8a8a; } .bl.clean .verdict { color: #8be0a0; } .bl.warn .verdict { color: var(--yellow); } .bl.fail .verdict { color: var(--muted); font-weight: 600; }
.bl-head .note { font-size: 15px; color: var(--muted); margin-left: auto; }
.rep { display: grid; grid-template-columns: auto 1fr; column-gap: 14px; row-gap: 4px; align-items: start; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.06); }
.rep:first-of-type { border-top: 0; padding-top: 0; }
.chip { display: inline-block; font-family: var(--mono); font-weight: 700; font-size: 15px; line-height: 1; padding: 8px 11px; border-radius: 8px; white-space: nowrap; background: rgba(255,59,59,.18); color: #ffb3b3; border: 1px solid rgba(255,59,59,.45); }
.bl.warn .chip { background: rgba(227,179,65,.14); color: #f4d98a; border-color: rgba(227,179,65,.45); }
.rep .msg { font-size: 19px; line-height: 1.35; color: var(--ink); word-break: break-word; }
.rep .msg.none { color: var(--muted); font-style: italic; font-size: 17px; }
.rep .meta { grid-column: 2; font-family: var(--mono); font-size: 14px; color: var(--muted); }
.verified { display: inline-block; font-family: var(--mono); font-size: 13px; padding: 4px 8px; border-radius: 6px; background: rgba(63,185,80,.15); color: #8be0a0; border: 1px solid rgba(63,185,80,.4); margin-left: 8px; vertical-align: middle; }
.badge { flex: 1; display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--line); background: rgba(16,19,25,.85); min-width: 0; }
.badge .dot { width: 12px; height: 12px; border-radius: 50%; flex: none; box-shadow: 0 0 0 4px rgba(255,255,255,.04); }
.badge.clean .dot { background: var(--green); box-shadow: 0 0 14px rgba(63,185,80,.7); }
.badge.bad { border-color: rgba(255,59,59,.55); background: rgba(255,59,59,.10); } .badge.bad .dot { background: var(--accent); box-shadow: 0 0 14px rgba(255,59,59,.8); }
.badge.warn .dot { background: var(--yellow); box-shadow: 0 0 14px rgba(227,179,65,.7); }
.badge.fail .dot { background: var(--muted); }
.badge .t { min-width: 0; } .badge .src { font-family: var(--mono); font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .8px; }
.badge .s { font-size: 18px; font-weight: 700; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge.bad .s { color: #ff8a8a; } .badge.clean .s { color: #8be0a0; } .badge.warn .s { color: var(--yellow); } .badge.fail .s { color: var(--muted); font-weight: 500; }
.badge .why { font-size: 13px; color: var(--muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.foot { display: flex; align-items: center; gap: 14px; margin-top: 24px; font-family: var(--mono); font-size: 15px; color: var(--muted); }
.foot .r { margin-left: auto; }
.bar { height: 8px; border-radius: 6px; background: rgba(255,255,255,.07); overflow: hidden; margin-top: 10px; }
.bar i { display: block; height: 100%; border-radius: 6px; background: linear-gradient(90deg, var(--accent), var(--accent-soft)); }

/* ---- Hypixel Tools cards ---- */
.rainbow { background: linear-gradient(90deg, #f55, #fa0, #ff5, #5f5, #5ff, #55f, #f5f); -webkit-background-clip: text; background-clip: text; color: transparent; }
.vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 24px; align-items: center; }
.vs .side { display: flex; align-items: center; gap: 16px; min-width: 0; }
.vs .side.r { flex-direction: row-reverse; text-align: right; }
.vs .side img { width: 96px; height: 96px; image-rendering: pixelated; filter: drop-shadow(0 10px 16px rgba(0,0,0,.6)); flex: none; }
.vs .side .ign { font-size: 34px; font-weight: 800; letter-spacing: -1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vs .side .sub { font-family: var(--mono); font-size: 15px; color: var(--muted); margin-top: 6px; display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.vs .side.r .sub { justify-content: flex-end; }
.vs .score { text-align: center; font-family: var(--mono); color: var(--muted); font-size: 14px; }
.vs .score b { display: block; font-family: var(--sans); font-size: 44px; font-weight: 800; letter-spacing: -2px; color: var(--ink); line-height: 1; margin-bottom: 6px; }
.vs .score .lead { color: var(--accent-soft); }
.crows { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 22px; }
.crow { display: grid; grid-template-columns: 1fr 112px 1fr; align-items: center; gap: 10px; padding: 8px 14px; border-radius: 10px; border: 1px solid var(--line); background: rgba(16,19,25,.85); }
.crow .lbl { font-family: var(--mono); font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: .6px; text-align: center; }
.crow .v { font-size: 21px; font-weight: 800; letter-spacing: -.4px; color: var(--muted); display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.crow .v.r { align-items: flex-end; } .crow .v .num { white-space: nowrap; }
.crow .v.win { color: #8be0a0; } .crow .v.win .num::before { content: '▲ '; font-size: 12px; vertical-align: 3px; } .crow .v.tie { color: var(--ink); }
.crow .v .b { width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,.07); overflow: hidden; }
.crow .v .b i { display: block; height: 100%; background: currentColor; opacity: .6; } .crow .v.l .b i { margin-left: auto; }
.ptile { border: 1px solid var(--line); border-radius: 14px; background: rgba(16,19,25,.85); padding: 18px 20px; }
.ptile .t { font-family: var(--mono); font-size: 16px; font-weight: 700; letter-spacing: 1px; color: var(--muted); display: flex; align-items: center; gap: 10px; }
.ptile .t .chip { margin-left: auto; font-size: 13px; padding: 6px 9px; }
.ptile .cur { display: flex; align-items: baseline; gap: 12px; margin-top: 8px; }
.ptile .cur b { font-size: 40px; font-weight: 800; letter-spacing: -1.5px; line-height: 1; }
.ptile .cur span { font-family: var(--mono); font-size: 15px; color: var(--muted); }
.ptile .need { margin-top: 12px; font-size: 17px; color: var(--ink); } .ptile .need b { color: var(--accent-soft); } .ptile .need.ok b { color: #8be0a0; }
.ptile .need small { display: block; font-family: var(--mono); font-size: 13px; color: var(--muted); margin-top: 3px; }
.chip.ok { background: rgba(63,185,80,.15); color: #8be0a0; border-color: rgba(63,185,80,.4); } .chip.warn { background: rgba(227,179,65,.14); color: #f4d98a; border-color: rgba(227,179,65,.45); }
.motd { font-family: var(--mono); font-size: 19px; line-height: 1.5; padding: 14px 18px; border-radius: 12px; background: #06070a; border: 1px solid var(--line); color: #AAAAAA; white-space: pre-wrap; word-break: break-word; margin-top: 18px; }
.motd .l { font-weight: 700; } .motd .o { font-style: italic; } .motd .n { text-decoration: underline; } .motd .m { text-decoration: line-through; }
.plist { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.plist span { font-family: var(--mono); font-size: 14px; padding: 6px 11px; border-radius: 999px; border: 1px solid var(--line); background: rgba(255,255,255,.04); color: var(--ink); }
.plist span.more { color: var(--muted); }
.sicon { width: 128px; height: 128px; border-radius: 22px; border: 1px solid var(--line); background: rgba(16,19,25,.85); display: flex; align-items: center; justify-content: center; font-size: 56px; overflow: hidden; flex: none; }
.sicon img { width: 100%; height: 100%; image-rendering: pixelated; }
.podium { display: grid; grid-template-columns: 1fr 1.15fr 1fr; gap: 12px; align-items: end; margin-top: 22px; }
.pod { border: 1px solid var(--line); border-radius: 14px; background: rgba(16,19,25,.85); padding: 16px 12px 14px; text-align: center; position: relative; min-width: 0; }
.pod img { width: 84px; height: 84px; image-rendering: pixelated; filter: drop-shadow(0 8px 12px rgba(0,0,0,.6)); }
.pod.first { border-color: rgba(255,200,60,.55); background: rgba(255,200,60,.07); padding-top: 22px; } .pod.first img { width: 104px; height: 104px; }
.pod.second { border-color: rgba(200,200,210,.35); } .pod.third { border-color: rgba(205,127,50,.45); }
.pod .place { position: absolute; top: 10px; left: 14px; font-family: var(--mono); font-size: 15px; color: var(--muted); }
.pod .nm { font-family: var(--mono); font-weight: 700; font-size: 20px; margin-top: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.pod .val { font-size: 24px; font-weight: 800; letter-spacing: -.5px; margin-top: 4px; }
.pod.first .val { color: #ffc83c; } .pod.second .val { color: #d0d3da; } .pod.third .val { color: #e0955a; }
.pod .rk { font-family: var(--mono); font-size: 13px; color: var(--muted); margin-top: 4px; }
.lrows { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px; margin-top: 14px; }
.lrow { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center; padding: 10px 14px; border-radius: 10px; border: 1px solid var(--line); background: rgba(16,19,25,.85); position: relative; overflow: hidden; }
.lrow .fill { position: absolute; left: 0; top: 0; bottom: 0; background: linear-gradient(90deg, rgba(255,59,59,.16), rgba(255,59,59,.02)); }
.lrow > * { position: relative; } .lrow .i { font-family: var(--mono); font-size: 14px; color: var(--muted); }
.lrow .nm { font-family: var(--mono); font-size: 17px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .lrow .nm small { font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 8px; }
.lrow .val { font-size: 18px; font-weight: 800; letter-spacing: -.3px; white-space: nowrap; } .lrow .val small { font-family: var(--mono); font-size: 12px; color: var(--muted); font-weight: 400; margin-left: 6px; }
`;
const page = (cls, inner, w, h) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE}</style></head><body style="width:${w}px"><div class="card ${cls}" style="--min-h:${h}px"><div class="grid"></div>${inner}</div></body></html>`;
const head = (cmd, arg) => `<div class="head"><span class="brand">waish<b>.ir</b></span><span>·</span><span>Terminal</span><span class="cmd"><b>/${cmd}</b> ${esc(arg)}</span></div>`;
const foot = (l, r) => `<div class="foot"><span>${l}</span><span class="r">${r}</span></div>`;
const rankHTML = r => r ? `<span class="pill" style="color:${r.color}">[${esc(r.name)}${r.plus ? `<span style="color:${r.plusColor || r.color}">${esc(r.plus)}</span>` : ''}]</span>` : '';
const VERDICT = { bad: 'BLACKLISTED', clean: 'not blacklisted', warn: 'flagged', fail: 'check failed' };
const blBlock = b => `<div class="bl ${b.state}">
  <div class="bl-head"><span class="src">${esc(b.src)}</span><span class="verdict">${b.state === 'bad' ? '⚠ ' : b.state === 'clean' ? '✔ ' : ''}${VERDICT[b.state]}${b.state === 'bad' && b.reports.length > 1 ? ` · ${b.reports.length} reports` : ''}</span>${b.note ? `<span class="note">${esc(b.note)}</span>` : ''}</div>
  ${(b.reports || []).map(r => `<div class="rep"><span class="chip">${esc(r.tag)}</span><div class="msg${r.message ? '' : ' none'}">${r.message ? esc(r.message) : 'no reason given'}${r.verified ? '<span class="verified">verified</span>' : ''}</div>${r.meta ? `<div class="meta">${esc(r.meta)}</div>` : ''}</div>`).join('')}
</div>`;
const badge = b => `<div class="badge ${b.state}"><span class="dot"></span><div class="t"><div class="src">${esc(b.src)}</div><div class="s">${esc(b.label)}</div>${b.why ? `<div class="why">${esc(b.why)}</div>` : ''}</div></div>`;
const tile = (k, v, opt = {}) => `<div class="tile${opt.wide ? ' wide' : ''}"><div class="k">${esc(k)}</div><div class="v"${opt.color ? ` style="color:${opt.color}"` : ''}>${v}</div></div>`;
const body = (uuid, pose) => `https://vzge.me/${pose}/512/${uuid}.png?no=ears`;
const n = v => v == null ? '—' : Number(v).toLocaleString('en-US');

// Minecraft § colour codes → spans (bold/italic/underline/strike, §x hex); everything else is escaped text
const MCODE = { 0: '#555', 1: '#5555FF', 2: '#55FF55', 3: '#55FFFF', 4: '#FF5555', 5: '#FF55FF', 6: '#FFAA00', 7: '#AAAAAA', 8: '#888', 9: '#5555FF', a: '#55FF55', b: '#55FFFF', c: '#FF5555', d: '#FF55FF', e: '#FFFF55', f: '#FFFFFF' };
function motdHTML(raw) {
  let out = '', color = null, fx = new Set(), buf = ''; const s = String(raw || '');
  const flush = () => { if (buf) out += `<span class="${[...fx].join(' ')}"${color ? ` style="color:${color}"` : ''}>${esc(buf)}</span>`; buf = ''; };
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '§' && i + 1 < s.length) {
      const c = s[i + 1].toLowerCase(); flush();
      if (c === 'x' && /^(§[0-9a-f]){6}$/i.test(s.slice(i + 2, i + 14))) { color = '#' + s.slice(i + 2, i + 14).replace(/§/g, ''); i += 13; continue; }
      if (MCODE[c]) { color = MCODE[c]; fx.clear(); } else if (c === 'r') { color = null; fx.clear(); } else if ('lonm'.includes(c)) fx.add(c);
      i++; continue;
    }
    buf += s[i];
  }
  flush(); return out;
}

export const CARDS = {
  user: d => page('', `<div class="topline ${d.bad ? 'red' : 'blue'}"></div>${head('user', d.ign)}
    <div class="body" style="flex:none">
      <div class="figure" style="height:380px"><img src="${body(d.uuid, 'full')}" alt=""></div>
      <div class="main">
        <div class="name">${d.star != null ? `<span class="pill" style="color:${d.starColor}">${n(d.star)}✫</span>` : ''}${rankHTML(d.rank)}<span class="ign">${esc(d.ign)}</span></div>
        <div class="uuid">${esc(d.uuid)}${d.guild ? `  ·  guild <span style="color:${d.guild.color || '#AAA'}">${esc(d.guild.name)}${d.guild.tag ? ` [${esc(d.guild.tag)}]` : ''}</span>` : ''}</div>
        <div class="tiles">
          ${tile('Network level', d.level != null ? n(d.level) : '—')}
          ${tile('BedWars FKDR', d.fkdr ?? '—', { color: d.fkdr != null ? '#ffd166' : undefined })}
          ${tile('BedWars wins', n(d.bwWins))}
          ${tile('Skin', `${d.model}${d.cape ? '<small>+ cape</small>' : ''}`)}
          ${tile('Guild', d.guild ? `${n(d.guild.level)}<small>lvl · ${n(d.guild.members)} members</small>` : '<span style="color:var(--muted)">none</span>', { wide: true })}
          ${d.karma != null ? tile('Karma', n(d.karma)) : tile('Final kills', n(d.finals))}
          ${d.firstSeen ? tile('First seen', esc(d.firstSeen)) : tile('BedWars WLR', d.wlr ?? '—')}
        </div>
      </div>
    </div>
    <div class="bls" style="margin-top:0">${blBlock(d.seraph)}${blBlock(d.urchin)}</div>
    ${foot(d.activity ? esc(d.activity) : (d.snapshot ? `Hypixel snapshot ${esc(d.snapshot)}` : 'Mojang · Hypixel · Seraph · Urchin'), 'waish.ir/apps/lookup.html')}`, ...SIZE.user),

  check: d => page('', `<div class="topline ${d.bad ? 'red' : 'green'}"></div>${head('check', d.ign)}
    <div class="body">
      <div class="figure" style="width:200px"><img src="${body(d.uuid, 'bust')}" alt="" style="max-height:250px"></div>
      <div class="main" style="justify-content:center">
        <div class="name"><span class="ign">${esc(d.ign)}</span><span class="pill" style="color:${d.bad ? '#ff8a8a' : '#8be0a0'};border-color:${d.bad ? 'rgba(255,59,59,.55)' : 'rgba(63,185,80,.5)'}">${d.bad ? '⚠ BLACKLISTED' : '✔ CLEAN'}</span></div>
        <div class="uuid">${esc(d.uuid)}</div>
        <div class="bls" style="margin-top:22px;padding-top:0">${blBlock(d.seraph)}${blBlock(d.urchin)}</div>
      </div>
    </div>
    ${foot('Seraph · Urchin', 'waish.ir → /check')}`, ...SIZE.check),

  stats: d => page('', `<div class="topline yellow"></div>${head('stats', d.ign)}
    <div class="body">
      <div class="figure"><img src="${body(d.uuid, 'full')}" alt=""></div>
      <div class="main">
        <div class="name">${d.star != null ? `<span class="pill" style="color:${d.starColor}">${n(d.star)}✫</span>` : ''}${rankHTML(d.rank)}<span class="ign">${esc(d.ign)}</span></div>
        <div class="uuid">network level <b style="color:var(--ink)">${n(d.level)}</b> · ${Math.round(d.levelPct)}% to ${n(d.level + 1)}${d.karma != null ? ` · karma ${n(d.karma)}` : ''}</div>
        <div class="bar"><i style="width:${Math.max(2, Math.round(d.levelPct))}%"></i></div>
        <div class="tiles" style="margin-top:20px">
          ${tile('BedWars wins', n(d.bw.wins))}${tile('Final kills', n(d.bw.finals))}${tile('FKDR', d.bw.fkdr, { color: '#ffd166' })}${tile('WLR', d.bw.wlr)}
          ${tile('SkyWars wins', n(d.sw.wins))}${tile('SkyWars KDR', d.sw.kdr)}${tile('Duels wins', n(d.du.wins))}${tile('Duels WLR', d.du.wlr)}
        </div>
      </div>
    </div>
    ${foot(d.snapshot ? `Hypixel snapshot ${esc(d.snapshot)} via Bordic` : 'Hypixel via Bordic', 'waish.ir/apps/lookup.html')}`, ...SIZE.stats),

  skin: d => page('', `<div class="topline blue"></div>${head('skin', d.ign)}
    <div class="body" style="gap:28px">
      <div class="figure" style="width:230px"><img src="${body(d.uuid, 'full')}" alt=""></div>
      <div class="figure" style="width:230px"><img src="https://vzge.me/full/512/${d.uuid}.png?no=ears&y=180" alt=""></div>
      <div class="main">
        <div class="name"><span class="ign">${esc(d.ign)}</span></div>
        <div class="uuid">${esc(d.uuid)}</div>
        <div class="tiles" style="grid-template-columns:repeat(2,1fr)">
          ${tile('Model', d.model)}${tile('Cape', d.cape ? 'yes' : 'none')}
        </div>
        <div style="margin-top:22px;display:flex;align-items:center;gap:18px">
          <img src="${d.skinUrl}" alt="" style="width:144px;height:144px;object-fit:contain;object-position:top;image-rendering:pixelated;padding:8px;border:1px solid var(--line);border-radius:10px;background:#000">
          <div style="font-family:var(--mono);font-size:13px;color:var(--muted);line-height:1.7">the raw skin texture<br>front and back renders<br>edit it in 3D on waish.ir</div>
        </div>
      </div>
    </div>
    ${foot('Mojang session server', 'waish.ir/apps/skin-editor.html')}`, ...SIZE.skin),

  guild: d => page('', `<div class="topline yellow"></div>${head('guild', d.query)}
    <div class="body">
      ${d.gmUuid ? `<div class="figure" style="width:200px"><img src="${body(d.gmUuid, 'bust')}" alt="" style="max-height:250px"></div>` : ''}
      <div class="main">
        <div class="name"><span class="ign" style="color:${d.color}">${esc(d.name)}</span>${d.tag ? `<span class="pill" style="color:${d.color}">[${esc(d.tag)}]</span>` : ''}</div>
        <div class="uuid">${d.of ? `guild of <b style="color:var(--ink)">${esc(d.of)}</b> · ` : ''}guild master <b style="color:var(--ink)">${esc(d.gm || '—')}</b></div>
        <div class="tiles" style="grid-template-columns:repeat(3,1fr)">
          ${tile('Level', `${n(d.level)}<small>${d.levelPct}%</small>`)}${tile('Members', n(d.members))}${tile('Created', esc(d.created || '—'))}
        </div>
        ${d.description ? `<div style="margin-top:18px;font-size:16px;color:var(--muted);line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(d.description)}</div>` : ''}
      </div>
    </div>
    ${foot('Hypixel', 'waish.ir/apps/lookup.html')}`, ...SIZE.guild),
  // ---- Hypixel Tools cards (data from tools/discord.bot.js → TOOLS) ----
  compare: d => { const side = (p, r) => `<div class="side${r ? ' r' : ''}"><img src="${body(p.uuid, 'bust')}" alt=""><div style="min-width:0"><div class="ign">${esc(p.ign)}</div><div class="sub">${rankHTML(p.rank)}<span class="pill" style="color:${p.starColor}">${n(p.star)}✫</span><span>lvl ${n(p.level)}</span></div></div></div>`;
    return page('', `<div class="topline blue"></div>${head('compare', `${d.a.ign} vs ${d.b.ign}`)}
    <div class="vs">${side(d.a)}<div class="score"><b>${d.score[0]} – ${d.score[1]}</b><span class="${d.score[0] === d.score[1] ? '' : 'lead'}">${esc(d.lead)}</span></div>${side(d.b, true)}</div>
    <div class="crows">${d.rows.map(r => `<div class="crow"><div class="v l${r.win === 1 ? ' win' : r.win === 0 ? ' tie' : ''}"><span class="num">${esc(r.a)}</span><div class="b"><i style="width:${r.pa}%"></i></div></div><div class="lbl">${esc(r.label)}</div><div class="v r${r.win === 2 ? ' win' : r.win === 0 ? ' tie' : ''}"><span class="num">${esc(r.b)}</span><div class="b"><i style="width:${r.pb}%"></i></div></div></div>`).join('')}</div>
    ${foot(d.snapshot ? `Hypixel snapshot ${esc(d.snapshot)} via Bordic` : 'Hypixel via Bordic', 'waish.ir → Compare Players')}`, ...SIZE.compare); },

  prestige: d => page('', `<div class="topline yellow"></div>${head('prestige', d.ign)}
    <div class="body">
      <div class="figure"><img src="${body(d.uuid, 'full')}" alt=""></div>
      <div class="main">
        <div class="name"><span class="pill" style="color:${d.starColor}">${n(d.star)}✫</span>${rankHTML(d.rank)}<span class="ign">${esc(d.ign)}</span></div>
        <div class="uuid">${esc(d.prestige)} now · next: <b style="color:${d.next.color === 'rainbow' ? '#fff' : d.next.color}">${esc(d.next.name)}</b> at ${n(d.next.star)}✫ · <b style="color:var(--ink)">${n(d.toGoStars)} stars</b> and <b style="color:var(--ink)">${n(d.toGoXP)} XP</b> to go</div>
        <div class="bar" style="height:12px"><i style="width:${Math.max(2, d.pct)}%"></i></div>
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:14px;color:var(--muted);margin-top:8px"><span>${n(d.star)}✫</span><span>${d.pct}%</span><span>${n(d.next.star)}✫</span></div>
        <div class="tiles" style="margin-top:20px;grid-template-columns:repeat(3,1fr)">
          ${tile('Games needed', n(d.games), { color: '#ffd166' })}${tile('Days at your pace', d.days != null ? n(d.days) : '—')}${tile('ETA', esc(d.eta || '—'))}
          ${tile('XP / game', n(d.xpg))}${tile('Games / day', d.gpd ? String(d.gpd) : '—')}${tile('Next star', `${n(d.xpNext)}<small>/ ${n(d.xpNextFull)} XP</small>`)}
        </div>
        <div class="uuid" style="margin-top:14px">total <b style="color:var(--ink)">${n(d.totalXP)} XP</b> over <b style="color:var(--ink)">${n(d.played)}</b> games</div>
      </div>
    </div>
    ${foot('500 · 1,000 · 2,000 · 3,500 XP then 5,000 per star · 487,000 per prestige', 'waish.ir → Prestige Calculator')}`, ...SIZE.prestige),

  ratio: d => page('', `<div class="topline yellow"></div>${head('ratio', `${d.ign} · ${d.mode}`)}
    <div class="body">
      <div class="figure" style="width:200px"><img src="${body(d.uuid, 'full')}" alt=""></div>
      <div class="main">
        <div class="name"><span class="pill" style="color:${d.starColor}">${n(d.star)}✫</span>${rankHTML(d.rank)}<span class="ign">${esc(d.ign)}</span><span class="pill">${esc(d.mode)}</span></div>
        <div class="tiles" style="grid-template-columns:1fr 1fr;gap:14px;margin-top:22px">
          ${d.items.map(i => `<div class="ptile"><div class="t">${esc(i.title)}<span style="font-weight:400;letter-spacing:0;text-transform:none">${n(i.a)} / ${n(i.b)}</span><span class="chip ${i.above ? 'ok' : 'warn'}">${i.above ? 'above target' : `→ ${esc(i.target)}`}</span></div>
            <div class="cur"><b class="${i.color === 'rainbow' ? 'rainbow' : ''}" style="${i.color && i.color !== 'rainbow' ? `color:${i.color}` : ''}">${esc(i.cur)}</b><span>target ${esc(i.target)}</span></div>
            <div class="bar"><i style="width:${Math.max(2, i.pct)}%"></i></div>
            <div class="need${i.above ? ' ok' : ''}">${i.above ? `can take <b>${n(i.afford)}</b> more ${esc(i.lb)}` : `<b>${n(i.need)}</b> ${esc(i.la)} in a row`}<small>${i.above ? 'before dropping under the target' : `without a single ${esc(i.lb1 || i.lb)}`}</small></div></div>`).join('')}
        </div>
      </div>
    </div>
    ${foot(d.snapshot ? `Hypixel snapshot ${esc(d.snapshot)} via Bordic` : 'Hypixel via Bordic', 'waish.ir → Ratio Calculator')}`, ...SIZE.ratio),

  status: d => page('', `<div class="topline ${d.online ? 'green' : 'red'}"></div>${head('status', d.host)}
    <div class="body" style="gap:30px">
      <div class="sicon">${d.icon ? `<img src="${d.icon}" alt="">` : '🧊'}</div>
      <div class="main">
        <div class="name"><span class="ign">${esc(d.host)}</span><span class="pill" style="color:${d.online ? '#8be0a0' : '#ff8a8a'};border-color:${d.online ? 'rgba(63,185,80,.5)' : 'rgba(255,59,59,.55)'}">${d.online ? '● ONLINE' : '○ OFFLINE'}</span>${d.version ? `<span class="pill" style="color:var(--blue)">${esc(d.version)}</span>` : ''}${d.edition === 'bedrock' ? '<span class="pill">Bedrock</span>' : ''}</div>
        <div class="uuid">${d.ip ? `${esc(d.ip)}${d.port ? ':' + d.port : ''}` : ''}${d.srv ? ` · SRV ${esc(d.srv)}` : ''}${d.software ? ` · ${esc(d.software)}` : ''}${d.plugins ? ` · ${n(d.plugins)} plugins` : ''}${d.mods ? ` · ${n(d.mods)} mods` : ''}${d.gamemode ? ` · ${esc(d.gamemode)}` : ''}${d.eula ? ' · <span style="color:#ff8a8a">EULA blocked</span>' : ''}</div>
        ${d.motd ? `<div class="motd">${motdHTML(d.motd)}</div>` : ''}
        <div class="tiles" style="grid-template-columns:repeat(3,1fr);margin-top:18px">
          ${tile('Players', `${n(d.on)}<small>/ ${n(d.max)}</small>`, { color: d.online ? '#8be0a0' : undefined })}${tile('Protocol', d.protocol != null ? esc(String(d.protocol)) : '—')}${tile('Answered in', `${n(d.ms)}<small>ms</small>`)}
        </div>
        ${d.list && d.list.length ? `<div class="plist">${d.list.map(p => `<span>${esc(p)}</span>`).join('')}${d.more ? `<span class="more">+${n(d.more)} more</span>` : ''}</div>` : ''}
      </div>
    </div>
    ${foot(`mcstatus.io · checked ${esc(d.checked)}`, 'waish.ir → Server Status')}`, ...SIZE.status),

  leaderboard: d => { const pod = (r, cls) => r ? `<div class="pod ${cls}"><span class="place">#${r.i}</span><img src="${body(r.uuid, 'bust')}" alt=""><div class="nm">${esc(r.name)}</div><div class="val">${esc(r.value)}</div><div class="rk">${esc(r.rank)}${r.share != null ? ` · ${r.share}%` : ''}</div></div>` : '<div></div>';
    return page('', `<div class="topline yellow"></div>${head('leaderboard', d.query)}
    <div class="name"><span class="ign" style="color:${d.color}">${esc(d.name)}</span>${d.tag ? `<span class="pill" style="color:${d.color}">[${esc(d.tag)}]</span>` : ''}<span class="pill">top ${esc(d.by)}</span></div>
    <div class="uuid">level <b style="color:var(--ink)">${n(d.level)}</b> · <b style="color:var(--ink)">${n(d.members)}</b> members · <b style="color:var(--ink)">${n(d.active)}</b> active this week · <b style="color:var(--ink)">${n(d.total)} XP</b> this week</div>
    <div class="podium">${pod(d.rows[1], 'second')}${pod(d.rows[0], 'first')}${pod(d.rows[2], 'third')}</div>
    <div class="lrows">${d.rows.slice(3).map(r => `<div class="lrow"><div class="fill" style="width:${r.pct}%"></div><span class="i">#${r.i}</span><span class="nm">${esc(r.name)}<small>${esc(r.rank)}</small></span><span class="val">${esc(r.value)}${r.share != null ? `<small>${r.share}%</small>` : ''}</span></div>`).join('')}</div>
    ${foot('Hypixel guild API', 'waish.ir → Guild Leaderboard')}`, ...SIZE.leaderboard); },

};
