// Pure predicate mirroring the SQL filter used in release-final-payout
// and transition-booking-status to lock progress while a dispute is active.
// Mirrors public.has_active_dispute(_booking_id).

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_refund"
  | "resolved_release"
  | "resolved_partial"
  | "closed";

const ACTIVE: ReadonlySet<DisputeStatus> = new Set(["open", "under_review"]);

export function isDisputeActive(status: DisputeStatus): boolean {
  return ACTIVE.has(status);
}

export function hasActiveDispute(disputes: { status: DisputeStatus }[]): boolean {
  return disputes.some((d) => isDisputeActive(d.status));
}

/** Returns the HTTP status the gated edge functions should emit when a dispute is active. */
export function gatedHttpStatus(disputes: { status: DisputeStatus }[]): 200 | 409 {
  return hasActiveDispute(disputes) ? 409 : 200;
}