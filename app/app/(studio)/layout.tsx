import { AppShell } from "@/components/app/AppShell";
import { getAccount } from "@/lib/app-context";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAccount();
  return (
    <AppShell email={ctx.user.email} planLabel={ctx.planLabel} isPaid={ctx.isPaid}>
      {children}
    </AppShell>
  );
}
