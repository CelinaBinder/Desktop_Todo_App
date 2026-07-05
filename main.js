const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('./src/store');
const Settings = require('./src/settings');

let widgetWindow;
let animationWindow;
let calendarWindow;
let tray;
const store = new Store();
const settings = new Settings();

const DEFAULT_WIDGET_WIDTH = 340;
const DEFAULT_WIDGET_HEIGHT = 520;
const DEFAULT_WIDGET_Y = 40;
const MIN_WIDGET_WIDTH = 260;
const MIN_WIDGET_HEIGHT = 320;

let boundsSaveTimeout = null;

function getDefaultWidgetBounds() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: screenWidth - DEFAULT_WIDGET_WIDTH - 20,
    y: DEFAULT_WIDGET_Y,
    width: DEFAULT_WIDGET_WIDTH,
    height: DEFAULT_WIDGET_HEIGHT,
  };
}

function getWidgetBounds() {
  return settings.get().windowBounds || getDefaultWidgetBounds();
}

function createWidgetWindow({ startHidden } = { startHidden: false }) {
  const bounds = getWidgetBounds();

  widgetWindow = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WIDGET_WIDTH,
    minHeight: MIN_WIDGET_HEIGHT,

    icon: path.join(__dirname, "assets", "icon.ico"),

    frame: false,
    transparent: true,
    resizable: true,
    // No alwaysOnTop: the widget behaves like a normal desktop-level window,
    // so it sits behind whatever app you're actively using and only shows
    // when the desktop is visible or you explicitly bring it to front.
    alwaysOnTop: false,
    hasShadow: false,
    show: !startHidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  widgetWindow.loadFile(path.join(__dirname, 'renderer', 'widget', 'index.html'));

  const saveBoundsDebounced = () => {
    clearTimeout(boundsSaveTimeout);
    boundsSaveTimeout = setTimeout(() => {
      if (widgetWindow) settings.update({ windowBounds: widgetWindow.getBounds() });
    }, 400);
  };

  widgetWindow.on('resize', saveBoundsDebounced);
  widgetWindow.on('move', saveBoundsDebounced);
}

function createAnimationWindow() {
  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;
  const { x: widgetX, y: widgetY } = getWidgetBounds();

  animationWindow = new BrowserWindow({
    width: screenWidth,
    height: 260,
    x: 0,
    y: Math.max(widgetY - 20, 0),
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  animationWindow.setIgnoreMouseEvents(true);

  const carColor = encodeURIComponent(settings.get().carColor);

  animationWindow.loadFile(
    path.join(__dirname, 'renderer', 'animation', 'index.html'),
    { query: { targetX: String(widgetX), topPos: '20', carColor } }
  );
}

function createCalendarWindow() {
  if (calendarWindow) {
    calendarWindow.focus();
    return;
  }

  calendarWindow = new BrowserWindow({
    width: 900,
    height: 700,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  calendarWindow.loadFile(path.join(__dirname, 'renderer', 'calendar', 'index.html'));
  calendarWindow.on('closed', () => {
    calendarWindow = null;
  });
}

function setupAutoLaunch() {
  if (process.platform !== 'win32') return;

  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: [],
    });
  } else {
    // In dev mode (`npm start`), process.execPath points at the bundled
    // Electron binary, which needs the project folder as an argument to
    // know which app to load — otherwise it opens a blank default window.
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: [path.resolve(__dirname)],
    });
  }
}

app.whenReady().then(() => {
  store.runRolloverCheck();
  createWidgetWindow({ startHidden: true });
  createAnimationWindow();
  setupAutoLaunch();

  tray = new Tray(path.join(__dirname, "assets", "icon.ico"));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Show Widget",
      click() {
        widgetWindow.show();
      }
    },
    {
      label: "Hide Widget",
      click() {
        widgetWindow.hide();
      }
    },
    {
      type: "separator"
    },
    {
      label: "Exit",
      click() {
        app.quit();
      }
    }
  ]);

  tray.setToolTip("Cat Todo Widget");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (widgetWindow.isVisible()) {
      widgetWindow.hide();
    } else {
      widgetWindow.hide();
    }
  });

  // In case the app is left running across midnight, re-check periodically.
  setInterval(() => {
    const changed = store.runRolloverCheck();
    if (changed && widgetWindow) {
      widgetWindow.webContents.send('todos-updated');
    }
  }, 5 * 60 * 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWidgetWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ---- IPC handlers ----
ipcMain.handle('get-todos', () => store.getTodosForToday());
ipcMain.handle('add-todo', (event, todo) => store.addTodo(todo));
ipcMain.handle('update-todo', (event, id, updates) => store.updateTodo(id, updates));
ipcMain.handle('delete-todo', (event, id) => store.deleteTodo(id));
ipcMain.handle('toggle-done', (event, id) => store.toggleDone(id));
ipcMain.handle('get-all-todos', () => store.getAllTodos());
ipcMain.handle('get-todos-for-date', (event, dateStr) => store.getTodosForDate(dateStr));

ipcMain.handle('get-settings', () => settings.get());
ipcMain.handle('update-settings', (event, partial) => {
  const updated = settings.update(partial);
  // Reflect color changes immediately in any open windows.
  if (widgetWindow) widgetWindow.webContents.send('settings-updated', updated);
  if (calendarWindow) calendarWindow.webContents.send('settings-updated', updated);
  return updated;
});

ipcMain.on("close-app", () => {
  widgetWindow.hide();
});
ipcMain.on('open-calendar', () => createCalendarWindow());

ipcMain.on('animation-finished', () => {
  if (widgetWindow) widgetWindow.show();
  if (animationWindow) {
    animationWindow.close();
    animationWindow = null;
  }
});
