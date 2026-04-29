// Pure helpers mirroring resolve-dispute/index.ts validation rules.
// Kept in sync with the edge function so unit tests can guard the
// "invalid resolution" and "no reopen" invariants.

export type Resolution =
  | "refund_full"
  | "refund_partial"
  | "release_to_photographer"
  | "close_no_action";

export const VALID_RESOLUTIONS: ReadonlySet<string> = new Set([
  "refund_full",
  "refund_partial",
  "release_to_photographer",
  "close_no_action",
]);

export type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved_refund"
  | "resolved_release"
  | "resolved_partial"
  | "closed";

export const TERMINAL_DISPUTE_STATUSES: ReadonlySet<DisputeStatus> = new Set([
  "resolved_refund",
  "resolved_release",
  "resolved_partial",
  "closed",
]);

export function isTerminalStatus(status: DisputeStatus): boolean {
  return TERMINAL_DISPUTE_STATUSES.has(status);
}

export type ValidationError =
  | { code: "missing_fields" }
  | { code: "unknown_resolution" }
  | { code: "invalid_partial_amount" }
  | { code: "already_resolved" }
  | { code: "cannot_reopen"; from: DisputeStatus; to: DisputeStatus };

export interface ValidateInput {
  disputeId?: string | null;
  resolution?: string | null;
  resolutionAmount?: number | null;
  total?: number;
  currentStatus?: DisputeStatus;
}

/** Validates a resolve-dispute payload. Returns null when valid. */
export function validateResolvePayload(input: ValidateInput): ValidationError | null {
  if (!input.disputeId || !input.resolution) return { code: "missing_fields" };
  if (!VALID_RESOLUTIONS.has(input.resolution)) return { code: "unknown_resolution" };

  if (input.currentStatus && isTerminalStatus(input.currentStatus)) {
    return { code: "already_resolved" };
  }

  if (input.resolution === "refund_partial") {
    const amt = Number(input.resolutionAmount ?? 0);
    const total = Number(input.total ?? 0);
    if (!(amt > 0) || amt > total) return { code: "invalid_partial_amount" };
  }

  return null;
}

/**
 * Guards status transitions on the dispute row. A dispute can move from
 * an active state (open / under_review) into any terminal state, but a
 * terminal dispute can never transition back to open or under_review.
 */
export function canTransitionDisputeStatus(
  from: DisputeStatus,
  to: DisputeStatus,
): true | ValidationError {
  if (from === to) return true;
  if (isTerminalStatus(from) && !isTerminalStatus(to)) {
    return { code: "cannot_reopen", from, to };
  }
  return true;
}
