interface RawViewProps {
	content: string;
}

export function RawView({ content }: Readonly<RawViewProps>) {
	return (
		<textarea
			className="raw-area"
			readOnly
			value={content}
			spellCheck={false}
		/>
	);
}
