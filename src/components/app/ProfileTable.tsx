import type { Id } from "@convex/_generated/dataModel";
import { AnimatePresence, motion } from "framer-motion";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSavedProfileIds } from "@/hooks/use-saved-profile-ids";
import { cn } from "@/lib/utils";
import { SaveProfileButton } from "./SaveProfileButton";

type SearchProfile = {
	_id: string;
	name: string;
	headline: string;
	currentCompany?: string;
	linkedInUrl: string;
};

const NAME_MAX = 36;
const HEADLINE_MAX = 72;
const COMPANY_MAX = 36;

const TABLE_PADDING_ROW_KEYS = [
	"pad-0",
	"pad-1",
	"pad-2",
	"pad-3",
	"pad-4",
	"pad-5",
	"pad-6",
	"pad-7",
	"pad-8",
	"pad-9",
] as const;

function truncateDisplay(text: string, maxLength: number): string {
	const t = text.trim();
	if (t.length <= maxLength) return t;
	if (maxLength <= 3) return ".".repeat(maxLength);
	return `${t.slice(0, maxLength - 3)}...`;
}

function formatResultsSummary(
	currentPage: number,
	pageSize: number,
	countOnPage: number,
	hasMore: boolean | undefined,
	totalResults?: number,
): string {
	if (countOnPage === 0) {
		return "No profiles on this page.";
	}
	const start = (currentPage - 1) * pageSize + 1;
	const end = (currentPage - 1) * pageSize + countOnPage;
	const total =
		totalResults ??
		(hasMore ? undefined : (currentPage - 1) * pageSize + countOnPage);
	if (total !== undefined) {
		return `Showing ${start}–${end} of ${total} results`;
	}
	return `Showing ${start}–${end} — more results available`;
}

const MAX_PAGINATION_PAGE_NUMBERS = 4;

type PaginationSegment =
	| { type: "page"; page: number }
	| { type: "ellipsis"; key: string };

