# Claude Notify

Play sound notifications when [Claude Code](https://github.com/anthropics/claude-code) finishes a task. Designed for **code-server** (VS Code in browser) environments.

---

**[中文说明](#中文说明) | [English](#features)**

---

## Features

- **Sound notification** when Claude Code completes a task
- **4 built-in sound presets**: ding, chime, bell, success
- **Custom audio file** support (mp3/wav/ogg)
- **Volume control** (0.0 - 1.0)
- **Browser notification** support (visible across tabs)
- **Info message popup** in VS Code (can be disabled)
- **Auto-detect Claude Code** process and open notification panel automatically
- **Sidebar panel** with persistent audio (survives tab switching)

## How It Works

```
Claude Code finishes task
  → Hook writes to /tmp/claude-notify-trigger
  → Extension detects file change
  → Webview plays notification sound
  → (Optional) Browser notification + info message popup
```

## Setup

### 1. Install the Extension

Install from Open VSX, or manually place the extension in your code-server extensions directory.

### 2. Configure Claude Code Hook

Add the following to your Claude Code settings (`~/.claude/settings.json`):

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ],
    "PermissionRequest": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ]
  }
}
```

### 3. Enable Sound

1. Open the **Claude Notify** panel in the sidebar (bell icon)
2. **Click once** on the panel to enable sound (required by browser audio policy)
3. Done! The panel auto-opens when Claude Code is detected

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `claude-notify.sound` | Sound preset: `ding`, `chime`, `bell`, `success`, `custom` | `success` |
| `claude-notify.customSoundPath` | Path to custom audio file (mp3/wav/ogg) | `""` |
| `claude-notify.volume` | Notification volume (0.0 - 1.0) | `0.5` |
| `claude-notify.showMessage` | Show info message popup on completion | `true` |

## Commands

| Command | Description |
|---------|-------------|
| `Claude Notify: Preview Current Sound` | Preview the selected notification sound |
| `Claude Notify: Toggle Sound` | Toggle notification on/off |

## Tips

- Place custom audio files in `/config/` to persist across container rebuilds
- The notification panel uses `retainContextWhenHidden`, so switching sidebar views won't break it
- Browser notifications require HTTPS and notification permission

---

## 中文说明

当 [Claude Code](https://github.com/anthropics/claude-code) 完成任务时播放提示音。专为 **code-server**（浏览器中的 VS Code）环境设计。

## 功能特性

- Claude Code 完成任务时**播放提示音**
- **4 种内置音效**：ding（短促）、chime（和弦）、bell（铃声）、success（庆祝）
- 支持**自定义音频文件**（mp3/wav/ogg）
- **音量控制**（0.0 - 1.0）
- 支持**浏览器原生通知**（切换标签页后也能看到）
- VS Code **右下角弹窗通知**（可关闭）
- **自动检测 Claude Code** 进程并打开通知面板
- **侧边栏面板**，切换视图不会中断

## 工作原理

```
Claude Code 完成任务
  → Hook 写入 /tmp/claude-notify-trigger
  → 扩展检测文件变化
  → Webview 播放提示音
  → （可选）浏览器通知 + 右下角弹窗
```

## 安装配置

### 1. 安装扩展

从 Open VSX 安装，或手动将扩展放到 code-server 的扩展目录。

### 2. 配置 Claude Code Hook

在 Claude Code 的设置文件（`~/.claude/settings.json`）中添加：

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ],
    "PermissionRequest": [
      {
        "hooks": [
          {
            "command": "date +%s%N > /tmp/claude-notify-trigger",
            "type": "command"
          }
        ],
        "matcher": "*"
      }
    ]
  }
}
```

### 3. 启用声音

1. 打开侧边栏的 **Claude Notify** 面板（铃铛图标）
2. **点击面板一次**启用声音（浏览器安全策略要求）
3. 完成！启动 Claude Code 时面板会自动打开

## 设置项

| 设置 | 说明 | 默认值 |
|------|------|--------|
| `claude-notify.sound` | 音效预设：`ding`、`chime`、`bell`、`success`、`custom` | `success` |
| `claude-notify.customSoundPath` | 自定义音频文件路径（mp3/wav/ogg） | `""` |
| `claude-notify.volume` | 通知音量（0.0 - 1.0） | `0.5` |
| `claude-notify.showMessage` | 完成时是否弹出右下角通知 | `true` |

## 命令

| 命令 | 说明 |
|------|------|
| `Claude Notify: Preview Current Sound` | 预览当前选择的提示音 |
| `Claude Notify: Toggle Sound` | 开关通知声音 |

## 小贴士

- 把自定义音频文件放在 `/config/` 下，容器重建不会丢失
- 通知面板设置了 `retainContextWhenHidden`，切换侧边栏视图不会中断声音
- 浏览器原生通知需要 HTTPS 和通知权限

---

## License

MIT
