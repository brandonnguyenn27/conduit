import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useSavedProfileIds } from "@/hooks/use-saved-profile-ids";
import { SavedProfileActionsProvider } from "./profileTable/savedProfileActionsContext";
import { ProfileTableBody } from "./profileTable/ProfileTableBody";
import { ProfileTableFooter } from "./profileTable/ProfileTableFooter";
import { ProfileTableShell } from "./profileTable/ProfileTableShell";
import { useProfileTablePageMotion } from "./profileTable/useProfileTablePageMotion";
import type { SearchProfile } from "./profileTable/profileTable.types";
import {
	formatResultsSummary,
	getPaginationSegments,
} from "./profileTable/profileTable.utils";

export interface ProfileTableProps {
	title: string;
	profiles: SearchProfile[];
	isLoading: boolean;
	emptyMessage: string;
	savedProfileIdSet?: Set<Id<"profiles">>;
	isSavedProfilesLoading?: boolean;
	/** Must match server page size (Convex numItems). */
	pageSize?: number;
	/** When true, pads empty rows to keep table height fixed at pageSize. */
	padToPageSize?: boolean;
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

export function ProfileTable(props: ProfileTableProps) {
	const organizationId = useOrganization();

	const shouldFetchSavedProfileIds = props.savedProfileIdSet === undefined;
	const {
		savedProfileIdSet: savedProfileIdSetFromQuery,
		isLoading: isSavedProfilesLoadingFromQuery,
	} = useSavedProfileIds(shouldFetchSavedProfileIds ? organizationId : null);

	const savedProfileIdSet = props.savedProfileIdSet ?? savedProfileIdSetFromQuery;
	const isSavedProfilesLoading =
		props.isSavedProfilesLoading ?? isSavedProfilesLoadingFromQuery;

	const addSavedProfile = useMutation(api.functions.savedProfiles.mutations.add);
	const removeSavedProfile = useMutation(api.functions.savedProfiles.mutations.remove);

	if (!organizationId) {
		return (
			<ProfileTablePresentation
				{...props}
				savedProfileIdSet={savedProfileIdSet}
				isSavedProfilesLoading={isSavedProfilesLoading}
			/>
		);
	}

	return (
		<SavedProfileActionsProvider
			value={{
				organizationId,
				saveProfile: async ({ profileId, organizationId }) => {
					await addSavedProfile({ profileId, organizationId });
				},
				unsaveProfile: async ({ profileId }) => {
					await removeSavedProfile({ profileId });
				},
			}}
		>
			<ProfileTablePresentation
				{...props}
				savedProfileIdSet={savedProfileIdSet}
				isSavedProfilesLoading={isSavedProfilesLoading}
			/>
		</SavedProfileActionsProvider>
	);
}

function ProfileTablePresentation(props: ProfileTableProps) {
	const {
		title,
		profiles,
		isLoading,
		emptyMessage,
		savedProfileIdSet,
		isSavedProfilesLoading,
		pageSize = 10,
		padToPageSize = true,
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
	} = props;

	const showEmptyState = !isLoading && profiles.length === 0;
	const showResultsFooter = !isLoading && (profiles.length > 0 || hasPrevious || hasMore);

	const resultsSummary = formatResultsSummary({
		currentPage,
		pageSize,
		countOnPage: profiles.length,
		hasMore,
		totalResults,
	});

	const paginationSegments = useMemo(
		() => getPaginationSegments(currentPage, knownPages),
		[currentPage, knownPages],
	);

	const { direction, motionKey } = useProfileTablePageMotion({
		isLoading,
		currentPage,
		profiles,
	});

	const paddingRows = padToPageSize ? Math.max(0, pageSize - profiles.length) : 0;

	return (
		<ProfileTableShell title={title} onRefresh={onRefresh} isRefreshing={isRefreshing}>
			<div
				className="relative grid w-full overflow-hidden"
				style={{ gridTemplateColumns: "1fr", gridTemplateRows: "1fr" }}
			>
				<AnimatePresence custom={direction} initial={false} mode="wait">
					<motion.div
						key={motionKey}
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
						<ProfileTableBody
							profiles={profiles}
							onProfileClick={onProfileClick}
							savedProfileIdSet={savedProfileIdSet}
							isSavedProfilesLoading={isSavedProfilesLoading}
							paddingRows={paddingRows}
						/>
					</motion.div>
				</AnimatePresence>
			</div>

			{showEmptyState ? (
				<p className="text-muted-foreground mt-4 text-sm">{emptyMessage}</p>
			) : null}

			{showResultsFooter ? (
				<ProfileTableFooter
					resultsSummary={resultsSummary}
					isRefreshing={isRefreshing}
					hasPrevious={hasPrevious}
					hasMore={hasMore}
					onPrevious={onPrevious}
					onNext={onNext}
					currentPage={currentPage}
					paginationSegments={paginationSegments}
					onPageSelect={onPageSelect}
				/>
			) : null}
		</ProfileTableShell>
	);
}
