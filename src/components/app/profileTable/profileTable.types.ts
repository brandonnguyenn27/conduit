import type { Id } from "@convex/_generated/dataModel";

export type SearchProfile = {
	_id: string;
	name: string;
	headline: string;
	currentCompany?: string;
	major?: string;
	linkedInUrl: string;
};

export type ProfileTableRowProps = {
	profile: SearchProfile;
	onProfileClick?: (profileId: string) => void;
	savedProfileIdSet?: Set<Id<"profiles">>;
	isSavedProfilesLoading?: boolean;
};

export type ProfileTableBodyProps = {
	profiles: SearchProfile[];
	onProfileClick?: (profileId: string) => void;
	savedProfileIdSet?: Set<Id<"profiles">>;
	isSavedProfilesLoading?: boolean;
	paddingRows: number;
};

export const TABLE_PADDING_ROW_KEYS = [
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

