import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { useId, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { verifyClaimCodeFn } from "@/lib/get-organization-data.functions";

type Step3VerifyCodeProps = {
	profileId: Id<"profiles">;
	email: string;
	onVerified: () => void;
};

export function Step3VerifyCode({
	profileId,
	email,
	onVerified,
}: Step3VerifyCodeProps) {
	const claimCodeFieldId = useId();
	const [errorMessage, setErrorMessage] = useState("");

	const form = useForm({
		defaultValues: {
			code: "",
		},
		onSubmit: async ({ value }) => {
			setErrorMessage("");
			try {
				const result = await verifyClaimCodeFn({
					data: {
						profileId,
						code: value.code.trim().toUpperCase(),
					},
				});

				if (!result.ok) {
					if (result.error === "EXPIRED") {
						setErrorMessage(
							"This code has expired. Please contact your organization admin for a new one.",
						);
					} else {
						setErrorMessage("Invalid claim code. Please check and try again.");
					}
					return;
				}

				onVerified();
			} catch {
				setErrorMessage("Verification failed. Please try again.");
			}
		},
	});

	return (
		<div className="grid gap-4">
			<div className="rounded-md border border-border bg-muted/40 p-4">
				<p className="text-sm text-muted-foreground">
					A 4-character claim code was generated for your onboarding. Enter the
					code from your organization admin for{" "}
					<span className="font-medium text-foreground">{email}</span>
				</p>
			</div>

			<form
				className="grid gap-4"
				onSubmit={(e) => {
					e.preventDefault();
					void form.handleSubmit();
				}}
			>
				<form.Field
					name="code"
					validators={{
						onChange: ({ value }) => {
							if (!value?.trim()) return "Claim code is required";
							if (value.trim().length !== 4) return "Code must be 4 characters";
							return undefined;
						},
					}}
				>
					{(field) => (
						<div className="grid gap-2">
							<Label htmlFor={claimCodeFieldId}>Claim code</Label>
							<InputOTP
								id={claimCodeFieldId}
								maxLength={4}
								value={field.state.value}
								onChange={(value) => {
									field.handleChange(value.toUpperCase().slice(0, 4));
								}}
								onBlur={field.handleBlur}
								autoComplete="off"
								pattern="^[A-Z0-9]+$"
								containerClassName="justify-start"
								className="uppercase"
							>
								<InputOTPGroup>
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
								</InputOTPGroup>
							</InputOTP>
						</div>
					)}
				</form.Field>

				{errorMessage ? (
					<Alert variant="destructive">
						<AlertTitle>Verification failed</AlertTitle>
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
							{isSubmitting ? "Verifying..." : "Verify and continue"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
