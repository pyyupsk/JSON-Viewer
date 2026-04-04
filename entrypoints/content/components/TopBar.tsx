type Tab = 'tree' | 'raw' | 'jq';

interface TopBarProps {
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  onCopyAll: () => void;
}

export function TopBar({ tab, onTabChange, onCollapseAll, onExpandAll, onCopyAll }: TopBarProps) {
  return (
    <div className="topbar">
      <span className="logo">{'{ }'} json</span>
      <div className="sep" />
      <div className="tab-group">
        <button className={`tab${tab === 'tree' ? ' on' : ''}`} onClick={() => onTabChange('tree')}>
          Tree
        </button>
        <button className={`tab${tab === 'raw' ? ' on' : ''}`} onClick={() => onTabChange('raw')}>
          Raw
        </button>
      </div>
      <div className="sep" />
      <button
        className={`tab${tab === 'jq' ? ' on' : ''}`}
        style={{ color: 'var(--accent)' }}
        onClick={() => onTabChange('jq')}
      >
        jq
      </button>
      <div className="spacer" />
      <button className="top-action" onClick={onCollapseAll}>
        ⊟ Collapse
      </button>
      <button className="top-action" onClick={onExpandAll}>
        ⊞ Expand
      </button>
      <div className="sep" />
      <button className="top-action primary" onClick={onCopyAll}>
        ⎘ Copy
      </button>
    </div>
  );
}
