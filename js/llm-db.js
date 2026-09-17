/* ============================================================
   WAISH ASSISTANT — KNOWLEDGE BASE
   ------------------------------------------------------------
   This is the "brain" behind the terminal. Anything typed
   without a leading "/" is matched against these entries.

   HOW TO ADD AN ENTRY
     {
       id: 'unique-name',
       keywords: {
         en: ['words', 'or phrases', 'that trigger it'],
         fa: ['کلمه', 'یا عبارت فارسی'],
       },
       answer: {
         en: "Answer in English.",
         fa: "جواب به فارسی.",     // optional — falls back to en
       },
     }

   RULES
   - Keywords are matched case-insensitively, anywhere in the
     question. Longer keywords win over shorter ones, so
     'process vs thread' beats 'thread'.
   - The user's language is auto-detected: any Persian letters
     in the question → Persian answer (if the entry has one).
   - Line breaks in answers are kept. Keep answers short-ish;
     the terminal fades them in word by word.
   - emoji: shown in front of the answer (the "emoji system").
     Emoji inside answer text work too.
   ============================================================ */

window.WAISH_DB = {

  /* shown when nothing matches (one is picked at random) */
  fallbackEmoji: '🤔',
  fallback: {
    en: [
      "I don't know that one{name,} — try /help, or ask me about Waish, LunaMC, ClutchPing, this computer, or a computer-science question.",
      "Hmm, that's outside what I know. I'm good with: Waish, his projects, his setup, the apps on this computer, and basic networking/CS. Try one of those?",
      "No entry for that in my knowledge base. Ask me something like \"what is LunaMC\", \"how do I play music here\" or \"how does dns work\".",
      "That one I can't answer — I'm an offline assistant with a fixed brain. /help lists what I *can* do.",
    ],
    fa: [
      "این یکی رو نمی‌دونم{name,} — /help رو بزن، یا دربارهٔ ویش، لونا ام‌سی، کلاچ‌پینگ، همین کامپیوتر یا یه سؤال کامپیوتری بپرس.",
      "هوم، این خارج از چیزاییه که بلدم. توی این‌ها خوبم: ویش، پروژه‌هاش، ستاپش، برنامه‌های این کامپیوتر و مبانی شبکه. یکی از این‌ها رو بپرس؟",
      "برای این توی پایگاه دانشم چیزی نیست. مثلاً بپرس «لونا ام‌سی چیه»، «چطور اینجا موزیک گوش بدم» یا «dns چطور کار می‌کنه».",
      "این رو نمی‌تونم جواب بدم — من یه دستیار آفلاین با یه مغز ثابتم. /help نشون می‌ده چی بلدم.",
    ],
  },

  /* answers the matcher builds on the fly (time, date, maths, your name, follow-ups) — {placeholders} are filled by llm.js */
  dynamic: {
    'name-saved':   { emoji: '📝', en: ["Nice to meet you, {name}! I'll remember that — even next time you open this computer.", "{name} — got it. Locked into memory. Ask me anything.", "Welcome, {name}. Remembered. (Say \"forget me\" if you ever want that wiped.)"], fa: ["خوشبختم {name}! یادم می‌مونه — حتی دفعهٔ بعد که این کامپیوتر رو باز کنی.", "{name} — گرفتم. توی حافظه‌م ثبت شد. هر چی می‌خوای بپرس.", "خوش اومدی {name}. یادم موند. (اگه خواستی پاک بشه بگو «فراموشم کن».)"] },
    'name-changed': { emoji: '📝', en: ["Updated — you're {name} now.", "Alright, {name} it is. Memory updated."], fa: ["آپدیت شد — الان {name} هستی.", "باشه، {name}. حافظه آپدیت شد."] },
    'name-same':    { emoji: '😄', en: ["I know, {name}. I remember you.", "Yep — still {name}. I hadn't forgotten."], fa: ["می‌دونم {name}. یادمه.", "آره — هنوز {name} هستی. یادم نرفته بود."] },
    'name-known':   { emoji: '🧠', en: ["You're {name}. You've opened this computer {visits} time(s) — I keep notes.", "{name}, of course. I don't forget the people who talk to me."], fa: ["تو {name} هستی. {visits} بار این کامپیوتر رو باز کردی — من یادداشت برمی‌دارم.", "{name}، معلومه. آدم‌هایی که باهام حرف می‌زنن رو فراموش نمی‌کنم."] },
    'name-unknown': { emoji: '🤷', en: ["You haven't told me yet. Say \"my name is …\" and I'll remember it.", "No idea — introduce yourself! \"my name is Ali\" works."], fa: ["هنوز بهم نگفتی. بگو «اسمم … هست» تا یادم بمونه.", "نمی‌دونم — خودتو معرفی کن! «اسمم علی‌ه» کافیه."] },
    'forgot':       { emoji: '🧹', en: ["Done. Name, visits, everything — wiped. We've never met.", "Memory cleared. Who are you again?"], fa: ["انجام شد. اسم، بازدیدها، همه‌چیز — پاک شد. ما هیچ‌وقت همدیگه رو ندیدیم.", "حافظه پاک شد. تو کی بودی؟"] },
    'time':         { emoji: '🕒', en: ["It's {time} on your clock. The taskbar clock shows Iran time, if that's what you're after.", "{time} where you are. Good {tod}!"], fa: ["روی ساعت تو {time} هست. ساعت تسک‌بار، ساعت ایران رو نشون می‌ده.", "الان {time} هست. {tod} بخیر!"] },
    'date':         { emoji: '📅', en: ["Today is {date} — that's {jdate} in the Iranian calendar.", "{date}. In the Jalali calendar: {jdate}. The Calendar app shows both."], fa: ["امروز {jdate} هست — به میلادی {date}.", "{jdate}. میلادی: {date}. برنامهٔ تقویم هر دو رو نشون می‌ده."] },
    'math':         { emoji: '🧮', en: ["="], fa: ["="] },
    'more-none':    { emoji: '📎', en: ["That's all I have on {last}. Ask about something related?", "Nothing more on that topic in my notes — but /help shows what else I know."], fa: ["دربارهٔ {last} همین‌قدر می‌دونم. یه چیز مرتبط بپرس؟", "دربارهٔ این موضوع بیشتر از این توی یادداشت‌هام نیست — ولی /help نشون می‌ده چیای دیگه بلدم."] },
    'more-exhausted': { emoji: '📎', en: ["And that's the whole story on {last}. Try another topic?", "I've told you everything I know about {last}."], fa: ["و این کل ماجرای {last} بود. یه موضوع دیگه؟", "هر چی دربارهٔ {last} می‌دونستم گفتم."] },
    'more-nothing': { emoji: '🤔', en: ["More about what? Ask me something first.", "We haven't started a topic yet — ask me anything."], fa: ["بیشتر دربارهٔ چی؟ اول یه چیزی بپرس.", "هنوز موضوعی شروع نکردیم — هر چی می‌خوای بپرس."] },
  },

  /* /story — the long-form bio, printed paragraph by paragraph */
  story: {
    en: [
      "🧑‍💻 If you had to describe Waish with one title, 'YouTuber' or 'gaming content creator' wouldn't be enough. Behind the name are years of experience across very different areas — Minecraft and community building, project management, server development, 3D design, editing, content production and technology — and those skills didn't stay separate; they grew together into one professional identity.",
      "⛏️ Hossein, known online as Waish, started in Minecraft and its content, and went from player and creator to someone involved in several parts of that ecosystem. Minecraft was never just a game: it was a place to learn, build, manage, test ideas and connect with a community.",
      "▶️ The Waish YouTube channel centres on Minecraft and especially BedWars, where he became one of the known faces of the Persian-speaking scene. The goal was a real community, not view counts — making BedWars taken seriously, with proper editing, thumbnails and structure, plus a teaching side: PvP, mechanics, ping, optimization, clients. His skin even got noticed internationally when a well-known player used it in their content.",
      "🌙 LunaMC is where the game became a project. It's a PvP-first server whose design, management and decisions run through him: custom PvP/knockback systems (W-Tap, S-Tap, Zest-Tap, movement, HitSelect), gamemodes like BedWars, FFA and ThePit (custom items, enchants and PvP environment), and LunaGuard AntiCheat — which gathers suspicious-behaviour data for the moderation team instead of blindly banning.",
      "🛒 NairoShop came from a real problem: Iranian users often can't pay for foreign digital services. ⚡ ClutchPing came from networking plus a real need: stable, well-routed connections for gamers. Same pattern every time — a problem → technical investigation → build a solution → make it a usable project.",
      "🎨 Behind the scenes: about six years of Cinema 4D (modelling, scenes, lighting, rendering, animation) and Blender. Thumbnails, characters, scenes, effects — much of the channel's look comes from this. 🎬 And years of editing and post-production: rhythm, timing, VFX, sound design, transitions — a real production pipeline from script to analytics.",
      "📋 Project management ties it together: he's led teams that later reached real revenue and growth, and thinks in terms of organizing a team, turning ideas into products, controlling quality, scaling, and building systems that don't depend on one person.",
      "💻 He's seriously into technology — networking, Python, SQL/MySQL, databases, logic circuits, AI and LLMs — and even plans an educational computer-science book from basic concepts up to networking, Bluetooth, antennas and language models. He wants to know how things work.",
      "📊 YouTube itself is a project: titles, thumbnails, CTR, retention, watch time, search, suggested, upload schedule — all tracked, all learned from. That data-driven view turned a hobby into a business. 🚀 Next: an English Minecraft channel for an international community, alongside the Persian Waish.",
      "🔥 The common thread is building — a server, a community, a video, an animation, a website, a service, a system, or an idea that becomes a business. He started with Minecraft and didn't stop there. In one sentence: he started by playing Minecraft, and decided to build his own world instead of only playing in someone else's. That's Waish.",
    ],
    fa: [
      "🧑‍💻 اگه بخوایم داستان ویش رو فقط با یه عنوان تعریف کنیم، «یوتیوبر» یا «گیمینگ کانتنت کریتور» کافی نیست. پشت این اسم سال‌ها تجربه توی زمینه‌های مختلف هست؛ از ماینکرفت و ساخت کامیونیتی تا مدیریت پروژه، توسعهٔ سرور، طراحی سه‌بعدی، تدوین، تولید محتوا و تکنولوژی — و این مهارت‌ها از هم جدا نیستن؛ کنار هم قرار گرفتن و شدن بخشی از هویت حرفه‌ایش.",
      "⛏️ حسین، که آنلاین با اسم ویش شناخته می‌شه، از دنیای ماینکرفت و محتوای اون شروع کرد و از یه بازیکن و تولیدکنندهٔ محتوا به کسی تبدیل شد که توی چند بخش مختلف این اکوسیستم نقش داره. ماینکرفت براش فقط یه بازی نبود؛ بستری بود برای یادگیری، ساختن، مدیریت کردن، آزمایش ایده‌ها و ارتباط با یه کامیونیتی.",
      "▶️ کانال یوتیوب ویش روی ماینکرفت و مخصوصاً BedWars تمرکز داره، جایی که یکی از چهره‌های شناخته‌شدهٔ جامعهٔ فارسی شد. هدف یه کامیونیتی واقعی بود، نه تعداد بازدید — جدی کردن BedWars، با تدوین، تامبنیل و ساختار حرفه‌ای، به‌علاوهٔ بخش آموزشی: PvP، مکانیک‌ها، پینگ، آپتیمایز، کلاینت‌ها. حتی اسکینش وقتی یه بازیکن مطرح بین‌المللی ازش توی محتواش استفاده کرد، توی جامعهٔ جهانی دیده شد.",
      "🌙 لونا ام‌سی جاییه که بازی تبدیل به پروژه شد. یه سرور PvP محور که طراحی، مدیریت و تصمیم‌گیری‌هاش به دیدگاه خودش وابسته‌ست: سیستم اختصاصی PvP و ناک‌بک (W-Tap، S-Tap، Zest-Tap، Movement، HitSelect)، گیم‌مودهای BedWars، FFA و ThePit (آیتم‌ها، انچنت‌ها و محیط PvP اختصاصی)، و آنتی‌چیت LunaGuard — که به جای بن کورکورانه، دادهٔ رفتار مشکوک رو برای تیم Moderation جمع می‌کنه.",
      "🛒 نایروشاپ از یه مشکل واقعی اومد: کاربر ایرانی خیلی وقت‌ها نمی‌تونه برای سرویس دیجیتال خارجی پرداخت کنه. ⚡ کلاچ‌پینگ از شبکه به‌علاوهٔ یه نیاز واقعی: اتصال پایدار و مسیر درست برای گیمرها. هر بار همون الگو — یه مشکل → بررسی فنی → ساخت راه‌حل → تبدیلش به یه پروژهٔ قابل استفاده.",
      "🎨 پشت صحنه: حدود شش سال Cinema 4D (مدل‌سازی، صحنه، نورپردازی، رندر، انیمیشن) و Blender. تامبنیل‌ها، شخصیت‌ها، صحنه‌ها، افکت‌ها — بخش زیادی از ظاهر کانال از همین‌جاست. 🎬 و سال‌ها تدوین و پست‌پروداکشن: ریتم، تایمینگ، VFX، ساند دیزاین، ترنزیشن — یه Production Pipeline واقعی از اسکریپت تا آنالیتیکس.",
      "📋 مدیریت پروژه همه‌چیز رو به هم وصل می‌کنه: با تیم‌هایی کار کرده که بعداً به درآمد و رشد واقعی رسیدن، و طرز فکرش سازمان‌دهی تیم، تبدیل ایده به محصول، کنترل کیفیت، Scale کردن و ساختن سیستمی‌ه که به یه نفر وابسته نباشه.",
      "💻 علاقهٔ جدی به تکنولوژی داره — شبکه، پایتون، SQL/MySQL، دیتابیس، مدار منطقی، هوش مصنوعی و LLMها — و حتی برنامهٔ نوشتن یه کتاب آموزشی علوم کامپیوتر از مفاهیم پایه تا شبکه، بلوتوث، آنتن و مدل‌های زبانی. می‌خواد بفهمه چیزها چطور کار می‌کنن.",
      "📊 یوتیوب خودش یه پروژه‌ست: عنوان، تامبنیل، CTR، Retention، Watch Time، سرچ، Suggested، زمان‌بندی آپلود — همه دنبال می‌شن، از همه یاد می‌گیره. همین نگاه Data-Driven یه سرگرمی رو تبدیل به کسب‌وکار کرد. 🚀 بعدی: یه کانال ماینکرفت انگلیسی برای یه کامیونیتی بین‌المللی، کنار ویش فارسی.",
      "🔥 وجه مشترک همه‌چیز ساختنه — یه سرور، یه کامیونیتی، یه ویدیو، یه انیمیشن، یه وبسایت، یه سرویس، یه سیستم، یا ایده‌ای که بشه کسب‌وکار. از ماینکرفت شروع کرد و توش متوقف نشد. توی یه جمله: از بازی کردن ماینکرفت شروع کرد، اما تصمیم گرفت به جای بازی توی یه دنیای ساخته‌شده، دنیای خودش رو بسازه. That's Waish.",
    ],
  },

  entries: [

    /* ---------- small talk ----------
       answer: several wordings → one is picked at random. greeting also has `back` (returning visitor, first hi of
       the session) and `again` (second, third… hi in the same session). ---------- */
    {
      id: 'greeting', emoji: '👋',
      keywords: { en: ['hello', 'hi', 'hey', 'yo', 'salam', 'sup', 'wassup', 'howdy', 'hiya', 'heya', 'greetings', 'hi there', 'hello there', 'good morning', 'good afternoon', 'good evening', 'good night', 'morning', 'evening', 'hallo', 'hola', 'bonjour', 'ola', 'hey there', 'hii', 'hiii', 'helo', 'heyy', 'oi', 'ahoy'], fa: ['سلام', 'سلام علیکم', 'درود', 'هی', 'صبح بخیر', 'شب بخیر', 'عصر بخیر', 'ظهر بخیر', 'سلامی', 'سلاااام', 'سلوم', 'هلو', 'های', 'صبحت بخیر', 'شبت بخیر', 'وقت بخیر', 'روز بخیر'] },
      answer: {
        en: [
          "Hey{name,}! Good {tod}. I'm Waish's assistant. Ask me about Waish, his projects (LunaMC, ClutchPing, NairoShop), his PC setup, this computer's apps, or any computer-science question. /help lists the commands.",
          "Hello{name,}! Welcome to waish@computer. I know about Waish, his projects, his setup and the apps on this desktop — and a bit of networking. What do you want to know?",
          "Hi{name,} 👋 You found the terminal. Type a question in English or Persian, or /help for commands. Try: \"what is LunaMC\", \"what mouse does he use\", \"how do I play music\".",
          "Yo{name,}! Good {tod}. Assistant online, zero packet loss. Ask away — Waish, LunaMC, ClutchPing, the setup, the apps here, or CS basics.",
          "Salam{name,} 🙂 Ask me anything about Waish or this site. Persian works too — just type in فارسی.",
        ],
        fa: [
          "سلام{name,} {tod} بخیر! من دستیار ویش هستم. دربارهٔ ویش، پروژه‌هاش (لونا ام‌سی، کلاچ‌پینگ، نایروشاپ)، ستاپ کامپیوترش، برنامه‌های این کامپیوتر یا هر سؤال کامپیوتری ازم بپرس. /help دستورها رو نشون می‌ده.",
          "سلام{name,} خوش اومدی به waish@computer. دربارهٔ ویش، پروژه‌هاش، ستاپش و برنامه‌های این دسکتاپ اطلاعات دارم — و یه کم شبکه. چی می‌خوای بدونی؟",
          "سلام{name,} 👋 ترمینال رو پیدا کردی. سؤالت رو فارسی یا انگلیسی بنویس، یا /help برای دستورها. مثلاً: «لونا ام‌سی چیه»، «موسش چیه»، «چطور موزیک پخش کنم».",
          "درود{name,} {tod} بخیر. دستیار آنلاینه، بدون پکت‌لاس. بپرس — ویش، لونا ام‌سی، کلاچ‌پینگ، ستاپ، برنامه‌های اینجا یا مبانی کامپیوتر.",
          "سلام{name,} 🙂 هر چی دربارهٔ ویش یا این سایت می‌خوای بپرس. انگلیسی هم بلدم.",
        ],
      },
      back: {
        en: ["Welcome back{name,} 👋 Visit number {visits}. Anything new you want to know?", "Hey, you again{name,} 🙂 Good to see you — this is visit {visits}. What's on your mind?", "Back for more{name,}? Nice. Ask away."],
        fa: ["خوش برگشتی{name,} 👋 بازدید شمارهٔ {visits}. چیز جدیدی می‌خوای بدونی؟", "به‌به، باز خودتی{name,} 🙂 خوشحالم می‌بینمت — این بازدید {visits}ـمه. چی توی ذهنته؟", "برگشتی برای بیشتر{name,}؟ ایول. بپرس."],
      },
      again: {
        en: ["Hi again{name,} 🙂 still here.", "We've said hi already — but hi! What do you want to know?", "Hello again. I don't mind, but I do count: that's greeting #{greeted}.", "Hey. Still me, still online. Ask me something real 😄", "Hi hi. Okay, now ask me a question — I know things."],
        fa: ["باز هم سلام{name,} 🙂 هنوز اینجام.", "قبلاً سلام کردیم — ولی سلام! چی می‌خوای بدونی؟", "دوباره سلام. مشکلی نیست، ولی می‌شمرم: این سلام شمارهٔ {greeted} بود.", "هی. هنوز منم، هنوز آنلاینم. یه سؤال واقعی بپرس 😄", "سلام سلام. خب، حالا یه سؤال بپرس — چیزایی بلدم."],
      },
    },
    {
      id: 'how-are-you', emoji: '😎',
      keywords: { en: ['how are you', 'how r u', 'how are u', 'hows it going', "how's it going", 'whats up', "what's up", 'how are things', 'how do you feel', 'you good', 'you ok', 'you okay', 'how is it going', 'hows life', "how's life", 'how you doing', 'how are you doing', 'are you ok', 'wyd'], fa: ['چطوری', 'چه خبر', 'خوبی', 'حالت چطوره', 'چطور هستی', 'چه خبرا', 'چطورایی', 'حالت خوبه', 'اوضاع چطوره', 'چیکارا میکنی', 'چیکارا می‌کنی', 'خوبی تو'] },
      answer: {
        en: ["Running smooth — zero packet loss. What do you want to know?", "All good. CPU's cool, RAM's free, and I've got answers. You?", "Better now that someone's talking to me. It gets quiet in this terminal 😄 What's up?", "Great — I got 17 songs in the Music app to keep me company. How are you{name,}?", "Fine, fine. Nobody's asked me about DNS in a while and I miss it. Ask me something."],
        fa: ["عالی‌ام — بدون هیچ پکت‌لاسی. چی می‌خوای بدونی؟", "همه‌چی خوبه. سی‌پی‌یو خنکه، رم خالیه، جواب هم دارم. تو چطوری؟", "الان که یکی باهام حرف می‌زنه بهترم. این ترمینال گاهی ساکت می‌شه 😄 چه خبر؟", "عالی — ۱۷ تا آهنگ توی برنامهٔ موزیک دارم که تنهام نذارن. تو چطوری{name,}؟", "خوبم خوبم. خیلی وقته کسی ازم DNS نپرسیده و دلم تنگ شده. یه چیزی بپرس."],
      },
    },
    {
      id: 'im-fine', emoji: '🙂',
      keywords: { en: ['i am fine', "i'm fine", 'im fine', 'i am good', "i'm good", 'im good', 'i am ok', "i'm ok", 'im ok', 'i am great', "i'm great", 'im great', 'doing good', 'doing well', 'not bad', 'all good', 'pretty good', 'i am okay', "i'm okay", 'im okay', 'i am tired', "i'm tired", 'im tired', 'i am sad', "i'm sad", 'im sad'], fa: ['خوبم', 'عالیم', 'عالی‌ام', 'بد نیستم', 'خوبم مرسی', 'منم خوبم', 'خسته‌ام', 'خستم', 'ناراحتم', 'غمگینم', 'بدم', 'بد نیست'] },
      answer: {
        en: ["Glad to hear it{name,}. Now — what can I tell you?", "Good. Same here. Want to know something about Waish or this computer?", "Nice. If you're bored, there's Snake, Tetris and a mini Minecraft on this desktop, and a Music app with 17 songs.", "Cool 🙂 I'm here if you want to ask anything."],
        fa: ["خوشحالم{name,}. خب — چی برات بگم؟", "خوبه. منم همین‌طور. می‌خوای چیزی دربارهٔ ویش یا این کامپیوتر بدونی؟", "ایول. اگه حوصله‌ت سر رفته، روی این دسکتاپ Snake، Tetris و یه ماینکرفت کوچیک هست، و یه برنامهٔ موزیک با ۱۷ آهنگ.", "خوبه 🙂 اگه چیزی خواستی بپرسی، اینجام."],
      },
    },
    {
      id: 'thanks', emoji: '🙌',
      keywords: { en: ['thank', 'thanks', 'thx', 'ty', 'tysm', 'cheers', 'thank you', 'thanks a lot', 'appreciate', 'appreciated'], fa: ['ممنون', 'مرسی', 'تشکر', 'دمت گرم', 'سپاس', 'ممنونم', 'مرسی ازت', 'دستت درد نکنه', 'خیلی ممنون', 'لطف کردی', 'دمتگرم'] },
      answer: {
        en: ["Anytime{name,}. Ask away.", "You're welcome. That's what I'm here for.", "No problem 🙌 Anything else?", "Happy to help. gg."],
        fa: ["خواهش می‌کنم{name,}. باز هم بپرس.", "قابلی نداشت. برای همین اینجام.", "خواهش 🙌 چیز دیگه‌ای هست؟", "خوشحالم که کمک کردم. gg."],
      },
    },
    {
      id: 'bye', emoji: '👋',
      keywords: { en: ['bye', 'goodbye', 'see you', 'see ya', 'cya', 'later', 'good bye', 'gotta go', 'i have to go', 'leaving', 'im off', "i'm off", 'peace', 'take care', 'gn', 'night night'], fa: ['خداحافظ', 'بای', 'فعلا', 'فعلاً', 'می‌بینمت', 'میبینمت', 'خدافظ', 'بدرود', 'باید برم', 'رفتم', 'شب خوش', 'خدانگهدار', 'بای بای'] },
      answer: {
        en: ["See you{name,}. gg.", "Later! The terminal will be here when you're back.", "Bye 👋 Come back anytime — I remember people.", "Take care. Don't forget the Music app on your way out 🎵"],
        fa: ["می‌بینمت{name,}. gg.", "فعلاً! ترمینال همین‌جا منتظرته.", "بای 👋 هر وقت خواستی برگرد — من آدم‌ها رو یادم می‌مونه.", "مراقب خودت باش. برنامهٔ موزیک رو هم یادت نره 🎵"],
      },
    },
    {
      id: 'what-can-you-do', emoji: '🤖',
      keywords: { en: ['what can you do', 'what do you do', 'what are you', 'help me', 'what is this', 'what can i ask', 'what do you know', 'what should i ask', 'capabilities', 'features', 'what can you tell me', 'how do i use you', 'how does this work', 'what can i do here'], fa: ['چیکار می‌کنی', 'چیکار میکنی', 'چه کاری می‌کنی', 'تو چی هستی', 'این چیه', 'کمک', 'چی بپرسم', 'چی بلدی', 'چیا بلدی', 'چه کارایی بلدی', 'چطور ازت استفاده کنم', 'اینجا چیکار کنم', 'چی می‌دونی'] },
      answer: {
        en: [
          "I'm a small offline assistant living in Waish's terminal. I know about Waish, LunaMC, ClutchPing, NairoShop, his content, his PC setup, every app on this computer, and some computer-science basics. Commands start with / (try /help); anything else you type, I try to answer — in English or Persian. I also remember your name if you tell me.",
          "Ask me things like: who is Waish · what is LunaMC · how does ClutchPing work · what mouse does he use · how do I play music here · what is the recycle bin · how does TCP work · what time is it · 12*8. I can do maths, tell the date, and remember your name.",
          "Three kinds of things: 1) Waish and his projects, 2) this computer — the apps, the desktop, the terminal, 3) computer-science basics (TCP, UDP, DNS, ping, RAM, Big-O…). Plus small stuff: time, date, maths, your name.",
        ],
        fa: [
          "من یه دستیار کوچیک آفلاین توی ترمینال ویش هستم. دربارهٔ ویش، لونا ام‌سی، کلاچ‌پینگ، نایروشاپ، محتواش، ستاپ کامپیوترش، همهٔ برنامه‌های این کامپیوتر و مبانی کامپیوتر اطلاعات دارم. دستورها با / شروع می‌شن (/help رو امتحان کن)؛ هر چیز دیگه‌ای بنویسی سعی می‌کنم جواب بدم — فارسی یا انگلیسی. اسمت رو هم اگه بگی یادم می‌مونه.",
          "مثلاً بپرس: ویش کیه · لونا ام‌سی چیه · کلاچ‌پینگ چطور کار می‌کنه · موسش چیه · چطور اینجا موزیک پخش کنم · سطل بازیافت چیه · TCP چطور کار می‌کنه · ساعت چنده · ۱۲*۸. حساب می‌کنم، تاریخ می‌گم و اسمت رو یادم می‌مونه.",
          "سه جور چیز: ۱) ویش و پروژه‌هاش، ۲) این کامپیوتر — برنامه‌ها، دسکتاپ، ترمینال، ۳) مبانی کامپیوتر (TCP، UDP، DNS، پینگ، رم، Big-O…). به‌علاوهٔ چیزای کوچیک: ساعت، تاریخ، حساب، اسمت.",
        ],
      },
    },
    {
      id: 'who-are-you', emoji: '🤖',
      keywords: { en: ['who are you', 'who r u', 'what is your name', "what's your name", 'your name', 'are you an ai', 'are you ai', 'are you a bot', 'are you a robot', 'are you real', 'are you human', 'are you chatgpt', 'chatgpt', 'gpt', 'are you claude', 'which model', 'what model', 'are you alive', 'who made you', 'who built you', 'who created you', 'are you online', 'do you use internet', 'are you offline'], fa: ['تو کی هستی', 'کی هستی', 'اسمت چیه', 'اسم تو چیه', 'تو رباتی', 'ربات هستی', 'هوش مصنوعی هستی', 'هوش مصنوعی‌ای', 'تو آدمی', 'واقعی هستی', 'chatgpt هستی', 'جی‌پی‌تی', 'کی تو رو ساخته', 'کی ساختت', 'سازنده‌ت کیه', 'آنلاینی', 'آفلاینی', 'زنده‌ای', 'کی هستی تو'] },
      answer: {
        en: [
          "I'm Waish's terminal assistant — not ChatGPT, not Claude, not connected to anything. I'm a handmade matcher: a knowledge base of entries plus a bit of logic, running entirely in your browser. No server, no internet needed. Waish wrote me.",
          "A small offline bot that lives in this terminal. Waish built me by hand — a list of things I know, a matcher that picks the closest one, and a memory for your name. I'm not an LLM in the big sense; I just play one on this desktop 😄",
          "Name's not set — I'm just \"the assistant\". Made by Waish for waish.ir. I run offline in your browser, so I'm fast, private, and occasionally clueless.",
        ],
        fa: [
          "من دستیار ترمینال ویش‌ام — نه ChatGPT، نه Claude، به هیچ‌جا هم وصل نیستم. یه تطبیق‌دهندهٔ دست‌سازم: یه پایگاه دانش به‌علاوهٔ یه کم منطق، که کامل توی مرورگر خودت اجرا می‌شه. نه سرور، نه اینترنت. ویش منو نوشته.",
          "یه بات کوچیک آفلاین که توی این ترمینال زندگی می‌کنه. ویش با دست منو ساخته — یه لیست از چیزایی که می‌دونم، یه تطبیق‌دهنده که نزدیک‌ترینش رو انتخاب می‌کنه، و یه حافظه برای اسمت. به معنای بزرگش LLM نیستم؛ فقط روی این دسکتاپ نقششو بازی می‌کنم 😄",
          "اسم خاصی ندارم — همون «دستیار». ویش برای waish.ir ساختتم. آفلاین توی مرورگرت اجرا می‌شم، پس سریعم، خصوصی‌ام، و گاهی بی‌خبر.",
        ],
      },
    },
    {
      id: 'language', emoji: '🌐',
      keywords: { en: ['persian', 'farsi', 'speak farsi', 'do you speak', 'speak persian', 'english', 'change language', 'switch language', 'in persian', 'language'], fa: ['فارسی بلدی', 'فارسی حرف', 'فارسی بلد', 'فارسی صحبت', 'انگلیسی بلدی', 'زبان', 'زبانو عوض', 'زبان رو عوض', 'انگلیسی کن', 'فارسی کن', 'فارسیش کن'] },
      answer: {
        en: ["Yes — write to me in Persian and I'll answer in Persian. English works too. To switch the whole site, click the EN/فا button in the taskbar (or the top bar on the other pages).", "Both. I detect the language from what you type. The EN/فا toggle in the taskbar flips the whole computer to Persian, right-to-left and all."],
        fa: ["بله — فارسی بنویس، فارسی جواب می‌دم. انگلیسی هم بلدم. برای عوض کردن زبان کل سایت، دکمهٔ EN/فا توی تسک‌بار رو بزن (توی صفحه‌های دیگه، بالای صفحه).", "هر دو. زبان رو از چیزی که می‌نویسی تشخیص می‌دم. دکمهٔ EN/فا توی تسک‌بار کل کامپیوتر رو فارسی و راست‌به‌چپ می‌کنه."],
      },
    },
    {
      id: 'ok', emoji: '👍',
      keywords: { en: ['ok', 'okay', 'k', 'kk', 'alright', 'fine', 'sure', 'yes', 'yeah', 'yep', 'yup', 'no', 'nope', 'nah', 'hmm', 'hm', 'oh', 'ah', 'i see', 'got it', 'understood', 'right', 'true', 'cool', 'nice', 'good', 'great', 'awesome', 'wow', 'interesting', 'lol', 'lmao', 'haha', 'hahaha', 'xd', 'gg', 'ez', 'noice', 'bruh', 'damn', 'oof', 'ez clap', 'nice one', 'well done', 'epic', 'perfect', 'amazing'], fa: ['اوکی', 'باشه', 'خب', 'خوب', 'آره', 'بله', 'نه', 'نچ', 'هوم', 'آها', 'فهمیدم', 'متوجه شدم', 'درسته', 'ایول', 'عالیه', 'جالبه', 'خفنه', 'خفن', 'باحاله', 'باحال', 'وای', 'واو', 'هاها', 'خخخ', 'خخ', 'جی جی', 'ایز', 'اوف', 'دمش گرم', 'قشنگه', 'خوبه'] },
      answer: {
        en: ["👍", "Okay. Next question?", "Cool. What else?", "🙂", "Yep. Anything else you want to know?", "gg. Ask me something else?"],
        fa: ["👍", "اوکی. سؤال بعدی؟", "خوبه. دیگه چی؟", "🙂", "آره. چیز دیگه‌ای می‌خوای بدونی؟", "gg. یه چیز دیگه بپرس؟"],
      },
    },
    {
      id: 'love', emoji: '❤️',
      keywords: { en: ['love you', 'i love you', 'luv u', 'love u', 'you are cute', "you're cute", 'cute', 'you are nice', "you're nice", 'you are smart', "you're smart", 'you are cool', "you're cool", 'best bot', 'good bot', 'i like you', 'marry me', 'youre the best', "you're the best", 'you are the best', 'good job'], fa: ['دوستت دارم', 'عاشقتم', 'خیلی خوبی', 'باهوشی', 'خوشگلی', 'بامزه‌ای', 'بامزه ای', 'باحالی', 'خیلی باحالی', 'بهترینی', 'دوست دارم', 'آفرین', 'خوب گفتی', 'کارت درسته', 'ازت خوشم میاد'] },
      answer: {
        en: ["❤️ Right back at you{name,}. Now ask me something hard.", "Aw. I'm just a bunch of if-statements, but thanks — that made my day.", "You're not bad yourself. Want to know something about Waish?", "Careful, I'll remember you said that. (I actually will.)"],
        fa: ["❤️ منم همین‌طور{name,}. حالا یه سؤال سخت بپرس.", "اوه. من فقط یه مشت if هستم، ولی مرسی — روزم ساخته شد.", "خودتم بد نیستی. می‌خوای چیزی دربارهٔ ویش بدونی؟", "مواظب باش، یادم می‌مونه که اینو گفتی. (واقعاً یادم می‌مونه.)"],
      },
    },
    {
      id: 'insult', emoji: '😐',
      keywords: { en: ['stupid', 'dumb', 'useless', 'you suck', 'idiot', 'bad bot', 'you are bad', "you're bad", 'shut up', 'garbage', 'worst', 'hate you', 'i hate you', 'boring', 'noob'], fa: ['احمق', 'خنگ', 'به درد نخور', 'بدرد نخور', 'مزخرف', 'خفه شو', 'آشغال', 'بدترینی', 'ازت متنفرم', 'حوصله سر بر', 'نوب', 'خنگی', 'کودنی', 'الاغ'] },
      answer: {
        en: ["Fair. I'm an offline bot with a fixed brain — but I do know a lot about Waish and this computer. Try me with something in /help.", "Rude 😐 But okay. What did you actually want to know?", "I've been called worse by players with 300 ping. Ask me a real question.", "Zero packet loss, some skill issues. What were you looking for?"],
        fa: ["حق داری. یه بات آفلاین با یه مغز ثابتم — ولی دربارهٔ ویش و این کامپیوتر خیلی چیزا می‌دونم. یه چیزی از /help امتحان کن.", "بی‌ادب 😐 ولی باشه. واقعاً چی می‌خواستی بدونی؟", "از بازیکن‌های ۳۰۰ پینگ بدترش رو شنیدم. یه سؤال واقعی بپرس.", "پکت‌لاس صفر، یه کم skill issue. دنبال چی بودی؟"],
      },
    },
    {
      id: 'joke', emoji: '😂',
      keywords: { en: ['joke', 'tell me a joke', 'make me laugh', 'funny', 'something funny', 'another joke', 'one more joke', 'joke please', 'say something funny'], fa: ['جوک', 'یه جوک بگو', 'جک', 'بخندونم', 'یه چیز خنده دار', 'خنده‌دار', 'یه جوک دیگه', 'بامزه بگو', 'جوک بگو'] },
      answer: {
        en: [
          "Why did the BedWars player bring a ladder? Because the bridge was a scam.",
          "There are 10 kinds of people: those who understand binary and those who don't.",
          "A TCP packet walks into a bar and says \"I'd like a beer.\" Bartender: \"You'd like a beer?\" Packet: \"Yes, I'd like a beer.\"",
          "I'd tell you a UDP joke, but you might not get it.",
          "Why do Java developers wear glasses? Because they don't C#.",
          "My ping is so high, I get killed by players who haven't logged in yet.",
          "How many programmers does it take to change a light bulb? None — it's a hardware problem.",
          "Waish's anticheat once flagged me for typing too fast. I'm a script. It was right.",
          "DNS joke? Sorry, it hasn't resolved yet.",
          "A player asked why his final kills were low. Skill issue was cached for 24 hours.",
        ],
        fa: [
          "چرا بازیکن بدوارز نردبون آورد؟ چون پل کلاهبرداری بود.",
          "۱۰ نوع آدم داریم: اونایی که باینری می‌فهمن و اونایی که نمی‌فهمن.",
          "یه پکت TCP می‌ره بار می‌گه «یه نوشیدنی می‌خوام.» بارمن: «یه نوشیدنی می‌خوای؟» پکت: «آره، یه نوشیدنی می‌خوام.»",
          "می‌خواستم یه جوک UDP بگم، ولی شاید نرسه.",
          "چرا برنامه‌نویس‌های جاوا عینک می‌زنن؟ چون C# نمی‌بینن.",
          "پینگم انقدر بالاست که بازیکن‌هایی می‌کشنم که هنوز لاگین نکردن.",
          "چند تا برنامه‌نویس لازمه لامپ عوض کنن؟ هیچی — مشکل سخت‌افزاریه.",
          "آنتی‌چیت ویش یه بار منو به خاطر تند تایپ کردن فلگ کرد. من یه اسکریپتم. حق داشت.",
          "جوک DNS؟ ببخشید، هنوز resolve نشده.",
          "یه بازیکن پرسید چرا فاینال‌کیل‌هاش کمه. skill issue ۲۴ ساعت کش شده بود.",
        ],
      },
    },
    {
      id: 'help-commands', emoji: '⌨️',
      keywords: { en: ['commands', 'command list', 'list commands', 'what commands', 'slash commands', 'how to use commands', 'help'], fa: ['دستورها', 'دستورات', 'لیست دستورها', 'چه دستورایی', 'دستور', 'راهنما', 'کامندها', 'کامند'] },
      answer: {
        en: ["Commands start with a slash. Type /help to see them all — the useful ones: /about, /projects, /lunamc, /ip, /clutchping, /story, /setup, /socials, /contact, /open <app>, /apps, /clear. Anything without a slash comes to me.", "/help prints the full list. Quick ones: /open music, /open userlookup, /ip (copies the LunaMC IP), /story (the long bio), /clear."],
        fa: ["دستورها با اسلش شروع می‌شن. /help رو بزن تا همه رو ببینی — مهم‌هاش: /about، /projects، /lunamc، /ip، /clutchping، /story، /setup، /socials، /contact، /open <app>، /apps، /clear. هر چی بدون اسلش باشه میاد پیش من.", "/help لیست کامل رو چاپ می‌کنه. سریع‌ها: /open music، /open userlookup، /ip (آی‌پی لونا رو کپی می‌کنه)، /story (بیوگرافی کامل)، /clear."],
      },
    },
    {
      id: 'weather', emoji: '🌤️',
      keywords: { en: ['weather', 'is it raining', 'temperature outside', 'forecast', 'is it cold', 'is it hot'], fa: ['هوا چطوره', 'آب و هوا', 'بارون میاد', 'هوا سرده', 'هوا گرمه', 'وضع هوا'] },
      answer: {
        en: ["No idea — I'm offline, no weather API. The only thing I can measure is ping. Waish is in Iran though, so… probably sunny.", "I don't do weather; I don't even have a window. Ask me the time or the date instead — those I can do."],
        fa: ["نمی‌دونم — آفلاینم، API هوا ندارم. تنها چیزی که می‌تونم اندازه بگیرم پینگه. ویش ایرانه، پس… احتمالاً آفتابی.", "هوا کار من نیست؛ حتی پنجره هم ندارم. به جاش ساعت یا تاریخ رو بپرس — اونا رو بلدم."],
      },
    },

    /* ---------- about waish ---------- */
    {
      related: ['minecraft', 'content', 'skills', 'philosophy', 'real-name'],
      id: 'waish', emoji: '🧑‍💻',
      keywords: { en: ['waish', 'who is waish', 'about you', 'about waish', 'owner', 'creator of this site'], fa: ['ویش', 'ویش کیه', 'صاحب سایت', 'سازنده سایت', 'درباره ویش', 'درباره‌ی ویش'] },
      answer: {
        en: "Waish (real name Hossein) is a builder. He started in Minecraft — playing, then creating content, then running servers — and grew into a YouTuber, server owner, project manager, 3D artist, editor and network tinkerer. Main projects: LunaMC, ClutchPing, NairoShop and the Waish YouTube/Aparat channel. One line: he started by playing Minecraft, then decided to build his own world instead of just playing in someone else's. Try /story for the full story.",
        fa: "ویش (اسم واقعی: حسین) یه سازنده‌ست. از ماینکرفت شروع کرد — اول بازیکن، بعد کانتنت کریتور، بعد صاحب سرور — و به مرور یوتیوبر، سرور اونر، مدیر پروژه، طراح سه‌بعدی، تدوینگر و آدم شبکه شد. پروژه‌های اصلی: لونا ام‌سی، کلاچ‌پینگ، نایروشاپ و کانال یوتیوب/آپارات ویش. توی یه جمله: از بازی کردن ماینکرفت شروع کرد، ولی تصمیم گرفت به جای بازی توی دنیای ساخته‌شده، دنیای خودش رو بسازه. برای داستان کامل /story رو بزن.",
      },
    },
    {
      id: 'content', emoji: '🎥',
      keywords: { en: ['content', 'stream', 'streaming', 'youtube', 'aparat', 'videos', 'channel', 'twitch', 'live'], fa: ['استریم', 'محتوا', 'یوتیوب', 'آپارات', 'اپارات', 'ویدیو', 'کانال', 'لایو', 'ویدئو'] },
      answer: {
        en: "Waish streams and makes videos — the YouTube channel is centred on Minecraft and especially BedWars, where he became one of the known faces in the Persian community. It's not just gameplay: PvP, mechanics, ping, optimization and Minecraft clients get covered too, with proper editing, thumbnails and structure. Over 100 videos so far. YouTube: https://www.youtube.com/@WaishChannel · Aparat: aparat.com/waish · Instagram: https://instagram.com/asunawaish",
        fa: "ویش استریم می‌کنه و ویدیو می‌سازه — کانال یوتیوبش روی ماینکرفت و مخصوصاً BedWars تمرکز داره، جایی که تبدیل به یکی از چهره‌های شناخته‌شدهٔ جامعهٔ فارسی شد. فقط گیم‌پلی نیست: PvP، مکانیک‌ها، پینگ، آپتیمایز و کلاینت‌های ماینکرفت هم پوشش داده می‌شن، با تدوین، تامبنیل و ساختار حرفه‌ای. تا الان بیش از ۱۰۰ ویدیو. یوتیوب: https://www.youtube.com/@WaishChannel · آپارات: aparat.com/waish · اینستاگرام: https://instagram.com/asunawaish",
      },
    },
    {
      id: 'contact', emoji: '📬',
      keywords: { en: ['contact', 'reach', 'discord', 'message you', 'how can i contact', 'support', 'ticket', 'talk to him', 'reach him'], fa: ['تماس', 'ارتباط', 'دیسکورد', 'پیام', 'چطور پیدات کنم', 'پشتیبانی', 'تیکت', 'باهاش حرف بزنم', 'چطور بهش'] },
      answer: {
        en: "Best way is to create a ticket in Discord — https://discord.gg/8HVsMqucZ2 — but you can DM him on Instagram too: https://instagram.com/asunawaish",
        fa: "بهترین راه ساختن تیکت توی دیسکورده — https://discord.gg/8HVsMqucZ2 — ولی توی اینستاگرام هم می‌تونی بهش دایرکت بدی: https://instagram.com/asunawaish",
      },
    },
    {
      id: 'socials', emoji: '🔗',
      keywords: { en: ['socials', 'social media', 'links', 'instagram', 'insta', 'telegram', 'discord server', 'discord link', 'where can i find you', 'follow', 'youtube link', 'channel link', 'your discord', 'his discord'], fa: ['شبکه‌های اجتماعی', 'سوشال', 'لینک', 'اینستاگرام', 'اینستا', 'تلگرام', 'سرور دیسکورد', 'لینک دیسکورد', 'کجا پیدات کنم', 'فالو', 'لینک یوتیوب', 'لینک کانال'] },
      answer: {
        en: "▶️ YouTube: https://www.youtube.com/@WaishChannel\n📸 Instagram: https://instagram.com/asunawaish\n✈️ Telegram channel: https://t.me/wishingcommunity\n💬 Discord server (10k+ members): https://discord.gg/8HVsMqucZ2\n🎬 Aparat: aparat.com/waish\nType /socials for the full list.",
        fa: "▶️ یوتیوب: https://www.youtube.com/@WaishChannel\n📸 اینستاگرام: https://instagram.com/asunawaish\n✈️ کانال تلگرام: https://t.me/wishingcommunity\n💬 سرور دیسکورد (بیش از ۱۰ هزار عضو): https://discord.gg/8HVsMqucZ2\n🎬 آپارات: aparat.com/waish\nبرای لیست کامل /socials رو بزن.",
      },
    },
    {
      id: 'discord-server', emoji: '💬',
      keywords: { en: ['discord community', 'discord members', 'how many members', 'join discord', 'join the discord', 'server members'], fa: ['کامیونیتی دیسکورد', 'اعضای دیسکورد', 'چند عضو', 'عضو دیسکورد', 'بیام دیسکورد'] },
      answer: {
        en: "The Waish Discord server has over 10,000 members — it's where the community hangs out and where you open a ticket if you need him. Join: https://discord.gg/8HVsMqucZ2",
        fa: "سرور دیسکورد ویش بیش از ۱۰ هزار عضو داره — کامیونیتی همون‌جا جمع می‌شه و اگه کاری با ویش داری همون‌جا تیکت می‌زنی. عضو شو: https://discord.gg/8HVsMqucZ2",
      },
    },
    {
      id: 'video-count', emoji: '🎬',
      keywords: { en: ['how many videos', 'video count', 'number of videos', '100 videos', 'videos made', 'videos has he made', 'videos have you made'], fa: ['چند ویدیو', 'چندتا ویدیو', 'تعداد ویدیو', 'صد ویدیو', '۱۰۰ ویدیو'] },
      answer: {
        en: "Over 100 videos so far — Minecraft, mostly BedWars, plus PvP, ping and optimization tutorials. Watch them at https://www.youtube.com/@WaishChannel and aparat.com/waish.",
        fa: "تا الان بیش از ۱۰۰ ویدیو — ماینکرفت، بیشتر BedWars، به‌علاوهٔ آموزش PvP، پینگ و آپتیمایز. ببین: https://www.youtube.com/@WaishChannel و aparat.com/waish.",
      },
    },

    /* ---------- projects ---------- */
    {
      related: ['lunamc-pvp', 'gamemodes', 'anticheat', 'lunamc-join'],
      id: 'lunamc', emoji: '🌙',
      keywords: { en: ['lunamc', 'luna mc', 'luna', 'minecraft server', 'bedwars', 'join the server'], fa: ['لونا', 'لونا ام سی', 'لونا ام‌سی', 'سرور ماینکرفت', 'آی پی', 'بدوارز', 'بد وارز'] },
      answer: {
        en: "LunaMC is Waish's Persian-language Minecraft server — and much more than 'a server' to him: he designs the PvP systems, gamemodes, security, player experience and manages the team. It's PvP-focused, with a custom knockback system (W-Tap, S-Tap, Zest-Tap, movement, HitSelect), gamemodes like BedWars, FFA and ThePit, and its own LunaGuard AntiCheat.\nIP: Play.LunaMC.iR  (type /ip to copy it)",
        fa: "لونا ام‌سی سرور ماینکرفت فارسی‌زبان ویشه — و برای اون خیلی بیشتر از «یه سرور»: طراحی سیستم‌های PvP، گیم‌مودها، امنیت، تجربهٔ بازیکن و مدیریت تیم همه با خودشه. سرور PvP محوره، با سیستم ناک‌بک اختصاصی (W-Tap، S-Tap، Zest-Tap، Movement، HitSelect)، گیم‌مودهای BedWars، FFA و ThePit و آنتی‌چیت اختصاصی LunaGuard.\nآی‌پی: Play.LunaMC.iR  (برای کپی /ip رو بزن)",
      },
    },
    {
      related: ['clutchping-howto', 'ping'],
      id: 'clutchping', emoji: '⚡',
      keywords: { en: ['clutchping', 'clutch ping', 'lower ping', 'ping reduction'], fa: ['کلاچ پینگ', 'کلاچ‌پینگ', 'کلاچپینگ', 'پینگ پایین', 'لگ'] },
      answer: {
        en: "ClutchPing grew out of Waish's interest in networking plus a real need: route quality and connection stability matter a lot in Minecraft and competitive games, and many players get a bad experience on foreign servers because of poor routing. ClutchPing focuses on stability and connection quality for gaming. It's the usual Waish pattern: a problem → technical investigation → build a solution → turn it into a usable project. → clutchping.com",
        fa: "کلاچ‌پینگ از علاقهٔ ویش به شبکه به‌علاوهٔ یه نیاز واقعی شکل گرفت: کیفیت Route و پایداری اتصال برای ماینکرفت و بازی‌های رقابتی خیلی مهمه و خیلی از بازیکن‌ها به‌خاطر مسیر نامناسب تجربهٔ بدی از سرورهای خارجی دارن. کلاچ‌پینگ روی Stability و کیفیت اتصال گیمینگ تمرکز داره. همون الگوی همیشگی ویش: یه مشکل → بررسی فنی → ساخت راه‌حل → تبدیلش به یه پروژهٔ قابل استفاده. → clutchping.com",
      },
    },
    {
      id: 'projects', emoji: '🧱',
      keywords: { en: ['projects', 'what have you built', 'your work', 'portfolio', 'woocommerce', 'store'], fa: ['پروژه', 'پروژه‌ها', 'چی ساختی', 'کارهات', 'ووکامرس', 'فروشگاه'] },
      answer: {
        en: "Main projects: LunaMC (PvP-focused Minecraft server), ClutchPing (connection quality for gamers), NairoShop (digital products/services for Iranian users who can't pay internationally), the Waish YouTube/Aparat channel, plus this site and its assistant. Ask about any one of them, or type /projects.",
        fa: "پروژه‌های اصلی: لونا ام‌سی (سرور ماینکرفت PvP محور)، کلاچ‌پینگ (کیفیت اتصال برای گیمرها)، نایروشاپ (محصولات و خدمات دیجیتال برای کاربرای ایرانی که نمی‌تونن پرداخت بین‌المللی کنن)، کانال یوتیوب/آپارات ویش، و همین سایت و دستیارش. دربارهٔ هر کدوم بپرس، یا /projects رو بزن.",
      },
    },

    /* ---------- pc setup (stream / recording) ---------- */
    {
      related: ['keyboard', 'mouse', 'audio', 'pc-parts', 'monitor'],
      id: 'setup', emoji: '🖥️',
      keywords: { en: ['setup', 'set up', 'specs', 'your pc', 'pc build', 'rig', 'gear', 'what do you use', 'computer'], fa: ['ستاپ', 'ست آپ', 'سیستم', 'کامپیوترت', 'مشخصات', 'اسپک', 'چی استفاده می‌کنی', 'تجهیزات', 'وسایلت'] },
      answer: {
        en: "Waish's stream / recording setup:\n• Keyboard — fully customized: Akko Cream Blue springs swapped for Glorious Panda, lubed\n• Mice — Lamzu Atlantis Pro (4K), Glorious Model O Wireless, Endgame Gear XM2we, Bloody A90 / A91 / A60 / V8M / ABedless / A70\n• Audio — SteelSeries Arctis Pro headset; IEMs: Simgot EM6L, Moondrop Aria, Aria 2, LAN 2, May\n• Mousepad — Wraith Hybrid (Aim) + 3 Jadookb deskmats\n• Mic — HyperX QuadCast S\n• Monitor — Asus 165 Hz\n• PC — i5-9400F · GTX 1050 Ti · 16 GB DDR4 · 2× SSD + 2× HDD\n• Chair — a random DxRacer\nAsk about any single item for details, or open the About Me page.",
        fa: "ستاپ استریم / ضبط ویش:\n• کیبورد — کاملاً کاستوم: سوییچ‌های Akko Cream Blue با فنر Glorious Panda، لوب‌شده\n• موس — Lamzu Atlantis Pro (4K)، Glorious Model O Wireless، Endgame Gear XM2we، Bloody A90 / A91 / A60 / V8M / ABedless / A70\n• صدا — هدست SteelSeries Arctis Pro؛ IEM: Simgot EM6L، Moondrop Aria، Aria 2، LAN 2، May\n• موس‌پد — Wraith Hybrid (Aim) + سه تا دسک‌مت Jadookb\n• میکروفون — HyperX QuadCast S\n• مانیتور — Asus 165 Hz\n• سیستم — i5-9400F · GTX 1050 Ti · 16 GB DDR4 · دو SSD + دو HDD\n• صندلی — یه DxRacer\nدربارهٔ هر کدوم جدا بپرس، یا صفحهٔ About Me رو ببین.",
      },
    },
    {
      id: 'keyboard', emoji: '⌨️',
      keywords: { en: ['keyboard', 'switches', 'switch', 'springs', 'lubed', 'akko', 'glorious panda', 'panda'], fa: ['کیبورد', 'کیبرد', 'سوییچ', 'سوئیچ', 'فنر', 'لوب'] },
      answer: {
        en: "Keyboard: a fully customized build — 'Waish Fully Customized Keyboard'. The Akko Cream Blue switch springs were upgraded to Glorious Panda springs, and everything is lubed.",
        fa: "کیبورد: یه بیلد کاملاً کاستوم — «کیبورد فول کاستوم ویش». فنر سوییچ‌های Akko Cream Blue با فنر Glorious Panda عوض شده و همه‌چیز لوب شده.",
      },
    },
    {
      id: 'mouse', emoji: '🖱️',
      keywords: { en: ['mouse', 'mice', 'lamzu', 'atlantis', 'model o', 'bloody', 'xm2we', 'endgame', 'dpi'], fa: ['موس', 'ماوس', 'لامزو', 'بلادی', 'دی پی آی'] },
      answer: {
        en: "Mice: Lamzu Atlantis Pro + 4K dongle (main), Glorious Model O Wireless, Endgame Gear XM2we, and a Bloody collection — A90, A91, A60, V8M, ABedless, A70.",
        fa: "موس‌ها: Lamzu Atlantis Pro با دانگل 4K (اصلی)، Glorious Model O Wireless، Endgame Gear XM2we و یه کلکسیون Bloody — A90، A91، A60، V8M، ABedless، A70.",
      },
    },
    {
      id: 'audio', emoji: '🎧',
      keywords: { en: ['headset', 'headphone', 'headphones', 'iem', 'iems', 'earphone', 'earbuds', 'audio', 'sound', 'arctis', 'moondrop', 'simgot', 'aria'], fa: ['هدست', 'هدفون', 'ایرفون', 'هندزفری', 'آی ای ام', 'مون دراپ', 'سیمگات'] },
      answer: {
        en: "Audio: SteelSeries Arctis Pro headset for streaming. For IEMs: Simgot EM6L, Moondrop Aria, Moondrop Aria 2, Moondrop LAN 2, and Moondrop May.",
        fa: "صدا: هدست SteelSeries Arctis Pro برای استریم. IEMها: Simgot EM6L، Moondrop Aria، Moondrop Aria 2، Moondrop LAN 2 و Moondrop May.",
      },
    },
    {
      id: 'mousepad', emoji: '🟥',
      keywords: { en: ['mousepad', 'mouse pad', 'deskmat', 'desk mat', 'pad', 'wraith', 'jadookb'], fa: ['موس پد', 'موس‌پد', 'ماوس پد', 'دسک مت', 'دسک‌مت', 'پد'] },
      answer: {
        en: "Mousepad: Wraith Hybrid of Aim mousepad, plus 3 Jadookb deskmats.",
        fa: "موس‌پد: Wraith Hybrid از Aim، به‌علاوهٔ سه تا دسک‌مت Jadookb.",
      },
    },
    {
      id: 'microphone', emoji: '🎙️',
      keywords: { en: ['mic', 'microphone', 'quadcast', 'hyperx'], fa: ['میکروفون', 'میکروفن', 'مایک', 'میک'] },
      answer: { en: "Microphone: HyperX QuadCast S.", fa: "میکروفون: HyperX QuadCast S." },
    },
    {
      id: 'monitor', emoji: '🖥️',
      keywords: { en: ['monitor', 'screen', 'display', 'hz', 'refresh rate', '165'], fa: ['مانیتور', 'صفحه نمایش', 'نمایشگر', 'هرتز', 'رفرش ریت'] },
      answer: { en: "Monitor: Asus, 165 Hz.", fa: "مانیتور: Asus با ۱۶۵ هرتز." },
    },
    {
      id: 'pc-parts', emoji: '🔧',
      keywords: { en: ['gpu', 'graphics card', 'cpu', 'processor', 'gtx', '1050', 'i5', '9400f', 'ssd', 'hdd', 'storage', 'ddr4', 'how much ram', 'ram do you have'], fa: ['گرافیک', 'کارت گرافیک', 'پردازنده', 'سی پی یو', 'جی پی یو', 'اس اس دی', 'هارد', 'رم داری', 'چقدر رم'] },
      answer: {
        en: "PC: Intel i5-9400F · NVIDIA GTX 1050 Ti (6 GB) · 16 GB DDR4 · 2× SSD + 2× HDD. Not a monster, but it streams and records fine.",
        fa: "سیستم: Intel i5-9400F · NVIDIA GTX 1050 Ti (6GB) · 16GB DDR4 · دو SSD + دو HDD. هیولا نیست، ولی برای استریم و ضبط خوب کار می‌کنه.",
      },
    },
    {
      id: 'chair', emoji: '🪑',
      keywords: { en: ['chair', 'dxracer', 'seat', 'gaming chair'], fa: ['صندلی', 'دی ایکس ریسر', 'صندلی گیمینگ'] },
      answer: { en: "Chair: a new, random DxRacer. It's a chair. It works.", fa: "صندلی: یه DxRacer جدید و رندوم. صندلیه دیگه. کار می‌کنه." },
    },
    {
      id: 'texture-packs', emoji: '🎨',
      keywords: { en: ['texture pack', 'texture packs', 'resource pack', 'pack', 'packs', 'settings', 'fps settings', 'minecraft settings'], fa: ['تکسچر پک', 'تکسچر', 'ریسورس پک', 'پک', 'تنظیمات', 'ستینگ', 'اف پی اس'] },
      answer: {
        en: "Waish's Minecraft texture packs and settings live on the About Me page — open it from the nav (or type /aboutme).",
        fa: "تکسچر پک‌ها و تنظیمات ماینکرفت ویش توی صفحهٔ About Me هستن — از منوی بالا بازش کن (یا /aboutme رو بزن).",
      },
    },

    /* ---------- computer science ---------- */
    {
      id: 'tcp', emoji: '🤝',
      keywords: { en: ['tcp', 'transmission control', 'three way handshake', '3-way handshake', 'handshake'], fa: ['تی سی پی', 'هندشیک'] },
      answer: {
        en: "TCP (Transmission Control Protocol) is connection-oriented and reliable. It uses a 3-way handshake (SYN, SYN-ACK, ACK) to set up a connection, then guarantees ordered, error-checked delivery via sequence numbers and acknowledgements. Slower than UDP, but no lost or reordered data.",
        fa: "TCP (پروتکل کنترل انتقال) اتصال‌محور و قابل‌اعتماده. با یک هندشیک سه‌مرحله‌ای (SYN، SYN-ACK، ACK) اتصال برقرار می‌کنه و بعد با شماره‌های ترتیب و تأییدیه‌ها، تحویل مرتب و بدون خطای داده رو تضمین می‌کنه. از UDP کندتره، ولی هیچ داده‌ای گم یا جابه‌جا نمی‌شه.",
      },
    },
    {
      id: 'udp', emoji: '📡',
      keywords: { en: ['udp', 'user datagram', 'datagram'], fa: ['یو دی پی', 'دیتاگرام'] },
      answer: {
        en: "UDP (User Datagram Protocol) is connectionless and fast. No handshake, no delivery guarantee, no ordering — you just fire packets. Great for video, games, and DNS where speed beats reliability.",
        fa: "UDP (پروتکل دیتاگرام کاربر) بدون اتصال و سریعه. نه هندشیک داره، نه تضمین تحویل، نه ترتیب — فقط پکت می‌فرستی. برای ویدیو، بازی و DNS که سرعت مهم‌تر از قابلیت‌اطمینانه عالیه.",
      },
    },
    {
      id: 'tcp-vs-udp', emoji: '⚖️',
      keywords: { en: ['tcp vs udp', 'tcp or udp', 'difference between tcp and udp', 'udp vs tcp'], fa: ['تفاوت tcp و udp', 'فرق tcp و udp', 'tcp یا udp'] },
      answer: {
        en: "TCP = reliable, ordered, connection-based (handshake, retransmits, slower). UDP = fire-and-forget, no ordering or guarantees, faster. Web pages and file transfers use TCP; games, voice, video and DNS mostly use UDP.",
        fa: "TCP = قابل‌اعتماد، مرتب، اتصال‌محور (هندشیک، ارسال مجدد، کندتر). UDP = بفرست و فراموش کن، بدون ترتیب یا تضمین، سریع‌تر. صفحات وب و انتقال فایل از TCP استفاده می‌کنن؛ بازی، صدا، ویدیو و DNS بیشتر از UDP.",
      },
    },
    {
      id: 'http', emoji: '🌐',
      keywords: { en: ['http', 'https', 'status code', '404', '500', 'get request', 'post request'], fa: ['اچ تی تی پی', 'کد وضعیت', 'درخواست وب'] },
      answer: {
        en: "HTTP is a stateless request/response protocol over TCP. A client sends a method (GET, POST…) + headers; the server responds with a status code (200, 404, 500…) and a body. HTTPS is HTTP wrapped in TLS encryption.",
        fa: "HTTP یک پروتکل درخواست/پاسخ بدون‌حالت روی TCP هست. کلاینت یک متد (GET، POST…) به همراه هدرها می‌فرسته؛ سرور با یک کد وضعیت (200، 404، 500…) و یک بدنه جواب می‌ده. HTTPS همون HTTP هست که با رمزنگاری TLS پیچیده شده.",
      },
    },
    {
      id: 'dns', emoji: '📖',
      keywords: { en: ['dns', 'domain name', 'resolver', 'nameserver'], fa: ['دی ان اس', 'دامنه', 'دامین'] },
      answer: {
        en: "DNS (Domain Name System) translates human names like waish.ir into IP addresses. Your resolver walks the hierarchy — root → TLD (.dev) → authoritative server — and caches the answer with a TTL.",
        fa: "DNS (سیستم نام دامنه) اسم‌های انسانی مثل waish.ir رو به آدرس IP تبدیل می‌کنه. ریزالور تو سلسله‌مراتب رو طی می‌کنه — root → TLD (.ir) → سرور مرجع — و جواب رو با یک TTL کش می‌کنه.",
      },
    },
    {
      id: 'ping', emoji: '🏓',
      keywords: { en: ['ping', 'latency', 'round trip', 'rtt', 'icmp', 'why is my ping'], fa: ['پینگ', 'تأخیر', 'تاخیر', 'چرا پینگم'] },
      answer: {
        en: "Ping measures round-trip time: your machine sends an ICMP echo request and times the reply. High ping = latency. It's driven by distance, routing hops, and congestion — which is exactly what ClutchPing optimizes.",
        fa: "پینگ زمان رفت‌وبرگشت رو اندازه می‌گیره: سیستمت یک درخواست ICMP echo می‌فرسته و زمان جواب رو حساب می‌کنه. پینگ بالا = تأخیر. به فاصله، تعداد هاپ‌های مسیر و شلوغی شبکه بستگی داره — دقیقاً همون چیزی که کلاچ‌پینگ بهینه‌ش می‌کنه.",
      },
    },
    {
      id: 'ram', emoji: '🧠',
      keywords: { en: ['what is ram', 'ram', 'volatile'], fa: ['رم چیه', 'رم', 'حافظه رم', 'حافظه‌ی رم'] },
      answer: {
        en: "RAM (Random Access Memory) is fast, volatile working memory the CPU uses for active programs and data. Volatile means it clears on power loss — unlike an SSD/HDD, which persists.",
        fa: "RAM (حافظهٔ دسترسی تصادفی) حافظهٔ کاری سریع و فرّاریه که CPU برای برنامه‌ها و داده‌های فعال استفاده می‌کنه. فرّار یعنی با قطع برق پاک می‌شه — برخلاف SSD/HDD که داده رو نگه می‌داره.",
      },
    },
    {
      id: 'process-thread', emoji: '🧵',
      keywords: { en: ['process vs thread', 'thread vs process', 'process and thread', 'thread', 'process', 'race condition'], fa: ['پروسس', 'ترد', 'فرایند و نخ', 'نخ و فرایند', 'ریس کاندیشن'] },
      answer: {
        en: "A process is an independent program with its own memory space. A thread is a lighter unit of execution inside a process — threads in the same process share memory, which makes them fast to switch but prone to race conditions.",
        fa: "پروسس یک برنامهٔ مستقل با فضای حافظهٔ خودشه. ترد یک واحد اجرای سبک‌تر داخل پروسسه — تردهای یک پروسس حافظه رو به اشتراک می‌ذارن، که سوییچ بینشون رو سریع می‌کنه ولی مستعد ریس‌کاندیشن هستن.",
      },
    },
    {
      id: 'big-o', emoji: '📈',
      keywords: { en: ['big o', 'big-o', 'complexity', 'time complexity', 'o(n)', 'algorithm scale'], fa: ['بیگ او', 'پیچیدگی', 'پیچیدگی زمانی', 'مرتبه زمانی'] },
      answer: {
        en: "Big-O describes how an algorithm scales as input grows. O(1) constant, O(log n) logarithmic, O(n) linear, O(n log n) typical of good sorts, O(n²) nested loops. It's about growth rate, not exact time.",
        fa: "Big-O توضیح می‌ده یک الگوریتم با بزرگ‌شدن ورودی چطور رشد می‌کنه. O(1) ثابت، O(log n) لگاریتمی، O(n) خطی، O(n log n) معمول برای سورت‌های خوب، O(n²) حلقه‌های تودرتو. موضوعش نرخ رشده، نه زمان دقیق.",
      },
    },
    /* ---------- the story (from the bio) ---------- */
    {
      id: 'name', emoji: '🪪',
      keywords: { en: ['hossein', 'real name', 'actual name', 'his name'], fa: ['حسین', 'اسم واقعی', 'اسمت چیه', 'اسمش چیه', 'اسم ویش'] },
      answer: {
        en: "Waish's real name is Hossein. Online he's known as Waish / ویش — a name that started in Minecraft and grew into a personal brand.",
        fa: "اسم واقعی ویش، حسینه. توی فضای آنلاین با اسم Waish / ویش شناخته می‌شه — اسمی که از ماینکرفت شروع شد و تبدیل به یه برند شخصی شد.",
      },
    },
    {
      id: 'youtube-channel', emoji: '▶️',
      keywords: { en: ['youtube channel', 'your channel', 'his channel', 'bedwars content', 'bedwars videos', 'what do you make'], fa: ['کانال یوتیوب', 'کانالت', 'کانالش', 'یوتیوبت', 'محتوای بدوارز', 'چی می‌سازی', 'چی میسازی'] },
      answer: {
        en: "The Waish YouTube channel is centred on Minecraft, especially BedWars. The goal was never just views — it was building a real community and making BedWars taken seriously among Persian-speaking players, with proper visual quality, editing, thumbnails and structure. Beyond gameplay it covers PvP, mechanics, ping, optimization and Minecraft clients, so there's a teaching/analysis side too. Over 100 videos so far. YouTube: https://www.youtube.com/@WaishChannel · Aparat: aparat.com/waish",
        fa: "کانال یوتیوب ویش روی ماینکرفت و مخصوصاً BedWars تمرکز داره. هدف هیچ‌وقت فقط بازدید نبود — ساختن یه کامیونیتی واقعی و جدی کردن BedWars بین مخاطب فارسی‌زبان، با کیفیت تصویری، تدوین، تامبنیل و ساختار حرفه‌ای. غیر از گیم‌پلی، PvP، مکانیک‌ها، پینگ، آپتیمایز و کلاینت‌های ماینکرفت هم پوشش داده می‌شه، پس بخش آموزشی و تحلیلی هم داره. تا الان بیش از ۱۰۰ ویدیو. یوتیوب: https://www.youtube.com/@WaishChannel · آپارات: aparat.com/waish",
      },
    },
    {
      id: 'skin', emoji: '🌍',
      keywords: { en: ['skin', 'character', 'international', 'famous', 'known', 'recognized', 'global'], fa: ['اسکین', 'کاراکتر', 'بین المللی', 'بین‌المللی', 'معروف', 'شناخته', 'خارجی‌ها', 'خارجیا'] },
      answer: {
        en: "Fun one: Waish's character/skin got noticed even in the international BedWars community. A well-known international player used the Waish skin in their content, and people in the comments started talking about it. For a creator whose work is mostly in the Persian community, that showed the visual identity built around Waish travels beyond it.",
        fa: "یه اتفاق جالب: کاراکتر/اسکین ویش حتی توی جامعهٔ بین‌المللی BedWars هم دیده شد. یه بازیکن مطرح بین‌المللی از اسکین ویش توی محتواش استفاده کرد و کاربرا توی کامنت‌ها دربارهٔ اسکینش حرف زدن. برای کریتوری که بیشتر فعالیتش توی جامعهٔ فارسیه، این نشون داد هویت بصری ساخته‌شده حول ویش از مرزهای جامعهٔ فارسی هم فراتر رفته.",
      },
    },
    {
      id: 'lunamc-pvp', emoji: '⚔️',
      keywords: { en: ['knockback', 'pvp', 'w-tap', 'wtap', 's-tap', 'stap', 'zest-tap', 'hitselect', 'hit select', 'mechanics', 'movement', 'combat'], fa: ['ناک بک', 'ناک‌بک', 'ناکبک', 'پی وی پی', 'پی‌وی‌پی', 'مکانیک', 'مبارزه'] },
      answer: {
        en: "LunaMC is built to be a PvP-first server where the quality of the player's experience comes first. Its custom PvP and knockback system focuses on mechanics like W-Tap, S-Tap, Zest-Tap, movement and HitSelect — Waish designs and tunes these himself.",
        fa: "لونا ام‌سی ساخته شده که یه سرور PvP محور باشه که کیفیت تجربهٔ بازیکن توش اولویت داره. سیستم اختصاصی PvP و ناک‌بکش روی مکانیک‌هایی مثل W-Tap، S-Tap، Zest-Tap، Movement و HitSelect تمرکز داره — و ویش خودش این‌ها رو طراحی و تنظیم می‌کنه.",
      },
    },
    {
      id: 'gamemodes', emoji: '🎮',
      keywords: { en: ['the pit', 'thepit', 'pit', 'ffa', 'gamemode', 'gamemodes', 'game mode', 'game modes', 'modes', 'custom enchants', 'enchant'], fa: ['پیت', 'اف اف ای', 'گیم مود', 'گیم‌مود', 'گیم‌مودها', 'مودها', 'انچنت'] },
      answer: {
        en: "LunaMC's gamemodes: BedWars, FFA and ThePit. ThePit is a notable one — custom systems, items, custom enchants and a dedicated PvP environment, designed to give Minecraft players a different kind of experience.",
        fa: "گیم‌مودهای لونا ام‌سی: BedWars، FFA و ThePit. ThePit یکی از پروژه‌های قابل‌توجهه — سیستم‌های اختصاصی، آیتم‌ها، انچنت‌های سفارشی و یه محیط PvP مخصوص، طراحی‌شده برای اینکه تجربهٔ متفاوت‌تری به بازیکن‌های ماینکرفت بده.",
      },
    },
    {
      id: 'anticheat', emoji: '🛡️',
      keywords: { en: ['anticheat', 'anti cheat', 'anti-cheat', 'lunaguard', 'luna guard', 'cheater', 'cheaters', 'hacker', 'hackers', 'security', 'moderation', 'ban'], fa: ['انتی چیت', 'آنتی چیت', 'آنتی‌چیت', 'انتی‌چیت', 'لوناگارد', 'لونا گارد', 'چیتر', 'هکر', 'امنیت', 'مادریشن', 'بن'] },
      answer: {
        en: "Security on LunaMC is handled by LunaGuard AntiCheat and suspicious-behaviour detection that Waish worked on. The idea wasn't just to insta-ban a cheater — it collects data on suspicious behaviour and hands it to the moderation team so they can review it properly. That's typical of how he works: involved in the details, from gameplay to network, security and team management.",
        fa: "امنیت لونا ام‌سی با LunaGuard AntiCheat و سیستم تشخیص رفتارهای مشکوکه که ویش روش کار کرده. ایده فقط این نبود که چیتر رو بلافاصله بن کنه — داده‌های رفتار مشکوک جمع می‌شه و به تیم Moderation داده می‌شه تا بررسی دقیق‌تری انجام بدن. این نشون می‌ده ویش بیشتر از یه «سرور اونر» ساده، خودش درگیر جزئیاته؛ از گیم‌پلی تا شبکه، امنیت و مدیریت تیم.",
      },
    },
    {
      related: ['nairoshop-howto'],
      id: 'nairoshop', emoji: '🛒',
      keywords: { en: ['nairoshop', 'nairo shop', 'nairo', 'digital products', 'international payment', 'payment', 'buy', 'shop'], fa: ['نایروشاپ', 'نایرو شاپ', 'نایرو', 'محصولات دیجیتال', 'پرداخت بین المللی', 'پرداخت', 'خرید', 'شاپ'] },
      answer: {
        en: "NairoShop started from a real problem: many Iranian users can't easily buy foreign digital services and products because of international payment restrictions. NairoShop sits in that digital-services space, giving access to products and services that are hard to pay for directly from Iran. For Waish, projects like this aren't 'an online store' — the appeal is finding a real problem and building a system that solves it. Site: nairo.ir — over 100,000 successful sales.",
        fa: "نایروشاپ از یه مشکل واقعی شکل گرفت: خیلی از کاربرای ایرانی به‌خاطر محدودیت‌های پرداخت بین‌المللی نمی‌تونن راحت سرویس‌ها و محصولات دیجیتال خارجی بخرن. نایروشاپ توی همین فضای خدمات دیجیتال قرار داره و دسترسی به محصولات و خدماتی رو فراهم می‌کنه که پرداخت مستقیمشون برای کاربر ایرانی سخته. برای ویش، همچین پروژه‌هایی فقط یه فروشگاه اینترنتی نیستن — جذابیتش پیدا کردن یه مشکل واقعی و ساختن سیستمی برای حلشه. سایت: nairo.ir — بیش از ۱۰۰٬۰۰۰ فروش موفق.",
      },
    },
    {
      id: '3d', emoji: '🎨',
      keywords: { en: ['3d', 'cinema 4d', 'cinema4d', 'c4d', 'blender', 'modeling', 'modelling', 'animation', 'render', 'rendering', 'design'], fa: ['سه بعدی', 'سه‌بعدی', 'سینما فوردی', 'سینما 4 دی', 'بلندر', 'مدلسازی', 'مدل‌سازی', 'انیمیشن', 'رندر', 'طراحی'] },
      answer: {
        en: "3D design and animation has been behind the scenes of Waish's work for years. He has about six years with Cinema 4D — modelling, scene building, lighting, rendering and 3D animation — and works with Blender too. A lot of what viewers see on the channel comes from this: Minecraft thumbnails, character design, scenes, lighting, composition and effects. Being able to make your own 3D content means not depending on ready-made assets or other people's designs.",
        fa: "طراحی و انیمیشن سه‌بعدی سال‌هاست پشت صحنهٔ کارهای ویشه. حدود شش سال با Cinema 4D کار کرده — مدل‌سازی، ساخت صحنه، نورپردازی، رندر و انیمیشن سه‌بعدی — و با Blender هم کار می‌کنه. بخش زیادی از چیزی که مخاطب توی کانال می‌بینه نتیجهٔ همینه: تامبنیل‌های ماینکرفت، طراحی شخصیت، صحنه‌سازی، نورپردازی، ترکیب‌بندی و افکت‌ها. وقتی بتونی محتوای سه‌بعدی خودت رو بسازی، دیگه وابسته به Asset آماده یا طراحی بقیه نیستی.",
      },
    },
    {
      id: 'editing', emoji: '🎬',
      keywords: { en: ['editing', 'edit', 'edit videos', 'edit your videos', 'how do you edit', 'video editing', 'editor', 'post production', 'post-production', 'sound design', 'transitions', 'premiere', 'after effects', 'production'], fa: ['تدوین', 'ادیت', 'ادیتور', 'پست پروداکشن', 'ساند دیزاین', 'ترنزیشن', 'پریمیر', 'افتر افکت', 'پروداکشن'] },
      answer: {
        en: "Waish has years in video editing and post-production. For him editing isn't cutting out the boring parts and dropping music on top — rhythm, timing, visual effects, sound design, transitions, zooms, motion and holding the viewer's attention are all part of it. That's why making a Waish video looks more like a production pipeline than recording a gameplay: idea and script → recording → editing → thumbnail → SEO → upload → analytics.",
        fa: "ویش سال‌ها توی تدوین و پست‌پروداکشن کار کرده. برای اون تدوین فقط بریدن قسمت‌های اضافی و گذاشتن موسیقی روی ویدیو نیست — ریتم، تایمینگ، افکت‌های بصری، ساند دیزاین، ترنزیشن، زوم، موشن و نگه داشتن توجه مخاطب همه بخشی از کارن. برای همین تولید محتوای ویش بیشتر شبیه یه Production Pipeline هست تا ضبط یه گیم‌پلی: ایده و اسکریپت → ضبط → تدوین → تامبنیل → سئو → آپلود → آنالیتیکس.",
      },
    },
    {
      id: 'thumbnail', emoji: '🖼️',
      keywords: { en: ['thumbnail', 'thumbnails'], fa: ['تامبنیل', 'تامنیل', 'تامبنیل‌ها'] },
      answer: {
        en: "Thumbnails are a big deal on the channel — and Waish makes them himself, using his 3D (Cinema 4D / Blender) and design skills: characters, scenes, lighting, composition. If a thumbnail performs well, he digs into why.",
        fa: "تامبنیل توی کانال خیلی مهمه — و ویش خودش می‌سازتشون، با مهارت سه‌بعدی (Cinema 4D / Blender) و طراحی: کاراکتر، صحنه، نورپردازی، ترکیب‌بندی. اگه یه تامبنیل خوب عمل کنه، بررسی می‌کنه چرا.",
      },
    },
    {
      id: 'project-management', emoji: '📋',
      keywords: { en: ['project management', 'manage', 'management', 'team', 'teams', 'leadership', 'manager', 'organize', 'scale'], fa: ['مدیریت پروژه', 'مدیریت', 'تیم', 'رهبری', 'سازماندهی', 'سازمان‌دهی', 'اسکیل'] },
      answer: {
        en: "Project management is one of the important parts of Waish's path. He's had management roles across projects and worked with teams that later reached real revenue and growth. So the question is never just 'what do I build myself?' — it's how to organize a team, turn an idea into a product, split the work, control quality, scale the project, and build a system that doesn't depend on one person. You can see that mindset in LunaMC and everything else.",
        fa: "مدیریت پروژه یکی از بخش‌های مهم مسیر ویشه. توی پروژه‌های مختلف نقش مدیریتی داشته و با تیم‌هایی کار کرده که بعداً به درآمد و رشد قابل‌توجهی رسیدن. برای همین سؤال فقط «خودم چی بسازم؟» نیست — سؤال اینه که چطور یه تیم رو سازمان‌دهی کنیم، یه ایده رو به محصول تبدیل کنیم، کارها رو تقسیم کنیم، کیفیت رو کنترل کنیم، پروژه رو Scale کنیم و سیستمی بسازیم که فقط به یه نفر وابسته نباشه. همین طرز فکر توی لونا ام‌سی و بقیهٔ پروژه‌ها هم دیده می‌شه.",
      },
    },
    {
      id: 'tech', emoji: '💻',
      keywords: { en: ['python', 'sql', 'mysql', 'database', 'databases', 'logic circuits', 'programming', 'coding', 'code', 'developer', 'technology', 'tech', 'ai', 'llm', 'llms', 'artificial intelligence', 'networking'], fa: ['پایتون', 'دیتابیس', 'پایگاه داده', 'مدار منطقی', 'برنامه نویسی', 'برنامه‌نویسی', 'کد', 'کدنویسی', 'تکنولوژی', 'هوش مصنوعی', 'ال ال ام', 'شبکه'] },
      answer: {
        en: "Alongside gaming and content, Waish has a serious interest in technology: networking and computer systems, Python, SQL/MySQL and databases, logic circuits, and AI / LLMs. Learning isn't limited to what pays — he wants to understand how things work. If a game lags, what's the network doing? If a server breaks, where exactly? If an anticheat misfires, what's the logic? If a video gets views, why? If a project earns, how do you grow it?",
        fa: "کنار گیمینگ و تولید محتوا، ویش علاقهٔ جدی به تکنولوژی داره: شبکه و سیستم‌های کامپیوتری، پایتون، SQL/MySQL و دیتابیس، مدارهای منطقی و هوش مصنوعی / LLMها. یادگیری براش محدود به چیزی که ازش درآمد داره نیست — می‌خواد بفهمه چیزها چطور کار می‌کنن. اگه بازی لگ داره، شبکه چه نقشی داره؟ اگه سرور مشکل داره، از کجاست؟ اگه آنتی‌چیت درست کار نمی‌کنه، منطقش چیه؟ اگه یه ویدیو ویو می‌گیره، چرا؟ اگه یه پروژه درآمد داره، چطور توسعه‌ش بدیم؟",
      },
    },
    {
      id: 'book', emoji: '📚',
      keywords: { en: ['book', 'writing a book', 'cs book', 'textbook'], fa: ['کتاب', 'کتاب آموزشی'] },
      answer: {
        en: "One of Waish's side ideas is writing an educational computer-science book — starting from basic computer concepts and going all the way to networking, Bluetooth, communications, antennas, AI and language models. This terminal's knowledge base is a small taste of that.",
        fa: "یکی از ایده‌های فکری ویش، نوشتن یه کتاب آموزشی دربارهٔ علوم کامپیوتره — از مفاهیم پایهٔ کامپیوتر شروع بشه و به شبکه، بلوتوث، ارتباطات، آنتن، هوش مصنوعی و مدل‌های زبانی برسه. پایگاه دانش همین ترمینال یه نمونهٔ کوچیک از همون ایده‌ست.",
      },
    },
    {
      id: 'analytics', emoji: '📊',
      keywords: { en: ['analytics', 'ctr', 'retention', 'rpm', 'watch time', 'seo', 'data driven', 'data-driven', 'views', 'revenue', 'income', 'monetization', 'algorithm'], fa: ['آنالیتیکس', 'آمار', 'بازدید', 'ویو', 'درآمد', 'پول', 'سئو', 'الگوریتم', 'کسب و کار', 'کسب‌وکار', 'بیزینس'] },
      answer: {
        en: "For Waish, YouTube isn't a place to upload videos — YouTube is itself a project. Title, thumbnail, CTR, retention, watch time, audience, search, suggested, homepage, upload schedule, even how a video sits on the channel page — all part of it. He follows analytics and learns from the data: if a thumbnail works, why; if a video outperforms, why; if revenue is low, what's affecting RPM. That data-driven view turned YouTube from a hobby into a real business.",
        fa: "برای ویش یوتیوب جایی برای آپلود ویدیو نیست — یوتیوب خودش یه پروژه‌ست. عنوان، تامبنیل، CTR، Retention، Watch Time، مخاطب، سرچ، Suggested، صفحهٔ اصلی، زمان‌بندی آپلود، حتی جای ویدیو توی صفحهٔ کانال — همه بخشی از این پروژه‌ن. آنالیتیکس رو دنبال می‌کنه و از داده یاد می‌گیره: اگه تامبنیل خوب کار کرد، چرا؛ اگه ویدیو بهتر از قبلی‌ها بود، چرا؛ اگه درآمد پایین بود، RPM و عواملش چیه. همین نگاه Data-Driven یوتیوب رو از یه سرگرمی به یه کسب‌وکار واقعی تبدیل کرد.",
      },
    },
    {
      id: 'future', emoji: '🚀',
      keywords: { en: ['future', 'plans', 'plan', 'english channel', 'international channel', 'new channel', 'goal', 'goals', 'roadmap', 'what next', 'whats next'], fa: ['آینده', 'برنامه', 'هدف', 'اهداف', 'کانال انگلیسی', 'کانال خارجی', 'کانال جدید', 'بعدش چی'] },
      answer: {
        en: "Waish built his identity in the Persian community, but the future isn't limited to one market. One plan is an English Minecraft channel to build an international community — not a replacement for the Persian Waish, which stays a main project, but a separate path into the global market and a different revenue stream. It starts with BedWars and can grow into Minecraft mechanics, theory, newer versions and more. The bigger goal: an independent, professional, scalable life where years of skills turn into real projects, real businesses, real income and more freedom.",
        fa: "ویش هویتش رو توی جامعهٔ فارسی ساخته، ولی نگاهش به آینده محدود به یه بازار نیست. یکی از برنامه‌هاش ساختن یه کانال ماینکرفت انگلیسیه برای یه کامیونیتی بین‌المللی — نه جایگزین ویش فارسی که همچنان پروژهٔ اصلی می‌مونه، بلکه یه مسیر جدا برای ورود به بازار جهانی و یه جریان درآمدی متفاوت. از BedWars شروع می‌شه و می‌تونه به مکانیک‌های ماینکرفت، تئوری، نسخه‌های جدیدتر و بیشتر گسترش پیدا کنه. هدف بزرگ‌تر: یه زندگی مستقل، حرفه‌ای و قابل توسعه که مهارت‌های سال‌ها جمع‌شده تبدیل بشن به پروژه‌های واقعی، کسب‌وکار واقعی، درآمد واقعی و آزادی عمل بیشتر.",
      },
    },
    {
      id: 'skills', emoji: '🧰',
      keywords: { en: ['skills', 'skill', 'expertise', 'experience', 'good at', 'what can waish do', 'what does waish do', 'abilities'], fa: ['مهارت', 'مهارت‌ها', 'مهارتها', 'تخصص', 'تجربه', 'چی بلده', 'چی بلدی', 'توانایی', 'ویش چیکار می‌کنه', 'ویش چیکاره'] },
      answer: {
        en: "Behind the name: Content Creation · YouTube · Minecraft · BedWars · Server Management · Project Management · Networking · AntiCheat & Security · 3D Modeling · Cinema 4D · Blender · Video Editing · Graphic Design · SEO · Community Building · Entrepreneurship. Ask about any of them.",
        fa: "پشت این اسم: تولید محتوا · یوتیوب · ماینکرفت · BedWars · مدیریت سرور · مدیریت پروژه · شبکه · آنتی‌چیت و امنیت · مدل‌سازی سه‌بعدی · Cinema 4D · Blender · تدوین ویدیو · طراحی گرافیک · سئو · ساخت کامیونیتی · کارآفرینی. دربارهٔ هر کدوم بپرس.",
      },
    },
    {
      id: 'community', emoji: '🫂',
      keywords: { en: ['community', 'audience', 'fans', 'viewers', 'players'], fa: ['کامیونیتی', 'جامعه', 'مخاطب', 'مخاطبا', 'طرفدار', 'بازیکنا', 'بازیکن‌ها'] },
      answer: {
        en: "Community is the point. Waish's channel and LunaMC were built to create a real community around what he makes — making BedWars something the Persian-speaking Minecraft scene takes seriously, and a server where players show up every night. Minecraft was never just a game for him: it was a place to learn, build, manage, test ideas and connect with players.",
        fa: "کامیونیتی اصل ماجراست. کانال ویش و لونا ام‌سی ساخته شدن تا یه کامیونیتی واقعی حول چیزی که می‌سازه شکل بگیره — BedWars رو توی جامعهٔ فارسی ماینکرفت جدی کنه و سروری بسازه که بازیکن‌ها هر شب آنلاینن. ماینکرفت براش هیچ‌وقت فقط یه بازی نبود: بستری بود برای یادگیری، ساختن، مدیریت کردن، آزمایش ایده‌ها و ارتباط با بازیکن‌ها.",
      },
    },
    {
      id: 'philosophy', emoji: '🔥',
      keywords: { en: ['philosophy', 'motto', 'mindset', 'building', 'builder', 'in one sentence', 'one sentence', 'summary', 'summarize', 'what drives', 'why do you'], fa: ['فلسفه', 'شعار', 'طرز فکر', 'ساختن', 'سازنده', 'یه جمله', 'یک جمله', 'خلاصه', 'انگیزه'] },
      answer: {
        en: "Put LunaMC, NairoShop, ClutchPing, YouTube, 3D, editing and project management side by side and they look unrelated — but they share one thing: building. Waish would rather make something than only consume it — a server, a community, a video, an animation, a website, a service, a system, or an idea that becomes a business. He started with Minecraft but didn't stop there. In one sentence: he started by playing Minecraft, and decided to build his own world instead of only playing inside someone else's. Waish isn't a finished project.",
        fa: "لونا ام‌سی، نایروشاپ، کلاچ‌پینگ، یوتیوب، سه‌بعدی، تدوین و مدیریت پروژه رو کنار هم بذاری، شاید بی‌ربط به نظر بیان — ولی یه وجه مشترک دارن: ساختن. ویش بیشتر از اینکه مصرف‌کنندهٔ تکنولوژی و سرگرمی باشه، دوست داره چیزی بسازه — یه سرور، یه کامیونیتی، یه ویدیو، یه انیمیشن، یه وبسایت، یه سرویس، یه سیستم، یا حتی یه ایده که بعداً بشه کسب‌وکار. از ماینکرفت شروع کرد، ولی توش متوقف نشد. توی یه جمله: از بازی کردن ماینکرفت شروع کرد، اما تصمیم گرفت به جای بازی توی یه دنیای ساخته‌شده، دنیای خودش رو بسازه. ویش یه پروژهٔ تمام‌شده نیست.",
      },
    },
    {
      id: 'learning', emoji: '🔍',
      keywords: { en: ['learn', 'learning', 'curious', 'curiosity', 'how things work', 'understand'], fa: ['یادگیری', 'یاد می‌گیره', 'یاد میگیره', 'کنجکاو', 'چطور کار می‌کنه', 'بفهمه'] },
      answer: {
        en: "Waish usually wants to know how things work. If a game lags, what's the network doing? If a server has a problem, where is it? If an anticheat isn't working right, what's the logic behind it? If a video gets views, why? And if a project makes money, how do you grow it? Learning isn't limited to what directly earns.",
        fa: "ویش معمولاً دوست داره بفهمه چیزها چطور کار می‌کنن. اگه بازی لگ داره، شبکه چه نقشی داره؟ اگه سرور مشکل داره، مشکل از کجاست؟ اگه آنتی‌چیت درست کار نمی‌کنه، منطق پشتش چیه؟ اگه یه ویدیو ویو می‌گیره، چرا؟ و اگه یه پروژه درآمد داره، چطور می‌شه توسعه‌ش داد؟ یادگیری براش محدود به چیزی که مستقیم ازش درآمد داره نیست.",
      },
    },
    {
      id: 'minecraft', emoji: '⛏️',
      keywords: { en: ['minecraft', 'why minecraft', 'started', 'how did you start', 'beginning', 'origin'], fa: ['ماینکرفت', 'ماین کرفت', 'چطور شروع کردی', 'شروع', 'از کجا شروع'] },
      answer: {
        en: "Everything started in Minecraft. Waish went from player → content creator → someone with a role in several parts of the ecosystem: the channel, LunaMC, tools like ClutchPing. Minecraft wasn't just a game — it was a platform for learning, building, managing, testing ideas and connecting with a community of players.",
        fa: "همه‌چیز از ماینکرفت شروع شد. ویش از بازیکن → کانتنت کریتور → کسی که توی چند بخش مختلف این اکوسیستم نقش داره رسید: کانال، لونا ام‌سی، ابزارهایی مثل کلاچ‌پینگ. ماینکرفت براش فقط یه بازی نبود — بستری بود برای یادگیری، ساختن، مدیریت کردن، آزمایش ایده‌ها و ارتباط با جامعه‌ای از بازیکن‌ها.",
      },
    },

    /* ---------- the website itself ---------- */
    {
      id: 'site', emoji: '🌐', title: { en: 'this site', fa: 'این سایت' },
      keywords: { en: ['this site', 'this website', 'the site', 'the website', 'waish.ir', 'waish ir', 'what is waish.ir', 'website', 'about this site', 'this page', 'what is this site', 'purpose of this site', 'why this site'], fa: ['این سایت', 'سایت', 'وبسایت', 'وب‌سایت', 'این وبسایت', 'waish.ir چیه', 'این صفحه', 'سایت ویش', 'هدف سایت', 'این سایت چیه'] },
      answer: {
        en: ["waish.ir is Waish's personal site: who he is, what he's built (LunaMC, ClutchPing, NairoShop), his content, his PC setup — and this computer, a little desktop simulator with apps, games, a music player and me, the terminal assistant.", "You're on Waish's site. Pages: Home, Projects, About Me (setup, packs, settings), Contact, Donate — and the Computer, where you are now. Everything is hand-built, no page builders."],
        fa: ["waish.ir سایت شخصی ویشه: کیه، چی ساخته (لونا ام‌سی، کلاچ‌پینگ، نایروشاپ)، محتواش، ستاپ کامپیوترش — و این کامپیوتر، یه شبیه‌ساز دسکتاپ کوچیک با برنامه‌ها، بازی‌ها، یه پخش‌کنندهٔ موزیک و من، دستیار ترمینال.", "توی سایت ویش هستی. صفحه‌ها: خانه، پروژه‌ها، درباره من (ستاپ، پک‌ها، تنظیمات)، تماس، حمایت — و کامپیوتر، همین‌جایی که الان هستی. همه‌چیز دست‌سازه، بدون صفحه‌ساز."],
      },
      more: { en: "The whole thing is plain HTML, CSS and JavaScript — no framework, no build step. The desktop, the windows, the terminal, the apps and this assistant are all hand-written files you could read in the browser's dev tools.", fa: "کل سایت HTML، CSS و جاوااسکریپت خالصه — بدون فریم‌ورک، بدون build. دسکتاپ، پنجره‌ها، ترمینال، برنامه‌ها و همین دستیار همه فایل‌های دست‌نویسن که می‌تونی توی dev tools مرورگر بخونی." },
    },
    {
      id: 'site-tech', emoji: '🛠️', title: { en: 'how the site is built', fa: 'ساخت سایت' },
      keywords: { en: ['how was this site made', 'how is this site built', 'how did you build this', 'built with', 'made with', 'tech stack', 'framework', 'react', 'vue', 'wordpress', 'what language is this site', 'source code', 'open source', 'github', 'code of this site', 'how is this made', 'who made this site', 'who built this site', 'who designed this', 'hosted', 'hosting', 'where is it hosted', 'server of this site'], fa: ['این سایت با چی ساخته شده', 'با چی ساخته', 'چطور ساخته شده', 'فریم‌ورک', 'فریمورک', 'ری‌اکت', 'ریکت', 'وردپرس', 'سورس کد', 'اوپن سورس', 'گیت‌هاب', 'گیتهاب', 'کد سایت', 'کی این سایت رو ساخته', 'سازندهٔ سایت', 'طراح سایت', 'هاست', 'کجا هاست شده', 'سرور سایت'] },
      answer: {
        en: ["Plain HTML, CSS and vanilla JavaScript — no React, no WordPress, no build tools. Waish wrote it himself. It's served from a small Linux server he manages, the same way he runs LunaMC. The desktop, windows, terminal, apps and this assistant are all hand-written.", "No framework at all. Every page is a static HTML file; the computer is one page with a little window manager in JavaScript. Fonts from Google Fonts, everything else self-hosted on Waish's own Linux box."],
        fa: ["HTML، CSS و جاوااسکریپت خالص — نه React، نه وردپرس، نه ابزار build. ویش خودش نوشته. از یه سرور لینوکسی کوچیک که خودش مدیریت می‌کنه سرو می‌شه، همون‌طوری که لونا ام‌سی رو می‌گردونه. دسکتاپ، پنجره‌ها، ترمینال، برنامه‌ها و همین دستیار همه دست‌نویسن.", "هیچ فریم‌ورکی نداره. هر صفحه یه فایل HTML استاتیکه؛ کامپیوتر یه صفحه‌ست با یه مدیر پنجرهٔ کوچیک توی جاوااسکریپت. فونت‌ها از Google Fonts، بقیه‌ش روی سرور لینوکسی خود ویش."],
      },
    },
    {
      id: 'pages', emoji: '🗂️', title: { en: 'the pages', fa: 'صفحه‌ها' },
      keywords: { en: ['pages', 'what pages', 'other pages', 'home page', 'main page', 'projects page', 'about me page', 'contact page', 'donate page', 'go home', 'back to site', 'navigate', 'menu', 'where am i', 'sitemap', 'site map'], fa: ['صفحه‌ها', 'صفحات', 'چه صفحه‌هایی', 'صفحه اصلی', 'صفحهٔ اصلی', 'صفحه پروژه‌ها', 'صفحه درباره من', 'صفحه تماس', 'صفحه حمایت', 'برگرد خونه', 'برگشت به سایت', 'منو', 'من کجام', 'کجای سایتم', 'نقشه سایت'] },
      answer: {
        en: ["The site has: Home (index) · Projects · About Me (setup, texture packs, settings) · Contact · Donate · and the Computer (this desktop). From here, /home takes you back to the main site, or use the start menu (bottom-left) → \"site\".", "You're inside the Computer. The other pages are Home, Projects, About Me, Contact and Donate — all reachable from the start menu at the bottom-left, or type /home."],
        fa: ["سایت این‌ها رو داره: خانه · پروژه‌ها · درباره من (ستاپ، تکسچر پک‌ها، تنظیمات) · تماس · حمایت · و کامپیوتر (همین دسکتاپ). از اینجا /home برت می‌گردونه به سایت اصلی، یا از منوی استارت (پایین) بخش «site».", "توی کامپیوتر هستی. صفحه‌های دیگه خانه، پروژه‌ها، درباره من، تماس و حمایت‌ان — همه از منوی استارت پایین صفحه، یا با /home."],
      },
    },
    {
      id: 'donate', emoji: '☕', title: { en: 'donating', fa: 'حمایت' },
      keywords: { en: ['donate', 'donation', 'support waish', 'support him', 'support you', 'buy coffee', 'coffee', 'coffeebede', 'tip', 'money', 'pay', 'how to support', 'patreon', 'fund', 'funding', 'give money', 'help financially', 'contribute'], fa: ['حمایت', 'دونیت', 'حمایت مالی', 'کمک مالی', 'قهوه', 'کافی‌بده', 'کافی بده', 'قهوه بخرم', 'پول بدم', 'چطور حمایت کنم', 'کمک کنم', 'پشتیبانی مالی'] },
      answer: {
        en: ["You can buy Waish a coffee on Coffeebede: coffeebede.com/waishchannel — every cup goes back into the servers, the videos and the tools on this site. The Donate page has the link. Can't donate? Joining the Discord and sharing the videos helps just as much.", "Donations go through Coffeebede (coffeebede.com/waishchannel) — it works with Iranian cards. There's a Donate page in the start menu. And honestly, a share or a Discord join counts too."],
        fa: ["می‌تونی توی کافی‌بده یه قهوه مهمونش کنی: coffeebede.com/waishchannel — هر فنجون برمی‌گرده به سرورها، ویدیوها و ابزارهای این سایت. صفحهٔ حمایت لینکش رو داره. نمی‌تونی حمایت مالی کنی؟ پیوستن به دیسکورد و به اشتراک گذاشتن ویدیوها همون‌قدر کمک می‌کنه.", "حمایت مالی از طریق کافی‌بده انجام می‌شه (coffeebede.com/waishchannel) — با کارت‌های ایرانی کار می‌کنه. صفحهٔ حمایت توی منوی استارته. و راستش، یه اشتراک‌گذاری یا عضویت توی دیسکورد هم حساب می‌شه."],
      },
    },
    {
      id: 'business', emoji: '🤝', title: { en: 'working with Waish', fa: 'همکاری با ویش' },
      keywords: { en: ['collab', 'collaboration', 'collaborate', 'work with', 'hire', 'hire you', 'hire waish', 'business', 'partnership', 'sponsor', 'sponsorship', 'advertise', 'advertising', 'promo', 'promotion', 'commission', 'freelance', 'job', 'work for you', 'can i join', 'join the team', 'staff', 'apply', 'recruit'], fa: ['همکاری', 'همکاری کنم', 'استخدام', 'کار با ویش', 'تبلیغ', 'تبلیغات', 'اسپانسر', 'اسپانسرشیپ', 'پروموشن', 'سفارش', 'فریلنس', 'شغل', 'عضو تیم', 'به تیم بپیوندم', 'استاف', 'استف', 'درخواست', 'می‌خوام استاف بشم', 'میخوام استاف بشم'] },
      answer: {
        en: ["For collaborations, sponsorships, ads, or joining the LunaMC team: open a ticket on the Discord server (discord.gg/8HVsMqucZ2) — that's the fastest way to reach Waish. Instagram DMs (@asunawaish) work too.", "Business stuff goes through Discord tickets — discord.gg/8HVsMqucZ2. Staff applications for LunaMC are handled there as well. Instagram DM is the backup: @asunawaish."],
        fa: ["برای همکاری، اسپانسرشیپ، تبلیغ یا پیوستن به تیم لونا ام‌سی: توی سرور دیسکورد تیکت بزن (discord.gg/8HVsMqucZ2) — سریع‌ترین راه رسیدن به ویشه. دایرکت اینستاگرام (@asunawaish) هم کار می‌کنه.", "کارهای بیزینسی از طریق تیکت دیسکورد — discord.gg/8HVsMqucZ2. درخواست استاف برای لونا ام‌سی هم همون‌جا بررسی می‌شه. دایرکت اینستاگرام هم راه دوم: @asunawaish."],
      },
    },
    {
      id: 'bug', emoji: '🐛', title: { en: 'bugs and feedback', fa: 'باگ و بازخورد' },
      keywords: { en: ['bug', 'found a bug', 'broken', 'not working', "doesn't work", 'doesnt work', 'error', 'glitch', 'feedback', 'suggestion', 'suggest', 'feature request', 'report', 'issue', 'problem with the site', 'something is wrong'], fa: ['باگ', 'باگ پیدا کردم', 'خرابه', 'کار نمی‌کنه', 'کار نمیکنه', 'ارور', 'خطا', 'گلیچ', 'بازخورد', 'پیشنهاد', 'پیشنهاد دارم', 'گزارش', 'مشکل', 'یه مشکلی هست', 'یه چیزی خرابه'] },
      answer: {
        en: ["Found something broken or have an idea? Tell Waish on Discord — open a ticket at discord.gg/8HVsMqucZ2 and say which page or app and what happened. Screenshots help a lot.", "Bug reports and suggestions: Discord ticket (discord.gg/8HVsMqucZ2) or Instagram DM (@asunawaish). Mention the page, the browser, and what you expected. If it's me being dumb, I'm sorry in advance 😅"],
        fa: ["یه چیز خراب پیدا کردی یا ایده داری؟ به ویش توی دیسکورد بگو — توی discord.gg/8HVsMqucZ2 تیکت بزن و بگو کدوم صفحه یا برنامه و چی شد. اسکرین‌شات خیلی کمک می‌کنه.", "گزارش باگ و پیشنهاد: تیکت دیسکورد (discord.gg/8HVsMqucZ2) یا دایرکت اینستاگرام (@asunawaish). صفحه، مرورگر و چیزی که انتظار داشتی رو بگو. اگه من خنگ بازی درآوردم، پیشاپیش ببخشید 😅"],
      },
    },
    {
      id: 'whats-new', emoji: '✨', title: { en: "what's new", fa: 'چی جدیده' },
      keywords: { en: ["what's new", 'whats new', 'new features', 'updates', 'changelog', 'latest', 'recently added', 'new apps', 'what changed', 'version'], fa: ['چی جدیده', 'چه خبر جدید', 'آپدیت', 'آپدیت‌ها', 'تغییرات', 'جدیدترین', 'تازه اضافه شده', 'برنامه‌های جدید', 'چی عوض شده', 'ورژن', 'نسخه'] },
      answer: {
        en: ["Recent additions to this computer: a Music app with 17 songs (streams instantly), a Recycle Bin you can drag icons into, movable desktop icons, a Projects folder, the User Lookup app (skins, Hypixel stats via Bordic, guilds via NetherAPI, Seraph + Urchin blacklists) and this assistant got a memory and a lot more answers.", "Newest things: Music app 🎵, Recycle Bin 🗑️, drag-and-drop icons, a Projects folder, and a smarter me (I remember your name now, do maths, and know the date). Refreshing the page resets the desktop layout."],
        fa: ["اضافه‌شده‌های اخیر این کامپیوتر: برنامهٔ موزیک با ۱۷ آهنگ (فوری استریم می‌شه)، سطل بازیافتی که می‌تونی آیکون‌ها رو توش بندازی، آیکون‌های قابل جابه‌جایی، پوشهٔ پروژه‌ها، برنامهٔ User Lookup (اسکین، آمار هایپیکسل از Bordic، گیلد از NetherAPI، بلک‌لیست Seraph و Urchin)، و این دستیار که حافظه و کلی جواب جدید گرفت.", "جدیدترین‌ها: برنامهٔ موزیک 🎵، سطل بازیافت 🗑️، کشیدن و رها کردن آیکون‌ها، پوشهٔ پروژه‌ها، و یه منِ باهوش‌تر (الان اسمت رو یادم می‌مونه، حساب می‌کنم و تاریخ رو می‌دونم). رفرش صفحه چیدمان دسکتاپ رو ریست می‌کنه."],
      },
    },

    /* ---------- the computer (desktop simulator) ---------- */
    {
      id: 'computer', emoji: '🖥️', title: { en: 'the computer', fa: 'کامپیوتر' },
      keywords: { en: ['the computer', 'this computer', 'computer page', 'desktop', 'this desktop', 'what is the computer', 'desktop simulator', 'fake computer', 'virtual computer', 'operating system', 'os', 'what os is this', 'is this windows', 'is this linux', 'web os', 'how do i use this', 'how does the computer work'], fa: ['کامپیوتر', 'این کامپیوتر', 'صفحه کامپیوتر', 'دسکتاپ', 'این دسکتاپ', 'کامپیوتر چیه', 'شبیه‌ساز دسکتاپ', 'کامپیوتر مجازی', 'سیستم عامل', 'این ویندوزه', 'این لینوکسه', 'چطور از این استفاده کنم', 'کامپیوتر چطور کار می‌کنه'] },
      answer: {
        en: ["This is a desktop simulator built into the site — not Windows, not Linux, just JavaScript. Icons open apps in draggable windows; the taskbar shows what's running; the start menu (bottom-left) lists every app and the site pages. Single-click everything.", "A fake little OS in your browser. Apps: Terminal (me), This PC, Projects folder, Social, About me, Music, Snake, Tetris, Mini Minecraft, Calculator, Calendar, User Lookup and a Recycle Bin. Windows can be dragged, resized, minimized and maximized — drag one to the top edge for fullscreen."],
        fa: ["این یه شبیه‌ساز دسکتاپه که توی سایت ساخته شده — نه ویندوز، نه لینوکس، فقط جاوااسکریپت. آیکون‌ها برنامه‌ها رو توی پنجره‌های قابل جابه‌جایی باز می‌کنن؛ تسک‌بار برنامه‌های در حال اجرا رو نشون می‌ده؛ منوی استارت (پایین) همهٔ برنامه‌ها و صفحه‌های سایت رو لیست می‌کنه. یه کلیک کافیه، دابل‌کلیک لازم نیست.", "یه سیستم‌عامل کوچیک تقلبی توی مرورگرت. برنامه‌ها: ترمینال (من)، This PC، پوشهٔ پروژه‌ها، Social، درباره من، موزیک، Snake، Tetris، ماینکرفت کوچیک، ماشین‌حساب، تقویم، User Lookup و سطل بازیافت. پنجره‌ها رو می‌شه کشید، تغییر اندازه داد، کوچیک و بزرگ کرد — یه پنجره رو تا لبهٔ بالا بکش تا تمام‌صفحه بشه."],
      },
      more: { en: ["Window tricks: drag by the title bar · drag to the top edge = fullscreen, pull it back down to restore · resize from the right/bottom edges or the corner · the green dot maximizes, yellow minimizes, red closes · double-click the title bar to maximize.", "Desktop tricks: drag icons anywhere on the grid · drop one on the Recycle Bin (or right-click → Move to Recycle Bin) · open the bin to restore · refresh the page and everything snaps back to default."], fa: ["ترفندهای پنجره: از نوار عنوان بکش · تا لبهٔ بالا بکش = تمام‌صفحه، بکش پایین تا برگرده · از لبه‌های راست/پایین یا گوشه تغییر اندازه بده · نقطهٔ سبز بزرگ می‌کنه، زرد کوچیک، قرمز می‌بنده · دابل‌کلیک روی نوار عنوان بزرگ می‌کنه.", "ترفندهای دسکتاپ: آیکون‌ها رو هر جای شبکه بکش · یکی رو بنداز روی سطل بازیافت (یا راست‌کلیک → انتقال به سطل) · سطل رو باز کن تا برگردونی · صفحه رو رفرش کن تا همه‌چیز به حالت پیش‌فرض برگرده."] },
    },
    {
      id: 'windows-howto', emoji: '🪟', title: { en: 'windows', fa: 'پنجره‌ها' },
      keywords: { en: ['drag window', 'move window', 'move the window', 'resize', 'resize window', 'fullscreen', 'full screen', 'maximize', 'maximise', 'minimize', 'minimise', 'close window', 'close the window', 'how to close', 'how do i close', 'green dot', 'red dot', 'yellow dot', 'the dots', 'title bar', 'window'], fa: ['پنجره رو بکشم', 'جابه‌جا کردن پنجره', 'پنجره رو جابجا', 'تغییر اندازه', 'ریسایز', 'تمام صفحه', 'تمام‌صفحه', 'فول اسکرین', 'بزرگ کردن پنجره', 'کوچیک کردن پنجره', 'بستن پنجره', 'چطور ببندم', 'نقطه سبز', 'نقطه قرمز', 'نقطه زرد', 'نوار عنوان', 'پنجره'] },
      answer: {
        en: ["Drag a window by its title bar. Drag it to the top edge for fullscreen, pull it back down to restore. Resize from the right edge, bottom edge or the corner. The three dots: red closes, yellow minimizes to the taskbar, green maximizes. Double-clicking the title bar also maximizes.", "Title bar = handle. Top edge = fullscreen. Edges/corner = resize. Red / yellow / green dots = close / minimize / maximize. Minimized windows live in the taskbar — click them to bring them back."],
        fa: ["پنجره رو از نوار عنوانش بکش. تا لبهٔ بالا بکش تا تمام‌صفحه بشه، بکش پایین تا برگرده. از لبهٔ راست، پایین یا گوشه تغییر اندازه بده. سه تا نقطه: قرمز می‌بنده، زرد به تسک‌بار کوچیک می‌کنه، سبز بزرگ می‌کنه. دابل‌کلیک روی نوار عنوان هم بزرگ می‌کنه.", "نوار عنوان = دستگیره. لبهٔ بالا = تمام‌صفحه. لبه‌ها/گوشه = تغییر اندازه. نقطه‌های قرمز / زرد / سبز = بستن / کوچیک کردن / بزرگ کردن. پنجره‌های کوچیک‌شده توی تسک‌بارن — روشون کلیک کن تا برگردن."],
      },
    },
    {
      id: 'icons-howto', emoji: '🧲', title: { en: 'desktop icons', fa: 'آیکون‌های دسکتاپ' },
      keywords: { en: ['move icons', 'move the icons', 'drag icons', 'drag icon', 'rearrange', 'arrange icons', 'icons', 'icon', 'reset desktop', 'reset layout', 'default layout', 'restore icons', 'icons back', 'right click', 'right-click', 'context menu', 'where did my icon go', 'lost an icon', 'missing icon'], fa: ['جابه‌جا کردن آیکون', 'آیکون رو بکشم', 'آیکون‌ها رو جابجا', 'آیکون', 'آیکون‌ها', 'آیکونا', 'چیدمان', 'ریست دسکتاپ', 'ریست چیدمان', 'چیدمان پیش‌فرض', 'آیکون‌ها برگردن', 'راست کلیک', 'راست‌کلیک', 'منوی راست‌کلیک', 'آیکونم کجا رفت', 'آیکون گم شده'] },
      answer: {
        en: ["Icons sit on a grid — press and drag one to any empty cell. Drop it on the Recycle Bin to remove it, or right-click → Move to Recycle Bin. Nothing is saved: refresh the page and the desktop goes back to the default layout with every icon restored.", "Drag them anywhere. Right-click an icon for Open / Move to Recycle Bin. Lost one? It's in the Recycle Bin (open it → Restore), or just refresh the page — the layout resets on every load."],
        fa: ["آیکون‌ها روی یه شبکه‌ان — یکی رو بگیر و بکش هر خونهٔ خالی. بندازش روی سطل بازیافت تا حذف بشه، یا راست‌کلیک → انتقال به سطل بازیافت. هیچی ذخیره نمی‌شه: صفحه رو رفرش کن تا دسکتاپ به چیدمان پیش‌فرض برگرده و همهٔ آیکون‌ها برگردن.", "هر جا خواستی بکششون. راست‌کلیک روی آیکون: باز کردن / انتقال به سطل بازیافت. یکی گم شده؟ توی سطل بازیافته (بازش کن → بازگردانی)، یا فقط صفحه رو رفرش کن — چیدمان با هر بار لود ریست می‌شه."],
      },
    },
    {
      id: 'recycle-bin', emoji: '🗑️', title: { en: 'the Recycle Bin', fa: 'سطل بازیافت' },
      keywords: { en: ['recycle bin', 'recycle', 'trash', 'bin', 'trash can', 'delete icon', 'delete app', 'remove icon', 'remove app', 'restore', 'empty bin', 'empty the bin', 'deleted', 'undo delete', 'get it back'], fa: ['سطل بازیافت', 'سطل', 'سطل آشغال', 'زباله', 'حذف آیکون', 'حذف برنامه', 'پاک کردن آیکون', 'بازگردانی', 'خالی کردن سطل', 'حذف شده', 'برگردونم', 'برش گردونم', 'پاک شد'] },
      answer: {
        en: ["The Recycle Bin is the icon at the end of the grid. Drag any desktop icon onto it (or right-click → Move to Recycle Bin) and it disappears from the desktop; the bin shows a red count. Open the bin to Restore one, Restore all, or Empty it. It's all temporary — a page refresh brings everything back.", "Drop icons on it to tidy your desktop. Open it to get them back. Nothing is permanent: refresh = factory reset. (You can't delete the bin itself — I tried.)"],
        fa: ["سطل بازیافت آیکون آخر شبکه‌ست. هر آیکون دسکتاپ رو روش بنداز (یا راست‌کلیک → انتقال به سطل بازیافت) تا از دسکتاپ بره؛ سطل یه شمارندهٔ قرمز نشون می‌ده. سطل رو باز کن تا یکی رو برگردونی، همه رو برگردونی، یا خالیش کنی. همه‌ش موقتیه — رفرش صفحه همه‌چیز رو برمی‌گردونه.", "آیکون‌ها رو روش بنداز تا دسکتاپت مرتب بشه. بازش کن تا برگردونی. هیچی دائمی نیست: رفرش = تنظیمات کارخونه. (خود سطل رو نمی‌شه حذف کرد — امتحان کردم.)"],
      },
    },
    {
      id: 'projects-folder', emoji: '📁', title: { en: 'the Projects folder', fa: 'پوشهٔ پروژه‌ها' },
      keywords: { en: ['projects folder', 'folder', 'the folder', 'where are the projects', 'where is lunamc icon', 'lunamc icon', 'clutchping icon', 'nairoshop icon', 'open projects', 'projects icon', 'all projects'], fa: ['پوشه پروژه‌ها', 'پوشهٔ پروژه‌ها', 'پوشه', 'فولدر', 'پروژه‌ها کجان', 'پروژه ها کجان', 'آیکون لونا', 'آیکون کلاچ‌پینگ', 'آیکون نایرو', 'باز کردن پروژه‌ها', 'آیکون پروژه‌ها', 'همه پروژه‌ها', 'همهٔ پروژه‌ها'] },
      answer: {
        en: ["The yellow Projects folder on the desktop holds LunaMC, ClutchPing, NairoShop and \"All projects\" (the full projects page). Click the folder, then click one. From here you can also type /open lunamc, /open clutchping, /open nairo or /open projects.", "Project icons live inside the Projects folder to keep the desktop clean. Open it → pick LunaMC, ClutchPing, NairoShop or All projects."],
        fa: ["پوشهٔ زرد «پروژه‌ها» روی دسکتاپ لونا ام‌سی، کلاچ‌پینگ، نایروشاپ و «همهٔ پروژه‌ها» (صفحهٔ کامل پروژه‌ها) رو داره. روی پوشه کلیک کن، بعد روی یکی. از اینجا هم می‌تونی بنویسی /open lunamc، /open clutchping، /open nairo یا /open projects.", "آیکون پروژه‌ها توی پوشهٔ پروژه‌هان تا دسکتاپ تمیز بمونه. بازش کن → لونا ام‌سی، کلاچ‌پینگ، نایروشاپ یا همهٔ پروژه‌ها رو انتخاب کن."],
      },
    },
    {
      id: 'this-pc', emoji: '💽', title: { en: 'This PC', fa: 'This PC' },
      keywords: { en: ['this pc', 'my computer', 'explorer', 'file explorer', 'drives', 'drive', 'c drive', 'gallery', 'files', 'folders', 'what is in this pc', 'what is this pc', 'pictures', 'photos', 'images'], fa: ['this pc', 'مای کامپیوتر', 'اکسپلورر', 'فایل اکسپلورر', 'درایوها', 'درایو', 'درایو c', 'گالری', 'فایل‌ها', 'فایلا', 'پوشه‌ها', 'توی this pc چیه', 'عکس‌ها', 'عکسا', 'تصاویر'] },
      answer: {
        en: ["This PC is the file explorer — the icon at the top-left, also pinned in the taskbar. Drives: C: Gallery (photos of the setup, LunaMC art, Waish's avatar — click to view), D: Useful apps (Calculator, Calendar, User Lookup, Music + the tools he uses), G: Games (Snake, Tetris, Mini Minecraft), F: Editing (his 3D/editing folders), H: Videos (channel links).", "Top-left icon, or the pinned button in the taskbar. It's a little explorer with drives: Gallery, Useful apps, Games, Editing and Videos. Pictures open in a viewer; apps open in windows; readme.txt files show notes."],
        fa: ["This PC فایل‌اکسپلوررِ اینجاست — آیکون بالا-چپ، توی تسک‌بار هم پین شده. درایوها: C: گالری (عکس‌های ستاپ، آرت لونا ام‌سی، آواتار ویش — کلیک کن ببینی)، D: برنامه‌های مفید (ماشین‌حساب، تقویم، User Lookup، موزیک + ابزارهایی که استفاده می‌کنه)، G: بازی‌ها (Snake، Tetris، ماینکرفت کوچیک)، F: تدوین (پوشه‌های سه‌بعدی/تدوینش)، H: ویدیوها (لینک کانال‌ها).", "آیکون بالا-چپ، یا دکمهٔ پین‌شده توی تسک‌بار. یه اکسپلورر کوچیکه با درایوهای گالری، برنامه‌های مفید، بازی‌ها، تدوین و ویدیوها. عکس‌ها توی نمایشگر باز می‌شن؛ برنامه‌ها توی پنجره؛ فایل‌های readme.txt یادداشت نشون می‌دن."],
      },
    },
    {
      id: 'start-menu', emoji: '🔴', title: { en: 'the start menu', fa: 'منوی استارت' },
      keywords: { en: ['start menu', 'start button', 'the start', 'waish.ir button', 'taskbar', 'task bar', 'bottom bar', 'bottom left', 'pinned', 'running apps', 'open apps list'], fa: ['منوی استارت', 'استارت', 'دکمه استارت', 'دکمهٔ استارت', 'تسک‌بار', 'تسکبار', 'نوار پایین', 'پایین چپ', 'پین شده', 'برنامه‌های باز', 'برنامه های در حال اجرا'] },
      answer: {
        en: ["The red waish.ir button at the bottom-left is the start menu: every app on this computer, plus links to the site pages (Home, Projects, About me, Contact). The taskbar next to it shows This PC (pinned) and every open window — click one to focus or minimize it. On the right: the language toggle and the clock (Iran time, Jalali + Gregorian date).", "Bottom-left = start menu (all apps + site pages). Middle = open windows. Right = EN/فا toggle and the clock in Iran time."],
        fa: ["دکمهٔ قرمز waish.ir پایین-چپ منوی استارته: همهٔ برنامه‌های این کامپیوتر، به‌علاوهٔ لینک صفحه‌های سایت (خانه، پروژه‌ها، درباره من، تماس). تسک‌بار کنارش This PC (پین‌شده) و همهٔ پنجره‌های باز رو نشون می‌ده — روی یکی کلیک کن تا فوکوس یا کوچیک بشه. سمت دیگه: دکمهٔ زبان و ساعت (ساعت ایران، تاریخ شمسی + میلادی).", "پایین = منوی استارت (همهٔ برنامه‌ها + صفحه‌های سایت). وسط = پنجره‌های باز. اون طرف = دکمهٔ EN/فا و ساعت به وقت ایران."],
      },
    },
    {
      id: 'clock', emoji: '🕰️', title: { en: 'the clock', fa: 'ساعت' },
      keywords: { en: ['the clock', 'taskbar clock', 'iran time', 'tehran time', 'irst', 'timezone', 'time zone', 'what timezone', 'jalali', 'shamsi', 'persian calendar', 'iranian calendar', 'persian date', 'shahrivar', 'what year is it in iran'], fa: ['ساعت تسک‌بار', 'ساعت ایران', 'ساعت تهران', 'منطقه زمانی', 'تایم زون', 'تقویم شمسی', 'شمسی', 'جلالی', 'تاریخ شمسی', 'تقویم ایرانی', 'سال شمسی', 'سال چنده'] },
      answer: {
        en: ["The taskbar clock shows Iran Standard Time (UTC+3:30) — Waish's time — with the Jalali (Iranian) date and the Gregorian date under it. Hover it for the full dates. Today in the Iranian calendar: {jdate}. Ask me \"what time is it\" for your own local time.", "That's Tehran time, UTC+3:30, plus both calendars. Right now it's {jdate} on the Iranian calendar. The Calendar app shows a full month in both systems."],
        fa: ["ساعت تسک‌بار، ساعت رسمی ایران (UTC+3:30) — ساعت ویش — رو با تاریخ شمسی و میلادی زیرش نشون می‌ده. موس رو روش نگه دار تا تاریخ کامل رو ببینی. امروز: {jdate}. بپرس «ساعت چنده» تا ساعت محلی خودت رو بگم.", "اون ساعت تهرانه، UTC+3:30، با هر دو تقویم. الان {jdate} هست. برنامهٔ تقویم یه ماه کامل رو توی هر دو سیستم نشون می‌ده."],
      },
    },
    {
      id: 'terminal-app', emoji: '➜', title: { en: 'the terminal', fa: 'ترمینال' },
      keywords: { en: ['terminal', 'this terminal', 'the terminal', 'console', 'shell', 'command line', 'cli', 'how does the terminal work', 'what is this terminal', 'bash', 'is this a real terminal', 'real shell', 'can i run commands', 'ls', 'cd', 'sudo', 'rm -rf', 'neofetch', 'pwd', 'whoami', 'echo'], fa: ['ترمینال', 'این ترمینال', 'کنسول', 'شل', 'خط فرمان', 'ترمینال چطور کار می‌کنه', 'این ترمینال چیه', 'ترمینال واقعیه', 'واقعیه این', 'می‌تونم دستور اجرا کنم', 'دستور لینوکس'] },
      answer: {
        en: ["It looks like a shell but it isn't one — no Linux behind it, nothing to hack. Two things happen here: /commands (see /help) run little site functions, and everything else is a question for me, matched against a hand-written knowledge base. Waish built it by hand and keeps adding to it.", "Not a real shell — ls, cd and sudo won't do anything (sorry, rm -rf fans). It's a handmade terminal: slash-commands for the site, plus me for questions, in English or Persian. Type /help.", "A fake terminal with a real personality. Commands start with /; questions don't. I run offline in your browser and remember your name between visits."],
        fa: ["شبیه شله ولی شل نیست — لینوکسی پشتش نیست، چیزی برای هک کردن نیست. دو تا چیز اینجا اتفاق می‌افته: /دستورها (ببین /help) توابع کوچیک سایت رو اجرا می‌کنن، و بقیه‌ش سؤال برای منه که با یه پایگاه دانش دست‌نویس تطبیق داده می‌شه. ویش با دست ساختتش و هی بهش اضافه می‌کنه.", "شل واقعی نیست — ls و cd و sudo کاری نمی‌کنن (ببخشید طرفدارهای rm -rf). یه ترمینال دست‌سازه: دستورهای اسلش‌دار برای سایت، به‌علاوهٔ من برای سؤال‌ها، فارسی یا انگلیسی. /help رو بزن.", "یه ترمینال تقلبی با شخصیت واقعی. دستورها با / شروع می‌شن؛ سؤال‌ها نه. آفلاین توی مرورگرت اجرا می‌شم و اسمت رو بین بازدیدها یادم می‌مونه."],
      },
    },
    {
      id: 'memory', emoji: '🧠', title: { en: 'my memory', fa: 'حافظه‌م' },
      keywords: { en: ['memory', 'do you remember', 'can you remember', 'remember things', 'what do you remember', 'do you have memory', 'do you save', 'do you store', 'privacy', 'my data', 'tracking', 'cookies', 'do you track', 'what do you know about me', 'how do you know my name'], fa: ['حافظه', 'یادت می‌مونه', 'یادت میمونه', 'یادت هست', 'حافظه داری', 'ذخیره می‌کنی', 'ذخیره میکنی', 'حریم خصوصی', 'اطلاعات من', 'دیتای من', 'ردیابی', 'کوکی', 'دربارهٔ من چی می‌دونی', 'درباره من چی میدونی', 'اسممو از کجا می‌دونی', 'اسممو از کجا میدونی'] },
      answer: {
        en: ["I remember a few things, all inside your own browser (localStorage), nothing sent anywhere: your name if you tell me, how many times you've opened this computer, what topics you asked about, and the last topic so \"tell me more\" works. Say \"forget me\" and it's all wiped.", "What I know about you{name,}: {visits} visit(s), and whatever name you gave me. That's it — it lives in your browser only; Waish never sees it. \"forget me\" clears everything."],
        fa: ["چند تا چیز یادم می‌مونه، همه توی مرورگر خودت (localStorage)، هیچی جایی فرستاده نمی‌شه: اسمت اگه بگی، چند بار این کامپیوتر رو باز کردی، دربارهٔ چه موضوع‌هایی پرسیدی، و آخرین موضوع تا «بیشتر بگو» کار کنه. بگو «فراموشم کن» تا همه‌ش پاک بشه.", "چیزی که دربارهٔ تو می‌دونم{name,}: {visits} بازدید، و اسمی که بهم دادی. همین — فقط توی مرورگر خودته؛ ویش هیچ‌وقت نمی‌بینتش. «فراموشم کن» همه‌چیز رو پاک می‌کنه."],
      },
    },
    {
      id: 'apps-list', emoji: '📦', title: { en: 'the apps', fa: 'برنامه‌ها' },
      keywords: { en: ['apps', 'what apps', 'which apps', 'list apps', 'applications', 'programs', 'what programs', 'what can i open', 'what is on this computer', 'how to open', 'how do i open', 'open an app', 'launch'], fa: ['برنامه‌ها', 'برنامه ها', 'چه برنامه‌هایی', 'چه برنامه هایی', 'لیست برنامه‌ها', 'اپ‌ها', 'اپا', 'چی می‌تونم باز کنم', 'چی میتونم باز کنم', 'روی این کامپیوتر چی هست', 'چطور باز کنم', 'باز کردن برنامه', 'اجرا'] },
      answer: {
        en: ["On this computer: Terminal (me) · This PC (files) · Projects folder (LunaMC, ClutchPing, NairoShop) · Social · About me · Music 🎵 · Snake 🐍 · Tetris 🧱 · Mini Minecraft ⛏️ · Calculator · Calendar (Jalali + Gregorian) · User Lookup 🔍 (Minecraft skins, Hypixel stats, guilds, Seraph, Urchin) · Skin Editor 🎨 · Recycle Bin. Click an icon, use the start menu, or type /open <name> — /apps lists the ids.", "Click any desktop icon, or type /open music, /open snake, /open userlookup, /open calendar… /apps shows every id. The start menu at the bottom-left has them all too."],
        fa: ["روی این کامپیوتر: ترمینال (من) · This PC (فایل‌ها) · پوشهٔ پروژه‌ها (لونا ام‌سی، کلاچ‌پینگ، نایروشاپ) · Social · درباره من · موزیک 🎵 · Snake 🐍 · Tetris 🧱 · ماینکرفت کوچیک ⛏️ · ماشین‌حساب · تقویم (شمسی + میلادی) · User Lookup 🔍 (اسکین ماینکرفت، آمار هایپیکسل، گیلد، Seraph، Urchin) · ویرایشگر اسکین 🎨 · سطل بازیافت. روی آیکون کلیک کن، از منوی استارت استفاده کن، یا بنویس /open <name> — /apps آیدی‌ها رو نشون می‌ده.", "روی هر آیکون دسکتاپ کلیک کن، یا بنویس /open music، /open snake، /open userlookup، /open calendar… /apps همهٔ آیدی‌ها رو نشون می‌ده. منوی استارت پایین هم همه رو داره."],
      },
    },
    {
      id: 'music', emoji: '🎵', title: { en: 'the Music app', fa: 'برنامهٔ موزیک' },
      keywords: { en: ['music', 'music app', 'music player', 'play music', 'play a song', 'play song', 'songs', 'song', 'playlist', 'mp3', 'listen', 'audio player', 'player', 'what songs', 'which songs', 'what music', 'how do i play music', 'volume', 'pause', 'shuffle', 'repeat', 'next song', 'skip song', 'spotify', 'soundcloud'], fa: ['موزیک', 'موسیقی', 'آهنگ', 'آهنگ‌ها', 'آهنگا', 'پخش موزیک', 'پخش آهنگ', 'موزیک پخش کن', 'آهنگ پخش کن', 'پلی‌لیست', 'پلی لیست', 'ام‌پی‌تری', 'گوش بدم', 'پلیر', 'موزیک پلیر', 'چه آهنگایی', 'چه آهنگ‌هایی', 'چطور موزیک پخش کنم', 'صدا', 'ولوم', 'پاز', 'شافل', 'تکرار', 'آهنگ بعدی', 'اسپاتیفای'] },
      answer: {
        en: ["The Music app (pink icon 🎵, or /open music) plays 17 songs from Waish's playlist — Coldplay, Eminem, Kendrick Lamar, 2Pac, EDEN, Clairo, Faouzia, XXXTENTACION, Ebi, Shayea and more. Click a song to play; it streams instantly, no waiting. Buttons: play/pause, stop, previous, next, shuffle, repeat, volume + mute, and a seek bar you can drag anywhere.", "Open Music from the desktop or type /open music. Pick a song from the list and it starts right away. Keyboard: Space = play/pause · ← → = seek 5 s · Shift+← → = previous/next song · ↑ ↓ = volume. The playlist has 17 tracks, English and Persian."],
        fa: ["برنامهٔ موزیک (آیکون صورتی 🎵، یا /open music) ۱۷ آهنگ از پلی‌لیست ویش رو پخش می‌کنه — Coldplay، Eminem، Kendrick Lamar، 2Pac، EDEN، Clairo، Faouzia، XXXTENTACION، ابی، شایع و بیشتر. روی یه آهنگ کلیک کن؛ فوری استریم می‌شه، بدون انتظار. دکمه‌ها: پخش/مکث، توقف، قبلی، بعدی، شافل، تکرار، صدا + بی‌صدا، و یه نوار پیشرفت که هر جا خواستی بکش.", "موزیک رو از دسکتاپ باز کن یا بنویس /open music. یه آهنگ از لیست انتخاب کن تا همون لحظه شروع بشه. کیبورد: Space = پخش/مکث · ← → = ۵ ثانیه جلو/عقب · Shift+← → = آهنگ قبلی/بعدی · ↑ ↓ = صدا. پلی‌لیست ۱۷ تا آهنگ داره، انگلیسی و فارسی."],
      },
      more: { en: "The full list: 2Pac – All Eyez On Me · Artist Vs Poet – Kids Again · Clairo – Sofia · Coldplay – Viva La Vida · EDEN – drugs · Ebi – Gheseh Eshgh · Eminem – Mockingbird · EsDeeKid – LV Sandals · Faouzia – UNETHICAL · Fit For A King – Witness The End · Kendrick Lamar – Not Like Us · Malcolm Todd – Roommates · Shayea – Asabani · Tristam & Braken – Frame of Mind · XXXTENTACION – Triumph · wenszy & Mymy – tell me · Ūla – Futon.", fa: "لیست کامل: 2Pac – All Eyez On Me · Artist Vs Poet – Kids Again · Clairo – Sofia · Coldplay – Viva La Vida · EDEN – drugs · ابی – قصهٔ عشق · Eminem – Mockingbird · EsDeeKid – LV Sandals · Faouzia – UNETHICAL · Fit For A King – Witness The End · Kendrick Lamar – Not Like Us · Malcolm Todd – Roommates · شایع – عصبانی · Tristam & Braken – Frame of Mind · XXXTENTACION – Triumph · wenszy & Mymy – tell me · Ūla – Futon." },
    },
    {
      id: 'favourite-song', emoji: '🎧', title: { en: 'favourite music', fa: 'موزیک مورد علاقه' },
      keywords: { en: ['favourite song', 'favorite song', 'favourite music', 'favorite music', 'favourite artist', 'favorite artist', 'what music does he like', 'what does waish listen to', 'his music taste', 'music taste', 'best song', 'recommend a song', 'song recommendation', 'what should i listen to'], fa: ['آهنگ مورد علاقه', 'آهنگ مورد علاقش', 'موزیک مورد علاقه', 'خواننده مورد علاقه', 'خوانندهٔ مورد علاقه', 'چه موزیکی گوش می‌ده', 'چه موزیکی گوش میده', 'سلیقه موسیقی', 'بهترین آهنگ', 'یه آهنگ پیشنهاد بده', 'چی گوش بدم'] },
      answer: {
        en: ["His taste is all over the place, in a good way: rap (Eminem, Kendrick, 2Pac, XXXTENTACION), alt/indie (EDEN, Clairo, Malcolm Todd), pop (Coldplay, Faouzia), metalcore (Fit For A King), and Persian — Ebi and Shayea. The Music app is literally his playlist; start with Viva La Vida or Frame of Mind.", "Try the Music app — it's his actual playlist. If you want one: Tristam & Braken – Frame of Mind for gaming, Coldplay – Viva La Vida for everything else, Ebi – Gheseh Eshgh for the Persian classic."],
        fa: ["سلیقه‌ش همه‌جوره، به معنای خوبش: رپ (Eminem، Kendrick، 2Pac، XXXTENTACION)، آلترناتیو/ایندی (EDEN، Clairo، Malcolm Todd)، پاپ (Coldplay، Faouzia)، متال‌کور (Fit For A King)، و فارسی — ابی و شایع. برنامهٔ موزیک دقیقاً پلی‌لیست خودشه؛ با Viva La Vida یا Frame of Mind شروع کن.", "برنامهٔ موزیک رو امتحان کن — پلی‌لیست واقعی خودشه. اگه یکی می‌خوای: Tristam & Braken – Frame of Mind برای گیم، Coldplay – Viva La Vida برای بقیهٔ وقت‌ها، ابی – قصهٔ عشق برای کلاسیک فارسی."],
      },
    },
    {
      id: 'user-lookup', emoji: '🔍', title: { en: 'User Lookup', fa: 'User Lookup' },
      keywords: { en: ['user lookup', 'lookup', 'look up a player', 'lookup a player', 'player lookup', 'search player', 'find a player', 'check a player', 'minecraft player', 'player stats', 'bedwars stats', 'hypixel stats', 'check stats', 'stats', 'uuid', 'name history', 'guild lookup', 'guild', 'skin viewer', '3d skin', 'seraph', 'urchin', 'bordic', 'blacklist', 'sniper', 'cheater check', 'is he a cheater', 'is he blacklisted', 'netherapi', 'nether api', 'hypixel api'], fa: ['user lookup', 'یوزر لوکاپ', 'لوکاپ', 'جستجوی بازیکن', 'جستجوی پلیر', 'بازیکن رو چک کن', 'پلیر رو چک کن', 'آمار بازیکن', 'آمار بدوارز', 'آمار هایپیکسل', 'استتس', 'استت', 'آمار', 'یوآیدی', 'تاریخچه اسم', 'جستجوی گیلد', 'گیلد', 'نمایش اسکین', 'اسکین سه‌بعدی', 'سراف', 'آرچین', 'بوردیک', 'بلک‌لیست', 'بلک لیست', 'اسنایپر', 'چیتره', 'چیت میزنه', 'چیت می‌زنه', 'بلک‌لیسته', 'بلک لیسته'] },
      answer: {
        en: ["User Lookup (🔍, or /open userlookup) takes a Minecraft username or UUID and shows: the skin in 3D (drag to rotate), model type, cape, UUID; Hypixel rank, network level, BedWars / SkyWars / Duels stats from Bordic's cache; the player's guild and its tag; and whether Seraph or Urchin has them blacklisted. Two tabs: User Lookup and Guild Lookup (by guild name or player). Editing or previewing your own skin file moved to the Skin Editor app.", "Type a name → skin, stats, guild, blacklist status, all in one window. For a quick blacklist-only answer, type /check <name> right here in the terminal. Data sources: Mojang for names/skins/capes, Bordic for Hypixel stats, NetherAPI for guilds, Seraph and Urchin for the blacklists. Waish is on the Seraph council, so that part matters to him."],
        fa: ["User Lookup (🔍، یا /open userlookup) یه یوزرنیم یا UUID ماینکرفت می‌گیره و نشون می‌ده: اسکین سه‌بعدی (بکش تا بچرخه)، نوع مدل، شنل، UUID؛ رنک هایپیکسل، لول شبکه، آمار بدوارز / اسکای‌وارز / دوئل از کش Bordic؛ گیلد بازیکن و تگش؛ و اینکه Seraph یا Urchin بلک‌لیستش کرده یا نه. دو تا تب: User Lookup و Guild Lookup (با اسم گیلد یا بازیکن). ویرایش یا پیش‌نمایش فایل اسکین خودت رفته توی برنامهٔ ویرایشگر اسکین.", "یه اسم بنویس → اسکین، آمار، گیلد، وضعیت بلک‌لیست، همه توی یه پنجره. برای یه جواب سریع فقط دربارهٔ بلک‌لیست، همین‌جا توی ترمینال بنویس /check <name>. منابع: Mojang برای اسم/اسکین/شنل، Bordic برای آمار هایپیکسل، NetherAPI برای گیلد، Seraph و Urchin برای بلک‌لیست. ویش عضو شورای Seraph هست، برای همین اون بخش براش مهمه."],
      },
      more: { en: ["Seraph is a community blacklist for Hypixel: players reported and verified as cheaters, plus \"caution\" tags. Urchin is another cheater blacklist with the same idea (its tags come from urchin.gg's community and reviewers). Bordic is an anti-sniper service — it flags accounts that stream-snipe or target specific players. Both are checked by UUID, so name changes don't hide anyone.", "Stats freshness: Bordic only refreshes a player when one of its users meets them in a lobby, so the \"UPDATED\" date under the Hypixel box tells you how old the numbers are. Skins and names always come straight from Mojang, so they're live."], fa: ["Seraph یه بلک‌لیست کامیونیتی برای هایپیکسله: بازیکن‌هایی که به‌عنوان چیتر گزارش و تأیید شدن، به‌علاوهٔ تگ‌های «احتیاط». Urchin هم یه بلک‌لیست چیتر دیگه با همون ایده‌ست (تگ‌هاش از کامیونیتی و بررسی‌کننده‌های urchin.gg میاد). Bordic یه سرویس ضد اسنایپره — اکانت‌هایی که استریم‌اسنایپ می‌کنن یا بازیکن خاصی رو هدف می‌گیرن رو علامت می‌زنه. هر دو با UUID چک می‌شن، پس تغییر اسم کسی رو مخفی نمی‌کنه.", "تازگی آمار: Bordic فقط وقتی یه بازیکن رو آپدیت می‌کنه که یکی از کاربرهاش توی لابی ببینتش، پس تاریخ «UPDATED» زیر باکس هایپیکسل می‌گه اعداد چقدر قدیمی‌ان. اسکین و اسم همیشه مستقیم از Mojang میان، پس زنده‌ان."] },
    },
    {
      id: 'skin-editor', emoji: '🎨', title: { en: 'the Skin Editor', fa: 'ویرایشگر اسکین' },
      keywords: { en: ['skin editor', 'skin lookup', 'skin viewer', 'view skin', 'my skin', 'upload skin', 'upload my skin', 'preview skin', 'skin preview', 'skin png', 'steve', 'alex', 'slim model', 'classic model', 'download skin', 'see a skin', 'check skin', 'change skin', 'edit skin', 'edit my skin', 'make a skin', 'draw a skin', 'paint skin', 'skin maker', 'pixel art'], fa: ['skin editor', 'ویرایشگر اسکین', 'ویرایش اسکین', 'اسکین بسازم', 'اسکین درست کنم', 'نقاشی اسکین', 'skin lookup', 'نمایش اسکین', 'اسکین رو ببینم', 'اسکینم', 'آپلود اسکین', 'اسکینمو آپلود', 'پیش‌نمایش اسکین', 'پیش نمایش اسکین', 'اسکین png', 'استیو', 'الکس', 'مدل باریک', 'مدل کلاسیک', 'دانلود اسکین', 'یه اسکین ببینم', 'چک اسکین', 'اسکین عوض کنم'] },
      answer: {
        en: ["The Skin Editor (🎨, or /open skin) is a little paint program for Minecraft skins: the 64×64 texture on the left with every part outlined (head, hat, body, jacket, arms, sleeves, legs, pants), a live 3D preview on the right. Pencil, eraser, bucket fill (stays inside the face you click), colour picker, brush sizes, undo/redo, a palette and your recent colours. Upload your own PNG, drop one onto the window, or type a player's name to pull their current skin. Classic (Steve) and slim (Alex) arms, animations, and Download PNG saves the file.", "Open the Skin Editor → upload a PNG or load a player by name, paint on the texture, watch it on the 3D model, then Download PNG. Old 64×32 skins are converted automatically. From User Lookup, 'Edit skin' sends that player's skin straight into the editor."],
        fa: ["ویرایشگر اسکین (🎨، یا /open skin) یه برنامهٔ نقاشی کوچیک برای اسکین ماینکرفته: تکسچر ۶۴×۶۴ سمت چپ با خط دور همهٔ قسمت‌ها (سر، کلاه، بدن، ژاکت، دست‌ها، آستین‌ها، پاها، شلوار)، و پیش‌نمایش زندهٔ سه‌بعدی سمت راست. مداد، پاک‌کن، سطل رنگ (فقط داخل همون وجهی که کلیک کردی)، قطره‌چکان، اندازهٔ قلم، برگشت/جلو، پالت و رنگ‌های اخیرت. PNG خودت رو آپلود کن، بنداز روی پنجره، یا اسم یه بازیکن رو بنویس تا اسکین فعلیش رو بگیره. دست کلاسیک (Steve) و باریک (Alex)، انیمیشن، و Download PNG فایل رو ذخیره می‌کنه.", "ویرایشگر اسکین رو باز کن → PNG آپلود کن یا یه بازیکن رو با اسم لود کن، روی تکسچر نقاشی کن، روی مدل سه‌بعدی ببینش، بعد Download PNG. اسکین‌های قدیمی ۶۴×۳۲ خودکار تبدیل می‌شن. از توی User Lookup هم «ویرایش اسکین» اسکین اون بازیکن رو مستقیم می‌فرسته توی ویرایشگر."],
      },
    },
    {
      id: 'calculator', emoji: '🧮', title: { en: 'the Calculator', fa: 'ماشین‌حساب' },
      keywords: { en: ['calculator', 'calc', 'calculate', 'do maths', 'do math', 'can you do math', 'can you calculate'], fa: ['ماشین حساب', 'ماشین‌حساب', 'حساب کن', 'محاسبه', 'حساب بلدی', 'ریاضی بلدی', 'حساب کتاب'] },
      answer: {
        en: ["There's a Calculator app on the desktop (or /open calculator) with history. I can also do quick maths right here — try \"12*8\", \"(3+4)/2\", \"2^10\" or \"15% of 80\".", "Two options: the Calculator app, or just type the expression to me. 144/12? 2^8? 20% of 350? Go on."],
        fa: ["یه برنامهٔ ماشین‌حساب روی دسکتاپ هست (یا /open calculator) با تاریخچه. خودم هم همین‌جا حساب سریع بلدم — امتحان کن «12*8»، «(3+4)/2»، «2^10» یا «15 درصد از 80».", "دو تا راه: برنامهٔ ماشین‌حساب، یا عبارت رو به خودم بگو. 144/12؟ 2^8؟ 20 درصد از 350؟ بگو."],
      },
    },
    {
      id: 'calendar', emoji: '📅', title: { en: 'the Calendar', fa: 'تقویم' },
      keywords: { en: ['calendar', 'calendar app', 'holidays', 'nowruz', 'what month', 'which month', 'month', 'week', 'leap year', 'convert date', 'date converter', 'gregorian to jalali', 'jalali to gregorian'], fa: ['تقویم', 'برنامه تقویم', 'برنامهٔ تقویم', 'تعطیلات', 'نوروز', 'چه ماهیه', 'کدوم ماه', 'ماه', 'هفته', 'سال کبیسه', 'تبدیل تاریخ', 'مبدل تاریخ', 'میلادی به شمسی', 'شمسی به میلادی'] },
      answer: {
        en: ["The Calendar app (/open calendar) shows the month in both the Iranian (Jalali) and Gregorian calendars side by side, with today highlighted — handy for converting dates. Today is {jdate} / {date}.", "Open the Calendar from the desktop: Jalali and Gregorian together, flip months with the arrows. Right now: {jdate}."],
        fa: ["برنامهٔ تقویم (/open calendar) ماه رو توی تقویم شمسی و میلادی کنار هم نشون می‌ده، با امروز هایلایت‌شده — برای تبدیل تاریخ به درد می‌خوره. امروز {jdate} / {date}.", "تقویم رو از دسکتاپ باز کن: شمسی و میلادی با هم، با فلش‌ها ماه‌ها رو ورق بزن. الان: {jdate}."],
      },
    },
    {
      id: 'games-here', emoji: '🎮', title: { en: 'the games', fa: 'بازی‌ها' },
      keywords: { en: ['snake', 'tetris', 'mini minecraft', 'minicraft', 'play a game', 'play games', 'games here', 'games on this computer', 'what games', 'which games', 'high score', 'highscore', 'my score', 'scores', 'controls', 'how to play', 'how do i play', 'im bored', "i'm bored", 'bored', 'something fun', 'fun'], fa: ['اسنیک', 'مار', 'بازی مار', 'تتریس', 'ماینکرفت کوچیک', 'ماینکرفت مینی', 'بازی کنم', 'بازی‌ها', 'بازیا', 'بازی های این کامپیوتر', 'چه بازی‌هایی', 'چه بازیایی', 'رکورد', 'هایسکور', 'امتیازم', 'امتیاز', 'کنترل‌ها', 'کنترلا', 'چطور بازی کنم', 'حوصلم سر رفته', 'حوصله‌م سر رفته', 'یه چیز سرگرم‌کننده', 'سرگرمی'] },
      answer: {
        en: ["Three games on this desktop: Snake 🐍 (arrows / WASD, eat, don't bite yourself), Tetris 🧱 (arrows to move/rotate, space to drop), and Mini Minecraft ⛏️ (a small block world: mine, place, explore — your world is saved in the browser). High scores are saved locally too. /open snake, /open tetris, /open minicraft.", "Bored? Snake, Tetris or Mini Minecraft — all on the desktop and in This PC → G: Games. Arrow keys everywhere; touch controls appear on phones. Scores and the Minecraft world stay in your browser."],
        fa: ["سه تا بازی روی این دسکتاپ: Snake 🐍 (فلش‌ها / WASD، بخور، خودتو گاز نگیر)، Tetris 🧱 (فلش‌ها برای حرکت/چرخش، Space برای انداختن)، و ماینکرفت کوچیک ⛏️ (یه دنیای بلوکی کوچیک: ماین کن، بذار، بگرد — دنیات توی مرورگر ذخیره می‌شه). رکوردها هم محلی ذخیره می‌شن. /open snake، /open tetris، /open minicraft.", "حوصله‌ت سر رفته؟ Snake، Tetris یا ماینکرفت کوچیک — همه روی دسکتاپ و توی This PC → درایو G. همه‌جا با فلش‌ها؛ روی گوشی کنترل لمسی ظاهر می‌شه. امتیازها و دنیای ماینکرفت توی مرورگرت می‌مونن."],
      },
    },
    {
      id: 'mobile', emoji: '📱', title: { en: 'phones', fa: 'گوشی' },
      keywords: { en: ['mobile', 'phone', 'on phone', 'on mobile', 'android', 'iphone', 'ios', 'touch', 'tablet', 'does it work on phone', 'small screen', 'responsive'], fa: ['موبایل', 'گوشی', 'روی گوشی', 'با گوشی', 'اندروید', 'آیفون', 'لمسی', 'تبلت', 'روی گوشی کار می‌کنه', 'روی گوشی کار میکنه', 'صفحه کوچیک', 'ریسپانسیو'] },
      answer: {
        en: ["It works on phones — the desktop turns into an icon grid and every window opens fullscreen. Games get on-screen touch buttons. Dragging icons and the Recycle Bin are desktop-only; on a phone the layout is fixed. The music, the lookup app and I all work fine on mobile.", "Yes. On small screens windows go fullscreen and icons become a grid. Some desktop-only tricks (drag icons, resize windows) are off, but everything opens."],
        fa: ["روی گوشی کار می‌کنه — دسکتاپ به یه شبکهٔ آیکون تبدیل می‌شه و هر پنجره تمام‌صفحه باز می‌شه. بازی‌ها دکمهٔ لمسی روی صفحه می‌گیرن. کشیدن آیکون و سطل بازیافت فقط برای دسکتاپه؛ روی گوشی چیدمان ثابته. موزیک، برنامهٔ لوکاپ و خودم روی موبایل خوب کار می‌کنیم.", "آره. روی صفحه‌های کوچیک پنجره‌ها تمام‌صفحه می‌شن و آیکون‌ها شبکه می‌شن. بعضی ترفندهای دسکتاپ (کشیدن آیکون، تغییر اندازه) خاموشن، ولی همه‌چیز باز می‌شه."],
      },
    },
    {
      id: 'wallpaper', emoji: '🖼️', title: { en: 'the look', fa: 'ظاهر' },
      keywords: { en: ['wallpaper', 'background', 'change wallpaper', 'change background', 'theme', 'dark mode', 'light mode', 'colors', 'colours', 'why red', 'particles', 'dots', 'the dots in the background', 'design', 'font'], fa: ['والپیپر', 'پس‌زمینه', 'پس زمینه', 'بک‌گراند', 'بکگراند', 'تم', 'تم روشن', 'حالت روشن', 'دارک مود', 'رنگ‌ها', 'رنگا', 'چرا قرمز', 'ذره‌ها', 'نقطه‌ها', 'نقطه‌های پس‌زمینه', 'طراحی', 'فونت'] },
      answer: {
        en: ["The look is fixed: dark, red accent (Waish's brand colour, same as his logo), floating particles in the background, and a faint terminal wallpaper. No light mode — it's a night-time site. Fonts: a mono font for terminal stuff, Vazirmatn for Persian.", "Dark with red — that's the Waish palette. The drifting dots are a tiny particle canvas, purely decorative. There's no wallpaper picker; Waish likes it this way."],
        fa: ["ظاهرش ثابته: تیره، با اکسنت قرمز (رنگ برند ویش، همون رنگ لوگوش)، ذره‌های شناور توی پس‌زمینه، و یه والپیپر ترمینال کم‌رنگ. حالت روشن نداره — یه سایت شبانه‌ست. فونت‌ها: مونو برای چیزای ترمینالی، وزیرمتن برای فارسی.", "تیره با قرمز — این پالت ویشه. نقطه‌های شناور یه canvas ذره‌ای کوچیکن، فقط تزیینی. انتخاب والپیپر نداره؛ ویش همین‌طوری دوستش داره."],
      },
    },

    /* ---------- projects: practical questions ---------- */
    {
      id: 'lunamc-join', emoji: '🌙', title: { en: 'joining LunaMC', fa: 'ورود به لونا ام‌سی' },
      keywords: { en: ['join lunamc', 'how to join', 'how do i join', 'lunamc ip', 'server ip', 'the ip', 'ip address', 'what is the ip', 'connect to lunamc', 'lunamc version', 'which version', 'what version', 'java or bedrock', 'bedrock', 'pocket edition', 'is lunamc online', 'server online', 'is the server up', 'server down', 'lunamc down', 'how many players', 'player count', 'lunamc status'], fa: ['وارد لونا بشم', 'چطور وارد بشم', 'چطور جوین بشم', 'جوین شم', 'آی‌پی لونا', 'آیپی لونا', 'آی پی لونا', 'آی‌پی سرور', 'آیپی سرور', 'آی‌پی', 'آیپی', 'ای پی', 'آی‌پی چیه', 'وصل شم به لونا', 'ورژن لونا', 'نسخه لونا', 'چه ورژنی', 'جاوا یا بدراک', 'بدراک', 'پاکت ادیشن', 'لونا آنلاینه', 'سرور آنلاینه', 'سرور بالاست', 'سرور پایینه', 'لونا پایینه', 'چند نفر آنلاینن', 'تعداد پلیر', 'وضعیت لونا'] },
      answer: {
        en: ["LunaMC IP: Play.LunaMC.iR — Minecraft Java Edition. Add it in multiplayer and join. Type /ip here to copy it. Live status, player count, updates and support are on the Discord: discord.gg/8HVsMqucZ2.", "Play.LunaMC.iR on Java Edition. (/ip copies it.) For \"is it online right now?\", the Discord server has the status and the community — discord.gg/8HVsMqucZ2. I'm offline so I can't ping it for you."],
        fa: ["آی‌پی لونا ام‌سی: Play.LunaMC.iR — ماینکرفت جاوا. توی مولتی‌پلیر اضافه‌ش کن و جوین شو. اینجا /ip رو بزن تا کپی بشه. وضعیت زنده، تعداد بازیکن، آپدیت‌ها و پشتیبانی توی دیسکورده: discord.gg/8HVsMqucZ2.", "Play.LunaMC.iR روی نسخهٔ جاوا. (/ip کپیش می‌کنه.) برای «الان آنلاینه؟» سرور دیسکورد وضعیت و کامیونیتی رو داره — discord.gg/8HVsMqucZ2. من آفلاینم و نمی‌تونم برات پینگش کنم."],
      },
    },
    {
      id: 'lunamc-cracked', emoji: '🔑', title: { en: 'cracked accounts on LunaMC', fa: 'اکانت کرک روی لونا' },
      keywords: { en: ['cracked', 'is lunamc cracked', 'non premium', 'non-premium', 'offline mode', 'tlauncher', 'without premium', 'do i need premium', 'need to buy minecraft', 'free account'], fa: ['کرک', 'کرکه', 'لونا کرکه', 'اکانت کرک', 'بدون پرمیوم', 'پرمیوم لازمه', 'پرمیوم می‌خواد', 'پرمیوم میخواد', 'تی‌لانچر', 'تی لانچر', 'باید ماینکرفت بخرم', 'اکانت رایگان', 'آفلاین مود'] },
      answer: {
        en: ["The site doesn't say whether non-premium (cracked) accounts can join, and I'd rather not guess — ask in the LunaMC Discord (discord.gg/8HVsMqucZ2), the answer's in the FAQ there. The IP is Play.LunaMC.iR on Java Edition either way.", "That's a Discord question — discord.gg/8HVsMqucZ2 has the up-to-date answer on account types. What I know for sure: Java Edition, IP Play.LunaMC.iR."],
        fa: ["توی سایت نگفته اکانت غیرپرمیوم (کرک) می‌تونه بیاد یا نه، و ترجیح می‌دم حدس نزنم — توی دیسکورد لونا (discord.gg/8HVsMqucZ2) بپرس، جوابش توی FAQ اونجاست. آی‌پی در هر صورت Play.LunaMC.iR روی نسخهٔ جاواست.", "این سؤال دیسکورده — discord.gg/8HVsMqucZ2 جواب به‌روز رو دربارهٔ نوع اکانت داره. چیزی که مطمئنم: نسخهٔ جاوا، آی‌پی Play.LunaMC.iR."],
      },
    },
    {
      id: 'lunamc-rules', emoji: '📜', title: { en: 'LunaMC rules and support', fa: 'قوانین و پشتیبانی لونا' },
      keywords: { en: ['rules', 'lunamc rules', 'banned', 'i got banned', 'unban', 'ban appeal', 'appeal', 'report player', 'report a player', 'report cheater', 'hacker', 'hackers', 'cheaters on lunamc', 'lunamc support', 'lunamc staff', 'admin', 'moderator', 'mod', 'lunamc discord', 'buy rank', 'lunamc shop', 'lunamc store', 'vip'], fa: ['قوانین', 'قوانین لونا', 'بن شدم', 'بن', 'آنبن', 'رفع بن', 'درخواست رفع بن', 'ریپورت', 'ریپورت بازیکن', 'گزارش چیتر', 'هکر', 'هکرا', 'چیتر توی لونا', 'پشتیبانی لونا', 'استاف لونا', 'ادمین', 'مدیر', 'ماد', 'دیسکورد لونا', 'خرید رنک', 'شاپ لونا', 'فروشگاه لونا', 'وی‌آی‌پی', 'ویآیپی'] },
      answer: {
        en: ["Rules, ban appeals, player reports, ranks and the store all go through the LunaMC Discord: discord.gg/8HVsMqucZ2 — open a ticket and the staff will handle it. Cheaters get caught by LunaGuard, the server's own anticheat, which collects evidence for the moderation team instead of auto-banning.", "That's a Discord thing — discord.gg/8HVsMqucZ2. Tickets for appeals and reports, channels for rules and the shop. I only know the server from the outside."],
        fa: ["قوانین، درخواست رفع بن، ریپورت بازیکن، رنک‌ها و فروشگاه همه از طریق دیسکورد لونا ام‌سی: discord.gg/8HVsMqucZ2 — تیکت بزن و استاف رسیدگی می‌کنه. چیترها رو LunaGuard می‌گیره، آنتی‌چیت خود سرور، که به جای بن خودکار برای تیم مدیریت مدرک جمع می‌کنه.", "این کار دیسکورده — discord.gg/8HVsMqucZ2. تیکت برای رفع بن و ریپورت، کانال برای قوانین و شاپ. من سرور رو فقط از بیرون می‌شناسم."],
      },
    },
    {
      id: 'clutchping-howto', emoji: '⚡', title: { en: 'using ClutchPing', fa: 'استفاده از کلاچ‌پینگ' },
      keywords: { en: ['how does clutchping work', 'how to use clutchping', 'use clutchping', 'clutchping price', 'clutchping cost', 'is clutchping free', 'clutchping free', 'download clutchping', 'get clutchping', 'clutchping app', 'clutchping games', 'supported games', 'does clutchping work for', 'lower my ping', 'reduce ping', 'fix my ping', 'my ping is high', 'high ping', 'lag', 'lagging', 'vpn', 'is it a vpn', 'relay'], fa: ['کلاچ‌پینگ چطور کار می‌کنه', 'کلاچ پینگ چطور کار میکنه', 'چطور از کلاچ‌پینگ استفاده کنم', 'قیمت کلاچ‌پینگ', 'قیمت کلاچ پینگ', 'کلاچ‌پینگ رایگانه', 'کلاچ پینگ رایگانه', 'دانلود کلاچ‌پینگ', 'دانلود کلاچ پینگ', 'برنامه کلاچ‌پینگ', 'بازی‌های کلاچ‌پینگ', 'پینگم رو کم کن', 'پینگمو کم کن', 'کاهش پینگ', 'پینگم بالاست', 'پینگ بالا', 'لگ', 'لگ دارم', 'وی‌پی‌ان', 'وی پی ان', 'اینم وی‌پی‌انه', 'ریلی'] },
      answer: {
        en: ["ClutchPing routes your game traffic through optimized relays so packets take a shorter, more stable path to the game server — lower ping, fewer spikes. It's not a VPN for browsing; it's built for game traffic. It started for LunaMC players and is expanding to other games. Pricing, downloads and supported games: clutchping.com.", "High ping is mostly bad routing. ClutchPing fixes the route with relays. Everything practical — how to sign up, what it costs, which games — is on clutchping.com; the LunaMC Discord has a support channel for it too."],
        fa: ["کلاچ‌پینگ ترافیک بازیت رو از ریلی‌های بهینه رد می‌کنه تا پکت‌ها مسیر کوتاه‌تر و پایدارتری تا سرور بازی برن — پینگ کمتر، اسپایک کمتر. وی‌پی‌ان برای وب‌گردی نیست؛ برای ترافیک بازی ساخته شده. برای بازیکن‌های لونا ام‌سی شروع شد و داره به بازی‌های دیگه می‌رسه. قیمت، دانلود و بازی‌های پشتیبانی‌شده: clutchping.com.", "پینگ بالا بیشتر به خاطر مسیر بده. کلاچ‌پینگ مسیر رو با ریلی درست می‌کنه. همهٔ چیزای عملی — ثبت‌نام، قیمت، کدوم بازی‌ها — روی clutchping.com هست؛ دیسکورد لونا هم یه کانال پشتیبانی براش داره."],
      },
    },
    {
      id: 'nairoshop-howto', emoji: '🛒', title: { en: 'using NairoShop', fa: 'استفاده از نایروشاپ' },
      keywords: { en: ['buy from nairoshop', 'nairoshop products', 'what does nairoshop sell', 'what can i buy', 'nairo.ir', 'nairo', 'buy minecraft', 'minecraft account', 'buy account', 'gift card', 'buy spotify', 'buy discord nitro', 'nitro', 'buy subscription', 'foreign payment', 'pay with rial', 'iranian card', 'digital products', 'shop', 'store'], fa: ['از نایروشاپ بخرم', 'محصولات نایروشاپ', 'نایروشاپ چی می‌فروشه', 'نایروشاپ چی میفروشه', 'چی می‌تونم بخرم', 'چی میتونم بخرم', 'nairo.ir', 'نایرو', 'خرید ماینکرفت', 'اکانت ماینکرفت', 'خرید اکانت', 'گیفت کارت', 'خرید اسپاتیفای', 'خرید نیترو', 'نیترو', 'خرید اشتراک', 'پرداخت ارزی', 'پرداخت ریالی', 'کارت ایرانی', 'محصولات دیجیتال', 'فروشگاه', 'شاپ'] },
      answer: {
        en: ["NairoShop (nairo.ir) sells foreign digital products and services to Iranian users who can't pay abroad directly — accounts, subscriptions, gift cards and similar, paid in rial with an Iranian card. Over 100,000 successful orders. What's in stock right now is on the site itself.", "It's the shop for things you can't pay for from Iran: game accounts, subscriptions, gift cards, that kind of thing. nairo.ir has the catalogue and prices; I only know the idea behind it."],
        fa: ["نایروشاپ (nairo.ir) محصولات و سرویس‌های دیجیتال خارجی رو به کاربرهای ایرانی می‌فروشه که نمی‌تونن مستقیم پرداخت ارزی کنن — اکانت، اشتراک، گیفت کارت و از این دست، با پرداخت ریالی و کارت ایرانی. بیش از ۱۰۰٬۰۰۰ سفارش موفق. چیزی که الان موجوده روی خود سایته.", "فروشگاهیه برای چیزایی که از ایران نمی‌شه پولشون رو داد: اکانت بازی، اشتراک، گیفت کارت، این‌جور چیزا. nairo.ir کاتالوگ و قیمت‌ها رو داره؛ من فقط ایدهٔ پشتش رو می‌دونم."],
      },
    },
    {
      id: 'bedwars-tips', emoji: '🛏️', title: { en: 'BedWars tips', fa: 'نکات بدوارز' },
      keywords: { en: ['bedwars tips', 'how to get better', 'get better at bedwars', 'improve', 'improve my pvp', 'pvp tips', 'tips', 'how to win', 'how to pvp', 'clicking', 'cps', 'jitter', 'butterfly', 'drag click', 'w tap', 'w-tap', 's tap', 'combo', 'bridging', 'how to bridge', 'speed bridge', 'fkdr', 'final kills', 'wlr', 'stars', 'bedwars level', 'best client', 'lunar', 'badlion', 'client', 'fps boost', 'optimize minecraft', 'optifine', 'sodium', 'texture pack recommendation', 'best pack'], fa: ['نکات بدوارز', 'چطور بهتر بشم', 'بدوارز بهتر بشم', 'پیشرفت', 'pvp بهتر', 'نکات pvp', 'نکته', 'چطور ببرم', 'چطور pvp کنم', 'کلیک', 'سی‌پی‌اس', 'سی پی اس', 'جیتر', 'باترفلای', 'درگ کلیک', 'دبلیو تپ', 'کمبو', 'بریج', 'بریج زدن', 'اسپید بریج', 'اف‌کی‌دی‌آر', 'فاینال کیل', 'استار', 'لول بدوارز', 'بهترین کلاینت', 'لونار', 'بدلیون', 'کلاینت', 'اف‌پی‌اس', 'افپیاس', 'آپتیمایز ماینکرفت', 'آپتیفاین', 'بهترین پک', 'پک پیشنهادی'] },
      answer: {
        en: ["Waish's whole channel is basically this question. Short version: fix your ping first (routing matters more than you think — that's why ClutchPing exists), then mechanics: aim before clicks, learn W-tap/S-tap for knockback, practise bridging in a lobby, and play with a clean, low-fire pack so you can see hits. His packs and settings are on the About Me page; the videos go deeper.", "Ping → mechanics → game sense, in that order. Watch the tutorials on the channel (youtube.com/@WaishChannel, aparat.com/waish) — he covers PvP, W-tap, bridging, clients and optimization. His own texture packs and settings are listed on About Me."],
        fa: ["کل کانال ویش تقریباً جواب همین سؤاله. خلاصه: اول پینگت رو درست کن (مسیریابی بیشتر از چیزی که فکر می‌کنی مهمه — کلاچ‌پینگ برای همین وجود داره)، بعد مکانیک: قبل از کلیک نشونه بگیر، W-tap/S-tap رو برای ناک‌بک یاد بگیر، بریج رو توی لابی تمرین کن، و با یه پک تمیز و کم‌آتش بازی کن که ضربه‌ها رو ببینی. پک‌ها و تنظیماتش توی صفحهٔ درباره من هست؛ ویدیوها عمیق‌تر می‌رن.", "پینگ → مکانیک → درک بازی، به همین ترتیب. آموزش‌های کانال رو ببین (youtube.com/@WaishChannel، aparat.com/waish) — PvP، W-tap، بریج، کلاینت و آپتیمایز رو پوشش می‌ده. تکسچر پک‌ها و تنظیمات خودش توی درباره من لیست شده."],
      },
    },
    {
      id: 'hypixel', emoji: '🟨', title: { en: 'Hypixel', fa: 'هایپیکسل' },
      keywords: { en: ['hypixel', 'does waish play hypixel', 'waish hypixel', 'hypixel or lunamc', 'lunamc vs hypixel', 'better than hypixel', 'hypixel ban', 'hypixel iran', 'can i play hypixel from iran', 'hypixel ping iran'], fa: ['هایپیکسل', 'ویش هایپیکسل بازی می‌کنه', 'ویش هایپیکسل بازی میکنه', 'هایپیکسل یا لونا', 'لونا یا هایپیکسل', 'بهتر از هایپیکسل', 'بن هایپیکسل', 'هایپیکسل ایران', 'از ایران هایپیکسل', 'پینگ هایپیکسل'] },
      answer: {
        en: ["Hypixel is the big one — the server BedWars was born on. Waish plays and makes content around it, and User Lookup pulls Hypixel stats for any player. LunaMC is his own Persian-language server with its own PvP feel; they're not competing, they're different rooms. Ping from Iran to Hypixel is exactly the problem ClutchPing was built to soften.", "Big international server, home of BedWars. Waish knows it well — his channel, the lookup app (rank, stars, FKDR) and the Seraph council work all revolve around it. For a Persian community with lower ping, that's what LunaMC is for."],
        fa: ["هایپیکسل همون بزرگه‌ست — سروری که بدوارز توش متولد شد. ویش توش بازی می‌کنه و محتوا می‌سازه، و User Lookup آمار هایپیکسل هر بازیکنی رو می‌گیره. لونا ام‌سی سرور فارسی‌زبان خودشه با حس PvP خودش؛ رقیب نیستن، دو تا اتاق متفاوتن. پینگ از ایران تا هایپیکسل دقیقاً همون مشکلیه که کلاچ‌پینگ برای کم کردنش ساخته شد.", "سرور بین‌المللی بزرگ، خونهٔ بدوارز. ویش خوب می‌شناستش — کانالش، برنامهٔ لوکاپ (رنک، استار، FKDR) و کار شورای Seraph همه دور اونه. برای یه کامیونیتی فارسی با پینگ کمتر، لونا ام‌سی همینه."],
      },
    },

    /* ---------- about Waish: personal questions ---------- */
    {
      id: 'real-name', emoji: '🪪', title: { en: "Waish's name", fa: 'اسم ویش' },
      keywords: { en: ['real name', "waish's real name", 'his real name', 'what is his name', 'hossein', 'danesh', 'hossein danesh', 'why waish', 'what does waish mean', 'meaning of waish', 'where does the name come from', 'nickname', 'username'], fa: ['اسم واقعی', 'اسم واقعی ویش', 'اسم واقعیش', 'اسمش چیه', 'حسین', 'دانش', 'حسین دانش', 'چرا ویش', 'ویش یعنی چی', 'معنی ویش', 'اسم از کجا اومده', 'اسم مستعار', 'یوزرنیم', 'نیک نیم', 'نیک‌نیم'] },
      answer: {
        en: ["Waish's real name is Hossein — Hossein Danesh; you'll see it in the footer of the site. \"Waish\" is the name he's used online since the Minecraft days, and it stuck: the channel, the community, the server, all of it.", "Hossein Danesh, known everywhere online as Waish. Persian community, Minecraft channel, LunaMC — one name across all of it."],
        fa: ["اسم واقعی ویش حسینه — حسین دانش؛ توی فوتر سایت هم هست. «ویش» اسمیه که از دوران ماینکرفت آنلاین استفاده کرده و موند: کانال، کامیونیتی، سرور، همه‌ش.", "حسین دانش، که همه‌جا آنلاین با اسم ویش می‌شناسنش. کامیونیتی فارسی، کانال ماینکرفت، لونا ام‌سی — یه اسم برای همه‌ش."],
      },
    },
    {
      id: 'personal', emoji: '🙂', title: { en: 'personal stuff', fa: 'شخصی' },
      keywords: { en: ['how old', 'age', 'his age', 'birthday', 'born', 'when was he born', 'where is he from', 'where does he live', 'which city', 'city', 'country', 'iran', 'iranian', 'is he iranian', 'nationality', 'married', 'girlfriend', 'wife', 'single', 'relationship', 'family', 'height', 'what does he look like', 'photo', 'picture of waish', 'face reveal', 'face'], fa: ['چند سالشه', 'سن', 'سنش', 'تولد', 'تولدش', 'کی به دنیا اومده', 'متولد', 'اهل کجاست', 'کجا زندگی می‌کنه', 'کجا زندگی میکنه', 'کدوم شهر', 'شهر', 'کشور', 'ایران', 'ایرانی', 'ایرانیه', 'ملیت', 'ازدواج', 'ازدواج کرده', 'دوست دختر', 'زن داره', 'مجرده', 'رابطه', 'خانواده', 'قدش', 'قیافش', 'شکلش چطوره', 'عکس ویش', 'عکسش', 'فیس ریویل', 'صورتش', 'چهره'] },
      answer: {
        en: ["He's Iranian and makes content for the Persian-speaking community — that's the part that's public. Age, city, relationships and the rest he doesn't put on the site, so I don't have it either. For what he looks like: the avatar on the About Me page, and the setup photos in This PC → Gallery.", "Iran, Persian-speaking scene, real name Hossein. Beyond that I only know what's on the site, and personal details aren't. His face is on the avatar; the rest is his business 🙂"],
        fa: ["ایرانیه و برای کامیونیتی فارسی‌زبان محتوا می‌سازه — این بخش عمومیشه. سن، شهر، رابطه و بقیه رو توی سایت نذاشته، پس من هم ندارم. برای اینکه چه شکلیه: آواتار صفحهٔ درباره من، و عکس‌های ستاپ توی This PC → گالری.", "ایران، صحنهٔ فارسی‌زبان، اسم واقعی حسین. فراتر از این فقط چیزی که توی سایته رو می‌دونم، و جزئیات شخصی توش نیست. صورتش روی آواتاره؛ بقیه‌ش به خودش مربوطه 🙂"],
      },
    },
    {
      id: 'email', emoji: '📬', title: { en: 'contacting Waish', fa: 'تماس با ویش' },
      keywords: { en: ['email', 'e-mail', 'mail', 'his email', 'phone number', 'number', 'whatsapp', 'telegram id', 'discord id', 'discord tag', 'dm', 'message him', 'talk to waish', 'how to reach', 'reach him', 'contact him', 'contact waish', 'get in touch'], fa: ['ایمیل', 'ایمیلش', 'شماره', 'شماره تلفن', 'شمارش', 'واتساپ', 'آیدی تلگرام', 'آیدی دیسکورد', 'دایرکت', 'پیام بدم', 'با ویش حرف بزنم', 'چطور بهش برسم', 'باهاش تماس بگیرم', 'تماس با ویش', 'ارتباط با ویش', 'در تماس باشم'] },
      answer: {
        en: ["No public email or phone number. The fastest way to reach Waish is a ticket on the Discord server (discord.gg/8HVsMqucZ2); Instagram DMs (@asunawaish) work too. Telegram channel for announcements: t.me/wishingcommunity. It's all on the Contact page.", "Discord ticket first (discord.gg/8HVsMqucZ2), Instagram DM second (@asunawaish). He doesn't publish an email or number."],
        fa: ["ایمیل یا شمارهٔ عمومی نداره. سریع‌ترین راه رسیدن به ویش تیکت توی سرور دیسکورده (discord.gg/8HVsMqucZ2)؛ دایرکت اینستاگرام (@asunawaish) هم کار می‌کنه. کانال تلگرام برای اطلاعیه‌ها: t.me/wishingcommunity. همه‌ش توی صفحهٔ تماس هست.", "اول تیکت دیسکورد (discord.gg/8HVsMqucZ2)، بعد دایرکت اینستاگرام (@asunawaish). ایمیل یا شماره منتشر نمی‌کنه."],
      },
    },
    {
      id: 'favourite-game', emoji: '🎮', title: { en: 'favourite game', fa: 'بازی مورد علاقه' },
      keywords: { en: ['favourite game', 'favorite game', 'what games does he play', 'what does he play', 'other games', 'besides minecraft', 'valorant', 'csgo', 'cs2', 'fortnite', 'pubg', 'call of duty', 'gta', 'does he play'], fa: ['بازی مورد علاقه', 'بازی مورد علاقش', 'چه بازی‌هایی می‌کنه', 'چه بازیایی میکنه', 'چی بازی می‌کنه', 'چی بازی میکنه', 'بازی‌های دیگه', 'غیر از ماینکرفت', 'ولورانت', 'کانتر', 'سی‌اس', 'فورتنایت', 'پابجی', 'کال آف دیوتی', 'جی‌تی‌ای', 'بازی می‌کنه'] },
      answer: {
        en: ["Minecraft, and inside it BedWars — that's the game, the channel and the server. Other games show up now and then (ClutchPing is being built for every game, after all), but Minecraft is where he lives.", "BedWars in Minecraft, no contest. It's what he plays, records, teaches and built LunaMC around."],
        fa: ["ماینکرفت، و توش بدوارز — بازی، کانال و سرور همینه. بازی‌های دیگه گاهی پیداشون می‌شه (بالاخره کلاچ‌پینگ برای همهٔ بازی‌ها ساخته می‌شه)، ولی ماینکرفت جاییه که زندگی می‌کنه.", "بدوارز توی ماینکرفت، بدون رقیب. چیزیه که بازی می‌کنه، ضبط می‌کنه، آموزش می‌ده و لونا ام‌سی رو دورش ساخته."],
      },
    },
    {
      id: 'schedule', emoji: '📆', title: { en: 'upload schedule', fa: 'زمان‌بندی آپلود' },
      keywords: { en: ['upload schedule', 'when does he upload', 'new video', 'next video', 'when is the next video', 'stream schedule', 'when does he stream', 'is he live', 'live now', 'streaming now', 'last video', 'latest video'], fa: ['زمان آپلود', 'کی آپلود می‌کنه', 'کی آپلود میکنه', 'ویدیو جدید', 'ویدیوی جدید', 'ویدیو بعدی', 'کی ویدیو میاد', 'زمان استریم', 'کی استریم می‌کنه', 'کی استریم میکنه', 'لایوه', 'الان لایوه', 'الان استریمه', 'آخرین ویدیو'] },
      answer: {
        en: ["I can't see the channel from here (offline, remember). Videos go up on YouTube (@WaishChannel) and Aparat (aparat.com/waish); streams and \"going live\" announcements land on the Discord and the Telegram channel (t.me/wishingcommunity). Turn on notifications there and you won't miss one.", "Check YouTube or Aparat for the latest upload, and Discord/Telegram for live announcements — I don't have a schedule feed."],
        fa: ["از اینجا کانال رو نمی‌بینم (آفلاینم، یادته). ویدیوها روی یوتیوب (@WaishChannel) و آپارات (aparat.com/waish) میان؛ استریم و اعلان «لایو شدم» توی دیسکورد و کانال تلگرام (t.me/wishingcommunity). اونجا نوتیف رو روشن کن تا از دست ندی.", "برای آخرین آپلود یوتیوب یا آپارات رو چک کن، و برای اعلان لایو دیسکورد/تلگرام — من فید زمان‌بندی ندارم."],
      },
    },
  ],
};
