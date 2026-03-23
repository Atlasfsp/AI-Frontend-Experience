import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const pathnameMock = vi.fn(() => '/software-factory/dashboard');

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { AppShell, type NavigationSection } from './app-shell';

const navigation: NavigationSection[] = [
  {
    title: 'Software Factory',
    items: [
      {
        href: '/software-factory/dashboard',
        label: 'Dashboard',
        description: 'Delivery overview',
        permission: 'workspace:view',
      },
      {
        href: '/software-factory/prd-intake',
        label: 'PRD Intake',
        description: 'Restricted intake route',
        permission: 'workspace:manage',
      },
    ],
  },
];

describe('AppShell', () => {
  it('filters navigation by permission and opens the command palette', () => {
    render(
      <AppShell
        navigation={navigation}
        productName="AI Software Factory"
        quickActions={[
          {
            href: '/software-factory/swagger',
            label: 'Open Swagger',
            description: 'Review API contracts',
          },
        ]}
        session={{
          email: 'viewer@example.com',
          name: 'Viewer User',
          roles: ['VIEWER'],
          tenantId: 'tenant-core',
          workspaceId: 'workspace-alpha',
        }}
      >
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getAllByText('Dashboard').length).toBeGreaterThan(0);
    expect(screen.queryByText('PRD Intake')).toBeNull();
    expect(screen.getAllByText('workspace-alpha').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /open command palette/i }));

    expect(screen.getByText('Review API contracts')).toBeTruthy();
    expect(screen.queryByText('Restricted intake route')).toBeNull();
  });
});
