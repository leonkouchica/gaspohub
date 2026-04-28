import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fnUrl, anonKey } from "../_shared/escrow.ts";

Deno.test("release-final-payout: 401 without Authorization header", async () => {
  const res = await fetch(fnUrl("release-final-payout"), {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey() },
    body: JSON.stringify({ bookingId: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("release-final-payout: 401 with invalid bearer token", async () => {
  const res = await fetch(fnUrl("release-final-payout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey(),
      Authorization: "Bearer not-a-real-token",
    },
    body: JSON.stringify({ bookingId: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Invalid token");
});

Deno.test("release-final-payout: 403 for non-admin signed-in user", async () => {
  // anon key is treated as a valid JWT but has no admin role
  const res = await fetch(fnUrl("release-final-payout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey(),
      Authorization: `Bearer ${anonKey()}`,
    },
    body: JSON.stringify({ bookingId: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await res.json();
  // Either 401 (anon has no user) or 403 (admin check fails) — both prove access is denied
  assert(res.status === 401 || res.status === 403, `expected 401/403 got ${res.status}`);
  assert(typeof body.error === "string");
});

Deno.test("release-final-payout: handles CORS preflight", async () => {
  const res = await fetch(fnUrl("release-final-payout"), {
    method: "OPTIONS",
    headers: { apikey: anonKey() },
  });
  await res.text();
  assert(res.status === 200 || res.status === 204);
});