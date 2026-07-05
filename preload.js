const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getTodos: () => ipcRenderer.invoke('get-todos'),
  addTodo: (todo) => ipcRenderer.invoke('add-todo', todo),
  updateTodo: (id, updates) => ipcRenderer.invoke('update-todo', id, updates),
  deleteTodo: (id) => ipcRenderer.invoke('delete-todo', id),
  toggleDone: (id) => ipcRenderer.invoke('toggle-done', id),
  getAllTodos: () => ipcRenderer.invoke('get-all-todos'),
  getTodosForDate: (dateStr) => ipcRenderer.invoke('get-todos-for-date', dateStr),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (partial) => ipcRenderer.invoke('update-settings', partial),
  onSettingsUpdated: (callback) => ipcRenderer.on('settings-updated', (event, settings) => callback(settings)),

  closeApp: () => ipcRenderer.send('close-app'),
  openCalendar: () => ipcRenderer.send('open-calendar'),
  animationDone: () => ipcRenderer.send('animation-finished'),

  onTodosUpdated: (callback) => ipcRenderer.on('todos-updated', callback),
});
