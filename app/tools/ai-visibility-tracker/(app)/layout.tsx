import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/tools/ai-visibility-tracker/login");
  }

  return <div className="min-h-screen bg-[#FAF9F6]">{children}</div>;
}
