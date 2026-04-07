import type { Row } from "@content/lib/flatten";
import { rowSearchText } from "@content/lib/flatten";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useSearch(rows: Row[]): {
	searchQuery: string;
	caseSen: boolean;
	matchIdx: number;
	matches: string[];
	matchSet: Set<string>;
	focusPath: string | null;
	setSearchQuery: (q: string) => void;
	setCaseSen: React.Dispatch<React.SetStateAction<boolean>>;
	stepMatch: (dir: 1 | -1) => void;
} {
	const [searchQuery, setSearchQuery] = useState("");
	const [caseSen, setCaseSen] = useState(false);
	const [matchIdx, setMatchIdx] = useState(-1);

	const matches = useMemo<string[]>(() => {
		if (!searchQuery) return [];
		const q = caseSen ? searchQuery : searchQuery.toLowerCase();
		return rows
			.filter((row) => {
				const text = caseSen
					? rowSearchText(row)
					: rowSearchText(row).toLowerCase();
				return text.includes(q);
			})
			.map((row) => row.path);
	}, [rows, searchQuery, caseSen]);

	const matchSet = useMemo(() => new Set(matches), [matches]);
	const focusPath = matches[matchIdx] ?? null;

	useEffect(() => {
		setMatchIdx(matches.length > 0 ? 0 : -1);
	}, [matches]);

	const stepMatch = useCallback(
		(dir: 1 | -1) => {
			if (!matches.length) return;
			setMatchIdx((prev) => (prev + dir + matches.length) % matches.length);
		},
		[matches],
	);

	return {
		searchQuery,
		caseSen,
		matchIdx,
		matches,
		matchSet,
		focusPath,
		setSearchQuery,
		setCaseSen,
		stepMatch,
	};
}
