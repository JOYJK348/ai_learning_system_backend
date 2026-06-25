import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-server";

// Standard APIError class extending Error
export class APIError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode: number = 400, code: string = "BAD_REQUEST", details?: any) {
    super(message);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Log error asynchronously to Supabase error_logs table (non-blocking)
export async function logErrorToDb(params: {
  route: string;
  method: string;
  errorCode: string;
  message: string;
  stackTrace?: string;
  userId?: string;
}) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Use non-blocking promise call so it doesn't slow down client response
    supabaseAdmin
      .from("error_logs")
      .insert({
        route: params.route,
        method: params.method,
        error_code: params.errorCode,
        message: params.message,
        stack_trace: params.stackTrace || null,
        user_id: params.userId || null,
      })
      .then(({ error }) => {
        if (error) {
          console.error("[api-error] Failed to insert error log into Supabase:", error);
        }
      });
  } catch (logErr) {
    console.error("[api-error] Error in logging service:", logErr);
  }
}

// Standardized errorResponse formatter
export async function errorResponse(
  error: any,
  requestContext?: { route: string; method: string; userId?: string }
): Promise<NextResponse> {
  let message = "Something went wrong";
  let errorCode = "SERVER_ERROR";
  let statusCode = 500;
  let details: any = undefined;

  // 1. Identify error type
  if (error instanceof APIError) {
    message = error.message;
    errorCode = error.code;
    statusCode = error.statusCode;
    details = error.details;
  } else if (error?.code === "23505") {
    // PostgreSQL Unique Violation (Duplicate key)
    message = "Record already exists";
    errorCode = "DB_UNIQUE";
    statusCode = 409;
    details = error.detail;
  } else if (error?.message?.includes("JWT") || error?.message?.includes("expired")) {
    message = "Session expired. Please login again.";
    errorCode = "AUTH_EXPIRED";
    statusCode = 401;
  } else {
    // General/Unknown server error
    message = error instanceof Error ? error.message : String(error);
  }

  console.error(`[API Error] ${requestContext?.method || ""} ${requestContext?.route || ""}:`, error);

  // 2. Perform non-blocking database logging if context is available
  if (requestContext) {
    await logErrorToDb({
      route: requestContext.route,
      method: requestContext.method,
      errorCode,
      message,
      stackTrace: error instanceof Error ? error.stack : undefined,
      userId: requestContext.userId,
    });
  }

  // 3. Return JSON response matching standardized client schema
  return NextResponse.json(
    {
      error: message,
      code: errorCode,
      details,
    },
    { status: statusCode }
  );
}
