import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import { ProfileTableRow } from "./ProfileTableRow";
import { TABLE_PADDING_ROW_KEYS, type ProfileTableBodyProps } from "./profileTable.types";

export function ProfileTableBody(props: ProfileTableBodyProps) {
	return (
		<Table className="w-full table-auto md:table-fixed">
			<TableHeader>
				<TableRow>
					<TableHead className="w-[72%] text-xs uppercase tracking-wide md:w-[18%]">
						Name
					</TableHead>
					<TableHead className="hidden w-[34%] text-xs uppercase tracking-wide md:table-cell">
						Current Occupation
					</TableHead>
					<TableHead className="hidden w-[18%] text-xs uppercase tracking-wide md:table-cell">
						Company
					</TableHead>
					<TableHead className="hidden w-[18%] text-xs uppercase tracking-wide md:table-cell">
						Major
					</TableHead>
					<TableHead className="w-[28%] text-right text-xs uppercase tracking-wide md:w-[22%]" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{props.profiles.map((profile) => (
					<ProfileTableRow
						key={profile._id}
						profile={profile}
						onProfileClick={props.onProfileClick}
						savedProfileIdSet={props.savedProfileIdSet}
						isSavedProfilesLoading={props.isSavedProfilesLoading}
					/>
				))}
				{TABLE_PADDING_ROW_KEYS.slice(0, props.paddingRows).map((rowKey) => (
					<TableRow
						key={rowKey}
						className="pointer-events-none border-b-0 hover:bg-transparent"
					>
						<TableCell className="py-4">
							<div className="h-9 w-px" />
						</TableCell>
						<TableCell className="hidden py-4 md:table-cell" />
						<TableCell className="hidden py-4 md:table-cell" />
						<TableCell className="hidden py-4 md:table-cell" />
						<TableCell className="py-4" />
					</TableRow>
				))}
			</TableBody>
		</Table>
	);
}

