const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

const TRIGGER_FILE = '/tmp/claude-notify-trigger';

class NotifyViewProvider {
  constructor(extensionUri) {
    this._extensionUri = extensionUri;
    this._view = null;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = this._getHtml();

    // Send config to webview
    this._sendConfig();

    // Listen for config changes
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('claude-notify')) {
        this._sendConfig();
      }
    });
  }

  _sendConfig() {
    if (!this._view) return;

    const config = vscode.workspace.getConfiguration('claude-notify');
    const sound = config.get('sound', 'ding');
    const volume = config.get('volume', 0.5);
    const customPath = config.get('customSoundPath', '');

    let customData = null;
    if (sound === 'custom' && customPath) {
      try {
        const buf = fs.readFileSync(customPath);
        const ext = path.extname(customPath).toLowerCase();
        const mime = { '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg' }[ext] || 'audio/mpeg';
        customData = `data:${mime};base64,${buf.toString('base64')}`;
      } catch (e) {
        vscode.window.showErrorMessage(`Claude Notify: Cannot read audio file: ${customPath}`);
      }
    }

    this._view.webview.postMessage({
      type: 'config',
      sound,
      volume,
      customData
    });
  }

  notify() {
    if (this._view) {
      this._view.webview.postMessage({ type: 'notify' });
    }
  }

  preview() {
    if (this._view) {
      this._sendConfig();
      this._view.webview.postMessage({ type: 'preview' });
    } else {
      vscode.window.showWarningMessage('Please open the Claude Notify sidebar panel first (click the bell icon).');
    }
  }

  _getHtml() {
    return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  body { padding:10px; font-family:sans-serif; color:#ccc; }
  #status { font-size:1.1em; margin:10px 0; transition:all 0.3s; }
  #sound-name { font-size:0.85em; color:#888; margin:5px 0; }
  .enabled { color:#4caf50; }
  .waiting { color:#ff9800; }
  .ring { color:#2196f3; animation:pulse 0.5s; }
  @keyframes pulse { 0%{transform:scale(1)} 50%{transform:scale(1.1)} 100%{transform:scale(1)} }
</style></head>
<body>
<p id="status" class="waiting">Click here to enable sound</p>
<p id="sound-name"></p>

<script>
const audioCtx = new AudioContext();
let enabled = false;
let currentSound = 'ding';
let currentVolume = 0.5;
let customAudio = null;
const statusEl = document.getElementById('status');
const soundNameEl = document.getElementById('sound-name');

// Sound presets using Web Audio API
const sounds = {
  ding: (vol) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(880, audioCtx.currentTime);
    o.frequency.setValueAtTime(660, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    o.start(); o.stop(audioCtx.currentTime + 0.4);
  },
  chime: (vol) => {
    [880, 1108.73].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol * 0.6, audioCtx.currentTime + i * 0.2);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.2 + 0.5);
      o.start(audioCtx.currentTime + i * 0.2);
      o.stop(audioCtx.currentTime + i * 0.2 + 0.5);
    });
  },
  bell: (vol) => {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.type = 'triangle';
    o.frequency.setValueAtTime(1200, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.8);
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
    o.start(); o.stop(audioCtx.currentTime + 0.8);
  },
  success: (vol) => {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.connect(g); g.connect(audioCtx.destination);
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol * 0.5, audioCtx.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + i * 0.12 + 0.3);
      o.start(audioCtx.currentTime + i * 0.12);
      o.stop(audioCtx.currentTime + i * 0.12 + 0.3);
    });
  }
};

function playSound() {
  if (currentSound === 'custom' && customAudio) {
    const audio = new Audio(customAudio);
    audio.volume = currentVolume;
    audio.play().catch(() => {});
  } else {
    const fn = sounds[currentSound] || sounds.ding;
    fn(currentVolume);
  }
}

// Browser notification
let notifyPermission = false;
try {
  const N = window.Notification || (window.parent && window.parent.Notification);
  if (N) N.requestPermission().then(p => { notifyPermission = (p === 'granted'); });
} catch(e) {}

