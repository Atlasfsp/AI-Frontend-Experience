import { redirect } from 'next/navigation';

import { hasRole } from '@bac/auth';

import { getServerSession } from '@/lib/session';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session || !hasRole(session, ['ADMIN'])) {
    redirect('/software-factory/dashboard');
  }

  return children;
}
