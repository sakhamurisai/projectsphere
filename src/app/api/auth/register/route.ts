import { NextRequest } from "next/server";
import { signUp } from "@/lib/auth/cognito";
import { signUpSchema } from "@/validations/auth";
import { successResponse, errorResponse } from "@/lib/api/response";
import { BadRequestError } from "@/lib/api/errors";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = signUpSchema.parse(body);

    const { userSub } = await signUp(
      validatedData.email,
      validatedData.password,
      validatedData.name
    );

    return successResponse({
      message: "Registration successful. Please check your email for verification code.",
      email: validatedData.email,
      userSub,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      switch (error.name) {
        case "UsernameExistsException":
          return errorResponse(new BadRequestError("An account with this email already exists"));
        case "InvalidPasswordException":
          return errorResponse(new BadRequestError("Password does not meet requirements"));
        case "InvalidParameterException":
          return errorResponse(new BadRequestError("Invalid registration details"));
        case "TooManyRequestsException":
          return errorResponse(new BadRequestError("Too many requests. Please try again later."));
      }
    }
    return errorResponse(error);
  }
}
