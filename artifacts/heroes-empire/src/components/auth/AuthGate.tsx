import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetAuthSession } from "@workspace/api-client-react";
import { Zap } from "lucide-react";

type HealthState =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok" }
  | { status: "fail"; httpStatus: number | null; url: string };

async function probeApiHealth(): Promise<HealthState> {
  const url = `${import.meta.env.BASE_URL}api/healthz`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (res.ok) {
      console.info("[AuthGate] health probe ok", { url, status: res.status });
      return { status: "ok" };
    }
    console.warn("[AuthGate] health probe non-2xx", {
      url,
      status: res.status,
    });
    return { status: "fail", httpStatus: res.status, url };
  } catch (err) {
    console.error("[AuthGate] health probe network failure", { url, err });
    return { status: "fail", httpStatus: null, url };
  }
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { data, isLoading, isError, error, refetch } = useGetAuthSession();
  const [, navigate] = useLocation();
  const [health, setHealth] = useState<HealthState>({ status: "idle" });

  useEffect(() => {
    if (!isLoading && !isError && data && !data.authenticated) {
      navigate("/login", { replace: true });
    }
  }, [data, isLoading, isError, navigate]);

  useEffect(() => {
    if (isError) {
      const status =
        (error as { status?: number } | null | undefined)?.status ?? null;
      const url = `${import.meta.env.BASE_URL}api/auth/me`;
      console.error("[AuthGate] auth session fetch failed", {
        url,
        status,
        error,
      });
      setHealth({ status: "checking" });
      probeApiHealth().then(setHealth);
    } else {
      setHealth({ status: "idle" });
    }
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-primary font-mono">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 animate-pulse" />
          <span className="tracking-widest text-sm">LOADING_OPERATIVE…</span>
        </div>
      </div>
    );
  }

  if (isError) {
    const httpStatus =
      (error as { status?: number } | null | undefined)?.status ?? null;
    const reachable = health.status === "ok";
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-destructive font-mono p-6 text-center">
        <div className="max-w-md">
          <div className="text-sm tracking-widest mb-2">
            {reachable ? "AUTH_ERROR" : "CONNECTION_LOST"}
          </div>
          <div className="text-xs text-muted-foreground mb-4">
            {reachable
              ? `Server is reachable but /api/auth/me returned ${httpStatus ?? "an error"}. Check API logs.`
              : "Could not reach the server. Check the API workflow logs."}
          </div>
          <button
            type="button"
            onClick={() => {
              setHealth({ status: "checking" });
              refetch();
            }}
            className="text-xs tracking-widest px-3 py-1 border border-destructive hover:bg-destructive hover:text-background transition-colors"
          >
            RETRY
          </button>
          {health.status === "checking" ? (
            <div className="mt-2 text-[10px] text-muted-foreground tracking-widest">
              PROBING_HEALTH…
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (!data?.authenticated) {
    // Effect will navigate. Render nothing in the meantime.
    return null;
  }

  return <>{children}</>;
}
