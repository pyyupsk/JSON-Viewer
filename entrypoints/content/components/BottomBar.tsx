interface BottomBarProps {
  valid: boolean;
  sizeKb: string;
  lineCount: number;
  selPath: string | null;
}

export function BottomBar({ valid, sizeKb, lineCount, selPath }: BottomBarProps) {
  return (
    <div className="bottombar">
      <span className={valid ? 'bb-ok' : 'bb-err'}>{valid ? '● valid' : '✗ invalid JSON'}</span>
      <span>{sizeKb} KB</span>
      <span>{lineCount} lines</span>
      <div className="bb-right">
        <span className="bb-path">{selPath ?? 'root'}</span>
      </div>
    </div>
  );
}
