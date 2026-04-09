import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useConvex, useQuery } from "convex/react";
import { useEffect, useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { getProfileByEmailFn } from "@/lib/get-organization-data.functions";

const NO_PROFILE_MESSAGE =
	"We couldn’t find anyone in your organization’s directory with the email address from this Google account. Sign in with the Google account that uses the same address your administrator added to your roster, or ask your administrator which email is on file.";

const JOIN_SESSION_EXPIRED_MESSAGE =
	"Your organization access from the previous step has expired. Select Previous, enter your organization password again, and continue.";

type IdentityVerifiedPayload = {
	profileId: Id<"profiles">;
	email: string;
	name?: string;
};

type IdentityStepEmailProps = {
	organizationId: Id<"organizations">;
	joinToken: string;
	savedEmail: string;
	onDraftChange: (email: string) => void;
	onIdentityVerified: (payload: IdentityVerifiedPayload) => void | Promise<void>;
	/** When the signed-in user already has this org profile, go to the app instead of claim. */
	onReturningMember: () => void | Promise<void>;
	onPersistBeforeOAuth?: () => void;
};

export function IdentityStepEmail({
	organizationId,
	joinToken,
	onDraftChange,
	onIdentityVerified,
	onReturningMember,
	onPersistBeforeOAuth,
}: IdentityStepEmailProps) {
	const convex = useConvex();
	const user = useQuery(api.auth.getCurrentUser);
	const [errorMessage, setErrorMessage] = useState("");
	const [isWorking, setIsWorking] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const pending = sessionStorage.getItem(
				"conduit.onboarding.identityError",
			);
			if (pending) {
				setErrorMessage(pending);
				sessionStorage.removeItem("conduit.onboarding.identityError");
			}
		} catch {
			// ignore
		}
	}, []);

	const continueWithGoogle = async () => {
		if (isWorking) return;
		setErrorMessage("");

		if (!user) {
			setIsWorking(true);
			try {
				onPersistBeforeOAuth?.();
				await authClient.signIn.social({
					provider: "google",
					callbackURL: "/onboarding",
				});
			} catch {
				setErrorMessage("We could not start Google sign in. Please try again.");
			} finally {
				setIsWorking(false);
			}
			return;
		}

		const normalizedEmail = user.email?.trim().toLowerCase();
		if (!normalizedEmail) {
			setErrorMessage(
				"Your Google account did not provide an email address. Try a different account.",
			);
			return;
		}

		setIsWorking(true);
		try {
			onDraftChange(normalizedEmail);
			const result = await getProfileByEmailFn({
				data: {
					joinToken,
					email: normalizedEmail,
				},
			});

			if (!result.ok) {
				if (result.error === "JOIN_SESSION_EXPIRED") {
					setErrorMessage(JOIN_SESSION_EXPIRED_MESSAGE);
					return;
				}
				if (typeof window !== "undefined") {
					sessionStorage.setItem(
						"conduit.onboarding.identityError",
						NO_PROFILE_MESSAGE,
					);
				}
				setErrorMessage(NO_PROFILE_MESSAGE);
				await authClient.signOut();
				return;
			}

			const matchedProfileId = result.profileId as Id<"profiles">;
			const isReturning = await convex.query(
				api.functions.onboarding.queries.isReturningMemberForOnboardingProfile,
				{
					organizationId,
					profileId: matchedProfileId,
				},
			);
			if (isReturning) {
				await onReturningMember();
				return;
			}

			await onIdentityVerified({
				profileId: matchedProfileId,
				email: result.email,
				name: result.name,
			});
		} catch {
			setErrorMessage(
				"We could not verify your Google account email right now. Please try again.",
			);
		} finally {
			setIsWorking(false);
		}
	};

	const errorTitle =
		errorMessage === JOIN_SESSION_EXPIRED_MESSAGE
			? "Session expired"
			: errorMessage === NO_PROFILE_MESSAGE
				? "No profile for this email"
				: "Could not verify identity";

	return (
		<div className="grid gap-4">
			<div className="rounded-md border border-border bg-muted/40 p-4">
				<p className="text-sm text-muted-foreground">
					Use your Google account to verify your identity for onboarding.
				</p>
				{user?.email ? (
					<p className="mt-2 text-sm">
						Signed in as <span className="font-medium">{user.email}</span>
					</p>
				) : null}
			</div>

			{errorMessage ? (
				<Alert variant="destructive">
					<AlertTitle>{errorTitle}</AlertTitle>
					<AlertDescription>
						{errorMessage === JOIN_SESSION_EXPIRED_MESSAGE ? (
							<span>
								Your organization access from the previous step has expired.
								Select <span className="font-medium">Previous</span>, enter your
								organization password again, and continue.
							</span>
						) : (
							errorMessage
						)}
					</AlertDescription>
				</Alert>
			) : null}

			<Button
				type="button"
				className="mt-2 w-full"
				onClick={() => {
					void continueWithGoogle();
				}}
				disabled={isWorking}
			>
				{isWorking
					? "Working..."
					: user
						? "Continue with this Google account"
						: "Continue with Google"}
			</Button>
		</div>
	);
}