/** Caps visible page links at 4; inserts ellipsis for gaps (shadcn-style pagination). */
function getPaginationSegments(
	currentPage: number,
	knownPages: number,
): PaginationSegment[] {
	if (knownPages < 1) {
		return [];
	}
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
		for (let p = start; p <= knownPages; p++) {
			pushPage(p);
		}
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

interface ProfileTableProps {
	title: string;
	profiles: SearchProfile[];
	isLoading: boolean;
	emptyMessage: string;
	/** Must match server page size (Convex numItems). */
	pageSize?: number;
	/** Exact total when known (e.g. from a count query); otherwise derived on last page only. */
	totalResults?: number;
	onRefresh?: () => void;
	isRefreshing?: boolean;
	onProfileClick?: (profileId: string) => void;
	hasMore?: boolean;
	hasPrevious?: boolean;
	onNext?: () => void;
	onPrevious?: () => void;
	currentPage?: number;
	knownPages?: number;
	onPageSelect?: (page: number) => void;
}

export function ProfileTable({
	title,
	profiles,
	isLoading,
	emptyMessage,
	pageSize = 10,
	totalResults,
	onRefresh,
	isRefreshing,
	onProfileClick,
	hasMore,
	hasPrevious,
	onNext,
	onPrevious,
	currentPage = 1,
	knownPages = 1,
	onPageSelect,
}: ProfileTableProps) {
	const organizationId = useOrganization();
	const { savedProfileIdSet, isLoading: isSavedProfilesLoading } =
		useSavedProfileIds(organizationId);
	const showEmptyState = !isLoading && profiles.length === 0;
	const resultsSummary = formatResultsSummary(
		currentPage,
		pageSize,
		profiles.length,
		hasMore,
		totalResults,
	);
	const showResultsFooter =
		!showEmptyState && (profiles.length > 0 || hasPrevious || hasMore);

	const paginationSegments = useMemo(
		() => getPaginationSegments(currentPage, knownPages),
		[currentPage, knownPages],
	);

	const [direction, setDirection] = useState(0);
	const prevPageRef = useRef(currentPage);

	useEffect(() => {
		if (currentPage !== prevPageRef.current) {
			setDirection(currentPage > prevPageRef.current ? 1 : -1);
			prevPageRef.current = currentPage;
		}
	}, [currentPage]);

	const paddingRows = Math.max(0, pageSize - profiles.length);

	return (
		<Card className="rounded-lg border-border/70 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70">
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle className="font-(family-name:--font-editorial) text-2xl">
					{title}
				</CardTitle>
				{onRefresh ? (
					<button
						type="button"
						onClick={onRefresh}
						disabled={isRefreshing}
						className="text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
					>
						Refresh
					</button>
				) : null}
			</CardHeader>
			<CardContent>
				<div
					className="relative grid w-full overflow-hidden"
					style={{ gridTemplateColumns: "1fr", gridTemplateRows: "1fr" }}
				>
					<AnimatePresence custom={direction} initial={false} mode="wait">
						<motion.div
							key={currentPage}
							custom={direction}
							variants={{
								enter: (dir: number) => ({ x: dir > 0 ? 30 : -30, opacity: 0 }),
								center: { x: 0, opacity: 1 },
								exit: (dir: number) => ({ x: dir < 0 ? 30 : -30, opacity: 0 }),
							}}
							initial="enter"
							animate="center"
							exit="exit"
							transition={{ duration: 0.25, ease: "easeInOut" }}
							className="col-start-1 row-start-1 w-full min-w-0"
						>
							<Table className="table-fixed w-full">
								<TableHeader>
									<TableRow>
										<TableHead className="w-[22%] text-xs uppercase tracking-wide">
											Name
										</TableHead>
										<TableHead className="w-[40%] text-xs uppercase tracking-wide">
											Current Occupation
										</TableHead>
										<TableHead className="w-[22%] text-xs uppercase tracking-wide">
											Company
										</TableHead>
										<TableHead className="w-[16%] text-right text-xs uppercase tracking-wide">
											LinkedIn
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{profiles.map((profile) => {
										const profileId = profile._id as Id<"profiles">;
										const nameDisplay = truncateDisplay(profile.name, NAME_MAX);
										const headlineDisplay = truncateDisplay(
											profile.headline,
											HEADLINE_MAX,
										);
										const companyRaw = profile.currentCompany ?? "—";
										const companyDisplay = truncateDisplay(
											companyRaw,
											COMPANY_MAX,
										);
										return (
											<TableRow
												key={profile._id}
												onClick={() => onProfileClick?.(profile._id)}
												className={cn(
													"group",
													onProfileClick ? "cursor-pointer" : "cursor-default",
												)}
											>
												<TableCell className="py-4 font-medium">
													<span className="block truncate" title={profile.name}>
														{nameDisplay}
													</span>
												</TableCell>
												<TableCell className="py-4 text-muted-foreground">
													<span
														className="block truncate"
														title={profile.headline}
													>
														{headlineDisplay}
													</span>
												</TableCell>
												<TableCell className="py-4">
													<span className="block truncate" title={companyRaw}>
														{companyDisplay}
													</span>
												</TableCell>
												<TableCell className="py-4">
													<div className="flex items-center justify-end gap-2">
														{organizationId ? (
															<SaveProfileButton
																profileId={profileId}
																organizationId={organizationId}
																saved={savedProfileIdSet.has(profileId)}
																loading={isSavedProfilesLoading}
																className="h-9 w-9"
															/>
														) : null}
														<a
															href={profile.linkedInUrl}
															target="_blank"
															rel="noopener noreferrer"
															aria-label={`Open ${profile.name} on LinkedIn`}
															onClick={(event) => {
																event.stopPropagation();
															}}
															className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border/70 hover:bg-muted"
														>
															<LinkedInIcon />
														</a>
													</div>
												</TableCell>
											</TableRow>
										);
									})}
									{TABLE_PADDING_ROW_KEYS.slice(0, paddingRows).map(
										(rowKey) => (
											<TableRow
												key={rowKey}
												className="pointer-events-none border-b-0 hover:bg-transparent"
											>
												<TableCell className="py-4">
													<div className="h-9 w-px"></div>
												</TableCell>
												<TableCell className="py-4"></TableCell>
												<TableCell className="py-4"></TableCell>
												<TableCell className="py-4"></TableCell>
											</TableRow>
										),
									)}
								</TableBody>
							</Table>
						</motion.div>
					</AnimatePresence>
				</div>

				{showEmptyState ? (
					<p className="text-muted-foreground mt-4 text-sm">{emptyMessage}</p>
				) : null}

				{showResultsFooter ? (
					<div className="mt-4 flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
						<p className="text-muted-foreground text-sm">{resultsSummary}</p>
						{hasPrevious || hasMore ? (
							<div className="flex justify-end">
								<Pagination className="mx-0 w-auto">
									<PaginationContent>
										<PaginationItem>
											<PaginationPrevious
												onClick={(e) => {
													e.preventDefault();
													if (hasPrevious && onPrevious && !isRefreshing)
														onPrevious();
												}}
												href="#"
												aria-disabled={!hasPrevious || isRefreshing}
												className={
													!hasPrevious || isRefreshing
														? "pointer-events-none opacity-50"
														: "cursor-pointer"
												}
											/>
										</PaginationItem>
										{paginationSegments.map((segment) =>
											segment.type === "page" ? (
												<PaginationItem key={segment.page}>
													<PaginationLink
														href="#"
														isActive={currentPage === segment.page}
														onClick={(e: MouseEvent) => {
															e.preventDefault();
															if (onPageSelect && !isRefreshing)
																onPageSelect(segment.page);
														}}
														className={
															isRefreshing
																? "pointer-events-none opacity-50"
																: ""
														}
													>
														{segment.page}
													</PaginationLink>
												</PaginationItem>
											) : (
												<PaginationItem key={segment.key}>
													<PaginationEllipsis />
												</PaginationItem>
											),
										)}
										<PaginationItem>
											{isRefreshing ? (
												<span className="inline-flex h-9 w-9 items-center justify-center">
													<Spinner className="size-4 text-muted-foreground" />
												</span>
											) : (
												<PaginationNext
													onClick={(e) => {
														e.preventDefault();
														if (hasMore && onNext) onNext();
													}}
													href="#"
													aria-disabled={!hasMore}
													className={
														!hasMore
															? "pointer-events-none opacity-50"
															: "cursor-pointer"
													}
												/>
											)}
										</PaginationItem>
									</PaginationContent>
								</Pagination>
							</div>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}

function LinkedInIcon() {
	return (
		<svg
			aria-hidden="true"
			viewBox="0 0 24 24"
			className="h-4 w-4 fill-current text-foreground"
		>
			<path d="M19 3A2 2 0 0 1 21 5v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 17.34V9.89H5.86v7.45h2.48Zm-1.24-8.47c.79 0 1.43-.65 1.43-1.43 0-.8-.64-1.43-1.43-1.43-.78 0-1.42.64-1.42 1.43 0 .79.64 1.43 1.42 1.43Zm11.24 8.47v-4.12c0-2.21-1.18-3.24-2.75-3.24-1.27 0-1.84.7-2.16 1.2v-1.03h-2.48v7.2h2.48v-4.02c0-.21.02-.42.08-.57.17-.42.56-.86 1.21-.86.85 0 1.19.65 1.19 1.6v3.85h2.43Z" />
		</svg>
	);
}
