const { app, BrowserWindow, Menu, Tray, shell } = require("electron");
const path = require("path");
const http = require("http");

let mainWindow = null;
const PORT = process.env.PORT || 3000;
const PRODUCTION_CLOUD_BASE =
  process.env.APP_URL || "https://dr-orthos-alpha.vercel.app";
const LOCAL_SERVER_BASE = `http://127.0.0.1:${PORT}`;

// Enforce single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (!mainWindow.isVisible()) mainWindow.show();
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function checkLocalServer(port = PORT, timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/queue`, (res) => {
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function pollServer(url, timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode && res.statusCode < 500) {
            resolve(true);
          } else {
            setTimeout(check, 500);
          }
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(new Error("Timeout waiting for local Next.js server"));
          } else {
            setTimeout(check, 500);
          }
        });
    };
    check();
  });
}

async function createMainWindow() {
  const appIconPath =
    process.platform === "win32"
      ? path.join(__dirname, "../public/app-icon.ico")
      : path.join(__dirname, "../public/logo.png");

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 720,
    title: "Dr. Orthos - Clinic OPD Software",
    backgroundColor: "#ffffff",
    icon: appIconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      plugins: true,
    },
    show: false,
  });

  // Show window immediately once ready
  mainWindow.once("ready-to-show", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Native application menu
  const menuTemplate = [
    {
      label: "File",
      submenu: [
        {
          label: "Reload (Get Latest Updates)",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow?.reload(),
        },
        {
          label: "Force Reload (Clear Cache)",
          accelerator: "CmdOrCtrl+Shift+R",
          click: async () => {
            try {
              await mainWindow?.webContents.session.clearCache();
            } catch {}
            mainWindow?.webContents.reloadIgnoringCache();
          },
        },
        { type: "separator" },
        { role: "quit", label: "Exit Software" },
      ],
    },
    {
      label: "Server",
      submenu: [
        {
          label: "Cloud Live Server (Vercel)",
          click: async () => {
            try {
              await mainWindow?.webContents.session.clearCache();
            } catch {}
            mainWindow?.loadURL(`${PRODUCTION_CLOUD_BASE}/queue`, {
              extraHeaders: "pragma: no-cache\nCache-Control: no-cache\n",
            });
          },
        },
        {
          label: "Local Dev Server (127.0.0.1:3000)",
          click: async () => {
            try {
              await mainWindow?.webContents.session.clearCache();
            } catch {}
            mainWindow?.loadURL(`${LOCAL_SERVER_BASE}/queue`, {
              extraHeaders: "pragma: no-cache\nCache-Control: no-cache\n",
            });
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        { role: "toggleDevTools" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "Check for Updates",
          click: async () => {
            try {
              await mainWindow?.webContents.session.clearCache();
            } catch {}
            mainWindow?.webContents.reloadIgnoringCache();
          },
        },
        { type: "separator" },
        {
          label: "Visit Documentation / Online Portal",
          click: async () => {
            await shell.openExternal("https://drorthos.in");
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  // External links open in default web browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  try {
    // Clear HTTP and session cache on startup to guarantee latest updates are immediately loaded
    try {
      await mainWindow.webContents.session.clearCache();
    } catch (cacheErr) {
      console.warn("Could not clear session cache:", cacheErr);
    }

    // Determine target URL: prefer local server if running, else Cloud server
    let targetUrl = `${PRODUCTION_CLOUD_BASE}/queue`;
    if (process.env.ELECTRON_LOCAL === "1") {
      targetUrl = `${LOCAL_SERVER_BASE}/queue`;
      await pollServer(LOCAL_SERVER_BASE);
    } else {
      const isLocalActive = await checkLocalServer();
      if (isLocalActive) {
        targetUrl = `${LOCAL_SERVER_BASE}/queue`;
      }
    }

    await mainWindow.loadURL(targetUrl, {
      extraHeaders: "pragma: no-cache\nCache-Control: no-cache\n",
    });
  } catch (err) {
    console.error("Failed to connect to clinic server:", err);
    mainWindow.loadURL(`data:text/html;charset=utf-8,
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Dr. Orthos OPD - Offline</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #f8fafc;
              color: #0f172a;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              padding: 24px;
            }
            .card {
              background: #ffffff;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 40px 32px;
              max-width: 440px;
              text-align: center;
              box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
            }
            .icon-wrap {
              width: 64px;
              height: 64px;
              background: #e0f2fe;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              margin-bottom: 20px;
            }
            h1 { font-size: 20px; font-weight: 700; color: #0f172a; margin-bottom: 8px; }
            p { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: #0284c7;
              color: #ffffff;
              font-weight: 600;
              font-size: 14px;
              padding: 10px 24px;
              border-radius: 10px;
              border: none;
              cursor: pointer;
              transition: background 0.15s ease;
            }
            .btn:hover { background: #0369a1; }
            .note { font-size: 12px; color: #94a3b8; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon-wrap">🏥</div>
            <h1>Dr. Orthos Clinic OPD</h1>
            <p>Unable to connect to the clinic cloud server. Please check your internet connection.</p>
            <button class="btn" onclick="retry()">Reconnect Now</button>
            <div class="note">Automatically reconnects when internet is restored...</div>
          </div>
          <script>
            function retry() {
              window.location.href = '${APP_URL}';
            }
            window.addEventListener('online', retry);
          </script>
        </body>
      </html>
    `);
  }

  // Safety fallback: if ready-to-show already fired during loadURL, ensure window is visible
  if (mainWindow && !mainWindow.isVisible()) {
    mainWindow.show();
    mainWindow.focus();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  await createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
