import { redirect } from 'next/navigation';

import { AppShell } from '@bac/ui';

import { platformQuickActions, platformWorkspaceOptions } from '@/features/data';
import { navigation } from '@/lib/navigation';
import { getServerSession } from '@/lib/session';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <AppShell
      navigation={navigation}
      productName="Platform Automation Web"
      productTagline="Global control plane surface for regions, promises, GitOps, policy, identity, and incident response."
      quickActions={platformQuickActions}
      session={session}
      workspaceOptions={platformWorkspaceOptions}
    >
      {children}
    </AppShell>
  );
}
