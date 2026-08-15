import { describe, expect, it } from "vitest";
import { createCustomerSchema, toCreateCustomerRequest } from "../create-customer-schema";

describe("createCustomerSchema - code", () => {
  it("accepts a valid code and normalizes it to trimmed + uppercase", () => {
    const result = createCustomerSchema.safeParse({
      code: "  gst-mx  ",
      legalName: "GS Trackme S.A. de C.V.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.code).toBe("GST-MX");
    }
  });

  it("rejects an empty code with a required message", () => {
    const result = createCustomerSchema.safeParse({ code: "", legalName: "GS Trackme" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Code is required");
    }
  });

  it("rejects a code shorter than the backend's minimum (3 chars) - mirrors ^[A-Z0-9][A-Z0-9_-]{2,49}$", () => {
    const result = createCustomerSchema.safeParse({ code: "AB", legalName: "GS Trackme" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/3-50 characters/);
    }
  });

  it("rejects a code with characters outside [A-Z0-9_-]", () => {
    const result = createCustomerSchema.safeParse({ code: "GST.MX", legalName: "GS Trackme" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toMatch(/3-50 characters/);
    }
  });

  it("rejects a code starting with a hyphen or underscore", () => {
    const result = createCustomerSchema.safeParse({ code: "-GSTMX", legalName: "GS Trackme" });
    expect(result.success).toBe(false);
  });

  it("accepts a code at the 50-character maximum", () => {
    const code = "A" + "1".repeat(49);
    const result = createCustomerSchema.safeParse({ code, legalName: "GS Trackme" });
    expect(result.success).toBe(true);
  });
});

describe("toCreateCustomerRequest - tradeName normalization", () => {
  const base = { code: "GST-MX", legalName: "GS Trackme S.A. de C.V." };

  it("omits tradeName entirely when empty", () => {
    const request = toCreateCustomerRequest({ ...base, tradeName: "" });
    expect(request.tradeName).toBeUndefined();
    expect("tradeName" in JSON.parse(JSON.stringify(request))).toBe(false);
  });

  it("omits tradeName entirely when whitespace-only", () => {
    const parsed = createCustomerSchema.safeParse({ ...base, tradeName: "   " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      const request = toCreateCustomerRequest(parsed.data);
      expect(request.tradeName).toBeUndefined();
    }
  });

  it("keeps a normal tradeName value", () => {
    const request = toCreateCustomerRequest({ ...base, tradeName: "GS Trackme" });
    expect(request.tradeName).toBe("GS Trackme");
  });
});
