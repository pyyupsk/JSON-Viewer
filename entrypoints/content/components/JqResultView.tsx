interface JqResultViewProps {
	result: string;
}

export function JqResultView({ result }: Readonly<JqResultViewProps>) {
	return (
		<div className="jq-result-view">
			<pre className="jq-result-pre">{result}</pre>
		</div>
	);
}
