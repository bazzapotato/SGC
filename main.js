const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const Store = require('electron-store')
const { google } = require('googleapis')
const { OAuth2 } = google.auth

// Initialize store
// Google Drive setup
const SCOPES = ['https://www.googleapis.com/auth/drive.file']
let oAuth2Client = null
let driveFolderId = store.get('driveFolderId') || null
const BACKUP_INTERVAL = 60 // minutes
const store = new Store()

let mainWindow

// Initialize Google Drive client
async function initDriveClient() {
  oAuth2Client = new OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
    initDriveClient()
  )
  
  const tokens = store.get('googleTokens')
  if (tokens) {
    oAuth2Client.setCredentials(tokens)
  }
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// IPC Handlers
ipcMain.handle('select-directory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    const dirPath = result.filePaths[0]
    store.set('dataDirectory', dirPath)
    
    // Create necessary subdirectories
    await fs.ensureDir(path.join(dirPath, 'customers'))
    await fs.ensureDir(path.join(dirPath, 'files'))
    
    return dirPath
  }
  return null
})

ipcMain.handle('get-data-directory', () => {
  return store.get('dataDirectory') || null
})

ipcMain.handle('get-customers', async () => {
  const dataDir = store.get('dataDirectory')
  if (!dataDir) return []
  
  const customersDir = path.join(dataDir, 'customers')
  try {
    const files = await fs.readdir(customersDir)
    const customers = []
    
    for (const file of files) {
      if (path.extname(file) === '.json') {
        const data = await fs.readJson(path.join(customersDir, file))
        customers.push(data)
      }
    }
    
    return customers
  } catch (err) {
    console.error('Error reading customers:', err)
    return []
  }
})

ipcMain.handle('save-customer', async (event, customer) => {
  const dataDir = store.get('dataDirectory')
  if (!dataDir) return false
  
  const customerDir = path.join(dataDir, 'customers')
  await fs.ensureDir(customerDir)
  
  const filePath = path.join(customerDir, `${customer.id}.json`)
  try {
    // Google Drive IPC Handlers
ipcMain.handle('google-drive-authorize', async () => {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
  
  mainWindow.webContents.send('google-auth-url', authUrl)
})

ipcMain.handle('set-drive-folder', (_, folderId) => {
  store.set('driveFolderId', folderId)
  driveFolderId = folderId
  return true
})

ipcMain.handle('get-drive-customers', async () => {
  if (!oAuth2Client || !driveFolderId) return []
  
  const drive = google.drive({ version: 'v3', auth: oAuth2Client })
  const res = await drive.files.list({
    q: `'${driveFolderId}' in parents and mimeType='application/json'`,
    fields: 'files(id,name)'
  })
  
  const customers = []
  for (const file of res.data.files) {
    const fileRes = await drive.files.get({
      fileId: file.id,
      alt: 'media'
    })
    customers.push(fileRes.data)
  }
  
  return customers
})

ipcMain.handle('save-drive-customer', async (_, customer) => {
  if (!oAuth2Client || !driveFolderId) return false
  
  const drive = google.drive({ version: 'v3', auth: oAuth2Client })
  try {
    await drive.files.create({
      requestBody: {
        name: `${customer.id}.json`,
        parents: [driveFolderId],
        mimeType: 'application/json'
      },
      media: {
        mimeType: 'application/json',
        body: JSON.stringify(customer)
      }
    })
    return true
  } catch (err) {
    console.error('Drive save error:', err)
    return false
  }
})

// Backup handlers
ipcMain.handle('get-backup-interval', () => store.get('backupInterval', BACKUP_INTERVAL))
ipcMain.handle('set-backup-interval', (_, minutes) => {
  store.set('backupInterval', minutes)
  return true
})
    await fs.writeJson(filePath, customer)
    return true
  } catch (err) {
    console.error('Error saving customer:', err)
    return false
  }
})

ipcMain.handle('save-interaction', async (event, interaction) => {
  const dataDir = store.get('dataDirectory')
  if (!dataDir) return false
  
  const customerDir = path.join(dataDir, 'customers', `${interaction.customerId}.json`)
  
  try {
    const customer = await fs.readJson(customerDir)
    
    if (!customer.interactions) {
      customer.interactions = []
    }
    
    customer.interactions.push({
      id: Date.now().toString(),
      type: interaction.type,
      content: interaction.content,
      files: [],
      timestamp: new Date().toISOString()
    })
    
    await fs.writeJson(customerDir, customer)
    return true
  } catch (err) {
    console.error('Error saving interaction:', err)
    return false
  }
})

ipcMain.handle('save-file', async (event, fileData) => {
  const dataDir = store.get('dataDirectory')
  if (!dataDir) return null
  
  const filesDir = path.join(dataDir, 'files')
  await fs.ensureDir(filesDir)
  
  const fileName = `${Date.now()}-${fileData.name}`
  const filePath = path.join(filesDir, fileName)
  
  try {
    await fs.writeFile(filePath, Buffer.from(fileData.data))
    return fileName
  } catch (err) {
    console.error('Error saving file:', err)
    return null
  }
})
