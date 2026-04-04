interface ToastProps {
	message: string | null;
}

export function Toast({ message }: Readonly<ToastProps>) {
	return <div className={`toast${message ? " show" : ""}`}>{message}</div>;
}
