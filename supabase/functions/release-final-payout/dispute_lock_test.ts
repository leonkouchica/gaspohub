import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  hasActiveDispute,
  isDisputeActive,
  gatedHttpStatus,
} from "../_shared/dispute-lock.ts";

Deno.test("dispute-lock: 'open' is active", () => {
  assertEquals(isDisputeActive("open"), true);
});

Deno.test("dispute-lock: 'under_review' is active", () => {
  assertEquals(isDisputeActive("under_review"), true);
});

Deno.test("dispute-lock: resolved/closed statuses are NOT active", () => {
  assertEquals(isDisputeActive("resolved_refund"), false);
  assertEquals(isDisputeActive("resolved_release"), false);
  assertEquals(isDisputeActive("resolved_partial"), false);
  assertEquals(isDisputeActive("closed"), false);
});

Deno.test("dispute-lock: hasActiveDispute true if any dispute is open", () => {
  assertEquals(
    hasActiveDispute([{ status: "closed" }, { status: "open" }]),
    true,
  );
});

Deno.test("dispute-lock: hasActiveDispute false when all resolved", () => {
  assertEquals(
    hasActiveDispute([{ status: "resolved_refund" }, { status: "closed" }]),
    false,
  );
});

Deno.test("dispute-lock: gated endpoint returns 409 when active", () => {
  assertEquals(gatedHttpStatus([{ status: "under_review" }]), 409);
});

Deno.test("dispute-lock: gated endpoint returns 200 when none active", () => {
  assertEquals(gatedHttpStatus([]), 200);
  assertEquals(gatedHttpStatus([{ status: "closed" }]), 200);
});