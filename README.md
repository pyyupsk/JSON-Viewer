# JSON Viewer

A browser extension that beautifully formats and displays JSON responses directly in the browser.

## Features

- **Tree view** — collapsible/expandable nodes for easy navigation
- **Raw view** — pretty-printed JSON with indentation
- **Minify view** — compact single-line output
- **jq filter** — run jq expressions against the JSON in real time
- **Search** — highlight matches across the tree with case-sensitivity toggle
- **Copy** — copy the full JSON or any selected node to clipboard
- **Keyboard shortcuts** — `Ctrl/Cmd+F` to focus search, `Ctrl/Cmd+Shift+C` to copy
- **Status bar** — shows JSON validity, file size, row count, and selected path

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)

### Install

```bash
bun install
```

### Development

```bash
bun dev          # Chrome
bun dev:firefox  # Firefox
```

### Build

```bash
bun run build          # Chrome
bun run build:firefox  # Firefox
```

### Test

```bash
bun test              # Unit tests
bun test:e2e          # E2E tests
bun run coverage:all  # Full coverage report
```

## Tech Stack

- [WXT](https://wxt.dev) — browser extension framework
- [React 19](https://react.dev) — UI
- [TypeScript](https://www.typescriptlang.org) — type safety
- [Biome](https://biomejs.dev) — linting and formatting
- [Vitest](https://vitest.dev) — unit testing
- [Playwright](https://playwright.dev) — E2E testing

## Contributing

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/pyyupsk/json-viewer/issues).

## License

MIT © [Pongsakorn Thipayanate](https://github.com/pyyupsk)
