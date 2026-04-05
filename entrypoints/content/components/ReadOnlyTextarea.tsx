interface ReadOnlyTextareaProps {
	value: string;
}

export function ReadOnlyTextarea({ value }: Readonly<ReadOnlyTextareaProps>) {
	return (
		<textarea className="raw-area" readOnly value={value} spellCheck={false} />
	);
}
