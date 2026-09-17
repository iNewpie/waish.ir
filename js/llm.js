/* ============================================================
   WAISH ASSISTANT — MATCHER + MEMORY
   Reads window.WAISH_DB (js/llm-db.js) and answers a question.
   Detects Persian vs English from the question itself.

   WHAT IT DOES ON TOP OF PLAIN KEYWORD MATCHING
   - Several answers per entry: answer.en / answer.fa may be an
     array → one is picked at random (never the same one twice
     in a row).
   - Memory (window + localStorage):
       · your name ("my name is Ali" / "اسمم علی‌ه") → used in
         greetings, "what's my name", and remembered next visit
       · how many times you visited, when you were last here
       · what you asked about, so "tell me more" / "بیشتر بگو"
         continues the last topic and repeated questions get a
         different wording
       · greetings escalate: hi → hi again → "we've said hi 3
         times now" …
   - Placeholders in answers: {name} {name,} {time} {date}
     {jdate} {day} {visits} {tod} {last} — filled at answer time.
   - Dynamic answers: current time/date, simple maths
     ("12*8", "what is 15% of 80"), "what's my name".
   - Typo tolerance: English words of 5+ letters match keywords
     one edit away ("lunamc" ⇢ "lunmac").
   - Follow-ups: entries may carry `more: {en, fa}` (string or
     array) and/or `related: [ids]` — "more / go on / بیشتر"
     walks through them one at a time.
   ============================================================ */
