import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { fetchAuthQuery } from "@/lib/auth-server";

type PublicOrganization = {
	_id: Doc<"organizations">["_id"];
	_creationTime: number;
	name: string;
	slug: string;
	logoUrl?: string;
	adminEmail?: string;
	createdAt: number;
};

type AuthUser = { _id: string; email?: string; name?: string | null };

export const getOrganizationDataFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = (await fetchAuthQuery(api.auth.getCurrentUser, {})) as
			| AuthUser
			| null;
		if (!user) {
			throw redirect({ to: "/login" });
		}
		const appUser = await fetchAuthQuery(
			api.functions.appUsers.queries.getByBetterAuthUserId,
			{ betterAuthUserId: user._id },
		);
		return { organizationId: appUser?.organizationId ?? null };
	},
);

export const getOrganizationsListFn = createServerFn({ method: "GET" }).handler(
	async (): Promise<PublicOrganization[]> => {
		return (await fetchAuthQuery(
			api.functions.organizations.queries.list,
			{},
		)) as PublicOrganization[];
	},
);

const convexPublicClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

export const getPublicOrganizationsListFn = createServerFn({
	method: "GET",
}).handler(async () => {
	return await convexPublicClient.query(
		api.functions.onboarding.queries.listPublicOrganizations,
		{},
	);
});
