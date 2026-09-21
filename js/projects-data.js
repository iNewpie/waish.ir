/* ============================================================
   PROJECT LIST — used by projects.html (cards) and the terminal.
   Each project has its own page in projects/<slug>.html — that's
   where the long-form writing lives.
   ============================================================ */
window.PROJECTS = [
  { slug: "lunamc", name: "LunaMC", tag: "live", tagText: "live", img: "assets/luna-logo.png", media: "bg", bg: "assets/luna-bg.jpg?v=20260916c",
    desc: "Persian-language Minecraft server. Bedwars, custom plugins, and the community around it.", meta: ["minecraft", "java", "plugins"] },
  { slug: "clutchping", name: "ClutchPing", tag: "cyan", tagText: "clutchping.com", img: "assets/clutchping-glow.png", media: "cp",
    desc: "Ping-reduction and network optimization for gamers. Launched through LunaMC, expanding to every game.", meta: ["network", "relay", "latency"] },
  { slug: "wbio", name: "wbio.ir", tag: "violet", tagText: "wbio.ir", img: "assets/wbio-logo.png", media: "wbio",
    desc: "Bio-link pages for Iran: one link for every social, 20 themes, live game cards, your own domain — free to start.", meta: ["saas", "cloudflare", "workers"] },
  { slug: "content-creator", name: "Content Creator", tag: "live", tagText: "aparat · youtube", video: "assets/avatar.mp4", img: "assets/avatar.jpg", media: "cover",
    desc: "I stream and make videos — Persian Bedwars gameplay and tutorials on Aparat and YouTube.", meta: ["stream", "video", "editing"] },
  { slug: "offline-terminal", name: "Computer & Terminal", tag: "live", tagText: "this site", img: "", media: "term",
    desc: "A desktop simulator with a handmade terminal: commands start with /, everything else goes to a local knowledge base. English + فارسی.", meta: ["assistant", "kb", "js"] },
];
