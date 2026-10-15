import { AppShell } from "@/components/app/AppShell";
import { getAccount } from "@/lib/app-context";
import { featureStates } from "@/lib/features";

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getAccount();
  // Only the launch flags reach the client; the operator-facing reasons stay on the server.
  const features = featureStates().map((f) => ({ ...f, reason: null }));
  return (
    <AppShell email={ctx.user.email} planLabel={ctx.planLabel} isPaid={ctx.isPaid} features={features}>
      {children}
    </AppShell>
  );
}
