import { useRef, useState } from 'react'

type PageInfo = {
  continueCursor: string | null
  isDone: boolean
}

export function useCursorPagination(resetKey?: string) {
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const [pageIndex, setPageIndex] = useState(0)
  const prevResetKeyRef = useRef(resetKey)

  if (resetKey !== undefined && prevResetKeyRef.current !== resetKey) {
    prevResetKeyRef.current = resetKey
    setCursors([null])
    setPageIndex(0)
  }

  const currentCursor = cursors[pageIndex]

  const reset = () => {
    setCursors([null])
    setPageIndex(0)
  }

  const nextPage = (page: PageInfo | null | undefined) => {
    if (!page || page.isDone) return

    if (cursors.length <= pageIndex + 1) {
      setCursors((prev) => {
        const next = [...prev]
        next[pageIndex + 1] = page.continueCursor
        return next
      })
    }

    setPageIndex((prev) => prev + 1)
  }

  const prevPage = () => {
    if (pageIndex <= 0) return
    setPageIndex((prev) => prev - 1)
  }

  const selectPage = (targetPageIndex: number) => {
    if (targetPageIndex < 0 || targetPageIndex >= cursors.length) return
    setPageIndex(targetPageIndex)
  }

  return {
    cursors,
    pageIndex,
    currentCursor,
    reset,
    nextPage,
    prevPage,
    selectPage,
  }
}

