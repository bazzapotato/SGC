const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs-extra')
const Store = require('electron-store')

// Initialize store
const store = new Store()

let mainWindow

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