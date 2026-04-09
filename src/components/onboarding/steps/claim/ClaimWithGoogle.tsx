import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

type ClaimWithGoogleProps = {
	organizationId: Id<"organizations">;
	profileId: Id<"profiles">;
	email: string;
	name: string;
	onSuccess: () => void;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export function ClaimWithGoogle({
	organizationId,
	profileId,
	email,
	name,
	onSuccess,
}: ClaimWithGoogleProps) {
	const currentUser = useQuery(api.auth.getCurrentUser);
	const completeOnboarding = useMutation(
		api.functions.appUsers.mutations.completeOnboarding,
	);

	const [errorMessage, setErrorMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const continueWithGoogle = async () => {
		if (isSubmitting) return;
		setErrorMessage("");
		setIsSubmitting(true);

		try {
			if (!currentUser) {
				await authClient.signIn.social({
					provider: "google",
					callbackURL: "/onboarding",
				});
				return;
			}

			const signedInEmail = currentUser.email
				? normalizeEmail(currentUser.email)
				: "";
			const resolvedEmail = normalizeEmail(email);
			if (!signedInEmail) {
				setErrorMessage(
					"Your Google account did not provide an email address.",
				);
				return;
			}
			if (signedInEmail !== resolvedEmail) {
				setErrorMessage(
					`You're signed in as ${signedInEmail}, but this claim is for ${resolvedEmail}. Switch Google accounts and try again.`,
				);
				return;
			}

			await completeOnboarding({
				organizationId,
				profileId,
			});
			onSuccess();
		} catch {
			setErrorMessage(
				"Unable to complete onboarding right now. Please try again.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="grid gap-4">
			<div className="rounded-md border border-border p-4">
				<p className="text-sm font-medium">{name}</p>
				<p className="mt-1 text-sm text-muted-foreground">{email}</p>
			</div>

			{errorMessage ? (
				<Alert variant="destructive">
					<AlertTitle>Unable to complete signup</AlertTitle>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			) : null}

			<Button
				type="button"
				className="mt-2 w-full"
				disabled={isSubmitting}
				onClick={() => {
					void continueWithGoogle();
				}}
			>
				{isSubmitting
					? "Working..."
					: currentUser
						? "Claim profile and continue"
						: "Continue with Google"}
			</Button>
		</div>
	);
}
