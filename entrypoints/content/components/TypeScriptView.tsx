import { jsonToTs } from "@content/lib/typescript";
import { useMemo, useState } from "react";

interface TypeScriptViewProps {
	data: unknown;
	name: string;
}

export function TypeScriptView({ data, name }: Readonly<TypeScriptViewProps>) {
	const [inline, setInline] = useState(false);
	const output = useMemo(
		() => jsonToTs(data, name, inline),
		[data, name, inline],
	);

	return (
		<div className="ts-view">
			<button
				type="button"
				className="ts-toggle"
				onClick={() => setInline((v) => !v)}
			>
				{inline ? "Extracted" : "Inline"}
			</button>
			<textarea
				className="raw-area"
				readOnly
				value={output}
				spellCheck={false}
			/>
		</div>
	);
}
