import type { Id } from "@convex/_generated/dataModel";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

import type { Slot1Value, Slot2Value } from "./chat-query-config";
import { ChatQueryResultsSection } from "./chat-query-interface/ChatQueryResultsSection";
import { ChatQuerySlot3Combobox } from "./chat-query-interface/ChatQuerySlot3Combobox";
import { useChatQueryState } from "./chat-query-interface/use-chat-query-state";

interface ChatQueryInterfaceProps {
	organizationId: Id<"organizations"> | null;
	onSearch?: (params: {
		slot2: Slot2Value;
		searchQuery: string;
		profileType?: "alumni" | "member";
	}) => void;
	compact?: boolean;
	resultsSlot?: ReactNode;
	isSearching?: boolean;
}

export function ChatQueryInterface({
	organizationId,
	onSearch,
	compact = false,
	resultsSlot,
	isSearching = false,
}: ChatQueryInterfaceProps) {
	const {
		buildSearchPayload,
		canLoadMore,
		canSearch,
		effectiveSlot2,
		effectiveSlot3,
		handleLoadMore,
		handleSlot1Change,
		handleSlot2Change,
		handleSlot3ListScroll,
		hasNoFacets,
		isAtListBottom,
		isLoading,
		isLoadingMore,
		listRef,
		setInputValue,
		setSlot3,
		slot1,
		slot1Options,
		slot2Options,
		slot3Options,
		slot3Placeholder,
	} = useChatQueryState(organizationId);
	const slot3ComboboxKey = `${organizationId ?? "none"}:${slot1}:${effectiveSlot2}`;

	function handleSearchClick() {
		if (isSearching) return;
		const searchPayload = buildSearchPayload();
		if (!searchPayload) return;
		onSearch?.(searchPayload);
	}

	return (
		<motion.div
			layout
			className={cn(
				"font-(family-name:--font-editorial)",
				"flex w-full max-w-6xl flex-wrap items-center gap-6",
				"rounded-xl border border-border",
				"bg-white/70 shadow-sm backdrop-blur-md",
				compact ? "px-8 py-7" : "px-12 py-10",
				"dark:bg-zinc-900/70",
				"flex justify-center",
			)}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.24, layout: { duration: 0.34 } }}
			whileHover={{ scale: 1.01 }}
			whileTap={{ scale: 0.99 }}
		>
			<div className="flex w-full flex-wrap items-center justify-center gap-6">
				<span className="text-foreground shrink-0 text-xl font-medium">
					Find me
				</span>
				<Select
					value={slot1}
					onValueChange={(value) => handleSlot1Change(value as Slot1Value)}
				>
					<SelectTrigger
						className="h-14 min-w-40 border-dashed border-primary/30 bg-transparent text-lg font-medium"
						size="default"
					>
						<SelectValue placeholder="Select..." />
					</SelectTrigger>
					<SelectContent>
						{slot1Options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select
					value={effectiveSlot2}
					onValueChange={(value) => handleSlot2Change(value as Slot2Value)}
					disabled={slot2Options.length === 0}
				>
					<SelectTrigger
						className="h-14 min-w-48 border-dashed border-primary/30 bg-transparent text-lg font-medium"
						size="default"
					>
						<SelectValue placeholder="Select..." />
					</SelectTrigger>
					<SelectContent>
						{slot2Options.map((opt) => (
							<SelectItem key={opt.value} value={opt.value}>
								{opt.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<ChatQuerySlot3Combobox
					key={slot3ComboboxKey}
					disabled={!organizationId || isLoading || hasNoFacets}
					isAtListBottom={isAtListBottom}
					isLoadingMore={isLoadingMore}
					listRef={listRef}
					onInputValueChange={setInputValue}
					onLoadMore={handleLoadMore}
					onScroll={handleSlot3ListScroll}
					onValueChange={setSlot3}
					options={slot3Options}
					placeholder={slot3Placeholder}
					showLoadMore={canLoadMore}
					value={effectiveSlot3}
				/>
				<HoverBorderGradient
					containerClassName={cn(
						"rounded-xl",
						!canSearch || isSearching
							? "pointer-events-none opacity-50"
							: undefined,
					)}
					as="button"
					onClick={handleSearchClick}
					aria-disabled={!canSearch || isSearching}
					className="dark:bg-black bg-white text-black dark:text-white flex items-center space-x-2 h-9 w-24 text-center justify-center "
				>
					{isSearching ? <Spinner className="size-4" /> : "Search"}
				</HoverBorderGradient>
			</div>
			<ChatQueryResultsSection>{resultsSlot}</ChatQueryResultsSection>
		</motion.div>
	);
}
