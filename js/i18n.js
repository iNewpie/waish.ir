/*LLM module data memory*/
window.I18N = (function () {
  const FA = {
    /* nav / shared */
    'Computer': 'کامپیوتر', 'Projects': 'پروژه‌ها', 'About Me': 'درباره من', 'About me': 'درباره من', 'Contact': 'تماس',
    'aparat': 'آپارات', 'youtube': 'یوتیوب', 'lunamc': 'لونا ام‌سی', 'clutchping': 'کلاچ‌پینگ', 'contact': 'تماس',
    'Waish.ir — Built and hosted by Hossein Danesh.': 'Waish.ir — ساخته و میزبانی‌شده توسط حسین دانش.', 'donate': 'حمایت', 'Donate ♥': 'حمایت ♥', 'nairoshop': 'نایروشاپ',
    'Home': 'خانه', 'Projects page': 'صفحهٔ پروژه‌ها', 'About me page': 'صفحهٔ درباره من',
    'EN': 'EN', 'FA': 'فا',

    /* index */
    "// hi, I'm Waish": '// سلام، من ویش هستم',
    "I've made plenty of online projects and things people actually use and watch!": 'پروژه‌های آنلاین زیادی ساخته‌م و چیزهایی که آدم‌ها واقعاً استفاده می‌کنن و تماشا می‌کنن!',
    'From playing Minecraft BedWars to creating content and leading three successful projects.': 'از بازی کردن بدوارز ماینکرفت تا تولید محتوا و رهبری سه پروژهٔ موفق.',
    'Type /help below, or just talk to my assistant — English or Persian.': 'پایین /help رو بزن، یا همین‌طوری با دستیارم حرف بزن — انگلیسی یا فارسی.',
    'See projects': 'دیدن پروژه‌ها', 'Open the computer →': 'باز کردن کامپیوتر ←',
    'server admin': 'سرور ادمین', 'LunaMC owner': 'صاحب لونا ام‌سی', 'ClutchPing founder': 'بنیان‌گذار کلاچ‌پینگ', 'SEO expert': 'متخصص سئو', 'LunaMC founder': 'بنیان‌گذار لونا ام‌سی', 'NairoShop founder': 'بنیان‌گذار نایروشاپ', '3D artist': 'هنرمند سه‌بعدی', 'WooCommerce builder': 'سازندهٔ ووکامرس',
    'content creator': 'کانتنت کریتور', 'streamer': 'استریمر', 'offline-AI tinkerer': 'اهل ور رفتن با هوش مصنوعی آفلاین',
    'type /help and hit enter': 'بنویس /help و اینتر بزن',
    '// featured server': '// سرور ویژه',
    'Persian-language Minecraft server. Bedwars, custom plugins, and a community that shows up every night. Join with the IP below.': 'سرور ماینکرفت فارسی‌زبان. بدوارز، پلاگین‌های اختصاصی و کامیونیتی‌ای که هر شب آنلاینه. با آی‌پی زیر وارد شو.',
    'click to copy': 'برای کپی کلیک کن', 'copied ✔': 'کپی شد ✔',
    '// who': '// کی', 'About': 'درباره',
    "I'm Waish — I run game servers and build the infrastructure behind them. LunaMC is my Persian-language Minecraft server; ClutchPing is my ping-reduction service for gamers; I build and operate WooCommerce stores, and I stream and make videos on Aparat and YouTube.": 'من ویش‌ام — سرورهای بازی رو مدیریت می‌کنم و زیرساخت پشتشون رو می‌سازم. لونا ام‌سی سرور ماینکرفت فارسی‌زبان منه؛ کلاچ‌پینگ سرویس کاهش پینگ من برای گیمرهاست؛ فروشگاه‌های ووکامرس می‌سازم و مدیریت می‌کنم، و توی آپارات و یوتیوب استریم می‌کنم و ویدیو می‌سازم.',
    'I like systems that connect: a server, a store, a channel, and now an assistant that answers computer questions offline. This site is one of those systems — the terminal above runs on my own knowledge base, in English and Persian.': 'سیستم‌هایی رو دوست دارم که به هم وصل می‌شن: یه سرور، یه فروشگاه، یه کانال، و حالا یه دستیار که سؤال‌های کامپیوتری رو آفلاین جواب می‌ده. این سایت یکی از همون سیستم‌هاست — ترمینال بالا روی پایگاه دانش خودم کار می‌کنه، به انگلیسی و فارسی.',
    "I've built a range of online projects that people genuinely use — communities, services and content with real reach.": 'مجموعه‌ای از پروژه‌های آنلاین ساخته‌م که آدم‌ها واقعاً ازشون استفاده می‌کنن — کامیونیتی‌ها، سرویس‌ها و محتوایی با مخاطب واقعی.',
    'Donate.': 'حمایت.', '// support': '// حمایت', 'If my projects or videos helped you, you can support the work here.': 'اگه پروژه‌ها یا ویدیوهام بهت کمک کردن، می‌تونی اینجا از کار حمایت کنی.', '// Donation links are coming soon.': '// لینک‌های حمایت به‌زودی.', 'Buy me a coffee — every cup goes back into the servers, the videos and the tools on this site.': 'یه قهوه مهمونم کن — هر فنجون برمی‌گرده به سرورها، ویدیوها و ابزارهای این سایت.', '☕ Support on Coffeebede ↗': '☕ حمایت در کافی‌بده ↗', '// coffee': '// قهوه', '// also': '// همچنین', 'Not in a position to donate? Joining the community and sharing the videos helps just as much.': 'نمی‌تونی حمایت مالی کنی؟ پیوستن به کامیونیتی و به اشتراک گذاشتن ویدیوها همون‌قدر کمک می‌کنه.',
    'Until then, the best support is joining the community and sharing the videos.': 'تا اون موقع، بهترین حمایت پیوستن به کامیونیتی و به اشتراک گذاشتن ویدیوهاست.', 'Join Discord ↗': 'عضویت در دیسکورد ↗',
    'Telegram ↗': 'تلگرام ↗', 'Discord ↗': 'دیسکورد ↗', '10k+ members': '+۱۰ هزار عضو', "I've made over 100 videos.": 'بیش از ۱۰۰ ویدیو ساخته‌م.',
    "Minecraft, mostly BedWars — and everything below is what they're made with.": 'ماینکرفت، بیشتر بدوارز — و هر چیزی که پایین می‌بینی همون چیزهاییه که با اون‌ها ساخته می‌شن.',
    '// best way': '// بهترین راه', 'The fastest way to reach me is a ticket on the Discord server. Instagram DMs work too.': 'سریع‌ترین راه برای رسیدن به من، زدن تیکت توی سرور دیسکورده. دایرکت اینستاگرام هم جواب می‌ده.',
    'chat': 'چت', 'dm': 'دایرکت', 'community': 'کامیونیتی', 'shop': 'فروشگاه', 'server · 10k+ members': 'سرور · +۱۰ هزار عضو', 'support': 'پشتیبانی', 'open a ticket': 'تیکت بزن', 'DM me': 'بهم دایرکت بده', 'channel': 'کانال',
    'youtube.com/@WaishChannel · 100+ videos': 'youtube.com/@WaishChannel · +۱۰۰ ویدیو', 'nairo.ir · digital products & services': 'nairo.ir · محصولات و سرویس‌های دیجیتال', 'over 100,000 successful sales': 'بیش از ۱۰۰٬۰۰۰ فروش موفق', 'Instagram ↗': 'اینستاگرام ↗', 'YouTube channel': 'کانال یوتیوب', 'Discord server': 'سرور دیسکورد',
    '@waishchannel · Persian BedWars · content creator': '@waishchannel · بدوارز فارسی · تولیدکنندهٔ محتوا', 'Aparat ↗': 'آپارات ↗', 'YouTube ↗': 'یوتیوب ↗',
    'Offline LLM Terminal': 'ترمینال LLM آفلاین', '6+ years of Cinema 4D experience': '+۶ سال تجربهٔ Cinema 4D', 'Newbie coder (Python · C#)': 'کدنویس تازه‌کار (Python · C#)',
    'Content creator (YouTube · Aparat · Instagram)': 'تولیدکنندهٔ محتوا (یوتیوب · آپارات · اینستاگرام)', 'Algorithm SEO designer': 'طراح الگوریتم سئو', 'Editor (2D and 3D)': 'ادیتور (دوبعدی و سه‌بعدی)',
    'Professional game designer': 'طراح حرفه‌ای بازی', 'Seraph.io Council': 'عضو شورای Seraph.io',
    'Owner': 'مالک', '· over 100k registered members': '· بیش از ۱۰۰ هزار عضو ثبت‌نام‌شده', '· over 100,000 successful sales': '· بیش از ۱۰۰٬۰۰۰ فروش موفق', '· over 500 successful sales ·': '· بیش از ۵۰۰ فروش موفق ·', 'unique idea': 'ایدهٔ منحصربه‌فرد',
    'role': 'نقش', 'server admin / builder': 'سرور ادمین / سازنده', 'infra': 'زیرساخت', 'stack': 'استک', 'game': 'بازی', 'network': 'شبکه', 'content': 'محتوا', 'ai': 'هوش مصنوعی',
    '/ YouTube': '/ یوتیوب', 'offline assistant (EN / FA)': 'دستیار آفلاین (انگلیسی / فارسی)',
    'Type': 'بنویس', 'for commands, or just ask me something — English or فارسی.': 'برای دستورها، یا همین‌طوری یه چیزی بپرس — انگلیسی یا فارسی.',
    '(': '(', 'for the full experience)': 'برای تجربهٔ کامل)',

    /* projects list + cards */
    'Projects — Waish': 'پروژه‌ها — ویش', '// selected work': '// کارهای منتخب', 'Projects.': 'پروژه‌ها.',
    'Servers, services, and content. Click any one to read the full story.': 'سرورها، سرویس‌ها و محتوا. روی هر کدوم کلیک کن تا داستان کاملش رو بخونی.',
    'read more →': 'بیشتر بخون ←', 'live': 'فعال', 'this site': 'همین سایت', 'aparat · youtube': 'آپارات · یوتیوب',
    'Persian-language Minecraft server. Bedwars, custom plugins, and the community around it.': 'سرور ماینکرفت فارسی‌زبان. بدوارز، پلاگین‌های اختصاصی و کامیونیتی دورش.',
    'Ping-reduction and network optimization for gamers. Launched through LunaMC, expanding to every game.': 'کاهش پینگ و بهینه‌سازی شبکه برای گیمرها. از لونا ام‌سی شروع شد و داره به همهٔ بازی‌ها می‌رسه.',
    'Content Creator': 'کانتنت کریتور',
    'I stream and make videos — Persian Bedwars gameplay and tutorials on Aparat and YouTube.': 'استریم می‌کنم و ویدیو می‌سازم — گیم‌پلی و آموزش بدوارز فارسی توی آپارات و یوتیوب.',
    'Computer & Terminal': 'کامپیوتر و ترمینال',
    'A desktop simulator with a handmade terminal: commands start with /, everything else goes to a local knowledge base. English + فارسی.': 'یه شبیه‌ساز دسکتاپ با یه ترمینال دست‌ساز: دستورها با / شروع می‌شن، بقیه‌ش می‌ره سراغ پایگاه دانش محلی. انگلیسی + فارسی.',

    /* project pages */
    '← all projects': '→ همهٔ پروژه‌ها', 'status': 'وضعیت', 'ip': 'آی‌پی', 'modes': 'مودها', 'type': 'نوع', 'born from': 'زاده از', 'site': 'سایت',
    'platforms': 'پلتفرم‌ها', 'language': 'زبان', 'Persian': 'فارسی', 'setup': 'ستاپ', 'see About Me': 'صفحهٔ درباره من', 'runs': 'اجرا', 'in the browser': 'توی مرورگر',
    'languages': 'زبان‌ها', 'commands': 'دستورها', '/help to list': '/help برای لیست', 'source': 'سورس',
    'LunaMC — Waish': 'لونا ام‌سی — ویش', '// minecraft server': '// سرور ماینکرفت',
    'A Persian-language Minecraft server built around Bedwars, custom plugins, and a community that shows up every night.': 'یه سرور ماینکرفت فارسی‌زبان حول بدوارز، پلاگین‌های اختصاصی و کامیونیتی‌ای که هر شب آنلاینه.',
    'What it is': 'چی هست', 'How it runs': 'چطور اجرا می‌شه', 'The community': 'کامیونیتی',
    'LunaMC is my Minecraft server for the Persian community. The core is Bedwars, with custom plugins written for the server and a set of game modes that keep changing based on what players ask for.': 'لونا ام‌سی سرور ماینکرفت من برای کامیونیتی فارسیه. هسته‌ش بدوارزه، با پلاگین‌های اختصاصی که برای سرور نوشته شده و مجموعه‌ای از گیم‌مودها که بر اساس خواستهٔ بازیکن‌ها مدام تغییر می‌کنن.',
    'The server lives on a Linux VPS that I manage myself — Java, custom plugin builds, backups, and the network layer in front of it. ClutchPing actually started here, as the answer to players complaining about ping.': 'سرور روی یه VPS لینوکسی که خودم مدیریتش می‌کنم زنده‌ست — جاوا، بیلد پلاگین‌های اختصاصی، بکاپ و لایهٔ شبکهٔ جلوش. کلاچ‌پینگ در واقع از همین‌جا شروع شد، به عنوان جواب به بازیکن‌هایی که از پینگ شکایت داشتن.',
    'Write about the players, the Discord, events, tournaments, whatever you want people to know. This text is a placeholder — replace it with your own story.': 'دربارهٔ بازیکن‌ها، دیسکورد، ایونت‌ها، تورنمنت‌ها و هر چیزی که می‌خوای مردم بدونن بنویس. این متن موقته — با داستان خودت جایگزینش کن.',
    'Minecraft (Java)': 'ماینکرفت (جاوا)', 'Bedwars + more': 'بدوارز + بیشتر', 'Java plugins, Linux VPS': 'پلاگین‌های جاوا، VPS لینوکس', 'Join: Play.LunaMC.iR': 'ورود: Play.LunaMC.iR', 'ClutchPing →': 'کلاچ‌پینگ ←',
    'ClutchPing — Waish': 'کلاچ‌پینگ — ویش', '// network service': '// سرویس شبکه',
    'Ping-reduction and network optimization for gamers. It started as a fix for LunaMC players and is expanding to every game.': 'کاهش پینگ و بهینه‌سازی شبکه برای گیمرها. به عنوان راه‌حلی برای بازیکن‌های لونا ام‌سی شروع شد و داره به همهٔ بازی‌ها می‌رسه.',
    'The problem': 'مشکل', 'What ClutchPing does': 'کلاچ‌پینگ چیکار می‌کنه', 'Where it is going': 'به کجا می‌ره',
    'High ping is mostly bad routing — your packets take a long, congested path to the game server. Players on LunaMC felt it every night.': 'پینگ بالا بیشتر از مسیریابی بده — پکت‌هات یه مسیر طولانی و شلوغ تا سرور بازی می‌رن. بازیکن‌های لونا ام‌سی هر شب حسش می‌کردن.',
    'ClutchPing routes your game traffic through optimized relays so it reaches the server on a shorter, more stable path. Lower latency, fewer spikes.': 'کلاچ‌پینگ ترافیک بازیت رو از رله‌های بهینه رد می‌کنه تا از مسیر کوتاه‌تر و پایدارتری به سرور برسه. تأخیر کمتر، اسپایک کمتر.',
    'Placeholder — write about supported games, pricing, how to sign up, and what is coming next.': 'موقت — دربارهٔ بازی‌های پشتیبانی‌شده، قیمت، نحوهٔ ثبت‌نام و برنامه‌های بعدی بنویس.',
    'relay / latency optimization': 'رله / بهینه‌سازی تأخیر', 'LunaMC →': 'لونا ام‌سی ←',
    'Content Creator — Waish': 'کانتنت کریتور — ویش', '// streams & videos': '// استریم‌ها و ویدیوها',
    'I stream and make videos — Persian Bedwars gameplay, tutorials, and whatever I am building at the time.': 'استریم می‌کنم و ویدیو می‌سازم — گیم‌پلی بدوارز فارسی، آموزش، و هر چیزی که اون موقع دارم می‌سازم.',
    'Where to watch': 'کجا ببینی', 'What you will find': 'چی پیدا می‌کنی', 'The setup': 'ستاپ',
    'Streams and videos go up on Aparat at aparat.com/waish, and on YouTube. Bedwars is the main thing, but server-building and setup content shows up too.': 'استریم‌ها و ویدیوها توی آپارات (aparat.com/waish) و یوتیوب می‌رن. بدوارز اصل ماجراست، ولی محتوای ساخت سرور و ستاپ هم هست.',
    'Placeholder — describe your series, upload schedule, the kind of content you make, and what viewers should expect.': 'موقت — سری‌هات، برنامهٔ آپلود، نوع محتوایی که می‌سازی و انتظاری که بیننده باید داشته باشه رو توضیح بده.',
    'Everything I record and stream with is listed on the About Me page — keyboard, mice, audio, mic, monitor, and the PC itself.': 'هر چیزی که باهاش ضبط و استریم می‌کنم توی صفحهٔ درباره من لیست شده — کیبورد، موس‌ها، صدا، میکروفون، مانیتور و خود سیستم.',
    ', YouTube': '، یوتیوب', 'Bedwars, tutorials, streams': 'بدوارز، آموزش، استریم', 'YouTube (link soon)': 'یوتیوب (لینک به‌زودی)', 'PC setup →': 'ستاپ کامپیوتر ←',
    'Offline Terminal — Waish': 'ترمینال آفلاین — ویش', '// assistant': '// دستیار', 'Offline Terminal': 'ترمینال آفلاین',
    'The assistant living in this site. Commands start with /, everything else goes to a local knowledge base — in English or Persian.': 'دستیاری که توی این سایت زندگی می‌کنه. دستورها با / شروع می‌شن، بقیه‌ش می‌ره سراغ یه پایگاه دانش محلی — انگلیسی یا فارسی.',
    'How it works': 'چطور کار می‌کنه', 'What it knows': 'چی می‌دونه', 'Next': 'بعدی',
    'Everything runs in the browser. Anything you type that starts with / is a command; anything else is matched against a knowledge base I maintain myself, and the answer fades in word by word. Write in Persian and it answers in Persian.': 'همه‌چیز توی مرورگر اجرا می‌شه. هر چیزی که با / شروع بشه دستوره؛ بقیه با پایگاه دانشی که خودم نگه می‌دارم مطابقت داده می‌شه و جواب کلمه‌به‌کلمه ظاهر می‌شه. فارسی بنویس، فارسی جواب می‌ده.',
    'Who I am, LunaMC, ClutchPing, my content, my full PC setup, and a set of computer-science basics — TCP, UDP, HTTP, DNS, ping, RAM, processes vs threads, Big-O.': 'اینکه کی‌ام، لونا ام‌سی، کلاچ‌پینگ، محتوام، ستاپ کامل کامپیوترم و یه سری مبانی علوم کامپیوتر — TCP، UDP، HTTP، DNS، پینگ، RAM، پروسس و ترد، Big-O.',
    'Placeholder — write about what you want to add: a bigger knowledge base, a real language model behind it, voice, whatever is on the roadmap.': 'موقت — دربارهٔ چیزهایی که می‌خوای اضافه کنی بنویس: پایگاه دانش بزرگ‌تر، یه مدل زبانی واقعی پشتش، صدا، هر چی توی نقشهٔ راهه.',
    'English, فارسی': 'انگلیسی، فارسی', 'Open the terminal': 'باز کردن ترمینال',

    /* about me */
    "About me — Waish's setup, texture packs & settings": 'درباره من — ستاپ، تکسچر پک‌ها و تنظیمات ویش',
    '// about me': '// درباره من', 'Setup, packs & settings.': 'ستاپ، پک‌ها و تنظیمات.',
    'What I stream and record with, the Minecraft texture packs I use, and the settings behind them.': 'چیزهایی که باهاشون استریم و ضبط می‌کنم، تکسچر پک‌های ماینکرفتی که استفاده می‌کنم و تنظیمات پشتشون.',
    '// stream / recording': '// استریم / ضبط', 'PC Setup': 'ستاپ کامپیوتر', '// the desk': '// میز', '// the whole thing': '// کل ماجرا',
    '// minecraft': '// ماینکرفت', 'Texture Packs': 'تکسچر پک‌ها', '// config': '// تنظیمات', 'Settings': 'تنظیمات',
    '// texture packs coming soon': '// تکسچر پک‌ها به‌زودی', '// settings coming soon': '// تنظیمات به‌زودی',
    'keyboard': 'کیبورد', 'mice': 'موس‌ها', 'audio': 'صدا', 'mousepad': 'موس‌پد', 'microphone': 'میکروفون', 'monitor': 'مانیتور', 'chair': 'صندلی', 'pc': 'کامپیوتر',
    'Waish Fully Customized Keyboard': 'کیبورد فول کاستوم ویش', 'Switches': 'سوییچ', 'Springs': 'فنر', 'upgraded → Glorious Panda': 'ارتقا ← Glorious Panda', 'Mod': 'ماد', 'fully lubed': 'کاملاً لوب‌شده',
    '// built and tuned by hand': '// با دست ساخته و تنظیم شده', 'Main + collection': 'اصلی + کلکسیون', 'Main': 'اصلی', 'Wireless': 'بی‌سیم', 'Alt': 'جایگزین',
    'Headset & IEMs': 'هدست و IEM', 'Headset': 'هدست', 'Pads & deskmats': 'پد و دسک‌مت', 'Mousepad': 'موس‌پد', 'Deskmats': 'دسک‌مت', '3× Jadookb': '۳ تا Jadookb',
    'Mic': 'میکروفون', 'Use': 'کاربرد', 'stream + recording': 'استریم + ضبط', 'Panel': 'پنل', 'Refresh': 'رفرش', 'Chair': 'صندلی', 'a new, random DxRacer': 'یه DxRacer جدید و رندوم',
    "// it's a chair. it works.": '// صندلیه دیگه. کار می‌کنه.', 'The machine': 'خود سیستم', 'CPU': 'پردازنده', 'GPU': 'گرافیک', 'RAM': 'رم', 'Storage': 'حافظه',
    'Desk: Asus monitor, custom keyboard, Lamzu mouse on the Wraith pad': 'میز: مانیتور ایسوس، کیبورد کاستوم، موس Lamzu روی پد Wraith',
    'Full setup with the DxRacer chair, QuadCast S on the boom arm and the camera rig': 'ستاپ کامل با صندلی DxRacer، میکروفون QuadCast S روی بازو و ریگ دوربین',

    /* contact */
    'Contact — Waish': 'تماس — ویش', '// say hi': '// سلام کن', 'Contact.': 'تماس.', 'Where to find me and how to reach me.': 'کجا پیدام کنی و چطور بهم برسی.',
    'streams & videos': 'استریم و ویدیو', 'minecraft': 'ماینکرفت', 'server': 'سرور', 'service': 'سرویس', 'more': 'بیشتر', 'YouTube · Discord · Email': 'یوتیوب · دیسکورد · ایمیل', 'coming soon': 'به‌زودی',
    '// this page is a placeholder — tell me what should go here': '// این صفحه موقته — بگو چی باید اینجا باشه',

    /* computer / desktop */
    'waish@computer': 'waish@computer',
    '// drag windows by their title bar · resize from the edges / corner ·': '// پنجره‌ها رو از نوار عنوان بکش · از لبه‌ها / گوشه تغییر اندازه بده ·',
    '// drag windows by their title bar · drag one to the': '// پنجره‌ها رو از نوار عنوان بکش · یکی رو تا', 'top edge': 'لبهٔ بالا',
    'for fullscreen, pull it back down to restore · resize from the edges / corner ·': 'بکش تا تمام‌صفحه شه، دوباره پایین بکش تا به اندازهٔ قبل برگرده · از لبه‌ها / گوشه تغییر اندازه بده ·',
    'green': 'سبز', 'dot maximizes': 'نقطهٔ سبز بزرگ می‌کنه', 'apps': 'برنامه‌ها', 'close': 'بستن', 'minimize': 'کوچک کردن', 'maximize': 'بزرگ کردن', 'Terminal': 'ترمینال', 'YouTube': 'یوتیوب', 'Social': 'شبکه‌های اجتماعی', 'youtube · instagram · telegram · discord': 'یوتیوب · اینستاگرام · تلگرام · دیسکورد', 'Aparat': 'آپارات', 'LunaMC': 'لونا ام‌سی', 'ClutchPing': 'کلاچ‌پینگ', 'NairoShop': 'نایروشاپ', 'This PC': 'این کامپیوتر', 'Snake': 'مار', 'Tetris': 'تتریس', 'Mini Minecraft': 'مینی ماینکرفت', 'Calculator': 'ماشین‌حساب', 'Calendar': 'تقویم', 'User Lookup': 'جستجوی کاربر', 'Skin Lookup': 'جستجوی اسکین', 'Minecraft · Seraph · Bordic': 'ماینکرفت · Seraph · Bordic', 'Games': 'بازی‌ها', 'build & mine': 'بساز و حفاری کن', 'Persian · Gregorian': 'شمسی · میلادی',
    'Small games made for this computer. Scores and worlds are saved in your browser.': 'بازی‌های کوچکی که برای این کامپیوتر ساخته شدن. امتیازها و دنیاها توی مرورگرت ذخیره می‌شن.',
    'youtube.com · Persian BedWars': 'youtube.com · بدوارز فارسی',
    'The Waish YouTube channel — Minecraft, mostly BedWars. Gameplay, PvP mechanics, ping & optimization, clients, and the occasional server-building video. Proper editing, thumbnails and structure.': 'کانال یوتیوب ویش — ماینکرفت، بیشتر بدوارز. گیم‌پلی، مکانیک‌های PvP، پینگ و آپتیمایز، کلاینت‌ها و گاهی ویدیوی ساخت سرور. تدوین، تامبنیل و ساختار حرفه‌ای.',
    'Open YouTube ↗': 'باز کردن یوتیوب ↗', 'link coming soon': 'لینک به‌زودی', 'external site': 'سایت خارجی',
    'Streams and videos for the Persian-speaking community — BedWars gameplay, tutorials, and whatever Waish is building at the time.': 'استریم و ویدیو برای کامیونیتی فارسی‌زبان — گیم‌پلی بدوارز، آموزش و هر چیزی که ویش اون موقع داره می‌سازه.',
    'Open Aparat ↗': 'باز کردن آپارات ↗', 'digital products & services': 'محصولات و خدمات دیجیتال',
    "NairoShop started from a real problem: many Iranian users can't buy foreign digital services and products because of international payment restrictions. NairoShop gives access to the products and services that are hard to pay for directly from Iran.": 'نایروشاپ از یه مشکل واقعی شروع شد: خیلی از کاربرای ایرانی به‌خاطر محدودیت‌های پرداخت بین‌المللی نمی‌تونن سرویس‌ها و محصولات دیجیتال خارجی بخرن. نایروشاپ دسترسی به محصولات و خدماتی رو می‌ده که پرداخت مستقیمشون از ایران سخته.',
    'Open NairoShop ↗': 'باز کردن نایروشاپ ↗',
    'drives': 'درایوها', 'Gallery': 'گالری', 'Useful apps': 'برنامه‌های مفید', 'Editing': 'تدوین', 'Videos': 'ویدیوها', 'items': 'آیتم', '% free of': '٪ خالی از',
    'Cinema 4D projects': 'پروژه‌های Cinema 4D', 'Blender scenes': 'صحنه‌های Blender', 'Thumbnails': 'تامبنیل‌ها', 'Renders': 'رندرها', 'Aparat channel': 'کانال آپارات', 'link soon': 'لینک به‌زودی',
    'BedWars': 'بدوارز', 'Tutorials': 'آموزش‌ها', 'Streams': 'استریم‌ها', '3D · ~6 years': 'سه‌بعدی · حدود ۶ سال', '3D': 'سه‌بعدی', 'scripts': 'اسکریپت', 'databases': 'دیتابیس',
    'Apps Waish actually uses. Add or rename them in js/desktop.js → DRIVES → D:// Useful apps.': 'برنامه‌هایی که ویش واقعاً استفاده می‌کنه. توی js/desktop.js → DRIVES → D:// اضافه یا ویرایش کن.',
    'idea & script → recording → editing → thumbnail → SEO → upload → analytics': 'ایده و اسکریپت ← ضبط ← تدوین ← تامبنیل ← سئو ← آپلود ← آنالیتیکس',
    '// This terminal is handmade and its been developing overtime in here, feel free to use it and know more about': '// این ترمینال دست‌سازه و همین‌جا به مرور توسعه پیدا کرده؛ راحت ازش استفاده کن و بیشتر دربارهٔ',
    'type /help, or ask anything (English / فارسی)': 'بنویس /help یا هر چیزی بپرس (انگلیسی / فارسی)',

    /* terminal UI */
    'booting waish@computer…': 'در حال بوت waish@computer…', 'knowledge base loaded': 'پایگاه دانش لود شد', 'topics · en / fa': 'موضوع · انگلیسی / فارسی', 'assistant online': 'دستیار آنلاینه',
    'Welcome. Commands start with': 'خوش اومدی. دستورها با', '— try': 'شروع می‌شن — امتحان کن:', '. Anything else is a question for me.': '. هر چیز دیگه‌ای یه سؤال برای منه.',
    'Tip:': 'نکته:', 'opens an app window ·': 'یه پنجرهٔ برنامه باز می‌کنه ·', 'lists them.': 'لیستشون می‌کنه.',
    'Commands start with': 'دستورها با', '. Anything else is a question for the assistant (English or فارسی).': 'شروع می‌شن. هر چیز دیگه‌ای یه سؤال برای دستیاره (انگلیسی یا فارسی).',
    'who Waish is': 'ویش کیه', 'list his work': 'لیست کارهاش', 'the Minecraft server': 'سرور ماینکرفت', 'copy the LunaMC server IP': 'کپی آی‌پی سرور لونا ام‌سی', 'the ping-reduction service': 'سرویس کاهش پینگ',
    'the full Waish story (/story fa for Persian)': 'داستان کامل ویش (/story fa برای فارسی)', 'PC / stream setup': 'ستاپ کامپیوتر / استریم', 'open the About Me page (setup, packs, settings)': 'باز کردن صفحهٔ درباره من (ستاپ، پک‌ها، تنظیمات)',
    'where to find Waish': 'ویش رو کجا پیدا کنی', 'how to reach him': 'چطور بهش برسی', 'clear the screen': 'پاک کردن صفحه', 'open an app window (see /apps)': 'باز کردن پنجرهٔ برنامه (/apps رو ببین)',
    'list the apps on this computer': 'لیست برنامه‌های این کامپیوتر', 'back to the main site': 'برگشت به سایت اصلی', 'set terminal wallpaper opacity': 'شفافیت والپیپر ترمینال', 'open the computer (desktop + full terminal)': 'باز کردن کامپیوتر (دسکتاپ + ترمینال کامل)',
    'Recycle Bin': 'سطل بازیافت', 'Music': 'موزیک', 'All projects': 'همهٔ پروژه‌ها', 'Restore': 'بازگردانی', 'Restore all': 'بازگردانی همه', 'Empty Recycle Bin': 'خالی کردن سطل', 'Move to Recycle Bin': 'انتقال به سطل بازیافت', 'Open': 'باز کردن', 'Recycle Bin is empty.': 'سطل بازیافت خالیه.', 'Drag a desktop icon onto the bin, or right-click it, to put it here. Refreshing the page brings everything back.': 'یه آیکون دسکتاپ رو بکش روی سطل، یا روش راست‌کلیک کن، تا بیاد اینجا. با رفرش صفحه همه‌چیز برمی‌گرده.',
    'Example:': 'مثال:', 'Apps on this computer:': 'برنامه‌های این کامپیوتر:', 'Open one with': 'یکی رو باز کن با', 'opened': 'باز شد', 'Full page:': 'صفحهٔ کامل:', 'Stream / recording setup': 'ستاپ استریم / ضبط',
  };

  // keep /commands and @handles reading left-to-right inside Persian sentences (LRM marks around them —
  // otherwise the bidi algorithm pushes the leading / or @ to the other side: "waishchannel@")
  Object.keys(FA).forEach(k => { if (/[\u0600-\u06FF]/.test(FA[k])) FA[k] = FA[k].replace(/(\/[a-z]+|@[A-Za-z0-9_.]+)/g, '\u200E$1\u200E'); });

  let lang = 'en';
  try { lang = localStorage.getItem('waish-lang') === 'fa' ? 'fa' : 'en'; } catch (e) {}
  const t = s => (lang === 'fa' && s in FA) ? FA[s] : s;
  const norm = s => s.replace(/\s+/g, ' ').trim();
  const ATTRS = ['placeholder', 'title', 'alt', 'data-type', 'aria-label'];

  function translateNode(node) {
    if (node.nodeType === 3) {
      const raw = node.nodeValue, key = norm(raw);
      if (key && key in FA) {
        const p = node.parentElement; if (p && p.closest('[data-i18n-skip], script, style, .term-body, .assistant')) return;
        node.nodeValue = raw.replace(key, FA[key]).replace(raw.trim(), FA[key]);
      }
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.closest && node.closest('[data-i18n-skip]')) return;
    ATTRS.forEach(a => { const v = node.getAttribute && node.getAttribute(a); if (v && norm(v) in FA) node.setAttribute(a, FA[norm(v)]); });
    node.childNodes.forEach(translateNode);
  }

  function apply() {
    if (lang !== 'fa') return;
    document.documentElement.lang = 'fa'; document.documentElement.dir = 'rtl'; document.documentElement.classList.add('fa');
    if (norm(document.title) in FA) document.title = FA[norm(document.title)];
    translateNode(document.body);
    new MutationObserver(muts => muts.forEach(m => {
      m.addedNodes.forEach(translateNode);
      if (m.type === 'characterData') translateNode(m.target);
    })).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  function toggle() {
    try { localStorage.setItem('waish-lang', lang === 'fa' ? 'en' : 'fa'); } catch (e) {}
    location.reload();
  }
  function button(cls) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'lang-toggle ' + (cls || '');
    b.setAttribute('data-i18n-skip', ''); b.title = lang === 'fa' ? 'Switch to English' : 'تغییر به فارسی';
    b.innerHTML = lang === 'fa' ? '<b>فا</b><span>EN</span>' : '<b>EN</b><span>فا</span>';
    b.addEventListener('click', toggle); return b;
  }

  if (document.body) apply(); else document.addEventListener('DOMContentLoaded', apply);
  return { get lang() { return lang; }, t, toggle, button, FA };
})();
