const { app, BrowserWindow, Menu, session, shell } = require("electron");

let mainWin;
let splash;

function createWindow() {
  // Splash screen
  splash = new BrowserWindow({
    width: 600,
    height: 250,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
  });
  splash.loadFile("splash.html");
  splash.center();

  // Main window
  mainWin = new BrowserWindow({
    show: false,
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    icon: __dirname + "/icon.png",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
  });

  // Open external links in default browser
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  // Block known ad URLs
  const filter = {
    urls: [
      "*://*.photopea.com/ad/*",
      "*://*.photopea.com/promo/*",
      "*://*.doubleclick.net/*",
      "*://*.googlesyndication.com/*",
      "*://*.adsafeprotected.com/*",
    ],
  };
  session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
    callback({ cancel: true });
  });

  mainWin.loadURL("https://www.photopea.com/");

  // Once loaded
  mainWin.webContents.on("did-finish-load", async () => {
    // Remove ad placeholders
    await mainWin.webContents.executeJavaScript(`
      const ads = document.querySelectorAll(
        'img[src*="pp_wide.png"], img[src*="pp_ad"], img[src*="pp_banner"], .pp_promo'
      );
      ads.forEach(a => a.remove());
    `);

    // Show splash bar fast
    splash.webContents.executeJavaScript(`
      const bar = document.getElementById('loadingBar');
      bar.style.transition = 'width 0.2s ease';
      bar.style.width = '100%';
    `);

    // Close splash shortly after
    setTimeout(() => {
      splash.close();
      mainWin.show();
    }, 200);
  });

  // Full Photopea ribbon menu
  const menuTemplate = [
    { label: "File", submenu: [
      { label: "New", click: () => mainWin.webContents.executeJavaScript(`app.newProject();`) },
      { label: "Open", click: () => mainWin.webContents.executeJavaScript(`app.openFile();`) },
      { label: "Open URL...", click: () => mainWin.webContents.executeJavaScript(`app.openURL();`) },
      { label: "Save", click: () => mainWin.webContents.executeJavaScript(`app.save();`) },
      { label: "Export As...", click: () => mainWin.webContents.executeJavaScript(`app.exportAs();`) },
      { type: "separator" },
      { role: "quit" },
    ]},
    { label: "Edit", submenu: [
      { label: "Undo", click: () => mainWin.webContents.executeJavaScript(`app.undo();`) },
      { label: "Redo", click: () => mainWin.webContents.executeJavaScript(`app.redo();`) },
      { type: "separator" },
      { label: "Cut", click: () => mainWin.webContents.executeJavaScript(`document.execCommand('cut');`) },
      { label: "Copy", click: () => mainWin.webContents.executeJavaScript(`document.execCommand('copy');`) },
      { label: "Paste", click: () => mainWin.webContents.executeJavaScript(`document.execCommand('paste');`) },
    ]},
    { label: "Image", submenu: [
      { label: "Image Size", click: () => mainWin.webContents.executeJavaScript(`app.imageSize();`) },
      { label: "Canvas Size", click: () => mainWin.webContents.executeJavaScript(`app.canvasSize();`) },
    ]},
    { label: "Layer", submenu: [
      { label: "New Layer", click: () => mainWin.webContents.executeJavaScript(`app.newLayer();`) },
      { label: "Duplicate Layer", click: () => mainWin.webContents.executeJavaScript(`app.duplicateLayer();`) },
      { label: "Delete Layer", click: () => mainWin.webContents.executeJavaScript(`app.deleteLayer();`) },
    ]},
    { label: "Select", submenu: [
      { label: "All", click: () => mainWin.webContents.executeJavaScript(`app.selectAll();`) },
      { label: "Deselect", click: () => mainWin.webContents.executeJavaScript(`app.deselect();`) },
      { label: "Inverse", click: () => mainWin.webContents.executeJavaScript(`app.invertSelection();`) },
    ]},
    { label: "Filter", submenu: [
      { label: "Blur", click: () => mainWin.webContents.executeJavaScript(`app.applyFilter('blur');`) },
      { label: "Sharpen", click: () => mainWin.webContents.executeJavaScript(`app.applyFilter('sharpen');`) },
      { label: "Other...", click: () => mainWin.webContents.executeJavaScript(`app.filters();`) },
    ]},
    { label: "View", submenu: [
      { label: "Zoom In", click: () => mainWin.webContents.executeJavaScript(`app.zoomIn();`) },
      { label: "Zoom Out", click: () => mainWin.webContents.executeJavaScript(`app.zoomOut();`) },
      { label: "Actual Pixels", click: () => mainWin.webContents.executeJavaScript(`app.actualPixels();`) },
    ]},
    { label: "Window", submenu: [
      { label: "Minimize", role: "minimize" },
      { label: "Close", role: "close" },
    ]},
    { label: "Help", submenu: [
      { label: "Photopea Website", click: () => shell.openExternal("https://www.photopea.com/") },
      { label: "About", click: () => shell.openExternal("https://www.photopea.com/") },
    ]},
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
