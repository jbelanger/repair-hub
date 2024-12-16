import { cn } from "~/utils/cn";
import { Badge } from "./Badge";

type StatusType = 
  | "pending"
  | "in_progress"
  | "completed"
  | "accepted"
  | "refused"
  | "rejected"
  | "cancelled"
  | "active"
  | "inactive"
  | "expired";

type UrgencyType = 
  | "high"
  | "medium"
  | "low";

interface StatusBadgeProps {
  status: string;
  type?: "status" | "urgency";
  className?: string;
}

type StatusVariant = {
  variant: "warning" | "primary" | "success" | "danger" | "default";
  label: string;
};

const statusVariants: Record<StatusType, StatusVariant> = {
  pending: { variant: "warning", label: "Pending" },
  in_progress: { variant: "primary", label: "In Progress" },
  completed: { variant: "success", label: "Completed" },
  accepted: { variant: "success", label: "Accepted" },
  refused: { variant: "danger", label: "Refused" },
  rejected: { variant: "danger", label: "Rejected" },
  cancelled: { variant: "default", label: "Cancelled" },
  active: { variant: "success", label: "Active" },
  inactive: { variant: "default", label: "Inactive" },
  expired: { variant: "danger", label: "Expired" }
};

const urgencyVariants: Record<UrgencyType, StatusVariant> = {
  high: { variant: "danger", label: "High Priority" },
  medium: { variant: "warning", label: "Medium Priority" },
  low: { variant: "default", label: "Low Priority" }
};

export function StatusBadge({ status, type = "status", className }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, "_");
  
  let variant: StatusVariant["variant"] = "default";
  let label = status;

  if (type === "status" && normalizedStatus in statusVariants) {
    const statusConfig = statusVariants[normalizedStatus as StatusType];
    variant = statusConfig.variant;
    label = statusConfig.label;
  } else if (type === "urgency" && normalizedStatus in urgencyVariants) {
    const urgencyConfig = urgencyVariants[normalizedStatus as UrgencyType];
    variant = urgencyConfig.variant;
    label = urgencyConfig.label;
  }

  return (
    <Badge
      variant={variant}
      className={cn("capitalize", className)}
    >
      {label}
    </Badge>
  );
}

// Specialized variants for common use cases
export function RepairStatus({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} type="status" className={className} />;
}

export function RepairUrgency({ urgency, className }: { urgency: string; className?: string }) {
  return <StatusBadge status={urgency} type="urgency" className={className} />;
}

export function InvitationStatus({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} type="status" className={className} />;
}

export function TenantStatus({ status, className }: { status: string; className?: string }) {
  return <StatusBadge status={status} type="status" className={className} />;
}
