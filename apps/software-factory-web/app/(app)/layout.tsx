import { redirect } from 'next/navigation';

import { AppShell } from '@bac/ui';

import { softwareFactoryQuickActions, softwareFactoryWorkspaceOptions } from '@/features/data';
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
      productName="Software Factory Web"
      productTagline="Enterprise delivery surface for PRDs, architecture, contracts, builds, releases, and audit."
      quickActions={softwareFactoryQuickActions}
      session={session}
      workspaceOptions={softwareFactoryWorkspaceOptions}
    >
      {children}
    </AppShell>
  );
}
