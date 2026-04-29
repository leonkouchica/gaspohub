import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  validateResolvePayload,
  canTransitionDisputeStatus,
  isTerminalStatus,
  VALID_RESOLUTIONS,
} from "../_shared/dispute-resolution.ts";

const DISPUTE_ID = "00000000-0000-0000-0000-000000000001";

// ---------- invalid resolution values ----------

Deno.test("validate: missing disputeId or resolution -> missing_fields", () => {
  assertEquals(
    validateResolvePayload({ resolution: "refund_full" })?.code,
    "missing_fields",
  );
  assertEquals(
    validateResolvePayload({ disputeId: DISPUTE_ID })?.code,
    "missing_fields",
  );
});

Deno.test("validate: unknown resolution string is rejected", () => {
  for (const bad of ["", "approve", "refund", "RELEASE", "refund_full ", "null", "undefined"]) {
    const err = validateResolvePayload({ disputeId: DISPUTE_ID, resolution: bad });
    assertEquals(err?.code, bad === "" ? "missing_fields" : "unknown_resolution", `value: ${bad}`);
  }
});

Deno.test("validate: every VALID_RESOLUTIONS value passes the type gate", () => {
  for (const r of VALID_RESOLUTIONS) {
    const err = validateResolvePayload({
      disputeId: DISPUTE_ID,
      resolution: r,
      resolutionAmount: r === "refund_partial" ? 50 : undefined,
      total: 100,
      currentStatus: "open",
    });
    assertEquals(err, null, `expected ${r} to validate`);
  }
});

Deno.test("validate: refund_partial requires positive amount within total", () => {
  // zero / negative
  for (const amt of [0, -1, -1000]) {
    assertEquals(
      validateResolvePayload({
        disputeId: DISPUTE_ID,
        resolution: "refund_partial",
        resolutionAmount: amt,
        total: 200,
        currentStatus: "open",
      })?.code,
      "invalid_partial_amount",
    );
  }
  // amount exceeds booking total
  assertEquals(
    validateResolvePayload({
      disputeId: DISPUTE_ID,
      resolution: "refund_partial",
      resolutionAmount: 250,
      total: 200,
      currentStatus: "open",
    })?.code,
    "invalid_partial_amount",
  );
  // boundary: equal to total is allowed
  assertEquals(
    validateResolvePayload({
      disputeId: DISPUTE_ID,
      resolution: "refund_partial",
      resolutionAmount: 200,
      total: 200,
      currentStatus: "open",
    }),
    null,
  );
});

// ---------- terminal-status / no-reopen invariants ----------

Deno.test("validate: already-resolved disputes are rejected at the API edge", () => {
  for (const s of ["resolved_refund", "resolved_release", "resolved_partial", "closed"] as const) {
    assertEquals(
      validateResolvePayload({
        disputeId: DISPUTE_ID,
        resolution: "close_no_action",
        currentStatus: s,
      })?.code,
      "already_resolved",
      `status: ${s}`,
    );
  }
});

Deno.test("isTerminalStatus: matches resolution table", () => {
  assertEquals(isTerminalStatus("open"), false);
  assertEquals(isTerminalStatus("under_review"), false);
  assertEquals(isTerminalStatus("resolved_refund"), true);
  assertEquals(isTerminalStatus("resolved_release"), true);
  assertEquals(isTerminalStatus("resolved_partial"), true);
  assertEquals(isTerminalStatus("closed"), true);
});

Deno.test("transition: terminal status cannot move back to 'open'", () => {
  for (const from of ["resolved_refund", "resolved_release", "resolved_partial", "closed"] as const) {
    const result = canTransitionDisputeStatus(from, "open");
    assertEquals(result === true, false, `expected ${from}->open to be blocked`);
    if (result !== true && result.code === "cannot_reopen") {
      assertEquals(result.from, from);
      assertEquals(result.to, "open");
    }
  }
});

Deno.test("transition: terminal status cannot move back to 'under_review'", () => {
  for (const from of ["resolved_refund", "resolved_release", "resolved_partial", "closed"] as const) {
    const result = canTransitionDisputeStatus(from, "under_review");
    assertEquals(result === true, false, `expected ${from}->under_review to be blocked`);
  }
});

Deno.test("transition: active->terminal is allowed", () => {
  for (const from of ["open", "under_review"] as const) {
    for (const to of ["resolved_refund", "resolved_release", "resolved_partial", "closed"] as const) {
      assertEquals(canTransitionDisputeStatus(from, to), true, `${from}->${to}`);
    }
  }
});

Deno.test("transition: open<->under_review (active churn) is allowed", () => {
  assertEquals(canTransitionDisputeStatus("open", "under_review"), true);
  assertEquals(canTransitionDisputeStatus("under_review", "open"), true);
});

Deno.test("transition: terminal->terminal stays terminal (no-op overwrite blocked at upper layer, not here)", () => {
  // The transition guard only protects against re-opening; switching between
  // terminal states is permitted by this pure helper because the edge function
  // already rejects any update to an already-resolved dispute via 'already_resolved'.
  assertEquals(canTransitionDisputeStatus("closed", "resolved_refund"), true);
  assertEquals(canTransitionDisputeStatus("resolved_partial", "closed"), true);
});
