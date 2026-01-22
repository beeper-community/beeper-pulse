# 🐝 Beeper Pulse

> Full monitoring suite for the Beeper ecosystem

[![Status Check](https://github.com/beeper-community/beeper-pulse/actions/workflows/status-check.yml/badge.svg)](https://github.com/beeper-community/beeper-pulse/actions/workflows/status-check.yml)
[![Official Updates](https://github.com/beeper-community/beeper-pulse/actions/workflows/official-updates.yml/badge.svg)](https://github.com/beeper-community/beeper-pulse/actions/workflows/official-updates.yml)

**Beeper Pulse** monitors the Beeper ecosystem and keeps the community informed about releases, status changes, and updates.

## 🌐 Status Page

Visit the live status page: **[beeper-community.github.io/beeper-pulse](https://beeper-community.github.io/beeper-pulse)**

## 📦 Features

### Version Tracking
- Monitors GitHub releases and npm packages
- Generates changelogs and release notes
- Provides RSS and JSON feeds for updates

### Status Monitoring
- Health checks for Beeper endpoints
- Uptime tracking (24h, 7d, 30d)
- Historical status data

### Notifications
- Discord webhooks with rich embeds
- Slack notifications with blocks
- Generic webhook support
- Email notifications (via Resend/SendGrid)

### Visualizations
- Live status page
- Service health indicators
- Release timeline

## 🏗️ Project Structure

```
beeper-pulse/
├── packages/
│   ├── core/           # Release tracking & feeds
│   ├── notifications/  # Multi-platform notifications
│   └── status/         # Health checks & uptime
├── apps/
│   └── web/            # Status page (GitHub Pages)
├── data/               # Snapshots & history
└── feeds/              # RSS & JSON feeds
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Run status check
pnpm status:check

# Fetch official releases
pnpm fetch:official

# Start dev server for status page
pnpm web:dev
```

## 📡 Subscribe to Updates

- **RSS Feed**: [releases.xml](https://raw.githubusercontent.com/beeper-community/beeper-pulse/main/feeds/releases.xml)
- **JSON Feed**: [releases.json](https://raw.githubusercontent.com/beeper-community/beeper-pulse/main/feeds/releases.json)

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub API access | Yes |
| `DISCORD_WEBHOOK_URL` | Discord notifications | No |
| `SLACK_WEBHOOK_URL` | Slack notifications | No |
| `RESEND_API_KEY` | Email via Resend | No |
| `SENDGRID_API_KEY` | Email via SendGrid | No |

## 📊 Monitored Endpoints

| Endpoint | Description |
|----------|-------------|
| Beeper API | Main API health |
| Beeper Download | Download server |
| Beeper Web | Website availability |

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Part of the [Beeper Community](https://github.com/beeper-community) · Not affiliated with Beeper or Automattic**
