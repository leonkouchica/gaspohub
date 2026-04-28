import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert, assertAlmostEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeEscrow, fnUrl, anonKey } from "../_shared/escrow.ts";

Deno.test("escrow math: 60/40 split with 10% commission", () => {
  const r = computeEscrow(1000, 10);
  assertEquals(r.initialRelease, 600);
  assertEquals(r.heldAmount, 400);
  assertEquals(r.commissionAmount, 100);
  assertEquals(r.finalRelease, 300);
  assertAlmostEquals(r.initialRelease + r.heldAmount, r.totalAmount);
});

Deno.test("escrow math: 15% commission default uses booking rate", () => {
  const r = computeEscrow(500, 15);
  assertEquals(r.commissionAmount, 75);
  assertEquals(r.heldAmount, 200);
  assertEquals(r.finalRelease, 125);
});

Deno.test("escrow math: zero amount yields zeros", () => {
  const r = computeEscrow(0, 10);
  assertEquals(r.initialRelease, 0);
  assertEquals(r.heldAmount, 0);
  assertEquals(r.finalRelease, 0);
});

Deno.test("escrow math: fractional rounding stays consistent", () => {
  const r = computeEscrow(123.45, 10);
  assertAlmostEquals(r.initialRelease + r.heldAmount, 123.45, 1e-9);
  assertAlmostEquals(r.finalRelease + r.commissionAmount, r.heldAmount, 1e-9);
});

Deno.test("process-booking-payment: rejects missing fields with 400", async () => {
  const res = await fetch(fnUrl("process-booking-payment"), {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey() },
    body: JSON.stringify({}),
  });
  const body = await res.json();
  assertEquals(res.status, 400);
  assert(typeof body.error === "string");
  assert(body.error.toLowerCase().includes("missing"));
});

Deno.test("process-booking-payment: returns 404 for unknown booking", async () => {
  const res = await fetch(fnUrl("process-booking-payment"), {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey() },
    body: JSON.stringify({
      bookingId: "00000000-0000-0000-0000-000000000000",
      amount: 100,
      currency: "USD",
      gateway: "stripe",
      customerEmail: "test@example.com",
    }),
  });
  const body = await res.json();
  assertEquals(res.status, 404);
  assertEquals(body.error, "Booking not found");
});

Deno.test("process-booking-payment: handles CORS preflight", async () => {
  const res = await fetch(fnUrl("process-booking-payment"), {
    method: "OPTIONS",
    headers: { apikey: anonKey() },
  });
  await res.text();
  assert(res.status === 200 || res.status === 204);
  assertEquals(res.headers.get("access-control-allow-origin"), "*");
});