import type { RefObject, UIEventHandler } from "react";

import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

import type { MadLibOption, Slot3Value } from "../chat-query-config";

interface ChatQuerySlot3ComboboxProps {
	disabled: boolean;
	isAtListBottom: boolean;
	isLoadingMore: boolean;
	listRef: RefObject<HTMLDivElement | null>;
	onInputValueChange: (value: string) => void;
	onLoadMore: () => void;
	onScroll: UIEventHandler<HTMLDivElement>;
	onValueChange: (value: Slot3Value) => void;
	options: MadLibOption[];
	placeholder: string;
	showLoadMore: boolean;
	value: Slot3Value | "";
}

export function ChatQuerySlot3Combobox({
	disabled,
	isAtListBottom,
	isLoadingMore,
	listRef,
	onInputValueChange,
	onLoadMore,
	onScroll,
	onValueChange,
	options,
	placeholder,
	showLoadMore,
	value,
}: ChatQuerySlot3ComboboxProps) {
	return (
		<Combobox
			value={value}
			onValueChange={(nextValue) => onValueChange(nextValue as Slot3Value)}
			onInputValueChange={onInputValueChange}
			items={options}
			filteredItems={options}
		>
			<ComboboxInput
				className={cn(
					"h-9 min-w-52 border-dashed border-primary/30 bg-transparent text-lg font-medium",
					"**:data-[slot=input-group-control]:text-lg",
					"**:data-[slot=input-group-control]:font-medium",
					"**:data-[slot=input-group-control]:text-foreground",
					"**:data-[slot=input-group-control]:placeholder:text-muted-foreground",
				)}
				disabled={disabled}
				placeholder={placeholder}
				showClear
			/>
			<ComboboxContent>
				<ComboboxEmpty>No matches found.</ComboboxEmpty>
				<ComboboxList ref={listRef} className="max-h-90" onScroll={onScroll}>
					<ComboboxCollection>
						{(item) => (
							<ComboboxItem key={item.value} value={item.value}>
								{item.label}
							</ComboboxItem>
						)}
					</ComboboxCollection>
					<div className="min-h-8 px-1 pb-1">
						{isAtListBottom && showLoadMore && !isLoadingMore ? (
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="h-7 w-auto justify-start px-2 text-xs font-normal text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground"
								onClick={onLoadMore}
							>
								Load more results
							</Button>
						) : null}
						{isLoadingMore ? (
							<div className="px-2 py-1.5 text-left text-xs text-muted-foreground">
								Loading more...
							</div>
						) : null}
					</div>
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
