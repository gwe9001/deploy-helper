import { contextBridge, ipcRenderer } from 'electron'
import { dialog } from '@electron/remote'

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: never[]) =>
      ipcRenderer.invoke(channel, ...args),
    on: (channel: string, func: (...args: never[]) => void) =>
      ipcRenderer.on(channel, (event, ...args) => func(...args)),
    send: (channel: string, ...args: never[]) =>
      ipcRenderer.send(channel, ...args),
    removeAllListeners: (channel: string) =>
      ipcRenderer.removeAllListeners(channel),
    setStoreValue: (key: string, value: never) => {
      ipcRenderer.send('setStore', key, value)
    },
    getStoreValue(key: string) {
      return ipcRenderer.sendSync('getStore', key)
    },
  },
  showOpenDialog: (options) => dialog.showOpenDialog(options),
})
