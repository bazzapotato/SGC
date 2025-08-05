const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  getDataDirectory: () => ipcRenderer.invoke('get-data-directory'),
  getCustomers: () => ipcRenderer.invoke('get-customers'),
  saveCustomer: (customer) => ipcRenderer.invoke('save-customer', customer),
  saveInteraction: (interaction) => ipcRenderer.invoke('save-interaction', interaction),
  saveFile: (fileData) => ipcRenderer.invoke('save-file', fileData)
})