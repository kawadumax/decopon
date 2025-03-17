import { useRouter } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useApi } from "./useApi";

export function useLogout() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const api = useApi();
	const logout = useCallback(async () => {
		setLoading(true);
		setError(null);

		api.post(
			route("logout"),
			{},
			(response) => {
				router.navigate({ to: "/" });
			},
			(response) => {
				setError("ログアウトに失敗しました。");
				setLoading(false);
				return;
			},
		);
	}, [router, api]);

	return { logout, loading, error };
}
