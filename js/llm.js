/* ============================================================
   WAISH ASSISTANT — MATCHER
   Reads window.WAISH_DB (js/llm-db.js) and answers a question.
   Detects Persian vs English from the question itself.
   ============================================================ */
window.WAISH_LLM = (function () {
  const FA_RE = /[؀-ۿ]/;

  // normalize so that ي/ی and ك/ک variants, tatweel and punctuation don't break matches
  function norm(s) {
    return s.toLowerCase()
      .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/ـ/g, '')
      .replace(/[‌‏‎]/g, ' ')          // ZWNJ / bidi marks → space
      .replace(/[!?.,;:'"()\[\]«»،؟؛]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function detectLang(text) { return FA_RE.test(text) ? 'fa' : 'en'; }

  // keyword must start at a word boundary. English keywords must also end at one
  // (plural -s/-es allowed); Persian keywords may carry an attached suffix
  // ("ستاپت" = setup + your, "موسی" = mouse + i), so anything may follow them.
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

  function answer(question) {
    const db = window.WAISH_DB;
    const lang = detectLang(question);
    const q = norm(question);
    let best = null, bestScore = 0;

    for (const e of db.entries) {
      let score = 0;
      for (const l of ['en', 'fa']) {
        for (const kw of (e.keywords[l] || [])) {
          const k = norm(kw);
          if (k && contains(q, k)) score = Math.max(score, k.length) + score * 0.1;
        }
      }
      if (score > bestScore) { bestScore = score; best = e; }
    }

    if (!best) return { text: db.fallback[lang] || db.fallback.en, lang, id: null, emoji: db.fallbackEmoji || '🤔' };
    const text = best.answer[lang] || best.answer.en;
    return { text, lang: best.answer[lang] ? lang : 'en', id: best.id, emoji: best.emoji || '' };
  }

  return { answer, detectLang };
})();
