// Pure TypeScript port of the jq-like engine from the prototype.
// No external dependencies. Handles the subset of jq used in the JSON viewer.

type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

function run(expr: string, data: unknown): unknown {
  expr = expr.trim();
  if (!expr || expr === '.') return data;

  // pipe
  if (expr.includes('|')) {
    const parts = splitPipe(expr);
    return parts.reduce((acc: unknown, p: string) => run(p.trim(), acc), data);
  }

  // array iter
  if (expr === '.[]') {
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data) return Object.values(data as Record<string, unknown>);
    throw new Error('not iterable');
  }

  // construct object  { a, b.c as b }
  if (expr.startsWith('{') && expr.endsWith('}')) {
    return buildObj(expr.slice(1, -1).trim(), data);
  }

  // construct array [ ... ]
  if (expr.startsWith('[') && expr.endsWith(']')) {
    const inner = expr.slice(1, -1).trim();
    if (!inner) return [];
    return splitComma(inner).map((e) => run(e.trim(), data));
  }

  // comma-separated → array of results
  const commas = splitComma(expr);
  if (commas.length > 1) return commas.map((e) => run(e.trim(), data));

  // select()
  const selM = expr.match(/^select\((.+)\)$/);
  if (selM) {
    const v = evalCond(selM[1], data);
    return v ? data : undefined;
  }

  // has()
  const hasM = expr.match(/^has\("(.+)"\)$/);
  if (hasM)
    return Object.prototype.hasOwnProperty.call(data ?? {}, hasM[1]);

  // keys / values / length / type
  if (expr === 'keys') return Object.keys((data ?? {}) as object);
  if (expr === 'values') return Object.values((data ?? {}) as object);
  if (expr === 'length') {
    if (Array.isArray(data)) return data.length;
    if (typeof data === 'string') return data.length;
    if (typeof data === 'object' && data) return Object.keys(data).length;
    return 0;
  }
  if (expr === 'type')
    return Array.isArray(data) ? 'array' : data === null ? 'null' : typeof data;

  // to_entries / from_entries
  if (expr === 'to_entries')
    return Object.entries((data ?? {}) as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v,
    }));
  if (expr === 'from_entries') {
    const o: Record<string, unknown> = {};
    ((data ?? []) as Array<{ key?: string; name?: string; value: unknown }>).forEach((e) => {
      o[e.key ?? e.name ?? ''] = e.value;
    });
    return o;
  }

  // map()
  const mapM = expr.match(/^map\((.+)\)$/);
  if (mapM) {
    const arr = Array.isArray(data) ? data : Object.values((data ?? {}) as object);
    return arr.map((i) => run(mapM[1], i)).filter((v) => v !== undefined);
  }

  // map_values()
  const mvM = expr.match(/^map_values\((.+)\)$/);
  if (mvM) {
    if (Array.isArray(data)) return data.map((i) => run(mvM[1], i));
    const o: Record<string, unknown> = {};
    Object.entries((data ?? {}) as Record<string, unknown>).forEach(([k, v]) => {
      o[k] = run(mvM[1], v);
    });
    return o;
  }

  // sort_by()
  const sbM = expr.match(/^sort_by\((.+)\)$/);
  if (sbM) {
    const field = sbM[1].trim().replace(/^\./, '');
    return [...(Array.isArray(data) ? data : [])].sort((a, b) => {
      const av = (a as Record<string, unknown>)[field] as string | number;
      const bv = (b as Record<string, unknown>)[field] as string | number;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  }

  // group_by()
  const gbM = expr.match(/^group_by\((.+)\)$/);
  if (gbM) {
    const field = gbM[1].trim().replace(/^\./, '');
    const groups: Record<string, unknown[]> = {};
    (Array.isArray(data) ? data : []).forEach((i) => {
      const k = String((i as Record<string, unknown>)[field]);
      if (!groups[k]) groups[k] = [];
      groups[k].push(i);
    });
    return Object.values(groups);
  }

  // unique_by()
  const ubM = expr.match(/^unique_by\((.+)\)$/);
  if (ubM) {
    const field = ubM[1].trim().replace(/^\./, '');
    const seen = new Set<string>();
    return (Array.isArray(data) ? data : []).filter((i) => {
      const k = String((i as Record<string, unknown>)[field]);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  // add
  if (expr === 'add') {
    if (!Array.isArray(data)) return null;
    return data.reduce((a: unknown, b: unknown) => {
      if (typeof a === 'number' && typeof b === 'number') return a + b;
      if (typeof a === 'string') return String(a) + String(b);
      if (Array.isArray(a) && Array.isArray(b)) return (a as unknown[]).concat(b as unknown[]);
      if (typeof a === 'object' && a && typeof b === 'object' && b) return Object.assign({}, a, b);
      return b;
    }, data[0] ?? null);
  }

  // not
  if (expr === 'not') return !data;

  // ascii_downcase / upcase
  if (expr === 'ascii_downcase') return String(data).toLowerCase();
  if (expr === 'ascii_upcase') return String(data).toUpperCase();

  // ltrimstr / rtrimstr
  const ltM = expr.match(/^ltrimstr\("(.*)"\)$/);
  if (ltM) return String(data).startsWith(ltM[1]) ? String(data).slice(ltM[1].length) : data;
  const rtM = expr.match(/^rtrimstr\("(.*)"\)$/);
  if (rtM)
    return String(data).endsWith(rtM[1]) ? String(data).slice(0, -rtM[1].length) : data;

  // split / join
  const spM = expr.match(/^split\("(.*)"\)$/);
  if (spM) return String(data).split(spM[1]);
  const jnM = expr.match(/^join\("(.*)"\)$/);
  if (jnM) return (Array.isArray(data) ? data : []).join(jnM[1]);

  // tostring / tonumber
  if (expr === 'tostring') return String(data);
  if (expr === 'tonumber') return Number(data);

  // recurse / ..
  if (expr === 'recurse' || expr === '..') {
    const out: unknown[] = [];
    function walk(v: unknown) {
      out.push(v);
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    }
    walk(data);
    return out;
  }

  // if-then-else
  const ifM = expr.match(/^if\s+(.+?)\s+then\s+(.+?)(?:\s+else\s+(.+?))?\s+end$/);
  if (ifM) {
    const cond = evalCond(ifM[1], data);
    return run(cond ? ifM[2] : (ifM[3] ?? '.'), data);
  }

  // .key.sub.path and .key[0].sub
  if (expr.startsWith('.')) {
    return pathGet(expr.slice(1), data);
  }

  // string literal
  if (expr.startsWith('"') && expr.endsWith('"')) return expr.slice(1, -1);

  // number literal
  if (!Number.isNaN(Number(expr)) && expr !== '') return Number(expr);

  // boolean / null / empty
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (expr === 'null') return null;
  if (expr === 'empty') return undefined;

  throw new Error(`Unknown: ${expr}`);
}

function pathGet(path: string, data: unknown): unknown {
  if (!path) return data;
  let cur = data;
  const tokens: Array<{ type: 'idx' | 'key'; val: string }> = [];
  let i = 0;
  while (i < path.length) {
    if (path[i] === '[') {
      const close = path.indexOf(']', i);
      tokens.push({ type: 'idx', val: path.slice(i + 1, close) });
      i = close + 1;
      if (path[i] === '.') i++;
    } else {
      const dot = path.indexOf('.', i);
      const bracket = path.indexOf('[', i);
      let end = path.length;
      if (dot !== -1 && dot < end) end = dot;
      if (bracket !== -1 && bracket < end) end = bracket;
      const key = path.slice(i, end);
      if (key) tokens.push({ type: 'key', val: key });
      i = end;
      if (path[i] === '.') i++;
    }
  }
  for (const t of tokens) {
    if (cur == null) return null;
    if (t.type === 'idx') {
      let idx: number | string | null;
      if (t.val === '') idx = null;
      else if (!Number.isNaN(Number(t.val))) idx = Number(t.val);
      else idx = t.val.replaceAll('"', '');
      cur =
        idx === null
          ? Array.isArray(cur)
            ? cur
            : Object.values(cur as object)
          : (cur as Record<string | number, unknown>)[idx];
    } else {
      cur = (cur as Record<string, unknown>)[t.val];
    }
  }
  return cur ?? null;
}

function evalCond(expr: string, data: unknown): boolean {
  const cmp = expr.match(/^(.+?)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (cmp) {
    const lv = run(cmp[1].trim(), data);
    let rv: unknown = cmp[3].trim();
    if ((rv as string).startsWith('"')) rv = (rv as string).slice(1, -1);
    else if (rv === 'true') rv = true;
    else if (rv === 'false') rv = false;
    else if (rv === 'null') rv = null;
    else if (!Number.isNaN(Number(rv as string))) rv = Number(rv as string);
    switch (cmp[2]) {
      case '==': return String(lv) === String(rv) || lv === rv; // loose equality for jq semantics
      case '!=': return String(lv) !== String(rv) && lv !== rv;
      case '>': return (lv as number) > (rv as number);
      case '<': return (lv as number) < (rv as number);
      case '>=': return (lv as number) >= (rv as number);
      case '<=': return (lv as number) <= (rv as number);
    }
  }
  return !!run(expr, data);
}

function buildObj(inner: string, data: unknown): unknown {
  const o: Record<string, unknown> = {};
  splitComma(inner).forEach((entry) => {
    entry = entry.trim();
    const colon = entry.indexOf(':');
    if (colon !== -1) {
      const k = entry.slice(0, colon).trim().replaceAll('"', '');
      o[k] = run(entry.slice(colon + 1).trim(), data);
    } else {
      const field = entry.replace(/^\./, '');
      o[field] = run(entry.startsWith('.') ? entry : `.${entry}`, data);
    }
  });
  return o;
}

function splitPipe(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0, str = false, buf = '';
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' && expr[i - 1] !== '\\') str = !str;
    if (!str) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
    }
    if (!str && depth === 0 && c === '|') {
      parts.push(buf);
      buf = '';
    } else buf += c;
  }
  parts.push(buf);
  return parts;
}

function splitComma(expr: string): string[] {
  const parts: string[] = [];
  let depth = 0, str = false, buf = '';
  for (let i = 0; i < expr.length; i++) {
    const c = expr[i];
    if (c === '"' && expr[i - 1] !== '\\') str = !str;
    if (!str) {
      if ('([{'.includes(c)) depth++;
      if (')]}'.includes(c)) depth--;
    }
    if (!str && depth === 0 && c === ',') {
      parts.push(buf);
      buf = '';
    } else buf += c;
  }
  parts.push(buf);
  return parts;
}

export const jq = { run };

// Suppress unused type warning
export type { JsonValue };
