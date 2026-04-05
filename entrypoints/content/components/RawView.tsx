import { ReadOnlyTextarea } from "./ReadOnlyTextarea";

interface RawViewProps {
	content: string;
}

export function RawView({ content }: Readonly<RawViewProps>) {
	return <ReadOnlyTextarea value={content} />;
}
