<div align="center">

# 🐝 Beeper Pulse

**Full monitoring suite for the Beeper ecosystem**

[![Status Check](https://github.com/beeper-community/beeper-pulse/actions/workflows/status-check.yml/badge.svg)](https://github.com/beeper-community/beeper-pulse/actions/workflows/status-check.yml)
[![Official Updates](https://github.com/beeper-community/beeper-pulse/actions/workflows/official-updates.yml/badge.svg)](https://github.com/beeper-community/beeper-pulse/actions/workflows/official-updates.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Status Page](https://beeper-community.github.io/beeper-pulse) •
[RSS Feed](https://raw.githubusercontent.com/beeper-community/beeper-pulse/main/feeds/releases.xml) •
[Join Alerts](https://matrix.to/#/#beeper-pulse-alerts:beeper.com)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 📊 Status Monitoring
- Health checks for Beeper endpoints
- Uptime tracking (24h, 7d, 30d)
- Historical status data
- Automated incident detection

</td>
<td width="50%">

### 📦 Release Tracking
- GitHub releases monitoring
- npm package updates
- Changelog generation
- RSS & JSON feeds

</td>
</tr>
<tr>
<td width="50%">

### 🔔 Notifications
- **Matrix/Beeper** - Native integration
- **Discord** - Rich embeds
- **Slack** - Block kit messages
- **Webhooks** - Generic HTTP
- **Email** - Via Resend/SendGrid

</td>
<td width="50%">

### 🌐 Status Page
- Live service status
- Release history
- Auto-refreshing dashboard
- Mobile-friendly design

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone https://github.com/beeper-community/beeper-pulse.git
cd beeper-pulse

# Install dependencies
pnpm install

# Run status check
pnpm status:check

# Start status page locally
pnpm web:dev
```

---

## 📡 Subscribe to Updates

| Method | Link |
|--------|------|
| 🔔 **Matrix Room** | [#beeper-pulse-alerts:beeper.com](https://matrix.to/#/#beeper-pulse-alerts:beeper.com) |
| 📰 **RSS Feed** | [releases.xml](https://raw.githubusercontent.com/beeper-community/beeper-pulse/main/feeds/releases.xml) |
| 📦 **JSON Feed** | [releases.json](https://raw.githubusercontent.com/beeper-community/beeper-pulse/main/feeds/releases.json) |
| 🌐 **Status Page** | [beeper-community.github.io/beeper-pulse](https://beeper-community.github.io/beeper-pulse) |

---

## 🏗️ Project Structure

```
beeper-pulse/
├── packages/
│   ├── core/           # Release tracking & feed generation
│   ├── notifications/  # Multi-platform notifications
│   │   ├── matrix.ts   # Matrix/Beeper support
│   │   ├── discord.ts  # Discord webhooks
│   │   ├── slack.ts    # Slack webhooks
│   │   └── email.ts    # Email notifications
│   └── status/         # Health checks & uptime
├── apps/
│   └── web/            # Status page (Vite)
├── data/               # Snapshots & history
├── feeds/              # RSS & JSON feeds
└── .github/workflows/  # Automated checks
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|:--------:|
| `GITHUB_TOKEN` | GitHub API access | ✅ |
| `MATRIX_HOMESERVER_URL` | Matrix server (e.g., `https://matrix.beeper.com`) | For Matrix |
| `MATRIX_ACCESS_TOKEN` | Matrix access token | For Matrix |
| `MATRIX_ROOM_ID` | Target room ID | For Matrix |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | For Discord |
| `SLACK_WEBHOOK_URL` | Slack webhook URL | For Slack |

---

## 📊 Monitored Services

| Service | Endpoint | Check Interval |
|---------|----------|:--------------:|
| Beeper API | `api.beeper.com` | 5 min |
| Beeper Download | `download.beeper.com` | 5 min |
| Beeper Web | `beeper.com` | 5 min |

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm status:check` | Run health checks |
| `pnpm fetch:official` | Fetch latest releases |
| `pnpm notify:status` | Send status notification |
| `pnpm notify:releases` | Send release notifications |
| `pnpm web:dev` | Start status page dev server |
| `pnpm web:build` | Build status page |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Ideas:**
- Add new endpoints to monitor
- Improve the status page design
- Add new notification providers

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Part of [Beeper Community](https://github.com/beeper-community)**

<sub>Not affiliated with Beeper or Automattic</sub>

</div>
