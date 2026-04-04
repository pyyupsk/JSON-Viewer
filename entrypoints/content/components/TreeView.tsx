import { useCallback, useEffect, useRef, useState } from 'react';
import type { Row } from '../flatten';
import { TreeRow } from './TreeRow';

const ROW_HEIGHT = 20; // matches --lh: 20px
const BUFFER = 20;     // rows to render above/below viewport

interface TreeViewProps {
  rows: Row[];
  selPath: string | null;
  matchSet: Set<string>;
  focusPath: string | null;
  onToggle: (path: string) => void;
  onSelect: (path: string) => void;
  onCopy: (val: unknown) => void;
}

export function TreeView({
  rows,
  selPath,
  matchSet,
  focusPath,
  onToggle,
  onSelect,
  onCopy,
}: TreeViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(600);

  // Track scroll and viewport size
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => setScrollTop(el.scrollTop);
    const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));

    el.addEventListener('scroll', onScroll, { passive: true });
    ro.observe(el);
    setViewportHeight(el.clientHeight);

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, []);

  // Scroll focused match into view
  useEffect(() => {
    if (focusPath === null) return;
    const idx = rows.findIndex((r) => r.path === focusPath);
    if (idx === -1) return;
    const el = scrollRef.current;
    if (!el) return;
    const rowTop = idx * ROW_HEIGHT;
    const rowBot = rowTop + ROW_HEIGHT;
    if (rowTop < el.scrollTop || rowBot > el.scrollTop + el.clientHeight) {
      el.scrollTo({ top: rowTop - el.clientHeight / 2 + ROW_HEIGHT / 2, behavior: 'smooth' });
    }
  }, [focusPath, rows]);

  // Virtual window
  const totalHeight = rows.length * ROW_HEIGHT;
  const visibleStart = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - BUFFER);
  const visibleEnd = Math.min(rows.length, Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER);
  const visibleRows = rows.slice(visibleStart, visibleEnd);
  const topPad = visibleStart * ROW_HEIGHT;
  const bottomPad = totalHeight - visibleEnd * ROW_HEIGHT;

  const openPathOf = useCallback(
    (row: Row) => (row.kind === 'close' ? row.path.replace('__close', '') : row.path),
    [],
  );

  return (
    <div className="tree-scroll" ref={scrollRef}>
      <div className="tree" style={{ height: totalHeight }}>
        {topPad > 0 && <div className="tree-spacer-top" style={{ height: topPad }} />}
        {visibleRows.map((row, i) => {
          const lineNum = visibleStart + i + 1;
          const openPath = openPathOf(row);
          return (
            <TreeRow
              key={row.path}
              row={row}
              lineNum={lineNum}
              isSelected={selPath === openPath}
              isMatch={matchSet.has(row.path)}
              isFocus={focusPath === row.path}
              onToggle={onToggle}
              onSelect={onSelect}
              onCopy={onCopy}
            />
          );
        })}
        {bottomPad > 0 && <div className="tree-spacer-bot" style={{ height: bottomPad }} />}
      </div>
    </div>
  );
}
