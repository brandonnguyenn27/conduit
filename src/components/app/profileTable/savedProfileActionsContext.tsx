import type { Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

export type SavedProfileActions = {
	organizationId: Id<"organizations">;
	saveProfile: (args: {
		profileId: Id<"profiles">;
		organizationId: Id<"organizations">;
	}) => Promise<void>;
	unsaveProfile: (args: { profileId: Id<"profiles"> }) => Promise<void>;
};

const SavedProfileActionsContext = createContext<SavedProfileActions | null>(null);

export function SavedProfileActionsProvider(props: {
	value: SavedProfileActions;
	children: React.ReactNode;
}) {
	return (
		<SavedProfileActionsContext.Provider value={props.value}>
			{props.children}
		</SavedProfileActionsContext.Provider>
	);
}

export function useSavedProfileActions(): SavedProfileActions | null {
	return useContext(SavedProfileActionsContext);
}

