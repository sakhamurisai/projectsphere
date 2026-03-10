import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  key: z
    .string()
    .min(2, "Key must be at least 2 characters")
    .max(10, "Key must be less than 10 characters")
    .regex(/^[A-Z0-9]+$/, "Key can only contain uppercase letters and numbers")
    .transform((val) => val.toUpperCase()),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["active", "archived"]).optional(),
});

export const addProjectMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["admin", "member", "viewer"], {
    error: "Please select a valid role",
  }),
});

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum(["admin", "member", "viewer"], {
    error: "Please select a valid role",
  }),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;
