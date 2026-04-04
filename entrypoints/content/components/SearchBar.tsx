import { NextIcon, PrevIcon, SearchIcon } from "./Icons";

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
}: Readonly<SearchBarProps>) {
	const meta = query
		? matchCount > 0
			? `${matchIdx + 1} / ${matchCount}`
			: "no matches"
		: "";

	return (
		<div className="searchbar">
			<SearchIcon />
			<input
				className="search-input"
				placeholder="Search keys and values…"
				value={query}
				onChange={(e) => onQueryChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === "Enter") onStepMatch(e.shiftKey ? -1 : 1);
					if (e.key === "Escape") onQueryChange("");
				}}
			/>
			<span className="search-meta">{meta}</span>
			<div className="search-nav">
				<button
					type="button"
					className="search-nav-btn"
					onClick={() => onStepMatch(-1)}
					title="Previous"
				>
					{PrevIcon}
				</button>
				<button
					type="button"
					className="search-nav-btn"
					onClick={() => onStepMatch(1)}
					title="Next"
				>
					{NextIcon}
				</button>
			</div>
			<button
				type="button"
				className={`case-btn${caseSen ? " on" : ""}`}
				onClick={onCaseSenToggle}
				title="Case sensitive"
			>
				Aa
			</button>
		</div>
	);
}