window.WAISH_LLM = (function () {
  const FA_RE = /[؀-ۿ]/;
  const KEY = 'waish-mem';

  /* ---------- memory ---------- */
  const mem = { name: null, visits: 0, first: 0, last: 0, greeted: 0, turns: 0, lastId: null, lastVariant: {}, asked: {}, moreIdx: {}, likes: [] };
  try { Object.assign(mem, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  mem.greeted = 0; mem.turns = 0; mem.lastId = null; mem.moreIdx = {};          // per-page-load bits
  (function visit() {
    try {
      if (sessionStorage.getItem('waish-visited')) return;   // one visit per tab session, not per terminal window
      sessionStorage.setItem('waish-visited', '1');
      mem.prevVisit = mem.last || 0; mem.visits = (mem.visits || 0) + 1; mem.last = Date.now(); if (!mem.first) mem.first = mem.last;
      save();
    } catch (e) {}
  })();
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ name: mem.name, visits: mem.visits, first: mem.first, last: mem.last, prevVisit: mem.prevVisit, asked: mem.asked, likes: mem.likes.slice(-10), lastVariant: mem.lastVariant })); } catch (e) {} }
  function forget() { Object.assign(mem, { name: null, visits: 0, first: 0, last: 0, prevVisit: 0, greeted: 0, turns: 0, lastId: null, lastVariant: {}, asked: {}, moreIdx: {}, likes: [] }); try { localStorage.removeItem(KEY); sessionStorage.removeItem('waish-visited'); } catch (e) {} }

  /* ---------- text helpers ---------- */
  function norm(s) {
    return s.toLowerCase()
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ـ/g, '')
      .replace(/[‌‏‎]/g, ' ')          // ZWNJ / bidi marks → space
      .replace(/[!?.,;:'"()\[\]«»،؟؛]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  const detectLang = text => FA_RE.test(text) ? 'fa' : 'en';
  const pick = (arr, avoidKey) => {                   // random element, not the same as last time for this key
    if (!Array.isArray(arr)) return arr;
    if (arr.length === 1) return arr[0];
    let i; do { i = Math.floor(Math.random() * arr.length); } while (i === mem.lastVariant[avoidKey]);
    mem.lastVariant[avoidKey] = i; return arr[i];
  };
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  // keyword must start at a word boundary. English keywords must also end at one (plural -s/-es allowed);
  // Persian keywords may carry an attached suffix ("ستاپت" = setup + your), so anything may follow them.
  function contains(text, kw) {
    const t = ' ' + text + ' ';
    let idx = t.indexOf(' ' + kw);
    while (idx >= 0) {
      const rest = t.slice(idx + 1 + kw.length);
      if (rest[0] === ' ' || FA_RE.test(kw) || /^(s|es) /.test(rest)) return true;
      idx = t.indexOf(' ' + kw, idx + 1);
    }
    return false;
  }
  // one-edit typo tolerance for single English words of 5+ letters
  function lev1(a, b) {   // true when a and b differ by one insert / delete / substitution, or one swapped pair ("lunmac" ~ "lunamc")
    if (a === b) return true; if (Math.abs(a.length - b.length) > 1) return false;
    if (a.length === b.length) { for (let k = 0; k < a.length - 1; k++) if (a[k] !== b[k]) { if (a[k] === b[k + 1] && a[k + 1] === b[k] && a.slice(k + 2) === b.slice(k + 2)) return true; break; } }
    let i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++; else if (a.length < b.length) j++; else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }
  function fuzzy(tokens, kw) { return kw.length >= 5 && !kw.includes(' ') && !FA_RE.test(kw) && tokens.some(t => t.length >= 5 && lev1(t, kw)); }

  /* ---------- placeholders ---------- */
  function fill(text, lang) {
    const d = new Date();
    const fa = lang === 'fa';
    const fmt = (loc, o) => { try { return new Intl.DateTimeFormat(loc, o).format(d); } catch (e) { return ''; } };
    const h = d.getHours(), tod = fa ? (h < 5 ? 'شب' : h < 12 ? 'صبح' : h < 17 ? 'ظهر' : h < 21 ? 'عصر' : 'شب') : (h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night');
    const name = mem.name ? cap(mem.name) : '';
    const last = mem.lastId && mem.lastId !== 'more' ? titleOf(mem.lastId, lang) : '';
    return text
      .replace(/\{name,\}/g, name ? (fa ? ` ${name} جان` : `, ${name}`) : '')
      .replace(/\{greeted\}/g, fa ? String(mem.greeted).replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[x]) : String(mem.greeted))
      .replace(/\{name\}/g, name)
      .replace(/\{time\}/g, fmt(fa ? 'fa-IR' : 'en-GB', { hour: '2-digit', minute: '2-digit' }))
      .replace(/\{date\}/g, fmt(fa ? 'fa-IR-u-ca-gregory' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
      .replace(/\{jdate\}/g, fmt(fa ? 'fa-IR-u-ca-persian' : 'en-GB-u-ca-persian', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/ AP$/, ''))
      .replace(/\{day\}/g, fmt(fa ? 'fa-IR' : 'en-GB', { weekday: 'long' }))
      .replace(/\{visits\}/g, fa ? String(mem.visits).replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[x]) : String(mem.visits))
      .replace(/\{tod\}/g, tod)
      .replace(/\{last\}/g, last)
      .replace(/ {2,}/g, ' ').trim();
  }
  function titleOf(id, lang) { const e = (window.WAISH_DB.entries || []).find(x => x.id === id); return e ? ((e.title && e.title[lang]) || (e.title && e.title.en) || id) : ''; }

  /* ---------- dynamic intents (checked before the keyword search) ---------- */
  const NAME_EN = /\b(?:my name is|my name's|i am|i'm|im|call me|this is|it's me|its me)\s+([a-z][a-z0-9_.-]{1,20})\b/i;
  const NAME_FA = /(?:اسمم|اسم من|منم|من هم)\s+([^\s]{2,20})\s*(?:هست|هستم|است|ام|ه|م)?\s*$|^\s*من\s+([^\s]{2,20})\s+(?:هستم|ام)\s*$/;
  const BAD_NAMES = /^(a|an|the|not|so|very|just|here|back|new|fine|good|great|ok|okay|bored|tired|happy|sad|sorry|done|ready|waish|hossein|you|he|she|it|kind|sure|also|still|going|gonna|from|in|on|at|to|of|for|with|about|really|looking|trying|asking|playing|learning|curious|confused|lost|stuck|hungry|sleepy|busy|alone|home|online|offline|banned|dead|bad|cool|interested|wondering|thinking|sure|serious|joking|kidding|right|wrong|late|early|first|last|next|glad|sick|free|open)$/i;
  const BAD_NAMES_FA = /^(خوبم|خوب|عالی|عالیم|بد|بدم|اینجا|برگشتم|خسته|خستم|کی|چی|چیه|هستم|کیم|کی‌ام|ویش|حسین|تو|اون|یه|یک|هم|رو|رفتم|اومدم|از|به|با|در|که|خیلی|الان|دارم|می‌خوام|میخوام|بازی|ماینکرفت|ایرانی|ایران|بیکار|تنها|گشنه|خوابم|مریض|ناراحت|غمگین|عصبانی|بن|آنلاین|آفلاین|منتظر|کنجکاو|گیج|مطمئن|جدی|شوخی|اول|آخر|بعدی|آماده|آزاد|بیدار)$/;
  const MATH = /^\s*(?:what(?:'s| is)|calc(?:ulate)?|compute|solve|حساب کن|چنده|چند میشه|چند می‌شه|=)?\s*([\d\s+\-*/×÷^%().,]+?)\s*(?:=|\?|چنده|چند میشه|چند می‌شه|is)?\s*$/i;
  const PERCENT = /(\d+(?:\.\d+)?)\s*(?:%|percent|درصد)\s*(?:of|از)\s*(\d+(?:\.\d+)?)/i;

  function dynamic(question, q, lang) {
    const db = window.WAISH_DB, D = db.dynamic || {};
    const say = (key, extra) => { const v = D[key] && (D[key][lang] || D[key].en); return v ? { text: fill(pick(v, 'dyn:' + key), lang) + (extra || ''), lang, id: 'dyn:' + key, emoji: (D[key] && D[key].emoji) || '' } : null; };

    // "what's my name" (checked before the name capture, so "اسمم چیه" isn't taken as a name)
    if (/\b(what(?:'s| is) my name|who am i|do you know me|remember me|know my name|my name\?)/i.test(question) || /(اسمم چیه|اسم من چیه|اسمم چی بود|من کیم|من کی‌ام|منو می‌شناسی|منو میشناسی|اسممو می‌دونی|اسممو میدونی|یادته من کیم|منو یادته|اسمم یادته)/.test(question)) return say(mem.name ? 'name-known' : 'name-unknown');
    // "my name is …"
    let m = lang === 'fa' ? question.match(NAME_FA) : question.match(NAME_EN);
    const cand = m && (m[1] || m[2]);
    if (cand && !(lang === 'fa' ? BAD_NAMES_FA : BAD_NAMES).test(cand) && !/^(چطور|چیکار|کجا|چرا|کی|چی)/.test(cand)) {
      const n = cand.replace(/[.,!?؟]+$/, '');
      const was = mem.name; mem.name = n; save();
      return say(was && norm(was) === norm(n) ? 'name-same' : was ? 'name-changed' : 'name-saved');
    }
    // forget me
    if (/\b(forget me|forget my name|reset memory|clear memory|delete my data)\b/i.test(question) || /(فراموشم کن|اسممو فراموش کن|حافظه‌ت رو پاک کن|حافظتو پاک کن|منو یادت بره)/.test(question)) { forget(); return say('forgot'); }
    // time / date
    if (/\b(what time|time is it|current time|the time|clock)\b/i.test(question) || /(ساعت چنده|ساعت چند|الان ساعت|چه ساعتیه)/.test(question)) return say('time');
    if (/\b(what(?:'s| is) the date|today'?s date|what day|which day|date today|what's today)\b/i.test(question) || /(تاریخ امروز|امروز چندمه|امروز چه روزیه|چندم|تاریخ چیه|امروز چند شنبه)/.test(question)) return say('date');
    // "tell me more" / follow-up on the last topic
    if (/^\s*(more|tell me more|go on|continue|and\?*|then\?*|details|more details|elaborate|what else|anything else|why\?*|how\?*|really\?*|explain)\s*[?!.]*\s*$/i.test(question) || /^\s*(بیشتر|بیشتر بگو|ادامه بده|ادامه|خب|خب؟|بعدش|دیگه چی|چرا|چطور|جزئیات|توضیح بده|واقعا|واقعاً)\s*[؟!.]*\s*$/.test(question)) {
      const e = mem.lastId && (db.entries || []).find(x => x.id === mem.lastId);
      if (e && (e.more || e.related)) {
        const own = e.more ? [].concat(e.more[lang] || e.more.en).map(t => ({ t, emoji: e.emoji })) : [];
        const rel = (e.related || []).map(id => (db.entries || []).find(x => x.id === id)).filter(Boolean).map(r => ({ t: pick([].concat(r.answer[lang] || r.answer.en), r.id), emoji: r.emoji }));
        const list = own.concat(rel); const i = (mem.moreIdx[e.id] || 0); mem.moreIdx[e.id] = i + 1;
        if (i < list.length) return { text: fill(list[i].t, lang), lang, id: e.id, emoji: list[i].emoji || '' };
        return say('more-exhausted');
      }
      return say(e ? 'more-none' : 'more-nothing');
    }
    // percentages, then plain arithmetic
    m = question.match(PERCENT); if (m) { const v = +m[1] / 100 * +m[2]; return say('math', ` ${fmtNum(v, lang)}`); }
    m = q.replace(/[×]/g, '*').replace(/[÷]/g, '/').replace(/\^/g, '**').match(MATH);
    if (m && /\d/.test(m[1]) && /[+\-*/%]/.test(m[1]) && /^[\d\s+\-*/%().,]+$/.test(m[1].replace(/\*\*/g, '*'))) {
      try { const v = Function('"use strict"; return (' + m[1].replace(/,/g, '').replace(/(\d)\s*%\s*(\d)/g, '$1%$2') + ')')(); if (typeof v === 'number' && isFinite(v)) return say('math', ` ${fmtNum(v, lang)}`); } catch (e) {}
    }
    return null;
  }
  const fmtNum = (v, lang) => { const s = (Math.round(v * 1e6) / 1e6).toLocaleString(lang === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: 6 }); return s; };

  /* ---------- main ---------- */
  function answer(question) {
    const db = window.WAISH_DB;
    const lang = detectLang(question);
    const q = norm(question);
    mem.turns++;

    const dyn = dynamic(question, q, lang);
    if (dyn) { if (!/^dyn:(more|name|forgot)/.test(dyn.id)) mem.lastId = dyn.id; return dyn; }

    const tokens = q.split(' ');
    let best = null, bestScore = 0;
    for (const e of db.entries) {
      let score = 0;
      for (const l of ['en', 'fa']) {
        for (const kw of (e.keywords[l] || [])) {
          const k = norm(kw); if (!k) continue;
          if (contains(q, k)) score = Math.max(score, k.length) + score * 0.1;
          else if (fuzzy(tokens, k)) score = Math.max(score, k.length * 0.8) + score * 0.1;
        }
      }
      if (score > bestScore) { bestScore = score; best = e; }
    }

    if (!best) { const fb = pick([].concat(db.fallback[lang] || db.fallback.en), 'fallback'); return { text: fill(fb, lang), lang, id: null, emoji: db.fallbackEmoji || '🤔' }; }

    // greetings escalate the more you say hi
    let variants = best.answer[lang] || best.answer.en;
    if (best.id === 'greeting') {
      mem.greeted++;
      const again = best.again && (best.again[lang] || best.again.en), back = best.back && (best.back[lang] || best.back.en);
      if (mem.greeted > 1 && again) variants = again;
      else if (mem.visits > 1 && back && mem.greeted === 1) variants = back;
    }
    // asked the same thing before → prefer the `repeat` wording when the entry has one
    const seen = (mem.asked[best.id] || 0); mem.asked[best.id] = seen + 1;
    if (seen > 0 && best.repeat && (best.repeat[lang] || best.repeat.en)) variants = best.repeat[lang] || best.repeat.en;
    if (/\b(i like|i love|my favou?rite)\b/i.test(question) || /(دوست دارم|عاشق)/.test(question)) { mem.likes.push(best.id); }
    save();

    const text = fill(pick([].concat(variants), best.id), lang);
    mem.lastId = best.id; mem.moreIdx[best.id] = mem.moreIdx[best.id] || 0;
    return { text, lang: best.answer[lang] ? lang : 'en', id: best.id, emoji: best.emoji || '' };
  }

  return { answer, detectLang, forget, get memory() { return mem; } };
})();
