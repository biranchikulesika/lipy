"use client";

import type { ReactNode } from "react";

type InputModeShellProps = {
	children: ReactNode;
	helperText?: string | null;
	helperVisible?: boolean;
	actionRow: ReactNode;
	errorSlot?: ReactNode;
	className?: string;
};

export function InputModeShell({
	children,
	helperText = null,
	helperVisible = true,
	actionRow,
	errorSlot = null,
	className = "",
}: InputModeShellProps) {
	return (
		<div className={`flex h-full min-h-0 flex-col items-center justify-center gap-1 px-1 py-1 sm:px-2 ${className}`}>
			<div className="flex min-h-0 flex-1 items-center justify-center">{children}</div>

			{helperText ? (
				<div
					className={`mt-1 w-full max-w-[336px] transition-opacity duration-200 ${
						helperVisible ? "opacity-100" : "opacity-0"
					} mx-auto text-center`}
				>
					<p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{helperText}</p>
				</div>
			) : null}

			{errorSlot}

			{actionRow}
		</div>
	);
}