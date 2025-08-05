const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDataDirectory: () => ipcRenderer.invoke('get-data-directory'),
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  saveCustomer: (customer) => ipcRenderer.invoke('save-customer', customer),
   // Google Drive API methods
  authorizeGoogleDrive: () => ipcRenderer.invoke('google-drive-authorize'),
  setDriveFolder: (folderId) => ipcRenderer.invoke('set-drive-folder', folderId),
  getDriveCustomers: () => ipcRenderer.invoke('get-drive-customers'),
  saveDriveCustomer: (customer) => ipcRenderer.invoke('save-drive-customer', customer),
  saveDriveFile: (fileData) => ipcRenderer.invoke('save-drive-file', fileData),
  getBackupInterval: () => ipcRenderer.invoke('get-backup-interval'),
  setBackupInterval: (minutes) => ipcRenderer.invoke('set-backup-interval', minutes),
  triggerBackup: () => ipcRenderer.invoke('trigger-backup')
  saveInteraction: (interaction) => ipcRenderer.invoke('save-interaction', interaction),
  saveFile: (fileData) => ipcRenderer.invoke('save-file', fileData)
})
