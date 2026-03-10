import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { isApiError, getErrorStatusCode, getErrorMessage, ValidationError } from "./errors";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    errors?: Record<string, string[]>;
  };
}

export function successResponse<T>(data: T, status: number = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status }
  );
}

export function errorResponse(error: unknown): NextResponse<ApiResponse> {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string[]> = {};
    error.issues.forEach((err) => {
      const path = err.path.map(String).join(".");
      if (!fieldErrors[path]) {
        fieldErrors[path] = [];
      }
      fieldErrors[path].push(err.message);
    });

    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Validation failed",
          code: "VALIDATION_ERROR",
          errors: fieldErrors,
        },
      },
      { status: 422 }
    );
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error.message,
          code: error.code,
          errors: error.errors,
        },
      },
      { status: error.statusCode }
    );
  }

  const statusCode = getErrorStatusCode(error);
  const message = getErrorMessage(error);
  const code = isApiError(error) ? error.code : undefined;

  return NextResponse.json(
    {
      success: false,
      error: {
        message,
        code,
      },
    },
    { status: statusCode }
  );
}

export function createdResponse<T>(data: T): NextResponse<ApiResponse<T>> {
  return successResponse(data, 201);
}

export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): NextResponse<
  ApiResponse<{
    items: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }>
> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return successResponse({
    items: data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasMore,
    },
  });
}
