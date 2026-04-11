import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useConvex, useQuery } from "convex/react";
import {
	type UIEvent,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
	CHAT_QUERY_CONFIG,
	getFacetKeyForSlot2,
	getProfileTypeFilterFromSlot1,
	getSlot2Options,
	mapFacetValuesToOptions,
	type Slot1Value,
	type Slot2Value,
	type Slot3Value,
} from "../chat-query-config";

const BROWSE_PAGE_SIZE = 100;
const SEARCH_LIMIT_INITIAL = 50;
const SEARCH_LIMIT_STEP = 50;
const SEARCH_LIMIT_MAX = 200;
const BOTTOM_THRESHOLD_PX = 48;

type ScrollSnapshot = {
	scopeKey: string;
	scrollTop: number;
};

type BrowseState = {
	scopeToken: number;
	extraItems: string[];
	nextCursor?: string;
	isLoadingMore: boolean;
};

type SearchState = {
	scopeToken: number;
	limit: number;
	requestedLimit: number | null;
	loadStartCount: number;
};

type SearchPayload = {
	slot2: Slot2Value;
	searchQuery: string;
	profileType?: "alumni" | "member";
};

function dedupeValues(values: string[]) {
	return Array.from(new Set(values));
}

function isNearBottom(element: HTMLDivElement) {
	const distanceToBottom =
		element.scrollHeight - element.scrollTop - element.clientHeight;
	return distanceToBottom <= BOTTOM_THRESHOLD_PX;
}

function useScopeToken(scopeKey: string) {
	const scopeRef = useRef({ key: scopeKey, token: 0 });
	if (scopeRef.current.key !== scopeKey) {
		scopeRef.current = {
			key: scopeKey,
			token: scopeRef.current.token + 1,
		};
	}
	return scopeRef.current.token;
}

