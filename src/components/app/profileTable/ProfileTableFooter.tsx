import type { MouseEvent } from "react";

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

import type { PaginationSegment } from "./profileTable.utils";

export function ProfileTableFooter(props: {
	resultsSummary: string;
	isRefreshing?: boolean;
	hasMore?: boolean;
	hasPrevious?: boolean;
	onNext?: () => void;
	onPrevious?: () => void;
	currentPage: number;
	paginationSegments: PaginationSegment[];
	onPageSelect?: (page: number) => void;
}) {
	const {
		resultsSummary,
		isRefreshing,
		hasMore,
		hasPrevious,
		onNext,
		onPrevious,
		currentPage,
		paginationSegments,
		onPageSelect,
	} = props;

	return (
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
										if (hasPrevious && onPrevious && !isRefreshing) onPrevious();
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
											className={isRefreshing ? "pointer-events-none opacity-50" : ""}
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
	);
}

