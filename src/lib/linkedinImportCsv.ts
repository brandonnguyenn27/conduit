export type LinkedInImportRow = {
	linkedInUrl: string;
	email?: string;
	class?: string;
	family?: string;
	profileType?: "alumni" | "member";
};

export type ParseLinkedInImportOptions = {
	defaultProfileType?: "alumni" | "member";
	preferredColumn?: string;
	preferredEmailColumn?: string;
	preferredClassColumn?: string;
	preferredFamilyColumn?: string;
};

function splitCsvLine(line: string): string[] {
	const out: string[] = [];
	let cur = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		const next = line[i + 1];

		if (ch === '"' && inQuotes && next === '"') {
			cur += '"';
			i++;
			continue;
		}
		if (ch === '"') {
			inQuotes = !inQuotes;
			continue;
		}
		if (ch === "," && !inQuotes) {
			out.push(cur);
			cur = "";
			continue;
		}
		cur += ch;
	}
	out.push(cur);
	return out.map((v) => v.trim());
}

export function parseCsv(content: string): string[][] {
	const lines = content
		.replace(/^\uFEFF/, "")
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter((line) => line.length > 0);

	if (lines.length < 1) {
		throw new Error("CSV file is empty.");
	}

	return lines.map((line) => splitCsvLine(line));
}

