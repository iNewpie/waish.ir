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

  /* shown when nothing matches */
  fallbackEmoji: '🤔',
  fallback: {
    en: "I don't know the answer about this one — use /help or ask me anything else, I'll try to answer you if I know something.",
    fa: "جواب این یکی رو نمی‌دونم — از /help استفاده کن یا هر چیز دیگه‌ای بپرس؛ اگه چیزی بدونم سعی می‌کنم جوابت رو بدم.",
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

    /* ---------- small talk ---------- */
    {
      id: 'greeting', emoji: '👋',
      keywords: { en: ['hello', 'hi', 'hey', 'yo', 'salam', 'sup', 'good morning', 'good evening'], fa: ['سلام', 'درود', 'هی', 'صبح بخیر', 'شب بخیر', 'عصر بخیر'] },
      answer: {
        en: "Hey! I'm Waish's assistant. Ask me about Waish, his projects (LunaMC, ClutchPing), his PC setup, or any computer-science question. Type /help to see commands.",
        fa: "سلام! من دستیار ویش هستم. می‌تونی دربارهٔ ویش، پروژه‌هاش (لونا ام‌سی، کلاچ‌پینگ)، ستاپ کامپیوترش یا هر سؤال کامپیوتری ازم بپرسی. برای دیدن دستورها /help رو بزن.",
      },
    },
    {
      id: 'how-are-you', emoji: '😎',
      keywords: { en: ['how are you', 'how r u', 'hows it going', "how's it going", 'whats up', "what's up"], fa: ['چطوری', 'چه خبر', 'خوبی', 'حالت چطوره', 'چطور هستی'] },
      answer: {
        en: "Running smooth — zero packet loss. What do you want to know?",
        fa: "عالی‌ام — بدون هیچ پکت‌لاسی. چی می‌خوای بدونی؟",
      },
    },
    {
      id: 'thanks', emoji: '🙌',
      keywords: { en: ['thank', 'thx', 'ty', 'cheers'], fa: ['ممنون', 'مرسی', 'تشکر', 'دمت گرم', 'سپاس'] },
      answer: { en: "Anytime. Ask away.", fa: "خواهش می‌کنم. باز هم بپرس." },
    },
    {
      id: 'bye', emoji: '👋',
      keywords: { en: ['bye', 'goodbye', 'see you', 'cya', 'later'], fa: ['خداحافظ', 'بای', 'فعلا', 'فعلاً', 'می‌بینمت'] },
      answer: { en: "See you. gg.", fa: "می‌بینمت. gg." },
    },
    {
      id: 'what-can-you-do', emoji: '🤖',
      keywords: { en: ['what can you do', 'what do you do', 'who are you', 'what are you', 'help me', 'what is this'], fa: ['چیکار می‌کنی', 'چه کاری می‌کنی', 'تو کی هستی', 'تو چی هستی', 'این چیه', 'کمک'] },
      answer: {
        en: "I'm a small offline assistant living in Waish's terminal. I know about Waish, LunaMC, ClutchPing, his content, his PC setup, and some computer-science basics. Commands start with / (try /help); anything else you type, I try to answer — in English or Persian.",
        fa: "من یه دستیار کوچیک آفلاین توی ترمینال ویش هستم. دربارهٔ ویش، لونا ام‌سی، کلاچ‌پینگ، محتواش، ستاپ کامپیوترش و مبانی کامپیوتر اطلاعات دارم. دستورها با / شروع می‌شن (/help رو امتحان کن)؛ هر چیز دیگه‌ای بنویسی سعی می‌کنم جواب بدم — انگلیسی یا فارسی.",
      },
    },
    {
      id: 'language', emoji: '🌐',
      keywords: { en: ['persian', 'farsi', 'speak farsi', 'do you speak'], fa: ['فارسی بلدی', 'فارسی حرف', 'فارسی بلد', 'فارسی صحبت', 'انگلیسی بلدی'] },
      answer: {
        en: "Yes — write to me in Persian and I'll answer in Persian. English works too.",
        fa: "بله — فارسی بنویس، فارسی جواب می‌دم. انگلیسی هم بلدم.",
      },
    },

    /* ---------- about waish ---------- */
    {
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
        en: "Waish streams and makes videos — the YouTube channel is centred on Minecraft and especially BedWars, where he became one of the known faces in the Persian community. It's not just gameplay: PvP, mechanics, ping, optimization and Minecraft clients get covered too, with proper editing, thumbnails and structure. Find him on Aparat at aparat.com/waish, and on YouTube.",
        fa: "ویش استریم می‌کنه و ویدیو می‌سازه — کانال یوتیوبش روی ماینکرفت و مخصوصاً BedWars تمرکز داره، جایی که تبدیل به یکی از چهره‌های شناخته‌شدهٔ جامعهٔ فارسی شد. فقط گیم‌پلی نیست: PvP، مکانیک‌ها، پینگ، آپتیمایز و کلاینت‌های ماینکرفت هم پوشش داده می‌شن، با تدوین، تامبنیل و ساختار حرفه‌ای. آپارات: aparat.com/waish و همچنین یوتیوب.",
      },
    },
    {
      id: 'contact', emoji: '📬',
      keywords: { en: ['contact', 'reach', 'email', 'discord', 'dm', 'message you', 'talk to waish'], fa: ['تماس', 'ارتباط', 'ایمیل', 'دیسکورد', 'پیام', 'چطور پیدات کنم'] },
      answer: {
        en: "Best places: Aparat (aparat.com/waish), the LunaMC community (Play.LunaMC.iR), and clutchping.com. Type /contact for the list.",
        fa: "بهترین راه‌ها: آپارات (aparat.com/waish)، کامیونیتی لونا ام‌سی (Play.LunaMC.iR) و clutchping.com. برای لیست کامل /contact رو بزن.",
      },
    },

    /* ---------- projects ---------- */
    {
      id: 'lunamc', emoji: '🌙',
      keywords: { en: ['lunamc', 'luna mc', 'luna', 'minecraft server', 'server ip', 'bedwars', 'join the server'], fa: ['لونا', 'لونا ام سی', 'لونا ام‌سی', 'سرور ماینکرفت', 'آی پی', 'آی‌پی', 'ای پی', 'بدوارز', 'بد وارز'] },
      answer: {
        en: "LunaMC is Waish's Persian-language Minecraft server — and much more than 'a server' to him: he designs the PvP systems, gamemodes, security, player experience and manages the team. It's PvP-focused, with a custom knockback system (W-Tap, S-Tap, Zest-Tap, movement, HitSelect), gamemodes like BedWars, FFA and ThePit, and its own LunaGuard AntiCheat.\nIP: Play.LunaMC.iR  (type /ip to copy it)",
        fa: "لونا ام‌سی سرور ماینکرفت فارسی‌زبان ویشه — و برای اون خیلی بیشتر از «یه سرور»: طراحی سیستم‌های PvP، گیم‌مودها، امنیت، تجربهٔ بازیکن و مدیریت تیم همه با خودشه. سرور PvP محوره، با سیستم ناک‌بک اختصاصی (W-Tap، S-Tap، Zest-Tap، Movement، HitSelect)، گیم‌مودهای BedWars، FFA و ThePit و آنتی‌چیت اختصاصی LunaGuard.\nآی‌پی: Play.LunaMC.iR  (برای کپی /ip رو بزن)",
      },
    },
    {
      id: 'clutchping', emoji: '⚡',
      keywords: { en: ['clutchping', 'clutch ping', 'lower ping', 'reduce ping', 'lag', 'ping reduction'], fa: ['کلاچ پینگ', 'کلاچ‌پینگ', 'کلاچپینگ', 'کاهش پینگ', 'پینگ پایین', 'لگ'] },
      answer: {
        en: "ClutchPing grew out of Waish's interest in networking plus a real need: route quality and connection stability matter a lot in Minecraft and competitive games, and many players get a bad experience on foreign servers because of poor routing. ClutchPing focuses on stability and connection quality for gaming. It's the usual Waish pattern: a problem → technical investigation → build a solution → turn it into a usable project. → clutchping.com",
        fa: "کلاچ‌پینگ از علاقهٔ ویش به شبکه به‌علاوهٔ یه نیاز واقعی شکل گرفت: کیفیت Route و پایداری اتصال برای ماینکرفت و بازی‌های رقابتی خیلی مهمه و خیلی از بازیکن‌ها به‌خاطر مسیر نامناسب تجربهٔ بدی از سرورهای خارجی دارن. کلاچ‌پینگ روی Stability و کیفیت اتصال گیمینگ تمرکز داره. همون الگوی همیشگی ویش: یه مشکل → بررسی فنی → ساخت راه‌حل → تبدیلش به یه پروژهٔ قابل استفاده. → clutchping.com",
      },
    },
    {
      id: 'projects', emoji: '🧱',
      keywords: { en: ['projects', 'what have you built', 'your work', 'portfolio', 'woocommerce', 'wordpress', 'store'], fa: ['پروژه', 'پروژه‌ها', 'چی ساختی', 'کارهات', 'ووکامرس', 'وردپرس', 'فروشگاه'] },
      answer: {
        en: "Main projects: LunaMC (PvP-focused Minecraft server), ClutchPing (connection quality for gamers), NairoShop (digital products/services for Iranian users who can't pay internationally), the Waish YouTube/Aparat channel, plus this site and its assistant. Ask about any one of them, or type /projects.",
        fa: "پروژه‌های اصلی: لونا ام‌سی (سرور ماینکرفت PvP محور)، کلاچ‌پینگ (کیفیت اتصال برای گیمرها)، نایروشاپ (محصولات و خدمات دیجیتال برای کاربرای ایرانی که نمی‌تونن پرداخت بین‌المللی کنن)، کانال یوتیوب/آپارات ویش، و همین سایت و دستیارش. دربارهٔ هر کدوم بپرس، یا /projects رو بزن.",
      },
    },

    /* ---------- pc setup (stream / recording) ---------- */
    {
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
      keywords: { en: ['headset', 'headphone', 'headphones', 'iem', 'iems', 'earphone', 'earbuds', 'audio', 'sound', 'arctis', 'moondrop', 'simgot', 'aria'], fa: ['هدست', 'هدفون', 'ایرفون', 'هندزفری', 'صدا', 'آی ای ام', 'مون دراپ', 'سیمگات'] },
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
      keywords: { en: ['gpu', 'graphics card', 'cpu', 'processor', 'gtx', '1050', 'i5', '9400f', 'ssd', 'hdd', 'storage', 'ddr4', 'how much ram', 'ram do you have'], fa: ['گرافیک', 'کارت گرافیک', 'پردازنده', 'سی پی یو', 'جی پی یو', 'اس اس دی', 'هارد', 'حافظه', 'رم داری', 'چقدر رم'] },
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
        fa: "DNS (سیستم نام دامنه) اسم‌های انسانی مثل waish.ir رو به آدرس IP تبدیل می‌کنه. ریزالور تو سلسله‌مراتب رو طی می‌کنه — root → TLD (.dev) → سرور مرجع — و جواب رو با یک TTL کش می‌کنه.",
      },
    },
    {
      id: 'ping', emoji: '🏓',
      keywords: { en: ['ping', 'latency', 'round trip', 'rtt', 'icmp', 'high ping', 'why is my ping'], fa: ['پینگ', 'تأخیر', 'تاخیر', 'پینگ بالا', 'چرا پینگم'] },
      answer: {
        en: "Ping measures round-trip time: your machine sends an ICMP echo request and times the reply. High ping = latency. It's driven by distance, routing hops, and congestion — which is exactly what ClutchPing optimizes.",
        fa: "پینگ زمان رفت‌وبرگشت رو اندازه می‌گیره: سیستمت یک درخواست ICMP echo می‌فرسته و زمان جواب رو حساب می‌کنه. پینگ بالا = تأخیر. به فاصله، تعداد هاپ‌های مسیر و شلوغی شبکه بستگی داره — دقیقاً همون چیزی که کلاچ‌پینگ بهینه‌ش می‌کنه.",
      },
    },
    {
      id: 'ram', emoji: '🧠',
      keywords: { en: ['what is ram', 'ram', 'memory', 'volatile'], fa: ['رم چیه', 'رم', 'حافظه رم', 'حافظه‌ی رم'] },
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
      keywords: { en: ['hossein', 'real name', 'actual name', 'your name', 'his name'], fa: ['حسین', 'اسم واقعی', 'اسمت چیه', 'اسمش چیه', 'اسم ویش'] },
      answer: {
        en: "Waish's real name is Hossein. Online he's known as Waish / ویش — a name that started in Minecraft and grew into a personal brand.",
        fa: "اسم واقعی ویش، حسینه. توی فضای آنلاین با اسم Waish / ویش شناخته می‌شه — اسمی که از ماینکرفت شروع شد و تبدیل به یه برند شخصی شد.",
      },
    },
    {
      id: 'youtube-channel', emoji: '▶️',
      keywords: { en: ['youtube channel', 'your channel', 'his channel', 'bedwars content', 'bedwars videos', 'what do you make'], fa: ['کانال یوتیوب', 'کانالت', 'کانالش', 'یوتیوبت', 'محتوای بدوارز', 'چی می‌سازی', 'چی میسازی'] },
      answer: {
        en: "The Waish YouTube channel is centred on Minecraft, especially BedWars. The goal was never just views — it was building a real community and making BedWars taken seriously among Persian-speaking players, with proper visual quality, editing, thumbnails and structure. Beyond gameplay it covers PvP, mechanics, ping, optimization and Minecraft clients, so there's a teaching/analysis side too. Aparat: aparat.com/waish.",
        fa: "کانال یوتیوب ویش روی ماینکرفت و مخصوصاً BedWars تمرکز داره. هدف هیچ‌وقت فقط بازدید نبود — ساختن یه کامیونیتی واقعی و جدی کردن BedWars بین مخاطب فارسی‌زبان، با کیفیت تصویری، تدوین، تامبنیل و ساختار حرفه‌ای. غیر از گیم‌پلی، PvP، مکانیک‌ها، پینگ، آپتیمایز و کلاینت‌های ماینکرفت هم پوشش داده می‌شه، پس بخش آموزشی و تحلیلی هم داره. آپارات: aparat.com/waish.",
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
      id: 'nairoshop', emoji: '🛒',
      keywords: { en: ['nairoshop', 'nairo shop', 'nairo', 'digital products', 'international payment', 'payment', 'buy', 'shop'], fa: ['نایروشاپ', 'نایرو شاپ', 'نایرو', 'محصولات دیجیتال', 'پرداخت بین المللی', 'پرداخت', 'خرید', 'شاپ'] },
      answer: {
        en: "NairoShop started from a real problem: many Iranian users can't easily buy foreign digital services and products because of international payment restrictions. NairoShop sits in that digital-services space, giving access to products and services that are hard to pay for directly from Iran. For Waish, projects like this aren't 'an online store' — the appeal is finding a real problem and building a system that solves it.",
        fa: "نایروشاپ از یه مشکل واقعی شکل گرفت: خیلی از کاربرای ایرانی به‌خاطر محدودیت‌های پرداخت بین‌المللی نمی‌تونن راحت سرویس‌ها و محصولات دیجیتال خارجی بخرن. نایروشاپ توی همین فضای خدمات دیجیتال قرار داره و دسترسی به محصولات و خدماتی رو فراهم می‌کنه که پرداخت مستقیمشون برای کاربر ایرانی سخته. برای ویش، همچین پروژه‌هایی فقط یه فروشگاه اینترنتی نیستن — جذابیتش پیدا کردن یه مشکل واقعی و ساختن سیستمی برای حلشه.",
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
      keywords: { en: ['project management', 'manage', 'management', 'team', 'teams', 'leadership', 'manager', 'organize', 'scale'], fa: ['مدیریت پروژه', 'مدیریت', 'تیم', 'رهبری', 'مدیر', 'سازماندهی', 'سازمان‌دهی', 'اسکیل'] },
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
      keywords: { en: ['analytics', 'ctr', 'retention', 'rpm', 'watch time', 'seo', 'data driven', 'data-driven', 'views', 'revenue', 'money', 'income', 'monetization', 'business', 'algorithm'], fa: ['آنالیتیکس', 'آمار', 'بازدید', 'ویو', 'درآمد', 'پول', 'سئو', 'الگوریتم', 'کسب و کار', 'کسب‌وکار', 'بیزینس'] },
      answer: {
        en: "For Waish, YouTube isn't a place to upload videos — YouTube is itself a project. Title, thumbnail, CTR, retention, watch time, audience, search, suggested, homepage, upload schedule, even how a video sits on the channel page — all part of it. He follows analytics and learns from the data: if a thumbnail works, why; if a video outperforms, why; if revenue is low, what's affecting RPM. That data-driven view turned YouTube from a hobby into a real business.",
        fa: "برای ویش یوتیوب جایی برای آپلود ویدیو نیست — یوتیوب خودش یه پروژه‌ست. عنوان، تامبنیل، CTR، Retention، Watch Time، مخاطب، سرچ، Suggested، صفحهٔ اصلی، زمان‌بندی آپلود، حتی جای ویدیو توی صفحهٔ کانال — همه بخشی از این پروژه‌ن. آنالیتیکس رو دنبال می‌کنه و از داده یاد می‌گیره: اگه تامبنیل خوب کار کرد، چرا؛ اگه ویدیو بهتر از قبلی‌ها بود، چرا؛ اگه درآمد پایین بود، RPM و عواملش چیه. همین نگاه Data-Driven یوتیوب رو از یه سرگرمی به یه کسب‌وکار واقعی تبدیل کرد.",
      },
    },
    {
      id: 'future', emoji: '🚀',
      keywords: { en: ['future', 'plans', 'plan', 'english channel', 'international channel', 'new channel', 'goal', 'goals', 'roadmap', 'what next', 'whats next'], fa: ['آینده', 'برنامه', 'برنامه‌ها', 'هدف', 'اهداف', 'کانال انگلیسی', 'کانال خارجی', 'کانال جدید', 'بعدش چی'] },
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
  ],
};
