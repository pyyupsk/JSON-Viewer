import ReactDOM from 'react-dom/client';
import { App } from './App';
import './style.css';

async function detectJson(): Promise<string | null> {
  if (document.contentType === 'application/json') return document.body.innerText;

  if (document.contentType !== 'text/plain' && document.contentType !== 'text/html') return null;

  const raw = document.body?.innerText ?? '';
  if (raw.length > 5_000_000) return null;

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
  cssInjectionMode: 'manifest',

  async main() {
    const raw = await detectJson();
    if (!raw) return;

    // Take over the page — remove all existing content and mount our viewer
    document.documentElement.style.cssText = 'height:100%;';
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;padding:0;height:100%;overflow:hidden;';

    const container = document.createElement('div');
    container.style.cssText = 'height:100%;';
    document.body.appendChild(container);

    ReactDOM.createRoot(container).render(<App rawJson={raw} />);
  },
});
