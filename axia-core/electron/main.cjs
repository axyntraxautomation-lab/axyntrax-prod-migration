const { app, BrowserWindow, Menu, Tray, nativeImage, shell } = require('electron')
const path = require('path')

/**
 * AXIA COMMAND CENTER — Electron v2.0
 * Dashboard AXYNTRAX instalado como aplicación de escritorio.
 */

let mainWindow = null
let tray       = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1440,
    height:          900,
    minWidth:        1024,
    minHeight:       680,
    title:           'AXYNTRAX — Command Center',
    backgroundColor: '#0a0f1a',
    show:            false,       // Esperar a que cargue para mostrar sin parpadeo
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      webSecurity:      true,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
  })

  // Cargar app compilada o dev server
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    mainWindow.loadURL('http://localhost:5173')
    // Abrir DevTools solo en desarrollo con F12
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') mainWindow.webContents.toggleDevTools()
    })
  }

  // Mostrar cuando esté listo (evita el flash blanco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  // Abrir links externos en el navegador del sistema
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Menú limpio (solo lo esencial)
  const menu = Menu.buildFromTemplate([
    {
      label: 'AXYNTRAX',
      submenu: [
        { label: 'Recargar Dashboard', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Pantalla Completa',  accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Salir', accelerator: 'CmdOrCtrl+Q', role: 'quit' },
      ]
    },
    {
      label: 'Ver',
      submenu: [
        { label: 'Dashboard',  accelerator: 'CmdOrCtrl+1', click: () => mainWindow?.webContents.executeJavaScript("window.location.hash='#/dashboard'") },
        { label: 'AXIA Chat', accelerator: 'CmdOrCtrl+2', click: () => mainWindow?.webContents.executeJavaScript("window.location.hash='#/axia'") },
        { label: 'Precios',   accelerator: 'CmdOrCtrl+3', click: () => mainWindow?.webContents.executeJavaScript("window.location.hash='#/pricing'") },
        { type: 'separator' },
        { label: 'Acercar',  role: 'zoomIn',  accelerator: 'CmdOrCtrl+Plus' },
        { label: 'Alejar',   role: 'zoomOut', accelerator: 'CmdOrCtrl+-' },
        { label: 'Normal',   role: 'resetZoom' },
      ]
    },
  ])
  Menu.setApplicationMenu(menu)
}

// Prevenir múltiples instancias
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(() => {
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
