import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

// Manual validation (no extra validation library) — the request body is small
// and beginner-readable checks are clearer than a schema DSL for three fields.
export function validateAnalyzeRequest(req: Request, _res: Response, next: NextFunction) {
  const { location, businessCategory, availableMarginCapital } = req.body ?? {};

  if (typeof location !== "string" || location.trim().length === 0) {
    return next(new AppError("\"location\" is required and must be a non-empty string.", 400));
  }

  if (typeof businessCategory !== "string" || businessCategory.trim().length === 0) {
    return next(
      new AppError("\"businessCategory\" is required and must be a non-empty string.", 400)
    );
  }

  if (
    typeof availableMarginCapital !== "number" ||
    !Number.isFinite(availableMarginCapital) ||
    availableMarginCapital <= 0
  ) {
    return next(
      new AppError("\"availableMarginCapital\" is required and must be a positive number.", 400)
    );
  }

  next();
}
