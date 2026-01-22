```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║    ██████╗ ███████╗███████╗██████╗ ███████╗██████╗               ║
║    ██╔══██╗██╔════╝██╔════╝██╔══██╗██╔════╝██╔══██╗              ║
║    ██████╔╝█████╗  █████╗  ██████╔╝█████╗  ██████╔╝              ║
║    ██╔══██╗██╔══╝  ██╔══╝  ██╔═══╝ ██╔══╝  ██╔══██╗              ║
║    ██████╔╝███████╗███████╗██║     ███████╗██║  ██║              ║
║    ╚═════╝ ╚══════╝╚══════╝╚═╝     ╚══════╝╚═╝  ╚═╝              ║
║                                                                  ║
║    ██████╗ ██╗   ██╗██╗     ███████╗███████╗                     ║
║    ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝                     ║
║    ██████╔╝██║   ██║██║     ███████╗█████╗                       ║
║    ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝                       ║
║    ██║     ╚██████╔╝███████╗███████║███████╗                     ║
║    ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝                     ║
║                                                                  ║
║    Real-time notifications for the Beeper ecosystem              ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

<div align="center">

[![Release Notifications](https://github.com/beeper-community/beeper-pulse/actions/workflows/release-notifications.yml/badge.svg)](https://github.com/beeper-community/beeper-pulse/actions/workflows/release-notifications.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

</div>

---

## Overview

**Beeper Pulse** is the notification hub for the Beeper community ecosystem. It delivers real-time alerts about releases, status changes, and important updates across multiple channels including Matrix, Discord, and Slack.

This repository focuses exclusively on **notifications** - discovery and analysis happen in [beeper-scout](https://github.com/beeper-community/beeper-scout), while curated documentation lives in [awesome-beeper](https://github.com/beeper-community/awesome-beeper).

---

## Features

| Feature | Description |
|---------|-------------|
| :loudspeaker: **Release Notifications** | Instant alerts when new versions of Beeper apps and bridges are released |
| :bell: **Status Alerts** | Real-time notifications for service status changes and incidents |
| :link: **Multi-Channel** | Deliver notifications to Matrix, Discord, Slack, and webhooks |

---

## Ecosystem

Beeper Pulse is part of a 3-repo ecosystem for the Beeper community:

| Repository | Purpose | Link |
|------------|---------|------|
| **beeper-pulse** | Notifications & Alerts | *You are here* |
| **beeper-scout** | Discovery & Analysis | [beeper-community/beeper-scout](https://github.com/beeper-community/beeper-scout) |
| **awesome-beeper** | Curated Documentation | [beeper-community/awesome-beeper](https://github.com/beeper-community/awesome-beeper) |

---

## Setup

### Repository Secrets

Configure these secrets in your GitHub repository settings:

| Secret | Description | Required |
|--------|-------------|:--------:|
| `GITHUB_TOKEN` | GitHub API access (auto-provided) | Automatic |
| `MATRIX_HOMESERVER_URL` | Matrix server URL (e.g., `https://matrix.beeper.com`) | For Matrix |
| `MATRIX_ACCESS_TOKEN` | Matrix bot access token | For Matrix |
| `MATRIX_ROOM_ID` | Target Matrix room ID | For Matrix |
| `DISCORD_WEBHOOK_URL` | Discord webhook URL | For Discord |
| `SLACK_WEBHOOK_URL` | Slack incoming webhook URL | For Slack |

---

## Notification Channels

### Matrix / Beeper

Native integration with Matrix protocol. Messages are sent directly to your specified room with rich formatting.

```bash
# Required secrets
MATRIX_HOMESERVER_URL=https://matrix.beeper.com
MATRIX_ACCESS_TOKEN=syt_xxx
MATRIX_ROOM_ID=!roomid:beeper.com
```

### Discord

Rich embed notifications via Discord webhooks with color-coded status indicators.

```bash
# Required secret
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

### Slack

Block Kit formatted messages for Slack workspaces.

```bash
# Required secret
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

---

## Development

```bash
# Clone the repository
git clone https://github.com/beeper-community/beeper-pulse.git
cd beeper-pulse

# Install dependencies
pnpm install

# Run tests
pnpm test

# Check types
pnpm typecheck

# Lint code
pnpm lint
```

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">

**Part of [Beeper Community](https://github.com/beeper-community)**

<sub>Not affiliated with Beeper or Automattic</sub>

</div>
