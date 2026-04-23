import { api } from "@convex/_generated/api";
import { Link, createFileRoute, redirect, useLoaderData } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { type ChangeEvent, type FormEvent, useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
		</div>
	);
}
