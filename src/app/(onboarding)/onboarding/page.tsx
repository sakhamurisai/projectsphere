"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Rocket,
  CheckCircle2,
  X,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// ── Schemas ──────────────────────────────────────────────────────────────────
const orgSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  description: z.string().max(200).optional(),
  slug: z
    .string()
    .min(2)
    .max(30)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
});

type OrgFormValues = z.infer<typeof orgSchema>;

const STEPS = [
  { id: 1, label: "Organization", icon: Building2, description: "Set up your organization" },
  { id: 2, label: "Invite Team", icon: Users, description: "Bring your team on board" },
  { id: 3, label: "Done", icon: Rocket, description: "You're all set!" },
];

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isDone = current > step.id;
        const isActive = current === step.id;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                  isDone
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-muted/30 text-muted-foreground"
                }`}
              >
                {isDone ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={`text-xs font-medium ${
                  isActive ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`h-0.5 w-16 mx-2 mb-4 transition-all ${
                  current > step.id ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [step, setStep] = useState(1);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteEmails, setInviteEmails] = useState<{ email: string; role: "admin" | "member" | "viewer" }[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState<"admin" | "member" | "viewer">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrgFormValues>({
    resolver: zodResolver(orgSchema),
    defaultValues: { name: "", description: "", slug: "" },
  });

  const nameValue = watch("name");

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 30);
    setValue("slug", slug, { shouldValidate: true });
  };

  const handleOrgSubmit = async (data: OrgFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message ?? "Failed to create workspace");
      setWorkspaceId(json.data.id);
      setWorkspaceName(json.data.name);
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create workspace");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes("@")) return;
    if (inviteEmails.some((e) => e.email === email)) return;
    setInviteEmails((prev) => [...prev, { email, role: roleInput }]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e.email !== email));
  };

  const handleSendInvites = async () => {
    if (!workspaceId) return;
    try {
      setIsSubmitting(true);
      await Promise.allSettled(
        inviteEmails.map((invite) =>
          fetch(`/api/workspaces/${workspaceId}/invitations`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: invite.email, role: invite.role }),
          })
        )
      );
      setStep(3);
    } catch {
      toast.error("Some invitations failed to send");
      setStep(3);
    } finally {
      setIsSubmitting(false);
    }
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-2">
      <StepIndicator current={step} />

      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        {/* Step 1 — Create Org */}
        {step === 1 && (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Set up your organization</h1>
              <p className="text-muted-foreground mt-1">
                Hey {firstName}! Let's create your first workspace. This is where your team will collaborate.
              </p>
            </div>

            <form onSubmit={handleSubmit(handleOrgSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Organization name *</Label>
                <Input
                  id="name"
                  placeholder="Acme Corp"
                  className="h-11"
                  {...register("name", {
                    onChange: handleNameChange,
                  })}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">projectsphere.app/</span>
                  <Input
                    id="slug"
                    placeholder="acme-corp"
                    className="h-11 font-mono"
                    {...register("slug")}
                    aria-invalid={!!errors.slug}
                  />
                </div>
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What does your organization do?"
                  rows={3}
                  {...register("description")}
                />
              </div>

              <Button type="submit" className="h-11 w-full text-base font-semibold" disabled={isSubmitting}>
                {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                Create Organization
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>
        )}

        {/* Step 2 — Invite Team */}
        {step === 2 && (
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold">Invite your team</h1>
              <p className="text-muted-foreground mt-1">
                Add teammates to <strong>{workspaceName}</strong>. They'll receive an email invitation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="colleague@company.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="h-10 flex-1"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail())}
                />
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value as typeof roleInput)}
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <Button type="button" variant="outline" onClick={addEmail} className="h-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {inviteEmails.length > 0 && (
                <div className="rounded-lg border divide-y">
                  {inviteEmails.map((invite) => (
                    <div key={invite.email} className="flex items-center justify-between px-4 py-2.5">
                      <span className="text-sm">{invite.email}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                          {invite.role}
                        </Badge>
                        <button
                          onClick={() => removeEmail(invite.email)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                  Skip for now
                </Button>
                <Button
                  className="flex-1 font-semibold"
                  onClick={handleSendInvites}
                  disabled={isSubmitting || inviteEmails.length === 0}
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  Send {inviteEmails.length > 0 ? `${inviteEmails.length} ` : ""}Invite
                  {inviteEmails.length !== 1 ? "s" : ""}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="p-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
              <Rocket className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold">You're all set! 🎉</h1>
            <p className="mt-3 text-muted-foreground">
              <strong>{workspaceName}</strong> is ready. Start creating projects and managing tasks with your team.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4 text-left">
              {[
                { title: "Create a project", desc: "Organize tasks into projects with Kanban boards", href: workspaceId ? `/dashboard/workspaces/${workspaceId}/projects/new` : "/" },
                { title: "Explore the board", desc: "Drag & drop tasks across status columns", href: workspaceId ? `/dashboard/workspaces/${workspaceId}` : "/" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border p-4">
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              ))}
            </div>

            <Button
              className="mt-8 h-11 px-8 text-base font-semibold"
              onClick={() =>
                router.push(workspaceId ? `/dashboard/workspaces/${workspaceId}` : "/dashboard")
              }
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
