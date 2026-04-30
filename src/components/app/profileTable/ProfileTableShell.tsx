import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProfileTableShell(props: {
	title: string;
	onRefresh?: () => void;
	isRefreshing?: boolean;
	children: React.ReactNode;
}) {
	return (
		<Card className="rounded-lg border-border/70 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70">
			<CardHeader className="flex flex-row items-center justify-between gap-4">
				<CardTitle className="font-(family-name:--font-editorial) text-2xl">
					{props.title}
				</CardTitle>
				{props.onRefresh ? (
					<button
						type="button"
						onClick={props.onRefresh}
						disabled={props.isRefreshing}
						className="text-sm text-muted-foreground underline hover:text-foreground disabled:opacity-50"
					>
						Refresh
					</button>
				) : null}
			</CardHeader>
			<CardContent>{props.children}</CardContent>
		</Card>
	);
}

