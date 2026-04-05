import { TOAST_DURATION_MS } from "@content/constants";
import { useCallback, useEffect, useRef, useState } from "react";

export function useToast(): {
	toast: string | null;
	showToast: (msg: string) => void;
} {
	const [toast, setToast] = useState<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const showToast = useCallback((msg: string) => {
		setToast(msg);
		if (timer.current) clearTimeout(timer.current);
		timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
	}, []);

	useEffect(() => {
		return () => {
			if (timer.current) {
				clearTimeout(timer.current);
				timer.current = null;
			}
		};
	}, []);

	return { toast, showToast };
}
