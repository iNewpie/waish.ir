using System;
using System.Collections;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Web.Script.Serialization;
using System.Windows.Forms;

// Small native launcher. All Minecraft account controls belong to waish.ir/admin.
public class Companion : Form {
    readonly string key;
    readonly Button start = new Button(), stop = new Button(), copy = new Button();
    readonly Label status = new Label();
    readonly TextBox logs = new TextBox();
    readonly Timer timer = new Timer();
    readonly JavaScriptSerializer json = new JavaScriptSerializer();
    Process backend;
    bool ready, closing;
    int failedPolls;

    public Companion() {
        Text = "Waish Companion"; ClientSize = new Size(780, 540); MinimumSize = new Size(650, 450);
        StartPosition = FormStartPosition.CenterScreen; BackColor = Color.FromArgb(14, 18, 26);
        ForeColor = Color.FromArgb(235, 239, 245); Font = new Font("Segoe UI", 10);
        byte[] bytes = new byte[32]; using (var rng = RandomNumberGenerator.Create()) rng.GetBytes(bytes);
        key = BitConverter.ToString(bytes).Replace("-", "").ToLowerInvariant();
        var heading = new Label { Text = "WAISH / COMPANION", Location = new Point(24, 20), AutoSize = true, Font = new Font("Segoe UI", 18, FontStyle.Bold) };
        status.SetBounds(26, 64, 710, 25); status.Text = "Starting local service...";
        start.Text = "Start"; start.SetBounds(26, 104, 110, 38);
        stop.Text = "Stop"; stop.SetBounds(146, 104, 110, 38);
        copy.Text = "Copy pairing code"; copy.SetBounds(270, 104, 180, 38);
        foreach (Button b in new Button[] { start, stop, copy }) { b.FlatStyle = FlatStyle.Flat; b.BackColor = Color.FromArgb(30, 36, 49); b.ForeColor = ForeColor; }
        start.Enabled = stop.Enabled = false;
        var help = new Label { Text = "Account controls: waish.ir/admin > Botting. Paste the pairing code there.\nClosing this app disconnects all accounts. No tokens are saved.", Location = new Point(26, 158), Size = new Size(720, 48), ForeColor = Color.FromArgb(165, 176, 194) };
        logs.SetBounds(26, 220, 728, 294); logs.Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right;
        logs.Multiline = true; logs.ReadOnly = true; logs.ScrollBars = ScrollBars.Vertical; logs.BorderStyle = BorderStyle.FixedSingle;
        logs.BackColor = Color.FromArgb(9, 12, 18); logs.ForeColor = Color.FromArgb(188, 207, 198); logs.Font = new Font("Consolas", 9);
        Controls.AddRange(new Control[] { heading, status, start, stop, copy, help, logs });
        copy.Click += delegate { try { Clipboard.SetText(key); status.Text = "Pairing code copied. Paste it into the website."; } catch { status.Text = "Clipboard unavailable. Try again."; } };
        start.Click += delegate { Command("/app/start"); }; stop.Click += delegate { Command("/app/stop"); };
        Shown += delegate { Launch(); };
        FormClosing += delegate { CloseBackend(); };
        timer.Interval = 1500; timer.Tick += delegate { Poll(); };
    }
    void Launch() {
        string root = AppDomain.CurrentDomain.BaseDirectory;
        string node = Path.Combine(root, "runtime", "node.exe");
        if (!File.Exists(node)) node = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe");
        if (!File.Exists(node)) { status.Text = "Node.js 22 or newer is required. See README.txt."; return; }
        string service = Path.Combine(root, "server.mjs");
        if (!File.Exists(service) || !Directory.Exists(Path.Combine(root, "node_modules", "mineflayer"))) { status.Text = "Installation is incomplete. Extract the entire ZIP before opening the app."; return; }
        try {
            var info = new ProcessStartInfo(node, "\"" + service + "\"") { WorkingDirectory = root, UseShellExecute = false, CreateNoWindow = true, RedirectStandardOutput = true, RedirectStandardError = true };
            info.EnvironmentVariables["WAISH_LOCAL_KEY"] = key;
            info.EnvironmentVariables["WAISH_PARENT_PID"] = Process.GetCurrentProcess().Id.ToString();
            // Minecraft protocol debug logging can contain sensitive session information.
            info.EnvironmentVariables.Remove("DEBUG"); info.EnvironmentVariables.Remove("NODE_DEBUG"); info.EnvironmentVariables.Remove("NODE_OPTIONS");
            backend = new Process { StartInfo = info };
            backend.OutputDataReceived += delegate(object s, DataReceivedEventArgs e) { /* Status is read through the local API. */ };
            backend.ErrorDataReceived += delegate(object s, DataReceivedEventArgs e) { /* Do not echo arbitrary dependency output. */ };
            backend.Start(); backend.BeginOutputReadLine(); backend.BeginErrorReadLine(); timer.Start();
        } catch { status.Text = "Could not launch Node.js. Check Windows Security and README.txt."; }
    }
    Dictionary<string, object> Request(string path, bool post) {
        var req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:47836" + path);
        req.Proxy = null; req.Timeout = 1200; req.ReadWriteTimeout = 1200; req.Headers["X-Waish-Key"] = key;
        req.Method = post ? "POST" : "GET";
        if (post) { req.ContentType = "application/json"; byte[] body = Encoding.UTF8.GetBytes("{}"); req.ContentLength = body.Length; using (var stream = req.GetRequestStream()) stream.Write(body, 0, body.Length); }
        using (var response = req.GetResponse()) using (var reader = new StreamReader(response.GetResponseStream())) return json.Deserialize<Dictionary<string, object>>(reader.ReadToEnd());
    }
    void Command(string path) { try { Request(path, true); Poll(); } catch { status.Text = "The local service did not respond. Close and reopen the app."; } }
    void Poll() {
        if (closing) return;
        if (backend == null || backend.HasExited) { timer.Stop(); status.Text = "Service stopped. Check for another app instance or an incomplete installation."; start.Enabled = stop.Enabled = false; return; }
        try {
            var data = Request("/status", false); bool running = (bool)data["running"];
            ready = true; failedPolls = 0; start.Enabled = !running; stop.Enabled = running;
            status.Text = running ? "Running - control accounts from waish.ir/admin" : "Stopped - press Start when you are ready";
            var content = new StringBuilder();
            foreach (object item in (IEnumerable)data["logs"]) { var row = (Dictionary<string, object>)item; content.AppendLine(row["time"] + "  " + row["message"]); }
            string next = content.ToString(); if (logs.Text != next) { logs.Text = next; logs.SelectionStart = logs.Text.Length; logs.ScrollToCaret(); }
        } catch {
            failedPolls++;
            if (ready || failedPolls > 20) status.Text = "Service not responding. Check Windows Security or close and reopen the app.";
        }
    }
    void CloseBackend() {
        closing = true; timer.Stop();
        if (backend == null) return;
        try { if (!backend.HasExited) { try { Request("/app/exit", true); } catch {} if (!backend.WaitForExit(2000)) backend.Kill(); } } catch {}
        backend.Dispose();
    }
    [STAThread] public static int Main(string[] args) {
        Application.EnableVisualStyles(); Application.SetCompatibleTextRenderingDefault(false);
        if (args.Length == 1 && args[0] == "--self-test") {
            using (var app = new Companion()) {
                try {
                    app.Launch();
                    for (int i = 0; i < 30; i++) { app.Poll(); if (app.ready) break; System.Threading.Thread.Sleep(500); }
                    if (!app.ready) return 1;
                    if (!(bool)app.Request("/app/start", true)["running"]) return 2;
                    app.Poll();
                    if ((bool)app.Request("/app/stop", true)["running"]) return 3;
                    return 0;
                } catch { return 4; }
                finally { app.CloseBackend(); }
            }
        }
        Application.Run(new Companion());
        return 0;
    }
}
