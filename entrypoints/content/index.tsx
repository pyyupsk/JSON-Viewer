import ReactDOM from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { App } from './App';

async function detectJson(): Promise<string | null> {
  // Fast path — explicit content type
  if (document.contentType === 'application/json') return document.body.innerText;

  // Only sniff text/plain and text/html fallbacks
  if (document.contentType !== 'text/plain' && document.contentType !== 'text/html') return null;

  const raw = document.body?.innerText ?? '';

  // Bail early on large pages before attempting parse
  if (raw.length > 5_000_000) return null;

  // Quick structural check before parsing
  const trimmed = raw.trimStart();
  if (trimmed[0] !== '{' && trimmed[0] !== '[') return null;

  try {
    JSON.parse(raw);
    return raw;
  } catch {
    return null;
  }
}

export default defineContentScript({
  matches: ['*://*/*'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    const raw = await detectJson();
    if (!raw) return;

    // Hide original content without destroying it
    const pre = document.body.querySelector('pre');
    if (pre) {
      pre.style.display = 'none';
    } else {
      document.body.style.visibility = 'hidden';
    }

    const ui = await createShadowRootUi(ctx, {
      name: 'json-viewer',
      position: 'inline',
      anchor: 'body',
      onMount(container: HTMLElement): Root {
        // Make the shadow host full-viewport so the viewer covers the page edge-to-edge
        const host = (container.getRootNode() as ShadowRoot).host as HTMLElement;
        host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;';

        const root = ReactDOM.createRoot(container);
        root.render(<App rawJson={raw} />);
        return root;
      },
      onRemove(root: Root | undefined) {
        root?.unmount();
      },
    });

    ui.mount();
  },
});
