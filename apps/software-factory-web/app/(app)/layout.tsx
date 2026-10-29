import { redirect } from 'next/navigation';

import { AppShell } from '@bac/ui';

import {
  softwareFactoryQuickActions,
  softwareFactoryWorkspaceOptions,
} from '@/features/data';
import { navigation } from '@/lib/navigation';
import { getServerSession } from '@/lib/session';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <AppShell
      navigation={navigation}
      productName="FluxCore"
      productTagline="Create from an idea or engineer a project with the tools and depth you need."
      quickActions={softwareFactoryQuickActions}
      session={session}
      workspaceOptions={softwareFactoryWorkspaceOptions}
    >
      {children}
    </AppShell>
  );
}
