# Cat Todo Widget 🐱

A comic-style desktop todo widget for Windows: color-coded priorities, due
dates, and automatic daily rollover of unfinished tasks.

## Status: Phase 1–4 complete

**Done:**
- A resizable, professional-looking always-there todo widget (drag the
  edges/corner to resize — size and position are remembered between
  sessions)
- Color-coded priority (green = low, yellow = medium, red = high)
- Optional due date per todo
- Todos persist locally (JSON file in your Windows user data folder)
- Automatic rollover: any todo left unfinished on its list day is moved to
  today and bumped to **high priority**, with a "rolled over" badge
- Auto-launch at Windows login, fixed for both dev mode (`npm start`) and
  a packaged install (see note below)
- **Desktop-only visibility:** the widget is a normal window, not
  "always on top." That means it sits *behind* whatever app you're
  actively using (browser, IDE, etc.) and is only visible when you're
  looking at the desktop — or if you explicitly click it back to the
  front (e.g. via the taskbar or Alt+Tab).
- **Startup animation:** an original flat-vector cat-and-car mascot
  (inspired by cute flat-illustration style, not a copy of any specific
  artwork) drives across the screen pulling the todo list on a rope,
  drops it off, and drives away — then the real widget fades in at that
  spot.
- **Color customization:** click the ⚙ icon on the widget to pick an
  accent color for the widget/calendar, and a separate color for the car
  in the startup animation. Both persist across restarts.
- **Full calendar view:** double-click the widget's list to open a
  month-grid calendar. Click any day (past, present, or future, any year)
  to manage its todos in the side panel.

**A note on the redesign:** the picture you shared looks like a specific
licensed stock illustration, so I couldn't reproduce it exactly — but I
built an original mascot in a similar cute, flat-vector style for the fun
startup moment. For the actual day-to-day widget and calendar, I went
with a cleaner, more neutral "productivity tool" look instead of a
cartoon style throughout, since that's usually what "professional" means
for something you'll be staring at all day. Happy to adjust either
direction if you want more/less personality in the daily UI.

**Possible future additions:**
- Notifications/reminders as due dates approach
- Packaging a signed installer for easier distribution
- A dedicated settings window instead of the small popover

## A note on autostart in dev mode

`app.setLoginItemSettings` needs to know exactly what to launch. When the
app isn't packaged yet (i.e. you're running it via `npm start`), Windows
login would otherwise launch a bare Electron window with nothing loaded.
This is now fixed by passing the project folder as a launch argument, but
the most robust long-term option is still to build a real installer with
`npm run dist` (see below) — that way Windows launches your actual
`.exe`, exactly like any other installed app.

## A note on "attaching to the desktop"

Windows doesn't have a built-in way for a normal app to sit *behind* your
desktop icons like Rainmeter widgets do — that requires reparenting the
window into the `Progman`/`WorkerW` window using the Win32 API, which is a
well-known but fragile hack (it can break between Windows updates). This
build instead makes the widget an **always-on-top, draggable window** that
behaves like a sticky note glued to your screen — visually similar in
practice, just not literally sandwiched behind icons. Let me know if you'd
like to push into the Progman hack later; it's doable, just riskier.

## Tuning the startup animation

The animation lives in `renderer/animation/` (`style.css` has the
keyframe timings, `script.js` reads the target position). If you want it
faster/slower, adjust the `2.2s` (drive-in) and `1s` (drive-off) durations
in `style.css`. If you'd rather skip it entirely while developing, comment
out the `createAnimationWindow()` call in `main.js` and change
`createWidgetWindow({ startHidden: true })` to `createWidgetWindow()`.

## Setup (on your Windows machine)

1. Install [Node.js](https://nodejs.org) (LTS version).
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Start the app:
   ```
   npm start
   ```

The widget should appear in the top-right of your screen. Drag it by the
header bar to reposition it anywhere.

## Building a distributable .exe (optional, later)

Once you're happy with it, you can package it into a proper installer:
```
npm run dist
```
This uses `electron-builder` and will produce an installer in the `dist/`
folder that sets up auto-start and a Start Menu shortcut.

## Data storage

Todos are stored as JSON in:
```
%APPDATA%\cat-todo-widget\todos.json
```
You can inspect or back up this file directly if needed.

## Project structure

```
cat-todo-widget/
├── main.js              # Electron main process, window creation, IPC
├── preload.js            # Secure bridge between main and renderer
├── src/
│   └── store.js          # Todo data layer + rollover logic
├── renderer/
│   ├── widget/            # The always-on-top todo widget UI
│   └── calendar/          # Full calendar view (placeholder, Phase 3)
└── package.json
```
