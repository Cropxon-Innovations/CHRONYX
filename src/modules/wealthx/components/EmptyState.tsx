import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

export const EmptyState = ({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) => (
  <div className="rounded-2xl border border-dashed border-border bg-card/60 p-10 text-center">
    <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground">
      {icon ?? <Sparkles className="w-5 h-5" />}
    </div>
    <h3 className="text-base font-medium text-foreground">{title}</h3>
    {description && <p className="mt-1.5 max-w-md mx-auto text-sm text-muted-foreground">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
