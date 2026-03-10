import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  parentTaskId: z.string().optional(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z.string().max(5000, "Description must be less than 5000 characters").optional(),
  status: z.enum(["todo", "in_progress", "in_review", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  labels: z.array(z.string()).optional(),
  order: z.number().optional(),
});

export const reorderTaskSchema = z.object({
  status: z.enum(["todo", "in_progress", "in_review", "done"]),
  order: z.number().min(0),
});

export const createSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
});

export const updateSubtaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  completed: z.boolean().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type UpdateSubtaskInput = z.infer<typeof updateSubtaskSchema>;
