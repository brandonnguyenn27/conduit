import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Link, createFileRoute, redirect, useLoaderData } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { type ChangeEvent, type FormEvent, useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrganization } from "@/contexts/OrganizationContext";
import { ensureOrganizationData } from "@/lib/get-organization-data.functions";
import {
	type LinkedInImportRow,
	parseLinkedInImportCsvContent,
} from "@/lib/linkedinImportCsv";

export const Route = createFileRoute("/_authenticated/admin")({
	loader: async ({ context }) => {
		const { isAdmin } = await ensureOrganizationData(context.queryClient);
		if (!isAdmin) {
			throw redirect({ to: "/explore" });
		}
	},
	component: AdminPage,
});

type ImportResult = {
	createdCount: number;
	skippedInvalid: number;
	skippedDuplicates: number;
	invalidUrls: string[];
};

function AdminPage() {
	const { isAdmin } = useLoaderData({ from: "/_authenticated" });
	const importBatchFieldId = useId();
	const csvFileInputId = useId();
	const [importBatch, setImportBatch] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const createManyForCurrentOrg = useMutation(
		api.functions.importQueue.mutations.createManyForCurrentOrg,
	);
	const organizationId = useOrganization();
	const [nameSearchInput, setNameSearchInput] = useState("");
	const [activeNameSearch, setActiveNameSearch] = useState("");
	const [enqueueSubmitting, setEnqueueSubmitting] = useState(false);

	const pendingRefresh = useQuery(
		api.functions.profiles.queries.listLinkedInRefreshPending,
		organizationId ? { organizationId } : "skip",
	);

	const nameSearchResults = useQuery(
		api.functions.profiles.queries.adminSearchProfilesByNameForRefresh,
		organizationId && activeNameSearch.trim()
			? { organizationId, searchText: activeNameSearch.trim() }
			: "skip",
	);

	const removePending = useMutation(
		api.functions.profiles.mutations.removeLinkedInRefreshPending,
	);
	const addPending = useMutation(
		api.functions.profiles.mutations.addLinkedInRefreshPending,
	);
	const enqueueRefresh = useMutation(
		api.functions.importQueue.mutations.enqueueLinkedInRefreshForOrg,
	);

	if (!isAdmin) {
		return (
			<div className="w-full max-w-4xl space-y-2">
				<h1 className="text-xl font-semibold tracking-tight">Admin</h1>
				<p className="text-sm text-muted-foreground">
					You don&apos;t have access to this page.
				</p>
				<Link to="/explore" className="text-sm underline underline-offset-4">
					Go back to Explore
				</Link>
			</div>
		);
	}

	const onCsvFile = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = () => {
			const text = typeof reader.result === "string" ? reader.result : "";
			setImportBatch(text);
		};
		reader.readAsText(file);
		event.target.value = "";
	};

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSubmitError(null);
		setImportResult(null);

		if (!importBatch.trim()) {
			setSubmitError("Paste CSV / URLs or choose a .csv file.");
			return;
		}

		let rows: LinkedInImportRow[];
		try {
			rows = parseLinkedInImportCsvContent(importBatch);
		} catch (error) {
			setSubmitError(
				error instanceof Error ? error.message : "Could not parse CSV.",
			);
			return;
		}

		if (rows.length === 0) {
			setSubmitError(
				"No LinkedIn rows found. Include a URL column or one profile URL per line.",
			);
			return;
		}

		try {
			setIsSubmitting(true);
			const result = await createManyForCurrentOrg({ rows });
			setImportResult(result);
			if (result.createdCount > 0) {
				setImportBatch("");
			}
		} catch (error) {
			setSubmitError(
				error instanceof Error
					? error.message
					: "Failed to enqueue import rows.",
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const runNameSearch = () => {
		setActiveNameSearch(nameSearchInput);
	};

	const clearNameSearch = () => {
		setActiveNameSearch("");
		setNameSearchInput("");
	};

	const onRemovePending = async (profileId: Id<"profiles">) => {
		try {
			await removePending({ profileId });
			toast.success("Removed from queue.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not remove.");
		}
	};

	const onAddPending = async (profileId: Id<"profiles">) => {
		try {
			await addPending({ profileId });
			toast.success("Added to refresh queue.");
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not add.");
		}
	};

	const onEnqueueRefresh = async () => {
		setEnqueueSubmitting(true);
		try {
			const result = await enqueueRefresh({});
			if (result.enqueued === 0) {
				toast.message("No profiles were queued.", {
					description:
						result.pendingCount === 0
							? "The refresh queue is empty."
							: "Check for invalid LinkedIn URLs.",
				});
			} else {
				toast.success(
					`Queued ${result.enqueued} profile${result.enqueued === 1 ? "" : "s"} for LinkedIn import.`,
				);
			}
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Enqueue failed.");
		} finally {
			setEnqueueSubmitting(false);
		}
	};

	return (
		<div className="w-full max-w-6xl space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="font-editorial">
						LinkedIn Batch Import
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={onSubmit}>
						<div className="grid gap-2">
							<Label htmlFor={importBatchFieldId}>CSV or URLs</Label>
							<p className="text-sm text-muted-foreground">
								Use a header row with columns such as linkedInUrl, email,
								profileType (alumni or member), class, and family—same as the
								CLI import. Without headers, each line can be a single profile
								URL, or comma-separated: URL, email, class, family—or five
								fields: URL, email, profileType, class, family.
							</p>
							<Textarea
								id={importBatchFieldId}
								value={importBatch}
								onChange={(event) => setImportBatch(event.target.value)}
								placeholder={`linkedInUrl,email,profileType,class,family\nhttps://www.linkedin.com/in/example, you@org.edu, member, Alpha, Blue`}
								rows={10}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor={csvFileInputId}>Or import a .csv file</Label>
							<input
								id={csvFileInputId}
								type="file"
								accept=".csv,text/csv"
								className="text-sm file:me-3 file:rounded-md file:border file:border-input file:bg-background file:px-3 file:py-1.5 file:text-sm"
								onChange={onCsvFile}
							/>
						</div>

						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Queueing..." : "Queue import"}
						</Button>

						{submitError ? (
							<p className="text-sm text-destructive">{submitError}</p>
						) : null}

						{importResult ? (
							<div className="space-y-1 text-sm text-muted-foreground">
								<p>Created: {importResult.createdCount}</p>
								<p>Skipped invalid: {importResult.skippedInvalid}</p>
								<p>Skipped duplicates: {importResult.skippedDuplicates}</p>
								{importResult.invalidUrls.length > 0 ? (
									<p>
										Invalid URL examples: {importResult.invalidUrls.join(", ")}
									</p>
								) : null}
							</div>
						) : null}
					</form>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="font-editorial">
						LinkedIn refresh queue
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-6">
					<div className="flex flex-wrap items-end gap-2">
						<div className="grid flex-1 min-w-[200px] gap-2">
							<Label htmlFor="admin-name-search">Find by name</Label>
							<Input
								id="admin-name-search"
								value={nameSearchInput}
								onChange={(e) => setNameSearchInput(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") runNameSearch();
								}}
								placeholder="Type a name, then Search"
							/>
						</div>
						<Button type="button" variant="secondary" onClick={runNameSearch}>
							Search
						</Button>
						{activeNameSearch.trim() ? (
							<Button type="button" variant="outline" onClick={clearNameSearch}>
								Clear
							</Button>
						) : null}
					</div>

					{nameSearchResults && nameSearchResults.length > 0 ? (
						<ul className="divide-y rounded-md border">
							{nameSearchResults.map((row) => (
								<li
									key={row._id}
									className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
								>
									<div>
										<p className="font-medium">{row.name}</p>
										<p className="text-sm text-muted-foreground line-clamp-2">
											{row.headline}
										</p>
									</div>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={() => void onAddPending(row._id)}
									>
										Add to queue
									</Button>
								</li>
							))}
						</ul>
					) : activeNameSearch.trim() ? (
						<p className="text-sm text-muted-foreground">No matching profiles.</p>
					) : null}

					<div className="space-y-2">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-sm font-medium">Pending refresh requests</h3>
							<Button
								type="button"
								onClick={() => void onEnqueueRefresh()}
								disabled={enqueueSubmitting}
							>
								{enqueueSubmitting ? "Queueing…" : "Run refresh for queued profiles"}
							</Button>
						</div>
						{pendingRefresh === undefined ? (
							<p className="text-sm text-muted-foreground">Loading…</p>
						) : pendingRefresh.length === 0 ? (
							<p className="text-sm text-muted-foreground">No pending requests.</p>
						) : (
							<ul className="divide-y rounded-md border">
								{pendingRefresh.map((p) => (
									<li
										key={p._id}
										className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
									>
										<div>
											<p className="font-medium">{p.name}</p>
											{p.linkedInUrl ? (
												<a
													href={p.linkedInUrl}
													target="_blank"
													rel="noreferrer"
													className="text-sm text-primary underline underline-offset-4"
												>
													LinkedIn
												</a>
											) : null}
										</div>
										<Button
											type="button"
											size="sm"
											variant="ghost"
											className="text-destructive hover:text-destructive"
											onClick={() => void onRemovePending(p._id)}
										>
											Remove from queue
										</Button>
									</li>
								))}
							</ul>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
