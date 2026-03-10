import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

// TODO: Explore optimizations - caching, request deduplication, or infrastructure
// changes to reduce load on auth/org fetches when navigating across home routes.

export const getOrganizationDataFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getOrganizationData } = await import(
			"./get-organization-data.server"
		);
		const data = await getOrganizationData();
		if (!data) {
			throw redirect({ to: "/login" });
		}
		return data;
	},
);

export const getOrganizationsListFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const { getOrganizationsList } = await import(
			"./get-organization-data.server"
		);
		return await getOrganizationsList();
	},
);
