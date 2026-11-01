"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api, ApiRequestError, type SessionArea } from "./api-client";
import type { SessionInfo } from "./types";

/** Loads the session for a layout and redirects when it belongs to another area or is missing. */
export function useSession(area: SessionArea) {
  const router = useRouter();
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    let active = true;
    api.session
      .me(area)
      .then((s) => {
        if (!active) return;
        if (s.user.must_change_password) return router.replace("/redefinir-senha");
        const isFirm = s.user.role === "firm_user";
        if (area === "staff" && isFirm) return router.replace("/portal/cases");
        if (area === "firm" && !isFirm) return router.replace("/admin/cases");
        setSession(s);
      })
      .catch((error) => {
        if (!active) return;
        if (error instanceof ApiRequestError && error.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        }
      });
    return () => {
      active = false;
    };
  }, [area, router]);

  const signout = useCallback(async () => {
    await api.session.signout().catch(() => undefined);
    router.push("/login");
  }, [router]);

  return { session, signout };
}

export function useApiStatus() {
  const [status, setStatus] = useState<"checking" | "ok" | "down">(api.useMockData ? "ok" : "checking");

  useEffect(() => {
    if (api.useMockData) return;
    let active = true;
    api
      .health()
      .then(() => active && setStatus("ok"))
      .catch(() => active && setStatus("down"));
    return () => {
      active = false;
    };
  }, []);

  return status;
}
