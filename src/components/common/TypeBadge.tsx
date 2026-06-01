import { cn } from "@/lib/utils";
import { GraduationCap, HeartHandshake, Briefcase } from "lucide-react";

const map = {
  school: {
    label: "School",
    icon: GraduationCap,
    cls: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  },
  nonprofit: {
    label: "Nonprofit",
    icon: HeartHandshake,
    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  },
  business: {
    label: "Business",
    icon: Briefcase,
    cls: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  },
} as const;

export function TypeBadge({ type }: { type: keyof typeof map }) {
  const { label, icon: Icon, cls } = map[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        cls
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
