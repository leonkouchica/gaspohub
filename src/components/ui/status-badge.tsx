import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        info: "bg-info/10 text-info border-info/20",
        destructive: "bg-destructive/10 text-destructive border-destructive/20",
        default: "bg-muted text-muted-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {}

export function StatusBadge({ className, variant, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props} />
  );
}

// Helper function to map status strings to variants
export const getStatusVariant = (status: string): StatusBadgeProps["variant"] => {
  const statusMap: Record<string, StatusBadgeProps["variant"]> = {
    confirmed: "success",
    completed: "info",
    paid: "success",
    pending: "warning",
    cancelled: "destructive",
    failed: "destructive",
  };
  return statusMap[status.toLowerCase()] || "default";
};
