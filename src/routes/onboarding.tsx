import type { Id } from "@convex/_generated/dataModel";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	Link,
	redirect,
	useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { OnboardingFlowImage } from "@/components/onboarding/OnboardingFlowImage";
import { ClaimWithGoogle } from "@/components/onboarding/steps/claim/ClaimWithGoogle";
import { IdentityStepEmail } from "@/components/onboarding/steps/identity/IdentityStepEmail";
import { Step1OrgPassword } from "@/components/onboarding/steps/Step1OrgPassword";
import { BackgroundBeams } from "@/components/ui/background-beams";
import {
	getOnboardingAccessStateFn,
	getPublicOrganizationsListFn,
} from "@/lib/get-organization-data.functions";

const ONBOARDING_RESUME_KEY = "conduit.onboarding.resume.v1";
const RESUME_MAX_AGE_MS = 14 * 60 * 1000;

type OnboardingResumeState = {
	stepIndex: number;
	joinToken: string;
	organizationId: Id<"organizations"> | null;
	draftEmail: string;
};

function readStoredOnboardingResume(): OnboardingResumeState | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = sessionStorage.getItem(ONBOARDING_RESUME_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as {
			savedAt?: number;
			stepIndex?: number;
			joinToken?: string;
			organizationId?: string;
			draftEmail?: string;
		};
		if (
			typeof parsed.savedAt !== "number" ||
			Date.now() - parsed.savedAt > RESUME_MAX_AGE_MS
		) {
			sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
			return null;
		}
		if (
			parsed.stepIndex !== 1 ||
			!parsed.joinToken ||
			!parsed.organizationId
		) {
			return null;
		}
		return {
			stepIndex: 1,
			joinToken: parsed.joinToken,
			organizationId: parsed.organizationId as Id<"organizations">,
			draftEmail: parsed.draftEmail ?? "",
		};
	} catch {
		sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
		return null;
	}
}

export const Route = createFileRoute("/onboarding")({
	beforeLoad: async () => {
		const [organizations, onboardingAccess] = await Promise.all([
			getPublicOrganizationsListFn(),
			getOnboardingAccessStateFn(),
		]);
		if (onboardingAccess.isAuthenticated && onboardingAccess.isOnboarded) {
			throw redirect({ to: "/explore" });
		}
		return { organizations, onboardingAccess };
	},
	component: OnboardingRoute,
});

