import { describe, expect, test } from "vitest";

import { isAllowedLocalRequest, isLocalHost } from "@/lib/security/local-access";

describe("local access guard", () => {
  test("accepts localhost host headers", () => {
    expect(isLocalHost("127.0.0.1:3000")).toBe(true);
    expect(isLocalHost("localhost:3000")).toBe(true);
    expect(isLocalHost("[::1]:3000")).toBe(true);
  });

  test("rejects non-local host headers", () => {
    expect(isLocalHost("example.com")).toBe(false);
    expect(isLocalHost("192.168.1.10:3000")).toBe(false);
    expect(isLocalHost(null)).toBe(false);
  });

  test("accepts local requests with no origin or local origin", () => {
    expect(
      isAllowedLocalRequest({
        host: "127.0.0.1:3000",
        origin: null,
      }),
    ).toBe(true);

    expect(
      isAllowedLocalRequest({
        host: "localhost:3000",
        origin: "http://127.0.0.1:3000",
      }),
    ).toBe(true);
  });

  test("rejects requests with non-local or malformed origins", () => {
    expect(
      isAllowedLocalRequest({
        host: "127.0.0.1:3000",
        origin: "https://example.com",
      }),
    ).toBe(false);

    expect(
      isAllowedLocalRequest({
        host: "127.0.0.1:3000",
        origin: "not-a-valid-origin",
      }),
    ).toBe(false);
  });
});
