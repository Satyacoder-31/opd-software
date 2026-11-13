const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopEnv", {
  isDesktop: true,
  platform: process.platform,
  version: process.env.npm_package_version || "1.0.0",
  openPdf: (base64Data, filename) =>
    ipcRenderer.invoke("desktop:open-pdf", { base64Data, filename }),
  printHtml: (htmlContent) =>
    ipcRenderer.invoke("desktop:print-html", { htmlContent }),
});
