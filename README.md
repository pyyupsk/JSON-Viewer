# JSON Viewer

A browser extension that beautifully formats and displays JSON responses directly in the browser.

## Features

- **Tree view** — collapsible/expandable nodes for easy navigation
- **Raw view** — pretty-printed JSON with indentation
- **Minify view** — compact single-line output
- **jq filter** — run jq expressions against the JSON in real time, with inline autocomplete for keys and built-in functions
- **Search** — highlight matches across the tree with case-sensitivity toggle
- **Copy** — copy the full JSON or any selected node to clipboard
- **Keyboard shortcuts** — `Ctrl/Cmd+F` to focus search, `Ctrl/Cmd+Shift+C` to copy
- **Status bar** — shows JSON validity, file size, row count, and selected path

## Installation

### Chrome

1. Go to the [latest release](https://github.com/pyyupsk/JSON-Viewer/releases/latest) and download `json-viewer-*-chrome.zip`
2. Unzip the downloaded file
3. In Chrome, go to `chrome://extensions` and turn on **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the unzipped folder

### Firefox

1. Go to the [latest release](https://github.com/pyyupsk/JSON-Viewer/releases/latest) and download `json-viewer-*-firefox.zip`
2. In Firefox, go to `about:debugging#/runtime/this-firefox`
3. Click **Load Temporary Add-on** and select the downloaded zip file

> **Note:** The Firefox extension is temporary and will be removed when the browser is closed. A permanently installable version is planned.

## Contributing

Bug reports and feature requests are welcome via [GitHub Issues](https://github.com/pyyupsk/json-viewer/issues).

## License

MIT © [pyyupsk](https://github.com/pyyupsk)