type IdentityStepEmailLegacyProps = {
	joinToken: string;
	savedEmail: string;
	onDraftChange: (email: string) => void;
	onResolved: (payload: {
		profileId?: Id<"profiles">;
		email: string;
		name?: string;
	}) => void | Promise<void>;
};

export function IdentityStepEmailLegacy({
	joinToken,
	savedEmail,
	onDraftChange,
	onResolved,
}: IdentityStepEmailLegacyProps) {
	const emailFieldId = useId();

	const [errorMessage, setErrorMessage] = useState("");

	const form = useForm({
		defaultValues: {
			email: savedEmail,
		},
		onSubmit: async ({ value }) => {
			setErrorMessage("");
			try {
				const normalizedEmail = value.email.trim().toLowerCase();
				const result = await getProfileByEmailFn({
					data: {
						joinToken,
						email: normalizedEmail,
					},
				});

				if (!result.ok) {
					if (result.error === "JOIN_SESSION_EXPIRED") {
						setErrorMessage(JOIN_SESSION_EXPIRED_MESSAGE);
						return;
					}
					await onResolved({
						email: normalizedEmail,
					});
					return;
				}

				await onResolved({
					profileId: result.profileId as Id<"profiles">,
					email: result.email,
					name: result.name,
				});
			} catch {
				setErrorMessage(
					"We could not verify your email right now. Please try again.",
				);
			}
		},
	});

	return (
		<form
			className="grid gap-4"
			onSubmit={(e) => {
				e.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.Field
				name="email"
				validators={{
					onChange: ({ value }) => {
						if (!value?.trim()) return "Email is required";
						if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
							return "Invalid email address";
						return undefined;
					},
				}}
			>
				{(field) => (
					<div className="grid gap-2">
						<Label htmlFor={emailFieldId}>Email</Label>
						<Input
							id={emailFieldId}
							type="email"
							placeholder="you@organization.com"
							value={field.state.value}
							onChange={(e) => {
								field.handleChange(e.target.value);
								onDraftChange(e.target.value);
							}}
							onBlur={field.handleBlur}
							autoComplete="email"
						/>
					</div>
				)}
			</form.Field>

			{errorMessage ? (
				<Alert variant="destructive">
					<AlertTitle>Email not found</AlertTitle>
					<AlertDescription>{errorMessage}</AlertDescription>
				</Alert>
			) : null}

			<form.Subscribe
				selector={(state) => [state.canSubmit, state.isSubmitting]}
			>
				{([canSubmit, isSubmitting]) => (
					<Button
						type="submit"
						className="mt-2 w-full"
						disabled={!canSubmit || isSubmitting}
					>
						{isSubmitting ? "Checking..." : "Find my profile"}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
}
