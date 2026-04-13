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
type AppUserForOnboarding = {
	organizationId: string;
	profileId?: string;
	email: string;
	isAdmin?: boolean;
};
type OnboardingAccessState = {
	isAuthenticated: boolean;
	isOnboarded: boolean;
	email: string | null;
};

function computeIsOnboarded(
	appUser: AppUserForOnboarding | null,
	defaultOrganization: { _id: string } | null,
): boolean {
	if (!appUser) {
		return false;
	}
	const hasProfile = !!appUser.profileId;
	if (!defaultOrganization) {
		return hasProfile;
	}
	return (
		hasProfile && appUser.organizationId !== defaultOrganization._id
	);
}

export const getOrganizationDataFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const user = (await fetchAuthQuery(
			api.auth.getCurrentUser,
			{},
		)) as AuthUser | null;
		if (!user) {
			throw redirect({ to: "/login" });
		}
		const [appUser, defaultOrganization] = await Promise.all([
			fetchAuthQuery(api.functions.appUsers.queries.getByBetterAuthUserId, {
				betterAuthUserId: user._id,
			}) as Promise<AppUserForOnboarding | null>,
			fetchAuthQuery(api.functions.organizations.queries.getBySlug, {
				slug: "default",
			}) as Promise<{ _id: string } | null>,
		]);

		if (!computeIsOnboarded(appUser, defaultOrganization)) {
			throw redirect({ to: "/onboarding" });
		}

		return {
			organizationId: appUser?.organizationId ?? null,
			isAdmin: appUser?.isAdmin === true,
		};
	},
);

export const getOnboardingAccessStateFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<OnboardingAccessState> => {
	const user = (await fetchAuthQuery(
		api.auth.getCurrentUser,
		{},
	)) as AuthUser | null;
	if (!user) {
		return {
			isAuthenticated: false,
			isOnboarded: false,
			email: null,
		};
	}

	const [appUser, defaultOrganization] = await Promise.all([
		fetchAuthQuery(api.functions.appUsers.queries.getByBetterAuthUserId, {
			betterAuthUserId: user._id,
		}) as Promise<AppUserForOnboarding | null>,
		fetchAuthQuery(api.functions.organizations.queries.getBySlug, {
			slug: "default",
		}) as Promise<{ _id: string } | null>,
	]);

	if (!appUser) {
		return {
			isAuthenticated: true,
			isOnboarded: false,
			email: user.email ?? null,
		};
	}

	const isOnboarded = computeIsOnboarded(appUser, defaultOrganization);

	return {
		isAuthenticated: true,
		isOnboarded,
		email: user.email ?? appUser.email ?? null,
	};
});

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
