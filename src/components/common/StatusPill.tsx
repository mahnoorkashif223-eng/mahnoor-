import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: "invited" | "active" }) {
  const cls =
    status === "active"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20"
      : "bg-zinc-50 text-zinc-700 ring-zinc-200 dark:bg-zinc-500/10 dark:text-zinc-300 dark:ring-zinc-500/20";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        cls
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          status === "active" ? "bg-emerald-500" : "bg-zinc-400"
        )}
      />
      {status === "active" ? "Active" : "Invited"}
    </span>
  );
}
