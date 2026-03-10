import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getOrganizationsListFn } from "@/lib/get-organization-data.functions";

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_BYPASS_USERNAME;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_BYPASS_PASSWORD;
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_BYPASS_EMAIL;

type OrganizationOption = {
	_id: Id<"organizations">;
	name: string;
	slug: string;
};

export function AdminBypassForm() {
	const [adminUsername, setAdminUsername] = useState("");
	const [adminPassword, setAdminPassword] = useState("");
	const [adminOrganizationId, setAdminOrganizationId] = useState("");
	const [adminError, setAdminError] = useState("");
	const [isAdminSubmitting, setIsAdminSubmitting] = useState(false);

	const adminBypassSetOrganization = useMutation(
		api.functions.appUsers.mutations.adminBypassSetOrganization,
	);
	const {
		data: organizationOptions = [],
		isPending: isOrganizationsLoading,
		error: organizationsLoadError,
	} = useQuery({
		queryKey: ["admin-bypass-organizations"],
		queryFn: async () => {
			const loaded = await getOrganizationsListFn();
			return loaded as OrganizationOption[];
		},
		retry: 2,
	});

	const handleAdminBypassLogin = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setAdminError("");

		if (!import.meta.env.DEV) {
			setAdminError("Admin bypass is only available in development.");
			return;
		}
		if (!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_EMAIL) {
			setAdminError(
				"Admin bypass is not configured. Set VITE_ADMIN_BYPASS_USERNAME, VITE_ADMIN_BYPASS_PASSWORD, and VITE_ADMIN_BYPASS_EMAIL.",
			);
			return;
		}
		if (adminUsername !== ADMIN_USERNAME || adminPassword !== ADMIN_PASSWORD) {
			setAdminError("Invalid admin credentials.");
			return;
		}
		if (!adminOrganizationId) {
			setAdminError("Select an organization.");
			return;
		}

		setIsAdminSubmitting(true);
		try {
			const signInResult = await authClient.signIn.email({
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
			});
			if (signInResult.error) {
				const signUpResult = await authClient.signUp.email({
					email: ADMIN_EMAIL,
					password: ADMIN_PASSWORD,
					name: ADMIN_USERNAME,
				});
				if (signUpResult.error) {
					const retrySignInResult = await authClient.signIn.email({
						email: ADMIN_EMAIL,
						password: ADMIN_PASSWORD,
					});
					if (retrySignInResult.error) {
						setAdminError(
							retrySignInResult.error.message || "Admin bypass sign in failed.",
						);
						return;
					}
				}
			}

			await adminBypassSetOrganization({
				organizationId: adminOrganizationId as Id<"organizations">,
			});
			location.assign("/home");
		} catch {
			setAdminError("Admin bypass failed.");
		} finally {
			setIsAdminSubmitting(false);
		}
	};

	return (
		<form onSubmit={handleAdminBypassLogin} className="grid gap-4">
			<h2 className="text-sm font-semibold tracking-tight">
				Admin bypass (dev)
			</h2>
			<p className="text-xs text-neutral-500 dark:text-neutral-400">
				Use your configured admin bypass credentials.
			</p>

			<label className="grid gap-1.5">
				<span className="text-sm font-medium">Username</span>
				<input
					value={adminUsername}
					onChange={(event) => setAdminUsername(event.target.value)}
					className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
					autoComplete="off"
					required
				/>
			</label>

			<label className="grid gap-1.5">
				<span className="text-sm font-medium">Password</span>
				<input
					type="password"
					value={adminPassword}
					onChange={(event) => setAdminPassword(event.target.value)}
					className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
					autoComplete="off"
					required
				/>
			</label>

			<label className="grid gap-1.5">
				<span className="text-sm font-medium">Organization</span>
				<select
					value={adminOrganizationId}
					onChange={(event) => setAdminOrganizationId(event.target.value)}
					className="h-9 rounded-md border border-neutral-300 bg-white px-3 text-sm dark:border-neutral-700 dark:bg-neutral-950"
					required
					disabled={isOrganizationsLoading || organizationOptions.length === 0}
				>
					<option value="">
						{isOrganizationsLoading
							? "Loading organizations..."
							: organizationOptions.length === 0
								? "No organizations found"
								: "Select organization"}
					</option>
					{organizationOptions.map((organization) => (
						<option key={organization._id} value={organization._id}>
							{organization.name} ({organization.slug})
						</option>
					))}
				</select>
			</label>

			{organizationsLoadError ? (
				<div className="border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
					<p className="text-sm text-red-600 dark:text-red-400">
						Failed to load organizations: {organizationsLoadError.message}
					</p>
				</div>
			) : null}

			{adminError ? (
				<div className="border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
					<p className="text-sm text-red-600 dark:text-red-400">{adminError}</p>
				</div>
			) : null}

			<button
				type="submit"
				disabled={
					isAdminSubmitting ||
					isOrganizationsLoading ||
					organizationOptions.length === 0
				}
				className="w-full h-9 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isAdminSubmitting ? "Linking admin..." : "Admin bypass login"}
			</button>
		</form>
	);
}
