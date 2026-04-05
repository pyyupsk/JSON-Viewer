import { ReadOnlyTextarea } from "./ReadOnlyTextarea";

interface MinifyViewProps {
	data: unknown;
}

export function MinifyView({ data }: Readonly<MinifyViewProps>) {
	return <ReadOnlyTextarea value={JSON.stringify(data) ?? ""} />;
}
