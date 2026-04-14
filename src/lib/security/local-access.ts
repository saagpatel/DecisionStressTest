import { headers } from "next/headers";
import { forbidden } from "next/navigation";

import { env } from "@/lib/config/env";

export function isLocalHost(value: string | null) {
  if (!value) {
    return false;
  }

  return /^(127\.0\.0\.1|localhost|\[::1\])(?::\d+)?$/i.test(value);
}

export function isAllowedLocalRequest(params: { host: string | null; origin: string | null }) {
  if (!isLocalHost(params.host)) {
    return false;
  }

  if (!params.origin) {
    return true;
  }

  try {
    const parsedOrigin = new URL(params.origin);
    return isLocalHost(parsedOrigin.host);
  } catch {
    return false;
  }
}

export async function assertLocalRequest() {
  if (env.UNSAFE_ALLOW_NONLOCALHOST) {
    return;
  }

  const headerStore = await headers();
  const host = headerStore.get("host");
  const origin = headerStore.get("origin");

  if (!isAllowedLocalRequest({ host, origin })) {
    forbidden();
  }
}
