const todoListEl = document.getElementById('todoList');
const newTodoText = document.getElementById('newTodoText');
const newTodoDue = document.getElementById('newTodoDue');
const addBtn = document.getElementById('addBtn');
const closeBtn = document.getElementById('closeBtn');
const footerHint = document.getElementById('footerHint');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');

let selectedPriority = 'medium';

document.querySelectorAll('.prio-swatch').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.prio-swatch').forEach((b) => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedPriority = btn.dataset.priority;
  });
});

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `Due ${m}/${d}`;
}

async function renderTodos() {
  const todos = await window.api.getTodos();
  todoListEl.innerHTML = '';

  if (todos.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Nothing on today\u2019s list yet';
    todoListEl.appendChild(empty);
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
      renderTodos();
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
    deleteBtn.textContent = '\u00d7';
    deleteBtn.addEventListener('click', async () => {
      await window.api.deleteTodo(todo.id);
      renderTodos();
    });

    li.appendChild(checkbox);
    li.appendChild(dot);
    li.appendChild(text);
    li.appendChild(deleteBtn);
    todoListEl.appendChild(li);
  });
}

addBtn.addEventListener('click', async () => {
  const text = newTodoText.value.trim();
  if (!text) return;

  await window.api.addTodo({
    text,
    priority: selectedPriority,
    dueDate: newTodoDue.value || null,
  });

  newTodoText.value = '';
  newTodoDue.value = '';
  renderTodos();
});

newTodoText.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

closeBtn.addEventListener('click', () => {
  window.api.closeApp();
});

todoListEl.addEventListener('dblclick', () => {
  window.api.openCalendar();
});

footerHint.addEventListener('dblclick', () => {
  window.api.openCalendar();
});

window.api.onTodosUpdated(() => {
  renderTodos();
});

// ---- Settings / color customization ----

function applyAccentColor(hex) {
  document.documentElement.style.setProperty('--accent', hex);
}

function markSelectedSwatch(groupEl, hex) {
  groupEl.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.color.toLowerCase() === hex.toLowerCase());
  });
}

settingsBtn.addEventListener('click', () => {
  settingsPanel.classList.toggle('open');
});

document.querySelectorAll('.swatch-group').forEach((group) => {
  const target = group.dataset.target; // "accentColor" or "carColor"
  group.querySelectorAll('.color-swatch').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const hex = btn.dataset.color;
      markSelectedSwatch(group, hex);
      if (target === 'accentColor') applyAccentColor(hex);
      await window.api.updateSettings({ [target]: hex });
    });
  });
});

window.api.onSettingsUpdated((settings) => {
  applyAccentColor(settings.accentColor);
  markSelectedSwatch(document.getElementById('accentSwatches'), settings.accentColor);
  markSelectedSwatch(document.getElementById('carSwatches'), settings.carColor);
});

(async function initSettings() {
  const settings = await window.api.getSettings();
  applyAccentColor(settings.accentColor);
  markSelectedSwatch(document.getElementById('accentSwatches'), settings.accentColor);
  markSelectedSwatch(document.getElementById('carSwatches'), settings.carColor);
}());

renderTodos();
