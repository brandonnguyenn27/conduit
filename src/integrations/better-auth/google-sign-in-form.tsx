import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function GoogleSignInForm() {
	const navigate = useNavigate();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiError, setApiError] = useState("");

	const onGoogleSignIn = async () => {
		if (isSubmitting) return;
		setApiError("");
		setIsSubmitting(true);
		try {
			await authClient.signIn.social({
				provider: "google",
				callbackURL: "/explore",
			});
		} catch {
			setApiError("Google sign in failed. Please try again.");
			setIsSubmitting(false);
		}
	};

	return (
		<div className="flex justify-center py-10 px-4">
			<div className="w-full max-w-md p-6">
				<h1 className="text-lg font-semibold leading-none tracking-tight">
					Sign in
				</h1>
				<p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2 mb-6">
					Continue with Google to access your account.
				</p>

				<button
					type="button"
					onClick={() => {
						void onGoogleSignIn();
					}}
					disabled={isSubmitting}
					className="w-full h-9 px-4 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Redirecting..." : "Continue with Google"}
				</button>

				{apiError ? (
					<div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
						<p className="text-sm text-red-600 dark:text-red-400">{apiError}</p>
					</div>
				) : null}

				<div className="mt-4 text-center">
					<button
						type="button"
						onClick={() => {
							void navigate({ to: "/onboarding" });
						}}
						className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
					>
						{"Don't have an account? Sign up"}
					</button>
				</div>
			</div>
		</div>
	);
}
