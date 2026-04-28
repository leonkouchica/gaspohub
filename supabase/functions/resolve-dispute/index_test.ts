import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { fnUrl, anonKey } from "../_shared/escrow.ts";

Deno.test("resolve-dispute: 401 without Authorization header", async () => {
  const res = await fetch(fnUrl("resolve-dispute"), {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: anonKey() },
    body: JSON.stringify({ disputeId: "00000000-0000-0000-0000-000000000000", resolution: "close_no_action" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Unauthorized");
});

Deno.test("resolve-dispute: 401 with invalid bearer", async () => {
  const res = await fetch(fnUrl("resolve-dispute"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey(),
      Authorization: "Bearer not-a-real-token",
    },
    body: JSON.stringify({ disputeId: "00000000-0000-0000-0000-000000000000", resolution: "close_no_action" }),
  });
  const body = await res.json();
  assertEquals(res.status, 401);
  assertEquals(body.error, "Invalid token");
});

Deno.test("resolve-dispute: non-admin caller is denied", async () => {
  const res = await fetch(fnUrl("resolve-dispute"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey(),
      Authorization: `Bearer ${anonKey()}`,
    },
    body: JSON.stringify({ disputeId: "00000000-0000-0000-0000-000000000000", resolution: "close_no_action" }),
  });
  const body = await res.json();
  assert(res.status === 401 || res.status === 403, `expected 401/403 got ${res.status}`);
  assert(typeof body.error === "string");
});

Deno.test("resolve-dispute: handles CORS preflight", async () => {
  const res = await fetch(fnUrl("resolve-dispute"), {
    method: "OPTIONS",
    headers: { apikey: anonKey() },
  });
  await res.text();
  assert(res.status === 200 || res.status === 204);
});