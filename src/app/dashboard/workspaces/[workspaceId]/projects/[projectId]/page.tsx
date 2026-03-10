import { redirect } from "next/navigation";

interface ProjectPageProps {
  params: Promise<{ workspaceId: string; projectId: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { workspaceId, projectId } = await params;
  redirect(`/dashboard/workspaces/${workspaceId}/projects/${projectId}/board`);
}
