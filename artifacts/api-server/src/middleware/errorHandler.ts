import type { ErrorRequestHandler, RequestHandler } from "express";

export const apiNotFoundHandler: RequestHandler = (_req, res, _next) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status =
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    typeof (err as { status: unknown }).status === "number"
      ? ((err as { status: number }).status as number)
      : 500;

  const message =
    err instanceof Error ? err.message : "Internal server error";

  req.log?.error?.(
    { err, status, url: req.url, method: req.method },
    "Unhandled error in request",
  );

  if (res.headersSent) {
    return;
  }
  res.status(status).json({
    error: status >= 500 ? "Internal server error" : message,
  });
};
