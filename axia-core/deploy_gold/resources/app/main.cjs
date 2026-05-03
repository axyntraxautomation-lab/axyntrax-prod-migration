const { app, BrowserWindow } = require('electron')
const path = require('path')

/**
 * AXIA COMMAND CENTER
 * Electron Main Process
 */

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    title: 'Axia Command Center',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // Custom Frame / Transparency can be added here for the WOW effect
  })

  // Load the compiled React app
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    // For development, load the Vite dev server
    win.loadURL('http://localhost:5173')
  }

  // Remove menu for a cleaner, professional look
  win.setMenu(null)
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
