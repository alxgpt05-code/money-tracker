export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 space-y-2">
      <p className="text-xs uppercase tracking-[0.28em] text-primary/80">{eyebrow}</p>
      <div className="space-y-1">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
