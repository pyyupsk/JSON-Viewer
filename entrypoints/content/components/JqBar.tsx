import { CopiedIcon, InvalidIcon, RunIcon } from './Icons';

interface JqBarProps {
  expr: string;
  result: string | null;
  error: string | null;
  onExprChange: (v: string) => void;
  onRun: () => void;
  onEscape: () => void;
}

export function JqBar({ expr, result, error, onExprChange, onRun, onEscape }: JqBarProps) {
  const hasStatus = result !== null || error !== null;

  return (
    <div className="jqbar">
      <span className="jq-label">jq</span>
      <input
        className="jq-input"
        placeholder=". | .features, .author.name, .stats | {stars, forks}"
        value={expr}
        onChange={(e) => onExprChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onRun();
          if (e.key === 'Escape') onEscape();
        }}
      />
      {hasStatus && (
        <span className={`jq-status ${error ? 'err' : 'ok'}`}>
          {error ? `${InvalidIcon} ${error}` : `${CopiedIcon} ok`}
        </span>
      )}
      <button className="jq-run" onClick={onRun}>
        {RunIcon} Run
      </button>
    </div>
  );
}