function normalizeHeader(header: string): string {
	return header.replaceAll(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function looksLikeLinkedInProfileUrl(value: string): boolean {
	return /linkedin\.com\/in\//i.test(value);
}

function stripSurroundingQuotes(value: string): string {
	return value.startsWith('"') && value.endsWith('"')
		? value.slice(1, -1)
		: value;
}

function normalizeOptionalEmail(value?: string): string | undefined {
	const normalized = stripSurroundingQuotes(value?.trim() ?? "").toLowerCase();
	return normalized || undefined;
}

function normalizeOptionalCsvField(value?: string): string | undefined {
	const normalized = stripSurroundingQuotes(value?.trim() ?? "");
	return normalized || undefined;
}

function parseProfileType(value?: string): "alumni" | "member" | undefined {
	const normalized = stripSurroundingQuotes(value?.trim() ?? "").toLowerCase();
	if (normalized === "alumni") return "alumni";
	if (normalized === "member") return "member";
	return undefined;
}

function parseLinkedInImportRows(
	parsedRows: string[][],
	options: ParseLinkedInImportOptions = {},
): LinkedInImportRow[] {
	const {
		defaultProfileType,
		preferredColumn,
		preferredEmailColumn,
		preferredClassColumn,
		preferredFamilyColumn,
	} = options;

	const headers = parsedRows[0];
	const rows = parsedRows.slice(1);
	const normalizedHeaders = headers.map(normalizeHeader);
	const linkedInCandidates = preferredColumn
		? [preferredColumn]
		: ["linkedInUrl", "linkedinUrl", "linkedin", "url"];
	const linkedInCandidateSet = new Set(linkedInCandidates.map(normalizeHeader));
	const emailCandidates = preferredEmailColumn
		? [preferredEmailColumn]
		: ["email", "workEmail", "work_email", "emailAddress", "email_address"];
	const emailCandidateSet = new Set(emailCandidates.map(normalizeHeader));
	const profileTypeCandidates = [
		"profileType",
		"profiletype",
		"type",
		"profile_type",
	];
	const profileTypeCandidateSet = new Set(
		profileTypeCandidates.map(normalizeHeader),
	);
	const classCandidates = preferredClassColumn
		? [preferredClassColumn]
		: [
				"class",
				"classYear",
				"class_year",
				"graduationClass",
				"graduation_class",
			];
	const classCandidateSet = new Set(classCandidates.map(normalizeHeader));
	const familyCandidates = preferredFamilyColumn
		? [preferredFamilyColumn]
		: ["family", "house"];
	const familyCandidateSet = new Set(familyCandidates.map(normalizeHeader));

	const headerUrlColumnIndex = normalizedHeaders.findIndex((h) =>
		linkedInCandidateSet.has(h),
	);
	const headerEmailColumnIndex = normalizedHeaders.findIndex((h) =>
		emailCandidateSet.has(h),
	);
	const headerProfileTypeColumnIndex = normalizedHeaders.findIndex((h) =>
		profileTypeCandidateSet.has(h),
	);
	const headerClassColumnIndex = normalizedHeaders.findIndex((h) =>
		classCandidateSet.has(h),
	);
	const headerFamilyColumnIndex = normalizedHeaders.findIndex((h) =>
		familyCandidateSet.has(h),
	);
	const isHeaderlessSingleColumn =
		headerUrlColumnIndex === -1 &&
		looksLikeLinkedInProfileUrl(parsedRows[0]?.[0]?.trim() ?? "");

	if (headerUrlColumnIndex === -1 && !isHeaderlessSingleColumn) {
		if (preferredColumn) {
			throw new Error(
				`Could not find column "${preferredColumn}" in CSV headers: ${headers.join(", ")}`,
			);
		}
		throw new Error(
			`Could not find LinkedIn URL column. Headers: ${headers.join(", ")}. Use a column like linkedInUrl, or start each data row with a profile URL.`,
		);
	}

	if (preferredEmailColumn && headerEmailColumnIndex === -1) {
		throw new Error(
			`Could not find email column "${preferredEmailColumn}" in CSV headers: ${headers.join(", ")}`,
		);
	}

	if (preferredClassColumn && headerClassColumnIndex === -1) {
		throw new Error(
			`Could not find class column "${preferredClassColumn}" in CSV headers: ${headers.join(", ")}`,
		);
	}

	if (preferredFamilyColumn && headerFamilyColumnIndex === -1) {
		throw new Error(
			`Could not find family column "${preferredFamilyColumn}" in CSV headers: ${headers.join(", ")}`,
		);
	}

	if (headerUrlColumnIndex !== -1) {
		return rows.map((row) => {
			const linkedInUrl = stripSurroundingQuotes(
				row[headerUrlColumnIndex]?.trim() ?? "",
			);
			const email =
				headerEmailColumnIndex !== -1
					? normalizeOptionalEmail(row[headerEmailColumnIndex])
					: undefined;
			const classValue =
				headerClassColumnIndex !== -1
					? normalizeOptionalCsvField(row[headerClassColumnIndex])
					: undefined;
			const family =
				headerFamilyColumnIndex !== -1
					? normalizeOptionalCsvField(row[headerFamilyColumnIndex])
					: undefined;
			const profileTypeFromRow =
				headerProfileTypeColumnIndex !== -1
					? parseProfileType(row[headerProfileTypeColumnIndex])
					: undefined;
			const profileType = profileTypeFromRow ?? defaultProfileType;
			return { linkedInUrl, email, class: classValue, family, profileType };
		});
	}

	return parsedRows.map((row) => {
		const linkedInUrl = stripSurroundingQuotes(row[0]?.trim() ?? "");
		const colCount = row.length;
		if (colCount <= 1) {
			return {
				linkedInUrl,
				profileType: defaultProfileType,
			};
		}
		if (colCount >= 5) {
			return {
				linkedInUrl,
				email: normalizeOptionalEmail(row[1]),
				profileType: parseProfileType(row[2]) ?? defaultProfileType,
				class: normalizeOptionalCsvField(row[3]),
				family: normalizeOptionalCsvField(row[4]),
			};
		}
		return {
			linkedInUrl,
			email: normalizeOptionalEmail(row[1]),
			class: normalizeOptionalCsvField(row[2]),
			family: normalizeOptionalCsvField(row[3]),
			profileType: defaultProfileType,
		};
	});
}

export function parseLinkedInImportCsvContent(
	content: string,
	options: ParseLinkedInImportOptions = {},
): LinkedInImportRow[] {
	const parsedRows = parseCsv(content);
	const importRows = parseLinkedInImportRows(parsedRows, options);
	return importRows.filter((row) => row.linkedInUrl.length > 0);
}
