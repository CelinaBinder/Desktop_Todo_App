const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { app } = require('electron');

const DATA_FILE = path.join(app.getPath('userData'), 'todos.json');

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

class Store {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.todos)) parsed.todos = [];
      return parsed;
    } catch (e) {
      return { todos: [], lastRolloverCheck: null };
    }
  }

  _save() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  /**
   * Moves any unfinished todo whose list-day is before today onto today's
   * list and bumps it to high priority. Returns true if anything changed.
   */
  runRolloverCheck() {
    const today = todayStr();
    if (this.data.lastRolloverCheck === today) return false;

    let changed = false;
    this.data.todos.forEach((todo) => {
      if (!todo.done && todo.listDate < today) {
        todo.listDate = today;
        todo.priority = 'high';
        todo.rolledOver = true;
        changed = true;
      }
    });

    this.data.lastRolloverCheck = today;
    this._save();
    return changed;
  }

  _sortByPriority(list) {
    return list.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  }

  getTodosForToday() {
    return this.getTodosForDate(todayStr());
  }

  getTodosForDate(dateStr) {
    return this._sortByPriority(this.data.todos.filter((t) => t.listDate === dateStr));
  }

  getAllTodos() {
    return this.data.todos;
  }

  addTodo({ text, priority = 'medium', dueDate = null, listDate = null }) {
    const todo = {
      id: crypto.randomUUID(),
      text,
      priority,
      dueDate,
      listDate: listDate || todayStr(),
      done: false,
      rolledOver: false,
      createdAt: new Date().toISOString(),
    };
    this.data.todos.push(todo);
    this._save();
    return todo;
  }

  updateTodo(id, updates) {
    const todo = this.data.todos.find((t) => t.id === id);
    if (todo) {
      Object.assign(todo, updates);
      this._save();
    }
    return todo;
  }

  deleteTodo(id) {
    this.data.todos = this.data.todos.filter((t) => t.id !== id);
    this._save();
    return true;
  }

  toggleDone(id) {
    const todo = this.data.todos.find((t) => t.id === id);
    if (todo) {
      todo.done = !todo.done;
      this._save();
    }
    return todo;
  }
}

module.exports = Store;
