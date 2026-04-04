interface MinifyViewProps {
	data: unknown;
}

export function MinifyView({ data }: MinifyViewProps) {
	const minified = JSON.stringify(data);
	return (
		<textarea
			className="raw-area"
			readOnly
			value={minified}
			spellCheck={false}
		/>
	);
}
