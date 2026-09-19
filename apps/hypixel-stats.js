/* ============================================================
   HYPIXEL STATS PANEL — used by lookup.html (User Lookup).
   Reads a Hypixel player object (Bordic's cache — api.bordic.xyz/v3/cache/hypixel — through the proxy worker) and renders:
     • the [RANK] Name header in Hypixel colours
     • an Overview tab (network level, socials, highlights — whatever Bordic has cached)
     • one tab per game the player has stats for, with mode buttons where Hypixel has modes
     • a Guild tab (fetched only when opened, to save API requests)
   Relies on globals from lookup.html: $, t, esc, fmtN, lang, ago, PROXY_URL.
   ============================================================ */
window.HYP = (() => {
  const fa = () => lang === 'fa';
  /* ---------- labels (Persian where it matters, English otherwise) ---------- */
  const LBL = { wins: 'برد', losses: 'باخت', kills: 'کیل', deaths: 'دث', assists: 'اسیست', games: 'بازی‌ها', coins: 'سکه', level: 'لول', stars: 'ستاره', winstreak: 'وین‌استریک', 'best winstreak': 'بهترین وین‌استریک', 'final kills': 'فاینال کیل', 'final deaths': 'فاینال دث', 'beds broken': 'تخت‌های شکسته', 'beds lost': 'تخت‌های ازدست‌رفته', 'time played': 'زمان بازی', 'arrows hit': 'تیرهای خورده', 'arrows shot': 'تیرهای زده', 'blocks placed': 'بلاک گذاشته', 'blocks broken': 'بلاک شکسته', score: 'امتیاز', karma: 'کارما', 'achievement points': 'امتیاز دستاورد', 'network level': 'لول شبکه', 'first login': 'اولین ورود', 'last login': 'آخرین ورود', 'last game': 'آخرین بازی', quests: 'کوئست‌ها', challenges: 'چلنج‌ها', online: 'آنلاین', offline: 'آفلاین', damage: 'دمیج', 'damage taken': 'دمیج خورده', heads: 'سر', souls: 'روح', 'void kills': 'کیل ووید', 'items purchased': 'آیتم خریده', iron: 'آهن', gold: 'طلا', diamond: 'الماس', emerald: 'زمرد', 'rounds played': 'راند', 'bow hits': 'تیر خورده', 'bow shots': 'تیر زده', 'melee hits': 'ضربهٔ خورده', 'melee swings': 'ضربهٔ زده', 'health regenerated': 'جون گرفته', division: 'دیویژن', 'murderer wins': 'برد قاتل', 'detective wins': 'برد کارآگاه', 'win rate': 'درصد برد', 'finals / game': 'فاینال / بازی', index: 'ایندکس', 'kills as murderer': 'کیل به‌عنوان قاتل', 'knife kills': 'کیل چاقو', 'bow kills': 'کیل تیر', 'was hero': 'قهرمان شده', 'chests opened': 'صندوق باز کرده', headshots: 'هدشات', 'shots fired': 'شلیک', members: 'اعضا', created: 'ساخته‌شده', tag: 'تگ', joined: 'عضو شده', rank: 'رنک', prestiges: 'پرستیژ', xp: 'XP', renown: 'شهرت', trophies: 'جام', laps: 'دور', 'games played': 'بازی‌ها', quits: 'ترک', record: 'رکورد' };
  const L = k => (fa() && LBL[k]) ? LBL[k] : k;
  const N = v => v == null ? null : fmtN(Number.isInteger(v) ? v : Math.round(v * 100) / 100);
  const R = (a, b) => ((a || 0) / Math.max(1, b || 0)).toFixed(2);
  const secs = s => s == null ? null : s >= 3600 ? (s / 3600).toFixed(1) + 'h' : s >= 60 ? Math.round(s / 60) + 'm' : s + 's';
  const get = (o, path) => path.split('.').reduce((a, k) => (a != null && a[k] != null) ? a[k] : undefined, o);
  // stat() = a number straight from the API (raw); calc() = something we derived from it (ratios, levels, percentages).
  // grid() puts the two groups side by side: raw on one side, calculated on the other.
  // cls = an optional tier class on the tile (FKDR / level tiers below) — lookup.html styles it.
  // extra = HTML dropped inside the tile (the level particles).
  const stat = (k, v, hi, color, isCalc, cls, extra) => (v == null || v === '' || v === 'NaN') ? '' : `<div class="stat${isCalc ? ' calc' : ''}${hi ? ' hi' : ''}${cls ? ' ' + cls : ''}">${extra || ''}<div class="k">${esc(L(k))}</div><div class="v"${color ? ` style="color:${color}"` : ''}>${v}</div></div>`;
  const calc = (k, v, hi, color, cls, extra) => stat(k, v, hi, color, true, cls, extra);
  const grid = cells => {
    const c = cells.filter(Boolean); if (!c.length) return '';
    const isCalc = h => h.startsWith('<div class="stat calc'), raw = c.filter(h => !isCalc(h)), der = c.filter(isCalc);
    if (!raw.length || !der.length) return `<div class="bw">${c.join('')}</div>`;
    return `<div class="hy-split"><div class="hy-col raw"><div class="hy-ctitle">${fa() ? 'آمار خام' : 'Raw stats'}</div><div class="bw">${raw.join('')}</div></div><div class="hy-col calc"><div class="hy-ctitle">${fa() ? 'آمار محاسبه‌شده' : 'Calculated'}</div><div class="bw">${der.join('')}</div></div></div>`;
  };
  const section = (title, inner) => inner ? `<div class="hy-sec"><div class="hy-title">${esc(title)}</div>${inner}</div>` : '';
  const empty = txt => `<span class="tag">${esc(txt)}</span>`;
  const humanize = k => k.replace(/_/g, ' ').replace(/\b(bedwars|skywars|duels|tntrun|pvprun|bowspleef|tntag|capture)\b/g, m => ({ bedwars: '', skywars: '', duels: '' }[m] ?? m)).replace(/\s+/g, ' ').trim();

  /* ---------- Hypixel formatting helpers ---------- */
  const MC = { BLACK: '#000', DARK_BLUE: '#00A', DARK_GREEN: '#0A0', DARK_AQUA: '#0AA', DARK_RED: '#A00', DARK_PURPLE: '#A0A', GOLD: '#FA0', GRAY: '#AAA', DARK_GRAY: '#555', BLUE: '#55F', GREEN: '#5F5', AQUA: '#5FF', RED: '#F55', LIGHT_PURPLE: '#F5F', YELLOW: '#FF5', WHITE: '#FFF' };
  const CODE = { 0: '#000', 1: '#00A', 2: '#0A0', 3: '#0AA', 4: '#A00', 5: '#A0A', 6: '#FA0', 7: '#AAA', 8: '#555', 9: '#55F', a: '#5F5', b: '#5FF', c: '#F55', d: '#F5F', e: '#FF5', f: '#FFF' };
  function rankOf(pl) {
    if (pl.prefix) { const m = pl.prefix.match(/§([0-9a-f])/); return { name: pl.prefix.replace(/§./g, '').replace(/[\[\]]/g, ''), color: vivid(m ? CODE[m[1]] : '#F55') }; }
    const r = pl.rank && !['NORMAL', 'NONE'].includes(pl.rank) ? pl.rank : null;
    if (r) return { ADMIN: { name: 'ADMIN', color: '#F55' }, GAME_MASTER: { name: 'GM', color: vivid('#0A0') }, MODERATOR: { name: 'MOD', color: vivid('#0A0') }, YOUTUBER: { name: 'YOUTUBE', color: '#F55' } }[r] || { name: r, color: '#F55' };
    if (pl.monthlyPackageRank === 'SUPERSTAR') return { name: 'MVP++', color: pl.monthlyRankColor === 'AQUA' ? '#5FF' : '#FA0', plus: vivid(MC[pl.rankPlusColor] || '#F55') };
    const pk = (pl.newPackageRank && pl.newPackageRank !== 'NONE') ? pl.newPackageRank : pl.packageRank;
    return { VIP: { name: 'VIP', color: '#5F5' }, VIP_PLUS: { name: 'VIP+', color: '#5F5', plus: '#FA0' }, MVP: { name: 'MVP', color: '#5FF' }, MVP_PLUS: { name: 'MVP+', color: '#5FF', plus: vivid(MC[pl.rankPlusColor] || '#F55') } }[pk] || null;
  }
  // "[117✫] [MVP+] Name [TAG]" — the way Hypixel shows a player in a lobby
  function nameHTML(pl, fallbackName, star, guild) {
    const r = rankOf(pl); const name = esc(pl.displayname || fallbackName);
    const starPart = star != null ? `<span style="color:${starColor(star)}">[${fmtN(star)}✫]</span> ` : '';
    const guildPart = guild && guild.tag ? ` <span style="color:${vivid(MC[guild.tagColor] || '#AAA')}">[${esc(guild.tag)}]</span>` : '';
    if (!r) return `${starPart}<span style="color:#AAA">${name}</span>${guildPart}`;
    const base = r.name.replace(/\+/g, ''), plus = r.name.slice(base.length);
    return `${starPart}<span style="color:${r.color}">[${esc(base)}${plus ? `<span style="color:${r.plus || r.color}">${plus}</span>` : ''}] ${name}</span>${guildPart}`;
  }
  const guildLine = g => g && g.name ? `<div class="guild-line"><span class="gl-ico">⚑</span><a href="#" class="gl-name" style="color:${vivid(MC[g.tagColor] || '#AAA')}" title="${fa() ? 'باز کردن گیلد' : 'open guild'}" onclick="GUILD.open(this.dataset.g); return false;" data-g="${esc(g.name)}">${esc(g.name)}${g.tag ? ` <b>[${esc(g.tag)}]</b>` : ''}</a><span class="gl-sub">${fa() ? 'گیلد' : 'guild'} · ${L('level')} ${fmtN(Math.floor(guildLevel(g.exp)))} · ${fmtN((g.members || []).length)} ${L('members')}</span></div>` : '';
  const netLevel = exp => Math.max(1, (Math.sqrt(2 * (exp || 0) + 30625) / 50) - 2.5);
  const bwLevel = exp => { exp = exp || 0; const p = Math.floor(exp / 487000); exp -= p * 487000; let l; if (exp < 500) l = exp / 500; else if (exp < 1500) l = 1 + (exp - 500) / 1000; else if (exp < 3500) l = 2 + (exp - 1500) / 2000; else if (exp < 7000) l = 3 + (exp - 3500) / 3500; else l = 4 + (exp - 7000) / 5000; return p * 100 + l; };
  const swLevel = xp => { const T = [0, 20, 70, 150, 250, 500, 1000, 2000, 3500, 6000, 10000, 15000]; xp = xp || 0; if (xp >= 15000) return 12 + (xp - 15000) / 10000; let i = 0; while (i < T.length - 1 && xp >= T[i + 1]) i++; return i + (xp - T[i]) / (T[i + 1] - T[i]); };
  const READABLE = { '#000': '#666', '#00A': '#5C7CFF', '#0A0': '#4CDB4C', '#0AA': '#33D6D6', '#A00': '#FF5C5C', '#A0A': '#E066FF', '#555': '#9A9A9A' };
  const vivid = c => READABLE[c] || c;
  const starColor = s => vivid(s < 100 ? '#AAA' : s < 200 ? '#FFF' : s < 300 ? '#FA0' : s < 400 ? '#5FF' : s < 500 ? '#0A0' : s < 600 ? '#0AA' : s < 700 ? '#A00' : s < 800 ? '#F5F' : s < 900 ? '#55F' : s < 1000 ? '#A0A' : '#FF5');
  const swColor = l => vivid(l < 5 ? '#AAA' : l < 10 ? '#FFF' : l < 15 ? '#FA0' : l < 20 ? '#5FF' : l < 25 ? '#0A0' : l < 30 ? '#0AA' : l < 35 ? '#A00' : l < 40 ? '#F5F' : l < 45 ? '#55F' : l < 50 ? '#A0A' : '#FF5');
  /* ---------- tiers: the higher the number, the louder the tile (classes styled in lookup.html) ----------
     FKDR: <1 gray · 1–2.99 white · 3–6.99 green · 7–9.99 yellow · 10–29.99 red · 30–59.99 purple · 60–99.99 aqua · 100–999 rainbow · 1000+ rainbow + effects */
  const fkdrTier = f => { f = +f; return f >= 1000 ? 'fk fk-god' : f >= 100 ? 'fk fk-rainbow' : f >= 60 ? 'fk fk-aqua' : f >= 30 ? 'fk fk-purple' : f >= 10 ? 'fk fk-red' : f >= 7 ? 'fk fk-yellow' : f >= 3 ? 'fk fk-green' : f >= 1 ? 'fk fk-white' : 'fk fk-gray'; };
  const fkdrCalc = (label, kills, deaths, hi) => { const v = R(kills, deaths); return calc(label, v, hi, null, fkdrTier(v)); };
  // levels keep their Hypixel colour; the tile just gets floating particles in that colour — more of them the higher the level.
  const ptCount = (v, a, b, c) => v >= c ? 8 : v >= b ? 5 : v >= a ? 3 : 0;
  const particles = (n, color) => n ? `<span class="pts" style="color:${color}">${Array.from({ length: n }, (_, i) => `<i style="left:${8 + Math.round(84 * ((i * 0.618) % 1))}%;--dx:${(i % 2 ? 1 : -1) * (4 + i)}px;--s:${3 + (i % 3)}px;animation-duration:${(2.2 + (i % 3) * 0.5).toFixed(1)}s;animation-delay:-${((i * 0.37) % 2.4).toFixed(2)}s"></i>`).join('')}</span>` : '';
  const starCalc = (label, s, hi) => { const n = ptCount(s, 100, 500, 1000); return calc(label, fmtN(s) + '✫', hi, starColor(s), n ? 'lv' : '', particles(n, starColor(s))); };
  const swCalc = (label, l, hi) => { const n = ptCount(l, 15, 30, 50); return calc(label, fmtN(l) + '⋆', hi, swColor(l), n ? 'lv' : '', particles(n, swColor(l))); };
  const guildLevel = exp => { const T = [100000, 150000, 250000, 500000, 750000, 1000000, 1250000, 1500000, 2000000, 2500000, 2500000, 2500000, 2500000, 2500000, 3000000]; let lvl = 0; exp = exp || 0; for (let i = 0; ; i++) { const need = i < T.length ? T[i] : 3000000; if (exp < need) return lvl + exp / need; exp -= need; lvl++; } };
  const dt = ts => ts ? new Date(ts).toLocaleDateString(fa() ? 'fa-IR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;
  const GAME_NAMES = { BEDWARS: 'BedWars', SKYWARS: 'SkyWars', DUELS: 'Duels', MURDER_MYSTERY: 'Murder Mystery', TNTGAMES: 'TNT Games', ARCADE: 'Arcade', SURVIVAL_GAMES: 'Blitz SG', MCGO: 'Cops and Crims', BUILD_BATTLE: 'Build Battle', PAINTBALL: 'Paintball', QUAKECRAFT: 'Quakecraft', VAMPIREZ: 'VampireZ', SPEED_UHC: 'Speed UHC', UHC: 'UHC Champions', SUPER_SMASH: 'Smash Heroes', GINGERBREAD: 'Turbo Kart Racers', ARENA: 'Arena Brawl', BATTLEGROUND: 'Warlords', WALLS: 'The Walls', WALLS3: 'Mega Walls', PIT: 'The Pit', WOOL_GAMES: 'Wool Games', SKYBLOCK: 'SkyBlock', HOUSING: 'Housing', PROTOTYPE: 'Prototype', SMP: 'SMP', REPLAY: 'Replay', LIMBO: 'Limbo', MAIN_LOBBY: 'Main Lobby', LEGACY: 'Classic Games', TOURNAMENT_LOBBY: 'Tournament Lobby' };

  /* ---------- per-game renderers ----------
     Each returns HTML for the panel; `s` is stats[game], `pl` the player, `mode` the selected mode key. */
  const modeButtons = (id, modes, cur) => `<div class="mtabs">${modes.map(([k, label]) => `<button class="mbtn${k === cur ? ' on' : ''}" data-mode="${esc(k)}">${esc(label)}</button>`).join('')}</div>`;
  const has = (s, keys) => keys.some(k => s[k]);

  const GAMES = {
    Bedwars: { title: 'BedWars', icon: '🛏️',
      modes: s => [['', fa() ? 'کلی' : 'Overall'], ['eight_one_', 'Solo'], ['eight_two_', 'Doubles'], ['four_three_', '3v3v3v3'], ['four_four_', '4v4v4v4'], ['two_four_', '4v4'], ['castle_', 'Castle']].filter(([p]) => p === '' || s[p + 'games_played_bedwars'] || s[p + 'wins_bedwars'] || s[p + 'final_kills_bedwars']),
      render(s, pl, P) {
        const star = P === '' ? ((pl.achievements && pl.achievements.bedwars_level) || (s.Experience != null ? Math.floor(bwLevel(s.Experience)) : null)) : null;
        const g = k => s[P + k];
        const games = g('games_played_bedwars') || ((g('wins_bedwars') || 0) + (g('losses_bedwars') || 0)) || 0, fkdr = R(g('final_kills_bedwars'), g('final_deaths_bedwars'));
        return grid([
          star != null ? starCalc('stars', star, true) : '',
          stat('wins', N(g('wins_bedwars') || 0)), stat('losses', N(g('losses_bedwars') || 0)), calc('WLR', R(g('wins_bedwars'), g('losses_bedwars')), true),
          games ? calc('win rate', Math.round(100 * (g('wins_bedwars') || 0) / games) + '%') : '', games ? calc('finals / game', (((g('final_kills_bedwars') || 0)) / games).toFixed(2)) : '',
          star != null && P === '' ? calc('index', N(Math.round(star * fkdr * fkdr)), false, '#FA0') : '',
          stat('final kills', N(g('final_kills_bedwars') || 0)), stat('final deaths', N(g('final_deaths_bedwars') || 0)), fkdrCalc('FKDR', g('final_kills_bedwars'), g('final_deaths_bedwars'), true),
          stat('beds broken', N(g('beds_broken_bedwars'))), stat('beds lost', N(g('beds_lost_bedwars'))), calc('BBLR', g('beds_lost_bedwars') != null ? R(g('beds_broken_bedwars'), g('beds_lost_bedwars')) : null),
          stat('kills', N(g('kills_bedwars') || 0)), stat('deaths', N(g('deaths_bedwars') || 0)), calc('KDR', R(g('kills_bedwars'), g('deaths_bedwars'))),
          stat('void kills', N(g('void_kills_bedwars'))), stat('winstreak', N(g('winstreak'))), stat('games', N(g('games_played_bedwars'))),
          stat('iron', N(g('iron_resources_collected_bedwars'))), stat('gold', N(g('gold_resources_collected_bedwars'))), stat('diamond', N(g('diamond_resources_collected_bedwars'))), stat('emerald', N(g('emerald_resources_collected_bedwars'))),
          stat('items purchased', N(g('items_purchased_bedwars'))), P === '' ? stat('coins', N(s.coins)) : '', P === '' ? stat('XP', N(s.Experience)) : '',
        ]);
      } },
    SkyWars: { title: 'SkyWars', icon: '☁️',
      modes: s => [['', fa() ? 'کلی' : 'Overall'], ['_solo', 'Solo'], ['_solo_normal', 'Solo Normal'], ['_solo_insane', 'Solo Insane'], ['_team', 'Teams'], ['_team_normal', 'Teams Normal'], ['_team_insane', 'Teams Insane'], ['_ranked', 'Ranked'], ['_mega', 'Mega'], ['_lab', 'Lab']].filter(([p]) => p === '' || s['wins' + p] || s['losses' + p] || s['games' + p]),
      render(s, pl, S) {
        const g = k => s[k + S] != null ? s[k + S] : (S === '' ? s[k] : undefined);
        const lvl = S === '' ? Math.floor(swLevel(s.skywars_experience)) : null;
        return grid([
          lvl != null ? swCalc('level', lvl, true) : '',
          stat('wins', N(g('wins') || 0)), stat('losses', N(g('losses') || 0)), calc('WLR', R(g('wins'), g('losses')), true),
          stat('kills', N(g('kills') || 0)), stat('deaths', N(g('deaths') || 0)), calc('KDR', R(g('kills'), g('deaths')), true), stat('assists', N(g('assists'))),
          stat('winstreak', N(g('win_streak') != null ? g('win_streak') : g('winstreak'))), stat('games', N(g('games'))), stat('time played', secs(g('time_played'))),
          stat('void kills', N(g('void_kills'))), stat('melee kills', N(g('melee_kills'))), stat('arrows hit', N(g('arrows_hit'))), stat('arrows shot', N(g('arrows_shot'))), calc('bow accuracy', g('arrows_shot') ? Math.round(100 * (g('arrows_hit') || 0) / g('arrows_shot')) + '%' : null),
          stat('chests opened', N(g('chests_opened'))), stat('blocks placed', N(g('blocks_placed'))), stat('blocks broken', N(g('blocks_broken'))), stat('longest bow shot', N(g('longest_bow_shot'))), stat('most kills / game', N(g('most_kills_game'))), stat('fastest win', secs(g('fastest_win'))),
          S === '' ? stat('souls', N(s.souls)) : '', S === '' ? stat('heads', N(s.heads)) : '', S === '' ? stat('coins', N(s.coins)) : '', S === '' ? stat('XP', N(s.skywars_experience)) : '',
        ]);
      } },
    Duels: { title: 'Duels', icon: '⚔️',
      modes: s => [['', fa() ? 'کلی' : 'Overall'], ['classic_duel_', 'Classic'], ['uhc_duel_', 'UHC 1v1'], ['uhc_doubles_', 'UHC 2v2'], ['uhc_four_', 'UHC 4v4'], ['uhc_meetup_', 'UHC Deathmatch'], ['op_duel_', 'OP 1v1'], ['op_doubles_', 'OP 2v2'], ['sw_duel_', 'SkyWars 1v1'], ['sw_doubles_', 'SkyWars 2v2'], ['bow_duel_', 'Bow'], ['bowspleef_duel_', 'Bow Spleef'], ['sumo_duel_', 'Sumo'], ['bridge_duel_', 'Bridge 1v1'], ['bridge_doubles_', 'Bridge 2v2'], ['bridge_threes_', 'Bridge 3v3'], ['bridge_four_', 'Bridge 4v4'], ['bridge_2v2v2v2_', 'Bridge 2v2v2v2'], ['bridge_3v3v3v3_', 'Bridge 3v3v3v3'], ['capture_threes_', 'Bridge CTF'], ['combo_duel_', 'Combo'], ['boxing_duel_', 'Boxing'], ['potion_duel_', 'NoDebuff'], ['blitz_duel_', 'Blitz'], ['mw_duel_', 'Mega Walls 1v1'], ['mw_doubles_', 'Mega Walls 2v2'], ['parkour_eight_', 'Parkour'], ['duel_arena_', 'Arena'], ['bedwars_two_one_duels_', 'BedWars 2v1']].filter(([p]) => p === '' || s[p + 'wins'] || s[p + 'losses'] || s[p + 'rounds_played']),
      render(s, pl, P) {
        const g = k => s[P + k];
        const div = (() => { const tiers = ['ascended', 'divine', 'celestial', 'godlike', 'grandmaster', 'legend', 'master', 'diamond', 'gold', 'iron', 'rookie']; for (const tr of tiers) { const v = s[`all_modes_${tr}_title_prestige`]; if (v) return tr[0].toUpperCase() + tr.slice(1) + (v > 1 ? ' ' + ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][v] || v : ''); } return null; })();
        const modeKey = P.replace(/_$/, '');
        return grid([
          P === '' && div ? stat('division', esc(div), true, '#FA0') : '',
          stat('wins', N(g('wins') || 0), true), stat('losses', N(g('losses') || 0)), calc('WLR', R(g('wins'), g('losses')), true),
          stat('kills', N(g('kills') || 0)), stat('deaths', N(g('deaths') || 0)), calc('KDR', R(g('kills'), g('deaths'))),
          stat('winstreak', N(P === '' ? s.current_winstreak : s['current_winstreak_mode_' + modeKey])), stat('best winstreak', N(P === '' ? s.best_overall_winstreak : s['best_winstreak_mode_' + modeKey])),
          stat('rounds played', N(g('rounds_played'))), P === '' ? stat('games', N(s.games_played_duels)) : '',
          stat('bow hits', N(g('bow_hits'))), stat('bow shots', N(g('bow_shots'))), calc('bow accuracy', g('bow_shots') ? Math.round(100 * (g('bow_hits') || 0) / g('bow_shots')) + '%' : null),
          stat('melee hits', N(g('melee_hits'))), stat('melee swings', N(g('melee_swings'))), calc('melee accuracy', g('melee_swings') ? Math.round(100 * (g('melee_hits') || 0) / g('melee_swings')) + '%' : null),
          stat('damage', N(g('damage_dealt'))), stat('health regenerated', N(g('health_regenerated'))), stat('blocks placed', N(g('blocks_placed'))), stat('goals', N(g('goals'))), P === '' ? stat('coins', N(s.coins)) : '',
        ]);
      } },
    MurderMystery: { title: 'Murder Mystery', icon: '🔪',
      modes: s => [['', fa() ? 'کلی' : 'Overall'], ['_MURDER_CLASSIC', 'Classic'], ['_MURDER_DOUBLE_UP', 'Double Up'], ['_MURDER_ASSASSINS', 'Assassins'], ['_MURDER_INFECTION', 'Infection']].filter(([p]) => p === '' || s['games' + p] || s['wins' + p]),
      render(s, pl, S) {
        const g = k => s[k + S];
        return grid([stat('wins', N(g('wins') || 0), true), stat('games', N(g('games'))), calc('win rate', g('games') ? Math.round(100 * (g('wins') || 0) / g('games')) + '%' : null, true), stat('kills', N(g('kills'))), stat('deaths', N(g('deaths'))), calc('KDR', g('deaths') != null ? R(g('kills'), g('deaths')) : null),
          stat('murderer wins', N(g('murderer_wins'))), stat('detective wins', N(g('detective_wins'))), stat('kills as murderer', N(g('kills_as_murderer'))), stat('kills as infected', N(g('kills_as_infected'))), stat('knife kills', N(g('knife_kills'))), stat('bow kills', N(g('bow_kills'))), stat('thrown knife kills', N(g('thrown_knife_kills'))), stat('was hero', N(g('was_hero'))),
          stat('fastest murderer win', secs(g('quickest_murderer_win_time_seconds'))), stat('fastest detective win', secs(g('quickest_detective_win_time_seconds'))), stat('coins picked up', N(g('coins_pickedup'))), S === '' ? stat('coins', N(s.coins)) : '']);
      } },
    TNTGames: { title: 'TNT Games', icon: '🧨', render(s) {
      return grid([stat('wins', N(s.wins), true), stat('winstreak', N(s.winstreak)), stat('coins', N(s.coins))]) +
        section('TNT Run', grid([stat('wins', N(s.wins_tntrun)), stat('deaths', N(s.deaths_tntrun)), stat('record', secs(s.record_tntrun)), stat('potions splashed', N(s.run_potions_splashed_on_players))])) +
        section('PVP Run', grid([stat('wins', N(s.wins_pvprun)), stat('kills', N(s.kills_pvprun)), stat('deaths', N(s.deaths_pvprun)), stat('record', secs(s.record_pvprun))])) +
        section('Bow Spleef', grid([stat('wins', N(s.wins_bowspleef)), stat('deaths', N(s.deaths_bowspleef)), stat('shots', N(s.tags_bowspleef))])) +
        section('TNT Tag', grid([stat('wins', N(s.wins_tntag)), stat('kills', N(s.kills_tntag)), stat('deaths', N(s.deaths_tntag))])) +
        section('Wizards', grid([stat('wins', N(s.wins_capture)), stat('kills', N(s.kills_capture)), stat('deaths', N(s.deaths_capture)), stat('assists', N(s.assists_capture)), stat('points', N(s.points_capture)), stat('air time', secs(s.air_time_capture))]));
    } },
    Arcade: { title: 'Arcade', icon: '🕹️', render(s) {
      const pp = s.pixel_party || {};
      return grid([stat('coins', N(s.coins), true)]) +
        section('Party Games', grid([stat('wins', N(s.wins_party)), stat('round wins', N(s.round_wins_party)), stat('wins (2)', N(s.wins_party_2)), stat('wins (3)', N(s.wins_party_3))])) +
        section('Zombies', grid([stat('wins', N(s.wins_zombies)), stat('best round', N(s.best_round_zombies)), stat('zombie kills', N(s.zombie_kills_zombies)), stat('deaths', N(s.deaths_zombies)), stat('headshots', N(s.headshots_zombies)), stat('bullets hit', N(s.bullets_hit_zombies)), stat('players revived', N(s.players_revived_zombies)), stat('doors opened', N(s.doors_opened_zombies)), stat('windows repaired', N(s.windows_repaired_zombies))])) +
        section('Hole in the Wall', grid([stat('wins', N(s.wins_hole_in_the_wall)), stat('rounds', N(s.rounds_hole_in_the_wall)), stat('record (qualifier)', N(s.hitw_record_q)), stat('record (finals)', N(s.hitw_record_f))])) +
        section('Mini Walls', grid([stat('wins', N(s.wins_mini_walls)), stat('kills', N(s.kills_mini_walls)), stat('final kills', N(s.final_kills_mini_walls)), stat('deaths', N(s.deaths_mini_walls)), stat('wither kills', N(s.wither_kills_mini_walls)), stat('arrows hit', N(s.arrows_hit_mini_walls))])) +
        section('Dragon Wars', grid([stat('wins', N(s.wins_dragonwars2)), stat('kills', N(s.kills_dragonwars2))])) +
        section('Ender Spleef', grid([stat('wins', N(s.wins_ender)), stat('blocks destroyed', N(s.blocks_destroyed_ender)), stat('powerups', N(s.powerup_activations_ender))])) +
        section('Farm Hunt', grid([stat('wins', N(s.wins_farm_hunt)), stat('kills', N(s.kills_farm_hunt)), stat('poop collected', N(s.poop_collected_farm_hunt))])) +
        section('Football', grid([stat('wins', N(s.wins_soccer)), stat('goals', N(s.goals_soccer)), stat('kicks', N(s.kicks_soccer)), stat('powerkicks', N(s.powerkicks_soccer))])) +
        section('Galaxy Wars', grid([stat('wins', N(s.sw_game_wins)), stat('kills', N(s.sw_kills)), stat('deaths', N(s.sw_deaths)), stat('shots fired', N(s.sw_shots_fired))])) +
        section('One in the Quiver', grid([stat('wins', N(s.wins_oneinthequiver)), stat('kills', N(s.kills_oneinthequiver)), stat('deaths', N(s.deaths_oneinthequiver)), stat('bounty kills', N(s.bounty_kills_oneinthequiver))])) +
        section('Throw Out', grid([stat('wins', N(s.wins_throw_out)), stat('kills', N(s.kills_throw_out)), stat('deaths', N(s.deaths_throw_out))])) +
        section('Simon Says', grid([stat('wins', N(s.wins_simon_says)), stat('rounds', N(s.rounds_simon_says)), stat('top score', N(s.top_score_simon_says))])) +
        section('Dropper', grid([stat('wins', N(s.wins_dropper)), stat('games', N(s.games_played_dropper)), stat('maps completed', N(s.maps_completed_dropper)), stat('flawless games', N(s.flawless_games_dropper)), stat('fastest win', s.fastest_win_dropper ? (s.fastest_win_dropper / 1000).toFixed(1) + 's' : null)])) +
        section('Pixel Party', grid([stat('wins', N(pp.wins)), stat('games', N(pp.games_played)), stat('rounds completed', N(pp.rounds_completed)), stat('powerups', N(pp.power_ups_collected))])) +
        section('Capture the Wool', grid([stat('wins', N(s.woolhunt_participated_wins)), stat('kills', N(s.woolhunt_kills)), stat('deaths', N(s.woolhunt_deaths)), stat('wools captured', N(s.woolhunt_wools_captured))])) +
        section('Blocking Dead', grid([stat('wins', N(s.wins_dayone)), stat('kills', N(s.kills_dayone)), stat('headshots', N(s.headshots_dayone))])) +
        section('Hide and Seek', grid([stat('seeker wins', N(s.seeker_wins_hide_and_seek)), stat('hider wins', N(s.hider_wins_hide_and_seek))])) +
        section('Creeper Attack', grid([stat('max wave', N(s.max_wave))])) +
        section('Seasonal', grid([stat('Grinch Simulator wins', N(s.wins_grinch_simulator_v2)), stat('Easter Simulator wins', N(s.wins_easter_simulator)), stat('Halloween Simulator wins', N(s.wins_halloween_simulator)), stat('Scuba Simulator wins', N(s.wins_scuba_simulator)), stat('Santa Simulator wins', N(s.wins_santa_simulator))]));
    } },
    HungerGames: { title: 'Blitz SG', icon: '🏹', render(s) { return grid([stat('wins', N(s.wins), true), stat('solo wins', N(s.wins_solo_normal)), stat('team wins', N(s.wins_teams_normal)), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('games', N(s.games_played)), stat('damage', N(s.damage)), stat('damage taken', N(s.damage_taken)), stat('arrows hit', N(s.arrows_hit)), stat('arrows shot', N(s.arrows_fired)), stat('chests opened', N(s.chests_opened)), stat('potions drunk', N(s.potions_drunk)), stat('potions thrown', N(s.potions_thrown)), stat('blitz uses', N(s.blitz_uses)), stat('time played', secs(s.time_played)), stat('default kit', s.defaultkit ? esc(s.defaultkit) : null), stat('coins', N(s.coins))]); } },
    MCGO: { title: 'Cops and Crims', icon: '🔫', render(s) { return grid([stat('wins', N(s.game_wins), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('cop kills', N(s.cop_kills)), stat('criminal kills', N(s.criminal_kills)), stat('headshots', N(s.headshot_kills)), stat('assists', N(s.assists)), stat('shots fired', N(s.shots_fired)), stat('bombs planted', N(s.bombs_planted)), stat('bombs defused', N(s.bombs_defused)), stat('round wins', N(s.round_wins)), stat('grenade kills', N(s.grenade_kills)), stat('coins', N(s.coins))]) + section('Deathmatch', grid([stat('wins', N(s.game_wins_deathmatch)), stat('kills', N(s.kills_deathmatch)), stat('deaths', N(s.deaths_deathmatch))])) + section('Gun Game', grid([stat('wins', N(s.game_wins_gungame)), stat('kills', N(s.kills_gungame)), stat('deaths', N(s.deaths_gungame))])); } },
    BuildBattle: { title: 'Build Battle', icon: '🏗️', render(s) { const title = s.score == null ? null : s.score >= 20000 ? '#1 Builder' : s.score >= 10000 ? 'Master' : s.score >= 7500 ? 'Legend' : s.score >= 5000 ? 'Professional' : s.score >= 3500 ? 'Expert' : s.score >= 2500 ? 'Skilled' : s.score >= 1500 ? 'Experienced' : s.score >= 1000 ? 'Amateur' : s.score >= 500 ? 'Apprentice' : s.score >= 100 ? 'Untrained' : 'Rookie'; return grid([stat('score', N(s.score), true), title ? calc('title', esc(title), true, '#FA0') : '', stat('wins', N(s.wins)), stat('solo wins', N(s.wins_solo_normal)), stat('team wins', N(s.wins_teams_normal)), stat('pro wins', N(s.wins_solo_pro)), stat('Guess the Build wins', N(s.wins_guess_the_build)), stat('Speed Builders wins', N(s.wins_speed_builders)), stat('games', N(s.games_played)), stat('votes', N(s.total_votes)), stat('super votes', N(s.super_votes)), stat('correct guesses', N(s.correct_guesses)), stat('solo best score', N(s.solo_most_points)), stat('team best score', N(s.teams_most_points)), stat('coins', N(s.coins))]); } },
    Paintball: { title: 'Paintball', icon: '🎨', render(s) { return grid([stat('wins', N(s.wins), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('shots fired', N(s.shots_fired)), calc('accuracy', s.shots_fired ? Math.round(100 * (s.kills || 0) / s.shots_fired) + '%' : null), stat('killstreaks', N(s.killstreaks)), stat('force field time', N(s.forcefieldTime)), stat('coins', N(s.coins))]) + section(fa() ? 'ارتقاها' : 'Perks', grid([stat('Godfather', N(s.godfather)), stat('Endurance', N(s.endurance)), stat('Superluck', N(s.superluck)), stat('Fortune', N(s.fortune)), stat('Transfusion', N(s.transfusion)), stat('Adrenaline', N(s.adrenaline)), stat('Headstart', N(s.headstart))])); } },
    Quake: { title: 'Quakecraft', icon: '⚡', render(s) { return grid([stat('wins', N(s.wins), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('headshots', N(s.headshots)), stat('killstreaks', N(s.killstreaks)), stat('highest killstreak', N(s.highest_killstreak)), stat('shots fired', N(s.shots_fired)), stat('distance travelled', N(s.distance_travelled)), stat('coins', N(s.coins))]) + section('Teams', grid([stat('wins', N(s.wins_teams)), stat('kills', N(s.kills_teams)), stat('deaths', N(s.deaths_teams)), stat('headshots', N(s.headshots_teams)), stat('killstreaks', N(s.killstreaks_teams)), stat('shots fired', N(s.shots_fired_teams))])); } },
    VampireZ: { title: 'VampireZ', icon: '🧛', render(s) { return section(fa() ? 'انسان' : 'Human', grid([stat('wins', N(s.human_wins), true), stat('kills', N(s.human_kills)), stat('deaths', N(s.human_deaths)), stat('zombie kills', N(s.zombie_kills))])) + section(fa() ? 'خون‌آشام' : 'Vampire', grid([stat('wins', N(s.vampire_wins), true), stat('kills', N(s.vampire_kills)), stat('deaths', N(s.vampire_deaths)), stat('most kills / game', N(s.most_vampire_kills_new))])) + grid([stat('gold bought', N(s.gold_bought)), stat('coins', N(s.coins))]); } },
    SpeedUHC: { title: 'Speed UHC', icon: '💨', render(s) { return grid([stat('score', N(s.score), true), stat('wins', N(s.wins)), stat('losses', N(s.losses)), calc('WLR', R(s.wins, s.losses), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths)), stat('games', N(s.games)), stat('winstreak', N(s.winstreak)), stat('quits', N(s.quits)), stat('survived players', N(s.survived_players)), stat('blocks broken', N(s.blocks_broken)), stat('blocks placed', N(s.blocks_placed)), stat('items enchanted', N(s.items_enchanted)), stat('salt', N(s.salt)), stat('coins', N(s.coins))]) + section('Solo', grid([stat('wins', N(s.wins_solo)), stat('kills', N(s.kills_solo)), stat('deaths', N(s.deaths_solo))])) + section('Teams', grid([stat('wins', N(s.wins_team)), stat('kills', N(s.kills_team)), stat('deaths', N(s.deaths_team))])); } },
    UHC: { title: 'UHC Champions', icon: '🍎', render(s) { const T = [0, 10, 60, 210, 460, 960, 1710, 2710, 5210, 10210, 13210, 16210, 19210, 22210, 25210]; let lvl = 1; for (let i = 0; i < T.length; i++) if ((s.score || 0) >= T[i]) lvl = i + 1; return grid([calc('star', fmtN(lvl) + '✰', true, '#FA0'), stat('score', N(s.score)), stat('wins', N(s.wins)), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('heads eaten', N(s.heads_eaten)), stat('ultimates crafted', N(s.ultimates_crafted)), stat('extra ultimates', N(s.extra_ultimates_crafted)), stat('coins', N(s.coins))]) + section('Solo', grid([stat('wins', N(s.wins_solo)), stat('kills', N(s.kills_solo)), stat('deaths', N(s.deaths_solo))])) + section('Other modes', grid([stat('Red vs Blue wins', N(s['wins_red vs blue'])), stat('Red vs Blue kills', N(s['kills_red vs blue'])), stat('No Diamonds wins', N(s['wins_no diamonds'])), stat('Vanilla Doubles wins', N(s['wins_vanilla doubles']))])); } },
    SuperSmash: { title: 'Smash Heroes', icon: '👊', render(s) { const cls = s.class_stats || {}; return grid([stat('smash level', N(s.smashLevel), true, '#FA0'), stat('total levels', N(s.smash_level_total)), stat('wins', N(s.wins), true), stat('losses', N(s.losses)), calc('WLR', R(s.wins, s.losses)), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths), true), stat('games', N(s.games)), stat('winstreak', N(s.win_streak)), stat('damage', N(s.damage_dealt)), stat('quits', N(s.quits)), stat('active hero', s.active_class ? esc(s.active_class.replace(/_/g, ' ')) : null), stat('coins', N(s.coins))]) + section(fa() ? 'هیروها' : 'Heroes', grid(Object.entries(cls).map(([k, v]) => stat(k.replace(/_/g, ' '), `${N(v.wins || 0)} W · ${N(v.kills || 0)} K`)))); } },
    GingerBread: { title: 'Turbo Kart Racers', icon: '🏁', render(s) { return grid([stat('wins', N(s.wins), true), stat('gold trophies', N(s.gold_trophy), false, '#FA0'), stat('silver trophies', N(s.silver_trophy), false, '#AAA'), stat('bronze trophies', N(s.bronze_trophy), false, '#A52'), stat('laps', N(s.laps_completed)), stat('box pickups', N(s.box_pickups)), stat('bananas hit', N(s.banana_hits_sent)), stat('bananas received', N(s.banana_hits_received)), stat('blue torpedo hits', N(s.blue_torpedo_hit)), stat('horns', N(s.horn)), stat('coins picked up', N(s.coins_picked_up)), stat('coins', N(s.coins))]) + section(fa() ? 'مپ‌ها' : 'Maps', grid([stat('Retro', N(s.retro_plays)), stat('Olympus', N(s.olympus_plays)), stat('Canyon', N(s.canyon_plays)), stat('Jungle Rush', N(s.junglerush_plays)), stat('Hypixel GP', N(s.hypixelgp_plays))])); } },
    Arena: { title: 'Arena Brawl', icon: '🏟️', render(s) { const m = (n) => grid([stat('wins', N(s['wins_' + n])), stat('losses', N(s['losses_' + n])), stat('kills', N(s['kills_' + n])), stat('deaths', N(s['deaths_' + n])), stat('games', N(s['games_' + n])), stat('damage', N(s['damage_' + n])), stat('healed', N(s['healed_' + n])), stat('winstreak', N(s['win_streaks_' + n]))]); return grid([stat('wins', N(s.wins), true), stat('rating', N(s.rating)), stat('keys', N(s.keys)), stat('magical chests', N(s.magical_chest)), stat('coins', N(s.coins))]) + section('1v1', m('1v1')) + section('2v2', m('2v2')) + section('4v4', m('4v4')); } },
    Battleground: { title: 'Warlords', icon: '🛡️', render(s) { return grid([stat('wins', N(s.wins), true), stat('losses', N(s.losses)), calc('WLR', R(s.wins, s.losses), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths)), stat('assists', N(s.assists)), stat('damage', N(s.damage)), stat('damage taken', N(s.damage_taken)), stat('healing', N(s.heal)), stat('damage prevented', N(s.damage_prevented)), stat('life leeched', N(s.life_leeched)), stat('winstreak', N(s.win_streak)), stat('flags captured', N(s.flag_conquer_self)), stat('team flags', N(s.flag_conquer_team)), stat('class', s.chosen_class ? esc(s.chosen_class) : null), stat('coins', N(s.coins))]) + section(fa() ? 'مودها' : 'Modes', grid([stat('CTF wins', N(s.wins_capturetheflag)), stat('Domination wins', N(s.wins_domination)), stat('TDM wins', N(s.wins_teamdeathmatch))])) + section(fa() ? 'کلاس‌ها' : 'Classes', grid([stat('Mage', N(s.mage_plays)), stat('Paladin', N(s.paladin_plays)), stat('Shaman', N(s.shaman_plays)), stat('Warrior', N(s.warrior_plays))])); } },
    Walls: { title: 'The Walls', icon: '🧱', render(s) { return grid([stat('wins', N(s.wins), true), stat('losses', N(s.losses)), calc('WLR', R(s.wins, s.losses), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths)), stat('assists', N(s.assists)), stat('coins', N(s.coins))]); } },
    Walls3: { title: 'Mega Walls', icon: '🏰', render(s) { return grid([stat('wins', N(s.wins), true), stat('losses', N(s.losses)), calc('WLR', R(s.wins, s.losses), true), stat('kills', N(s.kills)), stat('deaths', N(s.deaths)), calc('KDR', R(s.kills, s.deaths)), stat('assists', N(s.assists)), stat('final kills', N(s.final_kills)), stat('final deaths', N(s.final_deaths)), s.final_deaths != null ? fkdrCalc('FKDR', s.final_kills, s.final_deaths, true) : '', stat('final assists', N(s.final_assists)), stat('wither damage', N(s.wither_damage)), stat('wither kills', N(s.wither_kills)), stat('games', N(s.games_played)), stat('class', s.chosen_class ? esc(s.chosen_class) : null), stat('coins', N(s.coins))]); } },
    Pit: { title: 'The Pit', icon: '🕳️', present: s => !!(get(s, 'pit_stats_ptl.kills') || get(s, 'profile.xp') || get(s, 'pit_stats_ptl.joins')), render(s) { const p = s.pit_stats_ptl || {}, pr = s.profile || {}; return grid([stat('XP', N(pr.xp), true, '#5FF'), stat('prestiges', N((pr.prestiges || []).length), false, '#FA0'), stat('gold', N(pr.cash), false, '#FA0'), stat('renown', N(pr.renown)), stat('kills', N(p.kills)), stat('deaths', N(p.deaths)), calc('KDR', R(p.kills, p.deaths), true), stat('assists', N(p.assists)), stat('max streak', N(p.max_streak)), stat('damage', N(p.damage_dealt)), stat('damage taken', N(p.damage_received)), stat('sword hits', N(p.sword_hits)), stat('arrows hit', N(p.arrow_hits)), stat('arrows shot', N(p.arrows_fired)), stat('joins', N(p.joins)), stat('time played', p.playtime_minutes != null ? (p.playtime_minutes / 60).toFixed(1) + 'h' : null), stat('gold earned', N(p.gold_earned)), stat('contracts', N(p.contracts_completed)), stat('jumps into pit', N(p.jumped_into_pit)), stat('chat messages', N(p.chat_messages)), stat('golden heads eaten', N(p.ghead_eaten)), stat('gapples eaten', N(p.gapple_eaten)), stat('night quests', N(p.night_quests_completed)), stat('sewer treasures', N(p.sewer_treasures_found)), stat('ingots picked up', N(p.ingots_picked_up)), stat('wheat farmed', N(p.wheat_farmed)), stat('fishing rods launched', N(p.fishing_rod_launched))]); } },
    WoolGames: { title: 'Wool Games', icon: '🐑', present: s => !!(get(s, 'wool_wars.stats.games_played') || get(s, 'sheep_wars.stats.games_played') || get(s, 'capture_the_wool.stats.participated_wins') || s.coins), render(s) { const ww = get(s, 'wool_wars.stats') || {}, sw = get(s, 'sheep_wars.stats') || {}, ctw = get(s, 'capture_the_wool.stats') || {}; return grid([stat('XP', N(get(s, 'progression.experience')), true, '#5FF'), stat('coins', N(s.coins))]) + section('Wool Wars', grid([stat('wins', N(ww.wins), true), stat('games', N(ww.games_played)), stat('kills', N(ww.kills)), stat('deaths', N(ww.deaths)), calc('KDR', ww.deaths != null ? R(ww.kills, ww.deaths) : null), stat('assists', N(ww.assists)), stat('blocks broken', N(ww.blocks_broken)), stat('wool placed', N(ww.wool_placed)), stat('powerups', N(ww.powerups_gotten))])) + section('Sheep Wars', grid([stat('wins', N(sw.wins), true), stat('losses', N(sw.losses)), stat('games', N(sw.games_played)), stat('kills', N(sw.kills)), stat('deaths', N(sw.deaths)), stat('sheep thrown', N(sw.sheep_thrown)), stat('magic wool hits', N(sw.magic_wool_hit)), stat('damage', N(sw.damage_dealt))])) + section('Capture the Wool', grid([stat('wins', N(ctw.participated_wins), true), stat('losses', N(ctw.participated_losses)), stat('kills', N(ctw.kills)), stat('deaths', N(ctw.deaths)), stat('assists', N(ctw.assists)), stat('wools captured', N(ctw.wools_captured)), stat('wools stolen', N(ctw.wools_stolen)), stat('gold earned', N(ctw.gold_earned)), stat('fastest win', secs(ctw.fastest_win ? ctw.fastest_win / 1000 : null))])); } },
    SkyBlock: { title: 'SkyBlock', icon: '🏝️', present: s => !!(s.profiles && Object.keys(s.profiles).length), render(s, pl) { const list = Object.values(s.profiles || {}); return `<div class="row"><span class="k">${fa() ? 'پروفایل‌ها' : 'profiles'}</span><span class="tags">${list.map(p => `<a class="tag info" href="https://sky.shiiyu.moe/stats/${encodeURIComponent(pl.displayname || '')}/${encodeURIComponent(p.cute_name || '')}" target="_blank" rel="noopener">${esc(p.cute_name || p.profile_id)} ↗</a>`).join('')}</span></div><p class="vhint" style="text-align:left">${fa() ? 'آمار کامل اسکای‌بلاک روی SkyCrypt باز می‌شه.' : 'Full SkyBlock stats open on SkyCrypt.'}</p>`; } },
  };
  // anything not curated: show its numeric fields
  const SKIP = /^(active|packages|kit_|levelFormatted|chest|selected|lastTourneyAd|.*_prestige$|.*[cC]osmetic|favorite|purchased|inventory|spray|monthly_|weekly_|.*_openedChests|.*_opened(Commons|Rares|Epics|Legendaries)|data_version|updated_stats|saved_stats|clearup|lastLevel|new_|.*_double_jumps)/;
  const auto = s => { const ks = Object.entries(s).filter(([k, v]) => typeof v === 'number' && !SKIP.test(k)).sort((a, b) => (a[0] === 'coins' ? -1 : b[0] === 'coins' ? 1 : a[0].localeCompare(b[0]))).slice(0, 60); return ks.length ? grid(ks.map(([k, v]) => stat(humanize(k), N(v), k === 'coins' || k === 'wins'))) : empty(fa() ? 'آماری نیست.' : 'No stats.'); };
  const isPresent = (id, s) => { const g = GAMES[id]; if (g && g.present) return g.present(s); return Object.entries(s).some(([k, v]) => typeof v === 'number' && k !== 'coins' && !SKIP.test(k) && v) || (s.coins > 0); };

  /* ---------- state + rendering ---------- */
  const ST = { p: null, player: null, guild: undefined, tab: 'overview', mode: {} };
  const ORDER = ['Bedwars', 'SkyWars', 'Duels', 'MurderMystery', 'TNTGames', 'Arcade', 'Pit', 'WoolGames', 'HungerGames', 'MCGO', 'BuildBattle', 'Paintball', 'Quake', 'VampireZ', 'SpeedUHC', 'UHC', 'SuperSmash', 'GingerBread', 'Arena', 'Battleground', 'Walls', 'Walls3', 'SkyBlock'];
  const MAIN = ['Bedwars', 'SkyWars', 'Duels', 'MurderMystery', 'TNTGames', 'Arcade', 'Pit', 'WoolGames'];
  function tabs() {
    const st = ST.player.stats || {};
    const present = id => st[id] && isPresent(id, st[id]);
    const btn = (id, label, icon) => `<button class="gbtn${ST.tab === id ? ' on' : ''}" data-tab="${esc(id)}">${icon ? `<span class="gi">${icon}</span>` : ''}${esc(label)}</button>`;
    const game = id => btn(id, (GAMES[id] || {}).title || humanize(id), (GAMES[id] || {}).icon || '🎮');
    const main = MAIN.filter(present), classic = ORDER.filter(id => !MAIN.includes(id) && id !== 'SkyBlock' && present(id));
    const other = [...(present('SkyBlock') ? ['SkyBlock'] : []), ...Object.keys(st).filter(id => !ORDER.includes(id) && !['Housing', 'Legacy', 'SkyClash', 'TrueCombat'].includes(id) && present(id))];
    const group = (title, inner) => inner ? `<div class="ggroup"><span class="gg-title">${esc(title)}</span><div class="gtabs">${inner}</div></div>` : '';
    return group(fa() ? 'کلی' : 'General', btn('overview', fa() ? 'نمای کلی' : 'Overview', '◈') + btn('guild', fa() ? 'گیلد' : 'Guild', '⚑'))
      + group(fa() ? 'بازی‌های اصلی' : 'Main games', main.map(game).join(''))
      + group(fa() ? 'بازی‌های کلاسیک' : 'Classic games', classic.map(game).join(''))
      + group(fa() ? 'دیگر' : 'Other', other.map(game).join(''));
  }
  function overview() {
    const pl = ST.player, st = pl.stats || {}, r = rankOf(pl);
    const lvl = netLevel(pl.networkExp), pct = Math.round((lvl % 1) * 100);
    const quests = pl.quests ? Object.values(pl.quests).reduce((n, q) => n + ((q && q.completions) ? q.completions.length : 0), 0) : null;
    const chall = pl.challenges && pl.challenges.all_time ? Object.values(pl.challenges.all_time).reduce((a, b) => a + (b || 0), 0) : null;
    const soc = (pl.socialMedia && pl.socialMedia.links) || {};
    const SOC = { DISCORD: ['Discord', null], YOUTUBE: ['YouTube', 'https://youtube.com/'], TWITTER: ['Twitter', 'https://twitter.com/'], INSTAGRAM: ['Instagram', 'https://instagram.com/'], TWITCH: ['Twitch', 'https://twitch.tv/'], HYPIXEL: ['Forums', ''], TIKTOK: ['TikTok', 'https://tiktok.com/@'] };
    const socHTML = Object.entries(soc).map(([k, v]) => { const d = SOC[k] || [k, '']; const url = /^https?:/.test(v) ? v : (d[1] != null ? d[1] + v.replace(/^@/, '') : null); return url ? `<a class="tag info" href="${esc(url)}" target="_blank" rel="noopener">${esc(d[0])} ↗</a>` : `<span class="tag info" title="${esc(v)}">${esc(d[0])}: ${esc(v)}</span>`; }).join('');
    const bw = st.Bedwars || {}, sw = st.SkyWars || {}, du = st.Duels || {}, mm = st.MurderMystery || {};
    const bwStar = (pl.achievements && pl.achievements.bedwars_level) || (bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null);
    return `<div class="hy-head">${r ? `<span class="rank" style="color:${r.color}">${esc(r.name)}</span>` : `<span class="tag">Default</span>`}
</div>
      <div class="lvl"><div class="lvl-bar"><i style="width:${pct}%"></i></div><span>${L('network level')} <b>${fmtN(Math.floor(lvl))}</b> · ${fmtN(pct)}% → ${fmtN(Math.floor(lvl) + 1)}</span></div>
      ${grid([stat('karma', N(pl.karma)), stat('achievement points', N(pl.achievementPoints)), stat('quests', N(quests)), stat('challenges', N(chall)), stat('achievements', N(pl.achievementsOneTime ? pl.achievementsOneTime.length : null)), stat('first login', dt(pl.firstLogin)), stat('last login', dt(pl.lastLogin)), stat('last game', pl.mostRecentGameType ? esc(GAME_NAMES[pl.mostRecentGameType] || pl.mostRecentGameType) : null), stat('language', pl.userLanguage ? esc(pl.userLanguage) : null), stat('MC version', pl.mcVersionRp ? esc(pl.mcVersionRp) : null)])}
      ${socHTML ? `<div class="row"><span class="k">${fa() ? 'سوشال' : 'socials'}</span><span class="tags">${socHTML}</span></div>` : ''}
      ${section(fa() ? 'خلاصه' : 'Highlights', grid([bwStar != null ? starCalc('BedWars ' + L('stars'), bwStar, true) : '', bw.final_kills_bedwars != null ? fkdrCalc('BedWars FKDR', bw.final_kills_bedwars, bw.final_deaths_bedwars) : '', sw.skywars_experience != null ? swCalc('SkyWars ' + L('level'), Math.floor(swLevel(sw.skywars_experience)), true) : '', sw.kills != null ? calc('SkyWars KDR', R(sw.kills, sw.deaths)) : '', du.wins != null ? stat('Duels ' + L('wins'), N(du.wins)) : '', du.wins != null ? calc('Duels WLR', R(du.wins, du.losses)) : '', mm.wins != null ? stat('Murder Mystery ' + L('wins'), N(mm.wins)) : '', st.TNTGames && st.TNTGames.wins != null ? stat('TNT Games ' + L('wins'), N(st.TNTGames.wins)) : '', st.Arcade && st.Arcade.coins != null ? stat('Arcade ' + L('coins'), N(st.Arcade.coins)) : '']))}`;
  }
  function guildPanel() {
    if (ST.guild === undefined) return `<span class="tag"><span class="spin"></span>${t('checking…')}</span>`;
    if (ST.guild === null) return empty(fa() ? 'توی گیلدی نیست.' : 'Not in a guild.');
    if (ST.guild.error) return empty(ST.guild.error);
    const g = ST.guild, me = (g.members || []).find(m => m.uuid && m.uuid.replace(/-/g, '') === ST.p.undashed), lvl = guildLevel(g.exp), tagColor = MC[g.tagColor] || '#AAA';
    return `<div class="hy-head"><b style="font-size:18px">${esc(g.name)}</b>${g.tag ? `<span class="rank" style="color:${tagColor}">[${esc(g.tag)}]</span>` : ''}</div>
      ${g.description ? `<p class="vhint" style="text-align:left">${esc(g.description)}</p>` : ''}
      ${grid([calc('level', fmtN(Math.floor(lvl)), true, '#FA0'), stat('members', N((g.members || []).length)), stat('created', dt(g.created)), stat('XP', N(g.exp)), me ? stat('rank', esc(me.rank)) : '', me ? stat('joined', dt(me.joined)) : '', g.publiclyListed != null ? stat('listed', g.publiclyListed ? (fa() ? 'بله' : 'yes') : (fa() ? 'نه' : 'no')) : ''])}
      ${g.preferredGames && g.preferredGames.length ? `<div class="row"><span class="k">${esc(L('games'))}</span><span class="tags">${g.preferredGames.map(x => `<span class="tag">${esc(GAME_NAMES[x] || x)}</span>`).join('')}</span></div>` : ''}`;
  }
  function panel() {
    if (ST.tab === 'overview') return overview();
    if (ST.tab === 'guild') return guildPanel();
    const s = (ST.player.stats || {})[ST.tab] || {}, g = GAMES[ST.tab];
    if (!g) return auto(s);
    let html = '';
    if (g.modes) { const modes = g.modes(s); const cur = modes.some(([k]) => k === (ST.mode[ST.tab] || '')) ? (ST.mode[ST.tab] || '') : ''; if (modes.length > 1) html += modeButtons(ST.tab, modes, cur); html += g.render(s, ST.player, cur) || empty(fa() ? 'آماری نیست.' : 'No stats.'); }
    else html += g.render(s, ST.player) || empty(fa() ? 'آماری نیست.' : 'No stats.');
    return html;
  }
  function draw() {
    const body = $('#hyBody'); body.innerHTML = tabs() + `<div class="gpanel">${panel()}</div>`;
    body.querySelectorAll('.gbtn').forEach(b => b.addEventListener('click', () => { ST.tab = b.dataset.tab; if (ST.tab === 'guild' && ST.guild === undefined) loadGuild(); draw(); }));
    body.querySelectorAll('.mbtn').forEach(b => b.addEventListener('click', () => { ST.mode[ST.tab] = b.dataset.mode; draw(); }));
    const act = body.querySelector('.gbtn.on'); if (act) act.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  /* ---------- fetching (everything goes through the proxy worker) ---------- */
  async function loadGuild() {
    try {
      const r = await fetch(`${PROXY_URL}/guild?uuid=${ST.p.undashed}`); const d = await r.json();
      ST.guild = d && d.success ? (d.guild || null) : { error: (d && (d.cause || d.error)) || 'guild lookup failed' };
    } catch (e) { ST.guild = { error: fa() ? 'گیلد لود نشد.' : 'Guild lookup failed.' }; }
    if (ST.tab === 'guild') draw();
  }
  async function run(p) {
    const box = $('#hy'), body = $('#hyBody'), meta = $('#hyMeta'); box.hidden = false; meta.textContent = '';
    ST.p = p; ST.player = null; ST.guild = undefined; ST.tab = 'overview'; ST.mode = {};
    if (!PROXY_URL || window.PROXY_DOWN) { body.innerHTML = `<div class="row" style="color:var(--muted)"><span>${t('Hypixel stats are not connected yet. Set PROXY_DEFAULT at the top of apps/lookup.html to your proxy worker.')}</span></div>`; return; }
    body.innerHTML = `<span class="tag"><span class="spin"></span>${t('checking…')}</span>`;
    try {
      // Bordic's Hypixel cache through the proxy (api.bordic.xyz/v3/cache/hypixel). `no-store` so the browser never
      // shows a copy from an earlier lookup — the worker re-reads Bordic's newest snapshot every minute.
      // The guild tag (Hypixel API through the worker — guilds are not on Bordic) is fetched alongside.
      const [r, gd] = await Promise.all([fetch(`${PROXY_URL}/player?uuid=${p.undashed}`, { cache: 'no-store' }), fetch(`${PROXY_URL}/guild?uuid=${p.undashed}`).then(x => x.json()).catch(() => null)]);
      let d = null; try { d = await r.json(); } catch (e) { d = null; }
      // when Bordic last refreshed this player: "UPDATED: 16 Sep 2026"
      if (d && d.success && d.lastUpdated) meta.textContent = `${fa() ? 'به‌روزرسانی' : 'UPDATED'}: ${new Date(d.lastUpdated).toLocaleDateString(fa() ? 'fa-IR' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      else meta.textContent = '';
      ST.guild = gd && gd.success ? (gd.guild || null) : { error: (gd && (gd.cause || gd.error)) || (fa() ? 'گیلد لود نشد.' : 'Guild lookup failed.') };
      if (r.status === 429) { body.innerHTML = `<span class="tag warn">${t('Hypixel data is busy — try again in a minute.')}</span>`; return; }
      // Bordic only holds players its users have met: 404 "No data found [uuid]" means nobody with Bordic has seen this player yet
      if (r.status === 404 || (d && /no data/i.test(d.cause || ''))) { body.innerHTML = `<span class="tag">${t('Bordic has no stats for this player yet.')}</span>`; return; }
      if (!d || !d.success) { body.innerHTML = `<span class="tag">${t('Hypixel check failed.')} ${esc((d && (d.cause || d.error)) || (r && r.status) || '')}</span>`; return; }
      if (!d.player) { body.innerHTML = `<span class="tag">${t('Never joined Hypixel.')}</span>`; return; }
      ST.player = d.player;
      // header: guild line above, then [star✫] [RANK] Name [TAG]
      const bw = (d.player.stats || {}).Bedwars; const star = (d.player.achievements && d.player.achievements.bedwars_level) || (bw && bw.Experience != null ? Math.floor(bwLevel(bw.Experience)) : null);
      const g = ST.guild && !ST.guild.error ? ST.guild : null;
      $('#name').innerHTML = nameHTML(d.player, p.username, star, g);
      const gl = $('#guildLine'); if (gl) gl.innerHTML = guildLine(g);
      draw();
    } catch (e) { body.innerHTML = `<span class="tag">${t('Hypixel check failed.')}</span>`; }
  }
  return { run, rankOf, nameHTML, guildLevel, vivid, MC, GAME_NAMES };
})();
