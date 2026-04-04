// Single source of truth for all icons used in the JSON viewer UI.
// Unicode glyphs are exported as string constants; SVG icons as components.

// ── Unicode glyphs ────────────────────────────────────────────────────────────

export const CollapseIcon = '⊟';
export const ExpandIcon   = '⊞';
export const CopyIcon     = '⎘';
export const CopiedIcon   = '✓';
export const RunIcon      = '▶';
export const PrevIcon     = '▲';
export const NextIcon     = '▼';
export const CollapseNodeIcon = '−';
export const ExpandNodeIcon   = '+';
export const ValidIcon    = '●';
export const InvalidIcon  = '✗';

// ── SVG icons ─────────────────────────────────────────────────────────────────

export function SearchIcon() {
  return (
    <svg className="search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="4" stroke="#555" strokeWidth="1.2" />
      <line x1="8.9" y1="8.9" x2="12" y2="12" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
