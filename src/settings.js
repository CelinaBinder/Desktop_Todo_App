const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

const DEFAULTS = {
  windowBounds: null, // { x, y, width, height } - null means "use default position"
  accentColor: '#3a5bd9',
  carColor: '#3a5bd9',
};

class Settings {
  constructor() {
    this.data = this._load();
  }

  _load() {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch (e) {
      return { ...DEFAULTS };
    }
  }

  _save() {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  get() {
    return this.data;
  }

  update(partial) {
    this.data = { ...this.data, ...partial };
    this._save();
    return this.data;
  }
}

module.exports = Settings;
