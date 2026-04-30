import { useMemo, useRef } from "react";

export function useProfileTablePageMotion(args: {
	isLoading: boolean;
	currentPage: number;
	profiles: Array<{ _id: string }>;
}): { direction: number; motionKey: string } {
	const { isLoading, currentPage, profiles } = args;

	const directionRef = useRef(0);
	const prevCommittedPageRef = useRef(currentPage);

	const pageDataKey = useMemo(() => {
		const firstId = profiles[0]?._id ?? "none";
		const lastId = profiles.at(-1)?._id ?? "none";
		return `${profiles.length}:${firstId}:${lastId}`;
	}, [profiles]);

	const committedPageDataKeyRef = useRef(pageDataKey);
	if (!isLoading && pageDataKey !== committedPageDataKeyRef.current) {
		committedPageDataKeyRef.current = pageDataKey;
	}

	if (
		!isLoading &&
		currentPage !== prevCommittedPageRef.current &&
		committedPageDataKeyRef.current === pageDataKey
	) {
		directionRef.current = currentPage > prevCommittedPageRef.current ? 1 : -1;
		prevCommittedPageRef.current = currentPage;
	}

	return { direction: directionRef.current, motionKey: committedPageDataKeyRef.current };
}

