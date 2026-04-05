import { jq } from "@content/lib/jq";
import { useCallback, useState } from "react";

export function useJqFilter(data: unknown): {
	jqExpr: string;
	jqResult: string | null;
	jqError: string | null;
	setJqExpr: (expr: string) => void;
	handleJqEval: () => void;
	handleJqEscape: () => void;
} {
	const [jqExpr, setJqExpr] = useState("");
	const [jqResult, setJqResult] = useState<string | null>(null);
	const [jqError, setJqError] = useState<string | null>(null);

	const handleJqEval = useCallback(() => {
		const expr = jqExpr.trim();
		if (!expr || expr === ".") {
			setJqResult(null);
			setJqError(null);
			return;
		}
		try {
			const result = jq.run(expr, data);
			setJqResult(JSON.stringify(result, null, 2));
			setJqError(null);
		} catch (e) {
			setJqError((e as Error).message);
			setJqResult(null);
		}
	}, [jqExpr, data]);

	const handleJqEscape = useCallback(() => {
		setJqExpr("");
		setJqResult(null);
		setJqError(null);
	}, []);

	return {
		jqExpr,
		jqResult,
		jqError,
		setJqExpr,
		handleJqEval,
		handleJqEscape,
	};
}
