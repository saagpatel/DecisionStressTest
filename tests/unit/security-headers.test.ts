import { describe, expect, test } from "vitest";

import nextConfig from "../../next.config";
import { baseSecurityHeaders, privatePageHeaders, securityHeadersObject } from "@/lib/security/headers";

describe("security headers", () => {
  test("exposes the expected security header map", () => {
    expect(securityHeadersObject()).toEqual({
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
      "Cross-Origin-Opener-Policy": "same-origin",
    });
  });

  test("applies base security headers app-wide through next config", async () => {
    const headers = await nextConfig.headers?.();

    expect(headers?.[0]?.source).toBe("/");
    expect(headers?.[0]?.headers).toEqual(privatePageHeaders);
    expect(headers?.[1]?.source).toBe("/decisions");
    expect(headers?.[1]?.headers).toEqual(privatePageHeaders);
    expect(headers?.[2]?.source).toBe("/decisions/:path*");
    expect(headers?.[2]?.headers).toEqual(privatePageHeaders);
    expect(headers?.[3]?.source).toBe("/:path*");
    expect(headers?.[3]?.headers).toEqual(baseSecurityHeaders);
  });
});
