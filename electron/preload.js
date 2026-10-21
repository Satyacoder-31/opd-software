const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopEnv", {
  isDesktop: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
});