document.addEventListener('click', () => {
  audioCtx.resume().then(() => {
    if (!enabled) {
      try {
        const N = window.Notification || (window.parent && window.parent.Notification);
        if (N && N.permission === 'default') N.requestPermission().then(p => { notifyPermission = (p === 'granted'); });
      } catch(e) {}
      playSound();
      enabled = true;
      statusEl.textContent = 'Sound enabled';
      statusEl.className = 'enabled';
    }
  });
});

window.addEventListener('message', (e) => {
  const data = e.data;
  if (data.type === 'config') {
    currentSound = data.sound || 'ding';
    currentVolume = data.volume ?? 0.5;
    if (data.customData) customAudio = data.customData;
    soundNameEl.textContent = 'Current: ' + currentSound + ' | Volume: ' + Math.round(currentVolume * 100) + '%';
  }
  if (data.type === 'preview') {
    audioCtx.resume().then(() => {
      playSound();
      if (!enabled) {
        enabled = true;
        statusEl.textContent = 'Sound enabled';
        statusEl.className = 'enabled';
      }
      statusEl.textContent = 'Preview...';
      statusEl.className = 'ring';
      setTimeout(() => { statusEl.textContent = 'Sound enabled'; statusEl.className = 'enabled'; }, 1500);
    });
  }
  if (data.type === 'notify' && enabled) {
    playSound();
    try {
      const N = window.Notification || (window.parent && window.parent.Notification);
      if (N && N.permission === 'granted') {
        new N('Claude Code', { body: 'Task completed', tag: 'claude-notify' });
      }
    } catch(e) {}
    statusEl.textContent = 'Ding!';
    statusEl.className = 'ring';
    setTimeout(() => { statusEl.textContent = 'Sound enabled'; statusEl.className = 'enabled'; }, 1500);
  }
});
</script>
</body></html>`;
  }
}

function activate(context) {
  const provider = new NotifyViewProvider(context.extensionUri);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('claude-notify.view', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  // Preview command
  context.subscriptions.push(
    vscode.commands.registerCommand('claude-notify.preview', () => provider.preview())
  );

  // Status bar - click to focus panel and enable sound
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(bell) Notify';
  statusBarItem.tooltip = 'Click to open Claude Notify panel';
  statusBarItem.command = 'claude-notify.view.focus';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Auto-open panel when Claude Code process is detected
  const { exec } = require('child_process');
  let claudeDetected = false;
  const detectInterval = setInterval(() => {
    exec('pgrep -x claude 2>/dev/null', (err, stdout) => {
      if (!err && stdout.trim() && !claudeDetected) {
        claudeDetected = true;
        vscode.commands.executeCommand('claude-notify.view.focus');
      } else if (err && claudeDetected) {
        // Claude exited, reset so it re-opens next time
        claudeDetected = false;
      }
    });
  }, 3000);
  context.subscriptions.push({ dispose: () => clearInterval(detectInterval) });

  // Ensure trigger file
  if (!fs.existsSync(TRIGGER_FILE)) {
    fs.writeFileSync(TRIGGER_FILE, '0');
  }

  // Poll trigger file
  let lastMtime = 0;
  try { lastMtime = fs.statSync(TRIGGER_FILE).mtimeMs; } catch(e) {}

  const interval = setInterval(() => {
    try {
      const mtime = fs.statSync(TRIGGER_FILE).mtimeMs;
      if (mtime > lastMtime) {
        lastMtime = mtime;
        provider.notify();
        const config = vscode.workspace.getConfiguration('claude-notify');
        if (config.get('showMessage', true)) {
          vscode.window.showInformationMessage('Claude Code task completed.');
        }
      }
    } catch(e) {}
  }, 500);

  context.subscriptions.push({ dispose: () => clearInterval(interval) });
}

function deactivate() {}

module.exports = { activate, deactivate };
