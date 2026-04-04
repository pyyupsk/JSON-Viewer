// Row discriminated union — one entry per visible line in the tree.
// flattenData() walks the JSON depth-first, skipping children of collapsed paths.

export type OpenRow = {
  kind: 'open';
  path: string;
  depth: number;
  key: string | null;   // null for array items and root
  type: 'object' | 'array';
  count: number;        // number of keys/items (for collapsed pill)
  isLast: boolean;
  collapsed: boolean;
  // original subtree value — used for copy-as-JSON
  value: Record<string, unknown> | unknown[];
};

export type CloseRow = {
  kind: 'close';
  path: string;
  depth: number;
  type: 'object' | 'array';
  isLast: boolean;
};

export type PrimRow = {
  kind: 'prim';
  path: string;
  depth: number;
  key: string | null;
  value: string | number | boolean | null;
  isLast: boolean;
};

export type Row = OpenRow | CloseRow | PrimRow;

// ── flattenData ───────────────────────────────────────────────────────────────

export function flattenData(data: unknown, collapsed: Set<string>): Row[] {
  const rows: Row[] = [];
  walk(data, 'root', 0, null, true, collapsed, rows);
  return rows;
}

function walk(
  val: unknown,
  path: string,
  depth: number,
  key: string | null,
  isLast: boolean,
  collapsed: Set<string>,
  rows: Row[],
): void {
  if (val !== null && typeof val === 'object') {
    const isArr = Array.isArray(val);
    const type = isArr ? 'array' : 'object';
    const keys = isArr
      ? (val as unknown[]).map((_, i) => String(i))
      : Object.keys(val as Record<string, unknown>);
    const col = collapsed.has(path);

    rows.push({
      kind: 'open',
      path,
      depth,
      key,
      type,
      count: keys.length,
      isLast,
      collapsed: col,
      value: val as Record<string, unknown> | unknown[],
    });

    if (!col) {
      keys.forEach((k, i) => {
        const childPath = isArr ? `${path}[${k}]` : `${path}.${k}`;
        const childVal = isArr
          ? (val as unknown[])[Number(k)]
          : (val as Record<string, unknown>)[k];
        walk(childVal, childPath, depth + 1, isArr ? null : k, i === keys.length - 1, collapsed, rows);
      });

      rows.push({ kind: 'close', path: `${path}__close`, depth, type, isLast });
    }
  } else {
    rows.push({
      kind: 'prim',
      path,
      depth,
      key,
      value: val as string | number | boolean | null,
      isLast,
    });
  }
}

// ── rowSearchText ─────────────────────────────────────────────────────────────
// Returns the text that should be matched against the search query for a row.

export function rowSearchText(row: Row): string {
  if (row.kind === 'close') return '';

  const kp = row.key !== null ? `"${row.key}": ` : '';

  if (row.kind === 'open') {
    const open = row.type === 'array' ? '[' : '{';
    const close = row.type === 'array' ? ']' : '}';
    const label = `${row.count} ${row.type === 'array' ? 'items' : 'keys'}`;
    return row.collapsed ? `${kp}${open} ${label} ${close}` : `${kp}${open}`;
  }

  // prim
  if (row.value === null) return `${kp}null`;
  if (typeof row.value === 'string') return `${kp}"${row.value}"`;
  return `${kp}${row.value}`;
}
