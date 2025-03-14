import type { Ziggy as ZiggyType, ziggyRoute } from "@core/ziggy.js";
import type { PageProps as InertiaPageProps } from "@inertiajs/core";
import type { PageProps as AppPageProps } from ".";

declare global {
	// /* eslint-disable no-var */
	var route: typeof ziggyRoute;
	var Ziggy: typeof ZiggyType;
}

declare module "@inertiajs/core" {
	interface PageProps extends InertiaPageProps, AppPageProps {}
}
