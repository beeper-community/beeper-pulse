# Contributing to Beeper Pulse

Thank you for your interest in contributing to Beeper Pulse! This document provides guidelines for contributing.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/beeper-pulse.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature`

## Development

### Prerequisites

- Node.js 20+
- pnpm 8+

### Commands

```bash
# Install dependencies
pnpm install

# Run status check locally
pnpm status:check

# Start web dev server
pnpm web:dev

# Build all packages
pnpm build
```

### Project Structure

- `packages/core/` - Release tracking and feed generation
- `packages/notifications/` - Multi-platform notification system
- `packages/status/` - Health checks and uptime monitoring
- `apps/web/` - Status page (Vite + vanilla JS)

## Contributing Guidelines

### Adding a New Endpoint to Monitor

1. Edit `packages/status/types.ts`
2. Add your endpoint to the `ENDPOINTS` array
3. Test locally with `pnpm status:check`

### Adding a New Notification Provider

1. Create a new file in `packages/notifications/`
2. Implement the `NotificationProvider` interface
3. Export from `packages/notifications/index.ts`
4. Add documentation

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs
- Use meaningful variable and function names

## Pull Request Process

1. Ensure your code passes TypeScript checks
2. Update documentation if needed
3. Write a clear PR description
4. Link any related issues

## Questions?

Open an issue or start a discussion in the repository.

---

**Thank you for contributing to Beeper Pulse! 🐝**
