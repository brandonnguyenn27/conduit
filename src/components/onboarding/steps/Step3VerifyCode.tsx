import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
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
	profileId: Id<"profiles"> | null;
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

			if (!profileId) {
				setErrorMessage(
					"We couldn't verify this claim code. Please contact your organization admin.",
				);
				return;
			}

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
					Get your claim code from your organization admin for{" "}
					<span className="font-medium text-foreground">{email}</span>, then
					enter it below to continue.
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
								inputMode="text"
								pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
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
					selector={(state) => [state.values.code, state.isSubmitting] as const}
				>
					{([code, isSubmitting]) => (
						<Button
							type="submit"
							className="mt-2 w-full"
							disabled={code.trim().length !== 4 || isSubmitting}
						>
							{isSubmitting ? "Verifying..." : "Verify and continue"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
