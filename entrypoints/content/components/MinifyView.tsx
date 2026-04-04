interface MinifyViewProps {
	data: unknown;
}

export function MinifyView({ data }: Readonly<MinifyViewProps>) {
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
