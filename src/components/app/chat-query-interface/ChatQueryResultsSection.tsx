import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

interface ChatQueryResultsSectionProps {
	children?: ReactNode;
}

export function ChatQueryResultsSection({
	children,
}: ChatQueryResultsSectionProps) {
	return (
		<AnimatePresence initial={false}>
			{children ? (
				<motion.div
					key="search-results-slot"
					className="border-border/70 w-full overflow-hidden border-t"
					initial={{ height: 0, marginTop: 0, paddingTop: 0 }}
					animate={{ height: "auto", marginTop: 16, paddingTop: 24 }}
					exit={{ height: 0, marginTop: 0, paddingTop: 0 }}
					transition={{ duration: 0.36 }}
				>
					<motion.div
						initial={{ opacity: 0, x: 28 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 12 }}
						transition={{ duration: 0.26, delay: 0.34 }}
					>
						{children}
					</motion.div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
