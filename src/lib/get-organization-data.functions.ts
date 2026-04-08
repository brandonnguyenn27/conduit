import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";
import { fetchAuthQuery } from "@/lib/auth.server";

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
		const user = (await fetchAuthQuery(
			api.auth.getCurrentUser,
			{},
		)) as AuthUser | null;
		if (!user) {
			throw redirect({ to: "/login" });
		}
		const appUser = await fetchAuthQuery(
			api.functions.appUsers.queries.getByBetterAuthUserId,
			{ betterAuthUserId: user._id },
		);
		return {
			organizationId: appUser?.organizationId ?? null,
			isAdmin: appUser?.isAdmin === true,
		};
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

const convexUrl = import.meta.env.VITE_CONVEX_URL;
if (!convexUrl) {
	throw new Error("Missing VITE_CONVEX_URL");
}
const convexPublicClient = new ConvexHttpClient(convexUrl);

export const getPublicOrganizationsListFn = createServerFn({
	method: "GET",
}).handler(async () => {
	return await convexPublicClient.query(
		api.functions.onboarding.queries.listPublicOrganizations,
		{},
	);
});

export const verifyOrgPasswordFn = createServerFn({ method: "POST" })
	.inputValidator((data: { organizationId: string; password: string }) => data)
	.handler(async ({ data }) => {
		return await convexPublicClient.action(
			api.functions.onboarding.actions.verifyOrgPassword,
			{
				organizationId: data.organizationId as Doc<"organizations">["_id"],
				password: data.password,
			},
		);
	});

export const getProfileByEmailFn = createServerFn({ method: "POST" })
	.inputValidator((data: { joinToken: string; email: string }) => data)
	.handler(async ({ data }) => {
		return await convexPublicClient.action(
			api.functions.onboarding.actions.getProfileByEmail,
			{
				joinToken: data.joinToken,
				email: data.email,
			},
		);
	});

export const verifyClaimCodeFn = createServerFn({ method: "POST" })
	.inputValidator((data: { profileId: string; code: string }) => data)
	.handler(async ({ data }) => {
		return await convexPublicClient.action(
			api.functions.onboarding.actions.verifyClaimCode,
			{
				profileId: data.profileId as Doc<"profiles">["_id"],
				code: data.code,
			},
		);
	});

export const issueClaimCodeFn = createServerFn({ method: "POST" })
	.inputValidator((data: { joinToken: string; profileId: string }) => data)
	.handler(async ({ data }) => {
		return await convexPublicClient.action(
			api.functions.onboarding.actions.issueClaimCode,
			{
				joinToken: data.joinToken,
				profileId: data.profileId as Doc<"profiles">["_id"],
			},
		);
	});
