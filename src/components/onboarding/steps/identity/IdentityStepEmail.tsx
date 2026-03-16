import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getProfileByEmailFn } from "@/lib/get-organization-data.functions";

type IdentityStepEmailProps = {
	joinToken: string;
	savedEmail: string;
	onDraftChange: (email: string) => void;
	onResolved: (payload: {
		profileId: Id<"profiles">;
		email: string;
		name: string;
	}) => void | Promise<void>;
};

export function IdentityStepEmail({
	joinToken,
	savedEmail,
	onDraftChange,
	onResolved,
}: IdentityStepEmailProps) {
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
					setErrorMessage(
						"No matching email address in our system. Please contact your organization admin.",
					);
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
