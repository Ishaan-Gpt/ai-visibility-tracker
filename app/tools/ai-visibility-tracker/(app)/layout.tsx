import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AppHeader from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/tools/ai-visibility-tracker/login");
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <AppHeader email={user.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
