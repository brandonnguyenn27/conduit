import { createFileRoute, redirect } from "@tanstack/react-router";

import { GoogleSignInForm } from "@/integrations/better-auth/google-sign-in-form";
import { getOnboardingAccessStateFn } from "@/lib/get-organization-data.functions";

export const Route = createFileRoute("/login")({
	beforeLoad: async () => {
		const onboardingAccess = await getOnboardingAccessStateFn();
		if (!onboardingAccess.isAuthenticated) return;
		throw redirect({
			to: onboardingAccess.isOnboarded ? "/explore" : "/onboarding",
		});
	},
	component: LoginRoute,
});

function LoginRoute() {
	return (
		<main className="min-h-[calc(100vh-3.5rem)] bg-zinc-100 px-6 py-10 md:py-14">
			<div className="mx-auto max-w-6xl">
				<div className="rounded-2xl border border-zinc-300 bg-zinc-100/80">
					<GoogleSignInForm />
				</div>
			</div>
		</main>
	);
}
