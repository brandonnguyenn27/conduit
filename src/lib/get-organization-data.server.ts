import { api } from "@convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import { fetchAuthQuery } from "@/lib/auth-server";

type AuthUser = { _id: string; email?: string; name?: string | null };

export async function getOrganizationData() {
	const user = (await fetchAuthQuery(
		api.auth.getCurrentUser,
		{},
	)) as AuthUser | null;
	if (!user) return null;
	const appUser = await fetchAuthQuery(
		api.functions.appUsers.queries.getByBetterAuthUserId,
		{ betterAuthUserId: user._id },
	);
	return { organizationId: appUser?.organizationId ?? null };
}

export async function getOrganizationsList() {
	return await fetchAuthQuery(api.functions.organizations.queries.list, {});
}

const convexPublicClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL!);

export async function getPublicOrganizationsList() {
	return await convexPublicClient.query(
		api.functions.onboarding.queries.listPublicOrganizations,
		{},
	);
}
