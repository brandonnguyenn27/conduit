import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { ConvexHttpClient } from "convex/browser";
import { fetchAuthQuery } from "@/lib/auth.server";
import type { QueryClient } from "@tanstack/react-query";

type PublicOrganization = {
	_id: Doc<"organizations">["_id"];
	_creationTime: number;
	name: string;
	slug: string;
	logoUrl?: string;
	adminEmail?: string;
	createdAt: number;
};

type OnboardingAccessState = {
	isAuthenticated: boolean;
	isOnboarded: boolean;
	email: string | null;
};

type AuthenticatedLayoutData =
	| { state: "unauthenticated" }
	| { state: "needsOnboarding"; email: string | null }
	| {
			state: "ok";
			organizationId: Id<"organizations">;
			isAdmin: boolean;
			email: string | null;
	  };

export const getOrganizationDataFn = createServerFn({ method: "GET" }).handler(
	async () => {
		const layout = (await fetchAuthQuery(
			api.functions.viewer.queries.getAuthenticatedLayoutData,
			{},
		)) as AuthenticatedLayoutData;

		if (layout.state === "unauthenticated") {
			throw redirect({ to: "/login" });
		}
		if (layout.state === "needsOnboarding") {
			throw redirect({ to: "/onboarding" });
		}

		return {
			organizationId: layout.organizationId ?? null,
			isAdmin: layout.isAdmin === true,
		};
	},
);

export const organizationDataQueryKey = ["organization-data"] as const;

export async function ensureOrganizationData(queryClient: QueryClient) {
	return await queryClient.ensureQueryData({
		queryKey: organizationDataQueryKey,
		queryFn: async () => await getOrganizationDataFn(),
		staleTime: 5 * 60 * 1000,
	});
}

export const getOnboardingAccessStateFn = createServerFn({
	method: "GET",
}).handler(async (): Promise<OnboardingAccessState> => {
	const layout = (await fetchAuthQuery(
		api.functions.viewer.queries.getAuthenticatedLayoutData,
		{},
	)) as AuthenticatedLayoutData;

	if (layout.state === "unauthenticated") {
		return {
			isAuthenticated: false,
			isOnboarded: false,
			email: null,
		};
	}
	if (layout.state === "needsOnboarding") {
		return {
			isAuthenticated: true,
			isOnboarded: false,
			email: layout.email ?? null,
		};
	}

	return {
		isAuthenticated: true,
		isOnboarded: true,
		email: layout.email ?? null,
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
