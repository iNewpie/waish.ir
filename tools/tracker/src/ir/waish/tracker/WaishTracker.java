package ir.waish.tracker;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import net.minecraftforge.client.event.ClientChatReceivedEvent;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.fml.common.FMLCommonHandler;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.common.event.FMLInitializationEvent;
import net.minecraftforge.fml.common.eventhandler.EventPriority;
import net.minecraftforge.fml.common.eventhandler.SubscribeEvent;
import net.minecraftforge.fml.common.gameevent.TickEvent;

@Mod(modid = "waishtracker", name = "Waish Tracker", version = "0.1.0", clientSideOnly = true, acceptedMinecraftVersions = "[1.8.9]", acceptableRemoteVersions = "*")
public final class WaishTracker {
    private Object previousWorld;
    private long nextQuery, pendingUntil;
    private boolean active;
    private final Path folder = Paths.get(System.getProperty("user.home"), ".waish-companion");

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        FMLCommonHandler.instance().bus().register(this);
        MinecraftForge.EVENT_BUS.register(this);
        publish(null);
    }
    // Support both development names and Forge's runtime SRG names. No account/session fields are accessed.
    private static Object field(Object object, String... names) throws Exception {
        for (String name : names) {
            try { Field f = object.getClass().getField(name); return f.get(object); }
            catch (NoSuchFieldException ignored) {}
        }
        throw new NoSuchFieldException();
    }
    private static Object call(Object object, String... names) throws Exception {
        Class<?> c = object instanceof Class ? (Class<?>) object : object.getClass();
        for (String name : names) {
            try { Method m = c.getMethod(name); return m.invoke(object instanceof Class ? null : object); }
            catch (NoSuchMethodException ignored) {}
        }
        throw new NoSuchMethodException();
    }
    private static void chat(Object player, String command) throws Exception {
        for (String name : new String[] { "sendChatMessage", "func_71165_d" }) {
            try { player.getClass().getMethod(name, String.class).invoke(player, command); return; }
            catch (NoSuchMethodException ignored) {}
        }
        throw new NoSuchMethodException();
    }
    @SubscribeEvent
    public void tick(TickEvent.ClientTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;
        try {
            Object mc = call(Class.forName("net.minecraft.client.Minecraft"), "getMinecraft", "func_71410_x");
            Object world = field(mc, "theWorld", "field_71441_e");
            Object player = field(mc, "thePlayer", "field_71439_g");
            Object server = call(mc, "getCurrentServerData", "func_147104_D");
            String host = server == null ? "" : String.valueOf(field(server, "serverIP", "field_78845_b")).toLowerCase(Locale.ROOT).split(":")[0];
            boolean hypixel = host.equals("hypixel.net") || host.endsWith(".hypixel.net");
            long now = System.currentTimeMillis();
            if (!hypixel || world == null || player == null) {
                if (active) publish(null);
                active = false; previousWorld = null; pendingUntil = 0; return;
            }
            active = true;
            if (world != previousWorld) {
                previousWorld = world; pendingUntil = 0; nextQuery = now + 3000; publish(null);
            }
            if (now >= nextQuery) {
                nextQuery = now + 15000; pendingUntil = now + 8000;
                chat(player, "/locraw");
            }
        } catch (Exception ignored) {
            if (active) publish(null);
            active = false; previousWorld = null; pendingUntil = 0;
        }
    }
    @SubscribeEvent(priority = EventPriority.HIGHEST, receiveCanceled = true)
    public void message(ClientChatReceivedEvent event) {
        if (!active || System.currentTimeMillis() > pendingUntil) return;
        try {
            Object component = field(event, "message");
            String text = String.valueOf(call(component, "getUnformattedText", "func_150260_c")).trim();
            if (!text.startsWith("{") || !text.endsWith("}")) return;
            JsonObject source = new JsonParser().parse(text).getAsJsonObject();
            if (!source.has("server")) return;
            String server = source.get("server").getAsString();
            if (!server.matches("[A-Za-z0-9_-]{1,50}")) return;
            JsonObject result = new JsonObject();
            result.addProperty("server", server);
            for (String name : new String[] { "gametype", "mode", "map" }) {
                String value = source.has(name) ? source.get(name).getAsString() : "";
                result.addProperty(name, value.substring(0, Math.min(80, value.length())));
            }
            result.addProperty("observedAt", System.currentTimeMillis());
            publish(result); pendingUntil = 0;
            // Hide only the server response to this tracker's outstanding request.
            if (event.isCancelable()) event.setCanceled(true);
        } catch (Exception ignored) {}
    }
    private void publish(JsonObject location) {
        try {
            Files.createDirectories(folder);
            Path temp = folder.resolve("location.tmp"), target = folder.resolve("location.json");
            Files.write(temp, (location == null ? "null" : location.toString()).getBytes(StandardCharsets.UTF_8));
            try { Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE); }
            catch (java.nio.file.AtomicMoveNotSupportedException ignored) { Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING); }
        } catch (Exception ignored) { /* The dashboard treats missing/unwritable data as unknown. */ }
    }
}