export function useChatQueryState(organizationId: Id<"organizations"> | null) {
	const convex = useConvex();
	const [slot1, setSlot1] = useState<Slot1Value>(
		() => CHAT_QUERY_CONFIG.slot1[0]?.value ?? "alumni",
	);
	const [slot2, setSlot2] = useState<Slot2Value | "">(() => {
		const options = getSlot2Options(
			CHAT_QUERY_CONFIG.slot1[0]?.value ?? "alumni",
			CHAT_QUERY_CONFIG,
		);
		return options[0]?.value ?? "";
	});
	const [slot3, setSlot3] = useState<Slot3Value | "">("");
	const [inputValue, setInputValue] = useState("");
	const [browseState, setBrowseState] = useState<BrowseState>({
		scopeToken: -1,
		extraItems: [],
		nextCursor: undefined,
		isLoadingMore: false,
	});
	const [searchState, setSearchState] = useState<SearchState>({
		scopeToken: -1,
		limit: SEARCH_LIMIT_INITIAL,
		requestedLimit: null,
		loadStartCount: 0,
	});
	const [isAtListBottom, setIsAtListBottom] = useState(false);

	const debouncedInput = useDebouncedValue(inputValue, 400);
	const listRef = useRef<HTMLDivElement | null>(null);
	const pendingScrollSnapshotRef = useRef<ScrollSnapshot | null>(null);
	const browseScopeTokenRef = useRef(-1);
	const isAtListBottomRef = useRef(false);

	const slot2Options = useMemo(
		() => getSlot2Options(slot1, CHAT_QUERY_CONFIG),
		[slot1],
	);

	const effectiveSlot2 = slot2Options.some((option) => option.value === slot2)
		? slot2
		: (slot2Options[0]?.value ?? "");

	const selectedFacetKey = effectiveSlot2
		? getFacetKeyForSlot2(effectiveSlot2 as Slot2Value)
		: null;

	const trimmedInput = debouncedInput.trim();
	const isSearchMode = trimmedInput.length > 0;
	const browseScopeKey = `${organizationId ?? "none"}:${selectedFacetKey ?? "none"}:${isSearchMode ? "search" : "browse"}`;
	const searchScopeKey = `${organizationId ?? "none"}:${selectedFacetKey ?? "none"}:${trimmedInput}`;
	const browseScopeToken = useScopeToken(browseScopeKey);
	const searchScopeToken = useScopeToken(searchScopeKey);
	const hasActiveSearchState = searchState.scopeToken === searchScopeToken;
	const searchLimit = hasActiveSearchState
		? searchState.limit
		: SEARCH_LIMIT_INITIAL;
	const requestedSearchLimit = hasActiveSearchState
		? searchState.requestedLimit
		: null;
	const searchLoadStartCount = hasActiveSearchState
		? searchState.loadStartCount
		: 0;
	const isLoadingMoreSearch = requestedSearchLimit !== null;
	const listScopeKey = isSearchMode
		? `search:${searchScopeToken}`
		: `browse:${browseScopeToken}`;

	browseScopeTokenRef.current = browseScopeToken;

	const browsePage = useQuery(
		api.functions.facets.queries.getFacetPage,
		organizationId && selectedFacetKey
			? { organizationId, facet: selectedFacetKey, limit: BROWSE_PAGE_SIZE }
			: "skip",
	);
	const hasActiveBrowseState = browseState.scopeToken === browseScopeToken;
	const extraItems = hasActiveBrowseState ? browseState.extraItems : [];
	const browseNextCursor = hasActiveBrowseState
		? browseState.nextCursor
		: browsePage?.nextCursor;
	const isLoadingMoreBrowse = hasActiveBrowseState
		? browseState.isLoadingMore
		: false;

	const searchResults = useQuery(
		api.functions.facets.queries.searchFacet,
		organizationId && selectedFacetKey && isSearchMode
			? {
					organizationId,
					facet: selectedFacetKey,
					q: trimmedInput,
					limit: searchLimit,
				}
			: "skip",
	);

	const updateIsAtListBottom = useCallback((nextValue: boolean) => {
		if (isAtListBottomRef.current === nextValue) return;
		isAtListBottomRef.current = nextValue;
		setIsAtListBottom(nextValue);
	}, []);

	const captureScrollSnapshot = useCallback((scopeKey: string) => {
		const list = listRef.current;
		if (!list) return;
		pendingScrollSnapshotRef.current = {
			scopeKey,
			scrollTop: list.scrollTop,
		};
	}, []);

	useEffect(() => {
		if (requestedSearchLimit == null || searchResults === undefined) return;
		if (searchResults.length === searchLoadStartCount) {
			pendingScrollSnapshotRef.current = null;
		}
		setSearchState((current) => {
			if (
				current.scopeToken !== searchScopeToken ||
				current.requestedLimit == null
			) {
				return current;
			}

			return {
				...current,
				requestedLimit: null,
				loadStartCount: 0,
			};
		});
	}, [
		requestedSearchLimit,
		searchLoadStartCount,
		searchResults,
		searchScopeToken,
	]);

	const loadMoreBrowseItems = useCallback(async () => {
		if (
			!organizationId ||
			!selectedFacetKey ||
			!browseNextCursor ||
			isLoadingMoreBrowse ||
			isSearchMode
		) {
			return false;
		}

		const requestScopeToken = browseScopeToken;
		captureScrollSnapshot(listScopeKey);
		setBrowseState((current) => ({
			scopeToken: requestScopeToken,
			extraItems:
				current.scopeToken === requestScopeToken ? current.extraItems : [],
			nextCursor:
				current.scopeToken === requestScopeToken
					? current.nextCursor
					: browseNextCursor,
			isLoadingMore: true,
		}));
		let completed = false;

		try {
			const nextPage = await convex.query(
				api.functions.facets.queries.getFacetPage,
				{
					organizationId,
					facet: selectedFacetKey,
					cursor: browseNextCursor,
					limit: BROWSE_PAGE_SIZE,
				},
			);
			if (requestScopeToken !== browseScopeTokenRef.current) return false;

			setBrowseState((current) => {
				if (current.scopeToken !== requestScopeToken) {
					return current;
				}

				return {
					scopeToken: requestScopeToken,
					extraItems: current.extraItems.concat(nextPage.items),
					nextCursor: nextPage.nextCursor,
					isLoadingMore: false,
				};
			});
			completed = true;

			if (nextPage.items.length === 0) {
				pendingScrollSnapshotRef.current = null;
			}

			return true;
		} finally {
			if (!completed && requestScopeToken === browseScopeTokenRef.current) {
				setBrowseState((current) => {
					if (current.scopeToken !== requestScopeToken) {
						return current;
					}

					return {
						...current,
						isLoadingMore: false,
					};
				});
			}
		}
	}, [
		browseScopeToken,
		browseNextCursor,
		captureScrollSnapshot,
		convex,
		isLoadingMoreBrowse,
		isSearchMode,
		listScopeKey,
		organizationId,
		selectedFacetKey,
	]);

	const loadMoreSearchItems = useCallback(() => {
		if (!isSearchMode || isLoadingMoreSearch || searchResults === undefined)
			return false;
		if (searchLimit >= SEARCH_LIMIT_MAX || searchResults.length < searchLimit)
			return false;

		const nextLimit = Math.min(
			searchLimit + SEARCH_LIMIT_STEP,
			SEARCH_LIMIT_MAX,
		);
		if (nextLimit === searchLimit) return false;

		captureScrollSnapshot(listScopeKey);
		setSearchState({
			scopeToken: searchScopeToken,
			limit: nextLimit,
			requestedLimit: nextLimit,
			loadStartCount: searchResults.length,
		});
		return true;
	}, [
		captureScrollSnapshot,
		isLoadingMoreSearch,
		isSearchMode,
		listScopeKey,
		searchLimit,
		searchResults,
		searchScopeToken,
	]);

	const handleLoadMore = useCallback(() => {
		if (!isSearchMode) {
			void loadMoreBrowseItems();
			return;
		}
		loadMoreSearchItems();
	}, [isSearchMode, loadMoreBrowseItems, loadMoreSearchItems]);

	const handleSlot3ListScroll = useCallback(
		(event: UIEvent<HTMLDivElement>) => {
			updateIsAtListBottom(isNearBottom(event.currentTarget));
		},
		[updateIsAtListBottom],
	);

	const slot3Options = useMemo(() => {
		if (isSearchMode) {
			if (searchResults !== undefined) {
				return mapFacetValuesToOptions(searchResults);
			}
			return mapFacetValuesToOptions(browsePage?.items);
		}

		return mapFacetValuesToOptions(
			dedupeValues((browsePage?.items ?? []).concat(extraItems)),
		);
	}, [browsePage?.items, extraItems, isSearchMode, searchResults]);

	const slot3OptionValues = useMemo(
		() => new Set(slot3Options.map((option) => option.value)),
		[slot3Options],
	);

	const canLoadMoreBrowse = !isSearchMode && !!browseNextCursor;
	const canLoadMoreSearch =
		isSearchMode &&
		searchResults !== undefined &&
		searchLimit < SEARCH_LIMIT_MAX &&
		searchResults.length === searchLimit;
	const canLoadMore = canLoadMoreBrowse || canLoadMoreSearch;
	const isLoadingMore = isLoadingMoreBrowse || isLoadingMoreSearch;

	useLayoutEffect(() => {
		const snapshot = pendingScrollSnapshotRef.current;
		const list = listRef.current;
		if (!snapshot || !list) return;
		if (snapshot.scopeKey !== listScopeKey) {
			pendingScrollSnapshotRef.current = null;
			return;
		}
		if (slot3Options.length === 0) {
			pendingScrollSnapshotRef.current = null;
			return;
		}
		list.scrollTop = Math.max(snapshot.scrollTop, 0);
		pendingScrollSnapshotRef.current = null;
	}, [listScopeKey, slot3Options]);

	const effectiveSlot3 = slot3OptionValues.has(slot3) ? slot3 : "";
	const trimmedSlot3 = effectiveSlot3.trim();
	const canSearch = !!organizationId && trimmedSlot3.length > 0;

	const isLoading =
		!!organizationId && !!selectedFacetKey && browsePage === undefined;
	const hasNoFacets =
		!!organizationId &&
		!!selectedFacetKey &&
		browsePage !== undefined &&
		browsePage.items.length === 0;

	const slot3Placeholder = isLoading
		? "Loading..."
		: hasNoFacets
			? "No data yet"
			: effectiveSlot2 === "works_as" || effectiveSlot2 === "worked_as"
				? "Search or select role..."
				: "Search or select...";

	const handleSlot1Change = useCallback((value: Slot1Value) => {
		setSlot1(value);
		const nextSlot2Options = getSlot2Options(value, CHAT_QUERY_CONFIG);
		setSlot2(nextSlot2Options[0]?.value ?? "");
		setSlot3("");
		setInputValue("");
	}, []);

	const handleSlot2Change = useCallback((value: Slot2Value) => {
		setSlot2(value);
		setSlot3("");
		setInputValue("");
	}, []);

	const buildSearchPayload = useCallback((): SearchPayload | null => {
		if (!canSearch || !effectiveSlot2) return null;
		const profileType = getProfileTypeFilterFromSlot1(slot1);
		return {
			slot2: effectiveSlot2 as Slot2Value,
			searchQuery: trimmedSlot3,
			...(profileType ? { profileType } : {}),
		};
	}, [canSearch, effectiveSlot2, slot1, trimmedSlot3]);

	return {
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
		slot1Options: CHAT_QUERY_CONFIG.slot1,
		slot2Options,
		slot3Options,
		slot3Placeholder,
	};
}
