interface SearchBarProps {
  query: string;
  caseSen: boolean;
  matchIdx: number;
  matchCount: number;
  onQueryChange: (q: string) => void;
  onCaseSenToggle: () => void;
  onStepMatch: (dir: 1 | -1) => void;
}

export function SearchBar({
  query,
  caseSen,
  matchIdx,
  matchCount,
  onQueryChange,
  onCaseSenToggle,
  onStepMatch,
}: SearchBarProps) {
  const meta = query
    ? matchCount > 0
      ? `${matchIdx + 1} / ${matchCount}`
      : 'no matches'
    : '';

  return (
    <div className="searchbar">
      <svg className="search-icon" width="13" height="13" viewBox="0 0 13 13" fill="none">
        <circle cx="5.5" cy="5.5" r="4" stroke="#555" strokeWidth="1.2" />
        <line x1="8.9" y1="8.9" x2="12" y2="12" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      <input
        className="search-input"
        placeholder="Search keys and values…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onStepMatch(e.shiftKey ? -1 : 1);
          if (e.key === 'Escape') onQueryChange('');
        }}
      />
      <span className="search-meta">{meta}</span>
      <div className="search-nav">
        <button className="search-nav-btn" onClick={() => onStepMatch(-1)} title="Previous">
          ▲
        </button>
        <button className="search-nav-btn" onClick={() => onStepMatch(1)} title="Next">
          ▼
        </button>
      </div>
      <button className={`case-btn${caseSen ? ' on' : ''}`} onClick={onCaseSenToggle} title="Case sensitive">
        Aa
      </button>
    </div>
  );
}