function OnboardingRoute() {
	const { organizations, onboardingAccess } = Route.useRouteContext();
	const navigate = useNavigate();
	const [initialResume] = useState<OnboardingResumeState | null>(() =>
		readStoredOnboardingResume(),
	);
	const steps = useMemo(
		() => [
			{
				id: "org",
				title: "Organization Access",
				description: "Select your organization and enter the org password.",
			},
			{
				id: "identity",
				title: "Identity Verification",
				description: "Continue with Google to verify your organization email.",
			},
			{
				id: "claim",
				title: "Claim Account",
				description:
					"Confirm the Google account that matches your organization profile to finish onboarding.",
			},
		],
		[],
	);
	const [stepIndex, setStepIndex] = useState(initialResume?.stepIndex ?? 0);
	const [direction, setDirection] = useState(1);
	const shouldReduceMotion = useReducedMotion();
	const activeStep = steps[stepIndex];
	const [joinToken, setJoinToken] = useState(initialResume?.joinToken ?? "");
	const [organizationId, setOrganizationId] = useState<Id<"organizations"> | null>(
		initialResume?.organizationId ?? null,
	);
	const [profileId, setProfileId] = useState<Id<"profiles"> | null>(null);
	const [resolvedEmail, setResolvedEmail] = useState("");
	const [resolvedName, setResolvedName] = useState("");
	const draftForm = useForm({
		defaultValues: {
			organizationId: "",
			orgPassword: "",
			email: initialResume?.draftEmail || onboardingAccess.email || "",
		},
		onSubmit: async () => {},
	});

	const goPrevious = () => {
		if (stepIndex === 0) return;
		if (stepIndex === 1) {
			try {
				sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
			} catch {
				// ignore
			}
		}
		setDirection(-1);
		setStepIndex((value) => value - 1);
	};

	const goToStep = (nextStep: number) => {
		if (nextStep === stepIndex) return;
		setDirection(nextStep > stepIndex ? 1 : -1);
		setStepIndex(nextStep);
	};

	const persistOnboardingForOAuth = () => {
		if (typeof window === "undefined") return;
		try {
			sessionStorage.setItem(
				ONBOARDING_RESUME_KEY,
				JSON.stringify({
					savedAt: Date.now(),
					stepIndex: 1,
					joinToken,
					organizationId,
					draftEmail: draftForm.state.values.email,
				}),
			);
		} catch {
			// ignore
		}
	};

	const canGoToStep = (index: number) => {
		if (index === 0) return true;
		if (index === 1) return !!joinToken && !!organizationId;
		if (index === 2)
			return !!joinToken && !!organizationId && !!profileId && !!resolvedEmail;
		return false;
	};

	return (
		<main className="relative mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-7xl items-start overflow-x-hidden px-4 py-6 sm:px-6 md:items-center md:px-8 md:py-10 lg:py-14">
			<div
				className="absolute inset-0 mask-[linear-gradient(to_bottom,black_0%,black_70%,transparent_100%)] mask-size-[100%_100%] mask-no-repeat"
				aria-hidden
			>
				<BackgroundBeams />
			</div>
			<section className="relative z-10 grid w-full gap-6 md:gap-8 md:grid-cols-[1fr_minmax(320px,0.9fr)]">
				<div className="flex min-h-0 flex-col rounded-md border border-border bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 md:min-h-[620px] md:p-8 lg:min-h-[680px]">
					<div className="mb-6">
						<p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
							Onboarding
						</p>
						<h1 className="mt-2 text-2xl font-semibold tracking-tight">
							Create your account
						</h1>
						<Link
							to="/login"
							className="mt-3 inline-flex text-sm text-muted-foreground underline-offset-4 hover:underline"
						>
							Already have an account? Log in
						</Link>
					</div>

					<div className="relative flex-1 min-h-[360px] overflow-y-auto overscroll-contain pr-1 md:min-h-[380px]">
						<AnimatePresence initial={false} custom={direction} mode="wait">
							<motion.div
								key={activeStep.id}
								custom={direction}
								initial={
									shouldReduceMotion
										? { opacity: 0 }
										: { opacity: 0, x: direction > 0 ? 24 : -24 }
								}
								animate={{ opacity: 1, x: 0 }}
								exit={
									shouldReduceMotion
										? { opacity: 0 }
										: { opacity: 0, x: direction > 0 ? -24 : 24 }
								}
								transition={{
									duration: shouldReduceMotion ? 0.12 : 0.24,
									ease: "easeOut",
								}}
								className="absolute inset-0 flex min-h-full flex-col pb-2"
							>
								<p className="text-sm text-muted-foreground">
									Step {stepIndex + 1} of {steps.length}
								</p>
								<h2 className="mt-3 text-xl font-semibold">
									{activeStep.title}
								</h2>
								<p className="mt-3 max-w-md text-sm text-muted-foreground">
									{activeStep.description}
								</p>
								<div className="mt-6">
									{stepIndex === 0 ? (
										<Step1OrgPassword
											organizations={organizations}
											savedOrganizationId={
												draftForm.state.values.organizationId
											}
											savedPassword={draftForm.state.values.orgPassword}
											onDraftChange={({
												organizationId: nextOrgId,
												password: nextPassword,
											}) => {
												if (nextOrgId !== undefined) {
													draftForm.setFieldValue("organizationId", nextOrgId);
												}
												if (nextPassword !== undefined) {
													draftForm.setFieldValue("orgPassword", nextPassword);
												}
											}}
											onVerified={({
												organizationId: nextOrganizationId,
												joinToken: nextToken,
											}) => {
												setOrganizationId(nextOrganizationId);
												setJoinToken(nextToken);
												goToStep(1);
											}}
										/>
									) : null}

									{stepIndex === 1 && organizationId ? (
										<IdentityStepEmail
											organizationId={organizationId}
											joinToken={joinToken}
											savedEmail={draftForm.state.values.email}
											onDraftChange={(email) => {
												draftForm.setFieldValue("email", email);
											}}
											onPersistBeforeOAuth={persistOnboardingForOAuth}
											onReturningMember={async () => {
												try {
													sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
													sessionStorage.removeItem(
														"conduit.onboarding.identityError",
													);
												} catch {
													// ignore
												}
												void navigate({ to: "/explore" });
											}}
											onIdentityVerified={async ({
												profileId: nextProfileId,
												email,
												name,
											}) => {
												setProfileId(nextProfileId);
												setResolvedName(name ?? "");
												setResolvedEmail(email);
												try {
													sessionStorage.removeItem(ONBOARDING_RESUME_KEY);
													sessionStorage.removeItem(
														"conduit.onboarding.identityError",
													);
												} catch {
													// ignore
												}
												goToStep(2);
											}}
										/>
									) : null}

									{stepIndex === 2 &&
									organizationId &&
									profileId &&
								resolvedEmail ? (
										<ClaimWithGoogle
											organizationId={organizationId}
											profileId={profileId}
											email={resolvedEmail}
											name={resolvedName}
											onSuccess={() => {
												void navigate({ to: "/explore" });
											}}
										/>
									) : null}
								</div>
							</motion.div>
						</AnimatePresence>
					</div>

					<div className="mt-6 flex items-center justify-start gap-4">
						<button
							type="button"
							onClick={goPrevious}
							disabled={stepIndex === 0}
							className="h-11 min-w-[96px] rounded-md border border-border px-4 text-sm disabled:cursor-not-allowed disabled:opacity-40"
						>
							Previous
						</button>
					</div>

					<div className="mt-6 flex items-center justify-center gap-1 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
						{steps.map((step, index) => (
							<button
								key={step.id}
								type="button"
								onClick={() => {
									if (!canGoToStep(index)) return;
									goToStep(index);
								}}
								aria-current={index === stepIndex}
								aria-label={`Go to step ${index + 1}`}
								className="flex h-8 w-8 items-center justify-center rounded-full"
							>
								<span
									className={`h-2.5 w-2.5 rounded-full transition-opacity ${
										index === stepIndex
											? "bg-blue-600 opacity-100 dark:bg-blue-500"
											: canGoToStep(index)
												? "bg-zinc-400/70 opacity-80"
												: "bg-zinc-300/60 opacity-40"
									}`}
								/>
							</button>
						))}
					</div>
				</div>

				<div
					className="relative hidden min-h-[560px] overflow-hidden rounded-md border border-border bg-zinc-100 md:block md:min-h-[620px] lg:min-h-[680px] dark:bg-zinc-900"
					aria-hidden
				>
					<div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.28),transparent_46%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.18),transparent_38%)]" />
					<div className="absolute inset-0">
						<OnboardingFlowImage />
					</div>
				</div>
			</section>
		</main>
	);
}
