const monthLabel = document.getElementById('monthLabel');
const gridEl = document.getElementById('grid');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const todayBtn = document.getElementById('todayBtn');

const dayPanelTitle = document.getElementById('dayPanelTitle');
const dayAddRow = document.getElementById('dayAddRow');
const dayTodoList = document.getElementById('dayTodoList');
const dpText = document.getElementById('dpText');
const dpDue = document.getElementById('dpDue');
const dpAddBtn = document.getElementById('dpAddBtn');

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

let viewDate = new Date(); // month currently displayed
let selectedDateStr = null;
let allTodos = [];
let selectedPriority = 'medium';

function dateToStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayStr() {
  return dateToStr(new Date());
}

document.querySelectorAll('#dpPriorityPicker .prio-swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#dpPriorityPicker .prio-swatch').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedPriority = btn.dataset.priority;
  });
});

async function loadAllTodos() {
  allTodos = await window.api.getAllTodos();
}

function todosForDate(dateStr) {
  const order = { high: 0, medium: 1, low: 2 };
  return allTodos
    .filter((t) => t.listDate === dateStr)
    .sort((a, b) => order[a.priority] - order[b.priority]);
}

function renderCalendar() {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  monthLabel.textContent = `${MONTH_NAMES[month]} ${year}`;
  gridEl.innerHTML = '';

  const firstOfMonth = new Date(year, month, 1);
  // Monday-first offset: getDay() 0=Sun..6=Sat -> convert so Mon=0..Sun=6
  const jsDay = firstOfMonth.getDay();
  const mondayOffset = (jsDay + 6) % 7;

  const startDate = new Date(year, month, 1 - mondayOffset);
  const today = todayStr();

  for (let i = 0; i < 42; i += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + i);
    const cellDateStr = dateToStr(cellDate);

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (cellDate.getMonth() !== month) cell.classList.add('other-month');
    if (cellDateStr === today) cell.classList.add('today');
    if (cellDateStr === selectedDateStr) cell.classList.add('selected');

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = cellDate.getDate();
    cell.appendChild(dayNumber);

    const dots = todosForDate(cellDateStr);
    if (dots.length > 0) {
      const dotRow = document.createElement('div');
      dotRow.className = 'dot-row';
      dots.slice(0, 8).forEach((t) => {
        const dot = document.createElement('span');
        dot.className = `dot ${t.priority}`;
        if (t.done) dot.style.opacity = '0.3';
        dotRow.appendChild(dot);
      });
      cell.appendChild(dotRow);
    }

    cell.addEventListener('click', () => {
      selectedDateStr = cellDateStr;
      renderCalendar();
      renderDayPanel();
    });

    gridEl.appendChild(cell);
  }
}

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const [, m, d] = dateStr.split('-');
  return `Due ${m}/${d}`;
}

function formatPanelTitle(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
  return `${weekday}, ${MONTH_NAMES[m - 1]} ${d}`;
}

function renderDayPanel() {
  if (!selectedDateStr) {
    dayPanelTitle.textContent = 'Select a day';
    dayAddRow.style.display = 'none';
    dayTodoList.innerHTML = '';
    return;
  }

  dayPanelTitle.textContent = formatPanelTitle(selectedDateStr);
  dayAddRow.style.display = 'flex';
  dayTodoList.innerHTML = '';

  const todos = todosForDate(selectedDateStr);

  if (todos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nothing on this day yet.';
    dayTodoList.appendChild(empty);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', async () => {
      await window.api.toggleDone(todo.id);
      await loadAllTodos();
      renderCalendar();
      renderDayPanel();
    });

    const dot = document.createElement('span');
    dot.className = `priority-dot ${todo.priority}`;

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    if (todo.rolledOver) {
      const badge = document.createElement('span');
      badge.className = 'rolled-over-badge';
      badge.textContent = 'rolled over';
      text.appendChild(badge);
    }

    if (todo.dueDate) {
      const dueBadge = document.createElement('span');
      dueBadge.className = 'due-badge';
      dueBadge.textContent = formatDueDate(todo.dueDate);
      li.appendChild(dueBadge);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', async () => {
      await window.api.deleteTodo(todo.id);
      await loadAllTodos();
      renderCalendar();
      renderDayPanel();
    });

    li.appendChild(checkbox);
    li.appendChild(dot);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    dayTodoList.appendChild(li);
  });
}

dpAddBtn.addEventListener('click', async () => {
  const text = dpText.value.trim();
  if (!text || !selectedDateStr) return;

  await window.api.addTodo({
    text,
    priority: selectedPriority,
    dueDate: dpDue.value || null,
    listDate: selectedDateStr,
  });

  dpText.value = '';
  dpDue.value = '';
  await loadAllTodos();
  renderCalendar();
  renderDayPanel();
});

dpText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') dpAddBtn.click();
});

prevBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() - 1);
  renderCalendar();
});

nextBtn.addEventListener('click', () => {
  viewDate.setMonth(viewDate.getMonth() + 1);
  renderCalendar();
});

todayBtn.addEventListener('click', () => {
  viewDate = new Date();
  selectedDateStr = todayStr();
  renderCalendar();
  renderDayPanel();
});

(async function init() {
  const settings = await window.api.getSettings();
  document.documentElement.style.setProperty('--accent', settings.accentColor);

  await loadAllTodos();
  selectedDateStr = todayStr();
  renderCalendar();
  renderDayPanel();
}());

window.api.onSettingsUpdated((settings) => {
  document.documentElement.style.setProperty('--accent', settings.accentColor);
});
