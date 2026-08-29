export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

// AUTH DISABLED: fine-tuning is open to everyone, so no session or bearer token is
// required. Importing the Auth0 helper here also constructed an Auth0 client at
// module load, which logged missing-config warnings on every build and request.
// import { getSessionAndToken } from "@/lib/auth0-api";

const FINETUNE_API_BASE_URL = process.env.NEXT_PUBLIC_FINETUNE_API_BASE_URL;
// const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

interface ErrorDataShape {
  message?: string;
  error?: string;
  details?: unknown;
}

async function evaluateHandler(
  req: Request,
  _ctx: { params: Promise<Record<string, string | string[]>> }
) {
  try {
    if (!FINETUNE_API_BASE_URL) {
      logger.error("NEXT_PUBLIC_FINETUNE_API_BASE_URL is not configured");
      return new Response(
        JSON.stringify({
          error: "Fine-tune API is not configured",
          message: "Set NEXT_PUBLIC_FINETUNE_API_BASE_URL to enable fine-tuning",
          status: 503,
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const FINETUNE_API_URL = `${FINETUNE_API_BASE_URL}/api/v1/internal/evaluate`;

    // AUTH DISABLED: access-token gate removed.
    // const tokenRes = new NextResponse();
    // const result = await getSessionAndToken(req, tokenRes, AUTH0_AUDIENCE ?? undefined);
    // if (!result) {
    //   return new Response(
    //     JSON.stringify({
    //       error: "Unauthorized - No access token",
    //       message: "Authentication required",
    //       status: 401,
    //     }),
    //     { status: 401, headers: { "Content-Type": "application/json" } }
    //   );
    // }

    let body: unknown;
    try {
      body = await req.json();
    } catch (parseError) {
      logger.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON body",
          message: "The request body must be valid JSON",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const requestBody = body as Record<string, unknown>;

    const evaluateResponse = await fetch(FINETUNE_API_URL, {
      method: "POST",
      headers: {
        // Authorization: `Bearer ${result.token}`,
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });

   

    // Handle different response statuses
    if (evaluateResponse.status === 401) {
      return new Response(
        JSON.stringify({ 
          error: "Unauthorized - Invalid or expired token",
          message: "Authentication required",
          status: 401 
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (evaluateResponse.status === 402) {
      let errorData: ErrorDataShape = {};
      try {
        const contentType = evaluateResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await evaluateResponse.json();
        } else {
          const text = await evaluateResponse.text();
          errorData = { message: text || "Insufficient credits" };
        }
      } catch {
        errorData = { message: "Insufficient credits" };
      }
      return new Response(
        JSON.stringify({ 
          error: "INSUFFICIENT_CREDITS",
          message: errorData.message || "Insufficient credits",
          status: 402 
        }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    if (evaluateResponse.status === 403) {
      return new Response(
        JSON.stringify({ 
          error: "FORBIDDEN",
          message: "You don't have permission to access this resource",
          status: 403 
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (evaluateResponse.status === 404) {
      return new Response(
        JSON.stringify({ 
          error: "NOT_FOUND",
          message: "Resource not found",
          status: 404 
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (evaluateResponse.status === 422) {
      let errorData: ErrorDataShape = {};
      try {
        const contentType = evaluateResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await evaluateResponse.json();
        } else {
          const text = await evaluateResponse.text();
          errorData = { message: text || "Validation failed" };
        }
      } catch {
        errorData = { message: "Validation failed" };
      }
      return new Response(
        JSON.stringify({ 
          error: "VALIDATION_ERROR",
          message: errorData.message || "Validation failed",
          details: errorData.details || [],
          status: 422 
        }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    if (evaluateResponse.status === 400) {
      let errorData: ErrorDataShape = {};
      try {
        const contentType = evaluateResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorData = await evaluateResponse.json();
        } else {
          const text = await evaluateResponse.text();
          errorData = { error: text || "ValidationError: The request contains invalid or missing parameters.", message: text || "Invalid request" };
        }
      } catch {
        errorData = { error: "ValidationError: The request contains invalid or missing parameters.", message: "Invalid request" };
      }
      
      
      
      return new Response(
        JSON.stringify({ 
          error: errorData.error || "ValidationError: The request contains invalid or missing parameters.",
          message: errorData.message || "Invalid request",
          details: errorData.details || {},
          status: 400 
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!evaluateResponse.ok) {
      let errorText = "";
      try {
        const contentType = evaluateResponse.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await evaluateResponse.json();
          errorText = errorData.message || errorData.error || JSON.stringify(errorData);
        } else {
          errorText = await evaluateResponse.text();
        }
      } catch {
        errorText = `HTTP ${evaluateResponse.status} error`;
      }
      logger.error(`Fine-tune API error (${evaluateResponse.status}):`, errorText);
      return new Response(
        JSON.stringify({ 
          error: `Fine-tune API error: ${errorText}`,
          message: errorText,
          status: evaluateResponse.status 
        }),
        { 
          status: evaluateResponse.status, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    let responseData: unknown;
    try {
      const contentType = evaluateResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        responseData = await evaluateResponse.json();
      } else {
        const text = await evaluateResponse.text();
        responseData = text ? JSON.parse(text) : {};
      }
    } catch (err) {
      logger.error("Failed to parse success response:", err);
      return new Response(
        JSON.stringify({ 
          error: "Failed to parse response from fine-tune API",
          status: 500 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return NextResponse.json(responseData);
  } catch (error) {
    logger.error("Error in fine-tune evaluate API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred", status: 500 },
      { status: 500 }
    );
  }
}

export const POST = evaluateHandler;
