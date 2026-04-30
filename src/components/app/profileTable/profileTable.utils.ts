export const NAME_MAX = 36;
export const HEADLINE_MAX = 72;
export const COMPANY_MAX = 36;
export const MAJOR_MAX = 40;

export function truncateDisplay(text: string, maxLength: number): string {
	const t = text.trim();
	if (t.length <= maxLength) return t;
	if (maxLength <= 3) return ".".repeat(maxLength);
	return `${t.slice(0, maxLength - 3)}...`;
}

export function formatResultsSummary(args: {
	currentPage: number;
	pageSize: number;
	countOnPage: number;
	hasMore: boolean | undefined;
	totalResults?: number;
}): string {
	const { currentPage, pageSize, countOnPage, hasMore, totalResults } = args;

	if (countOnPage === 0) return "No profiles on this page.";

	const start = (currentPage - 1) * pageSize + 1;
	const end = (currentPage - 1) * pageSize + countOnPage;
	const total =
		totalResults ??
		(hasMore ? undefined : (currentPage - 1) * pageSize + countOnPage);

	if (total !== undefined) return `Showing ${start}–${end} of ${total} results`;
	return `Showing ${start}–${end} — more results available`;
}

const MAX_PAGINATION_PAGE_NUMBERS = 4;

export type PaginationSegment =
	| { type: "page"; page: number }
	| { type: "ellipsis"; key: string };

/** Caps visible page links at 4; inserts ellipsis for gaps (shadcn-style pagination). */
export function getPaginationSegments(
	currentPage: number,
	knownPages: number,
): PaginationSegment[] {
	if (knownPages < 1) return [];

	if (knownPages <= MAX_PAGINATION_PAGE_NUMBERS) {
		return Array.from({ length: knownPages }, (_, i) => ({
			type: "page" as const,
			page: i + 1,
		}));
	}

	const out: PaginationSegment[] = [];
	const pushPage = (page: number) => out.push({ type: "page", page });
	const pushEllipsis = (key: string) => out.push({ type: "ellipsis", key });

	if (currentPage <= 2) {
		pushPage(1);
		pushPage(2);
		pushPage(3);
		pushEllipsis("tail");
		pushPage(knownPages);
	} else if (currentPage >= knownPages - 1) {
		pushPage(1);
		pushEllipsis("head");
		const start = Math.max(2, knownPages - 2);
		for (let p = start; p <= knownPages; p++) pushPage(p);
	} else {
		pushPage(1);
		pushEllipsis("mid-left");
		pushPage(currentPage);
		pushPage(currentPage + 1);
		pushEllipsis("mid-right");
		pushPage(knownPages);
	}

	return out;
}

