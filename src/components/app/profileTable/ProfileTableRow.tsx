import type { Id } from "@convex/_generated/dataModel";
import { SaveProfileButton } from "@/components/app/SaveProfileButton";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { LinkedInIcon } from "./LinkedInIcon";
import { useSavedProfileActions } from "./savedProfileActionsContext";
import {
	COMPANY_MAX,
	HEADLINE_MAX,
	MAJOR_MAX,
	NAME_MAX,
	truncateDisplay,
} from "./profileTable.utils";
import type { ProfileTableRowProps } from "./profileTable.types";

export function ProfileTableRow(props: ProfileTableRowProps) {
	const { profile, onProfileClick } = props;
	const actions = useSavedProfileActions();
	const profileId = profile._id as Id<"profiles">;

	const nameDisplay = truncateDisplay(profile.name, NAME_MAX);
	const headlineDisplay = truncateDisplay(profile.headline, HEADLINE_MAX);
	const companyRaw = profile.currentCompany ?? "—";
	const companyDisplay = truncateDisplay(companyRaw, COMPANY_MAX);
	const majorRaw = profile.major?.trim() ? profile.major.trim() : "—";
	const majorDisplay = truncateDisplay(majorRaw, MAJOR_MAX);

	return (
		<TableRow
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
				{profile.major?.trim() ? (
					<span
						className="mt-0.5 block truncate text-xs text-muted-foreground md:hidden"
						title={profile.major.trim()}
					>
						{truncateDisplay(profile.major.trim(), MAJOR_MAX)}
					</span>
				) : null}
			</TableCell>

			<TableCell className="hidden py-4 text-muted-foreground md:table-cell">
				<span className="block truncate" title={profile.headline}>
					{headlineDisplay}
				</span>
			</TableCell>

			<TableCell className="hidden py-4 md:table-cell">
				<span className="block truncate" title={companyRaw}>
					{companyDisplay}
				</span>
			</TableCell>

			<TableCell className="hidden py-4 text-muted-foreground md:table-cell">
				<span className="block truncate" title={majorRaw}>
					{majorDisplay}
				</span>
			</TableCell>

			<TableCell className="py-4">
				<div className="flex items-center justify-end gap-2">
					{actions && props.savedProfileIdSet ? (
						<SaveProfileButton
							key={profileId}
							profileId={profileId}
							organizationId={actions.organizationId}
							saved={props.savedProfileIdSet.has(profileId)}
							loading={props.isSavedProfilesLoading}
							onSave={async ({ profileId, organizationId }) => {
								await actions.saveProfile({ profileId, organizationId });
							}}
							onUnsave={async ({ profileId }) => {
								await actions.unsaveProfile({ profileId });
							}}
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
}

