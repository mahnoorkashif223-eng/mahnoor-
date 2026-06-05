interface Props {
  label: string;
  value: React.ReactNode;
}

export function InfoRow({ label, value }: Props) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
