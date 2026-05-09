import { describe, it, expect } from "vitest";
import { calcTax } from "./tax";

describe("tax", () => {
  it("calculates 20% VAT correctly", () => {
    const { tax, total } = calcTax(100, 20);
    expect(tax).toBe(20);
    expect(total).toBe(120);
  });
  it("handles zero rate", () => {
    const { tax, total } = calcTax(50, 0);
    expect(tax).toBe(0);
    expect(total).toBe(50);
  });
});