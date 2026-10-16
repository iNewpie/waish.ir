# Waish Tracker for Lunar / Forge 1.8.9

Client-only tracking companion for the website's Botting section. See `../companion/README.md` for installation, data handling, and limits. Requires a Lunar profile that supports loading custom Forge mods.

Build on a modern JDK using `javac --release 8`, with the Forge 1.8.9 universal JAR and Gson 2.2.4 on the classpath. Package the generated classes plus `mcmod.info` in `WaishTracker-1.8.9.jar`. Both dependencies are compile-only; they are supplied by Minecraft/Forge at runtime.

The implementation only reads current world/server information, sends `/locraw`, and writes the resulting location to the user's local `.waish-companion/location.json`. It never accesses login/session fields. It is not a mechanism for selecting a Hypixel game instance.
