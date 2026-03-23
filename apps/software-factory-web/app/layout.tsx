import './globals.css';

import type { Metadata } from 'next';

import { createCssVariableBlock, tokenSets } from '@bac/design-tokens';

export const metadata: Metadata = {
  title: 'BAC Software Factory Web',
  description: 'Operational dashboard for NeuroForge SDX.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const tokenStyles = [createCssVariableBlock(tokenSets.enterprise), createCssVariableBlock(tokenSets.consumer)].join('\n');

  return (
    <html lang="en" data-bac-theme="enterprise">
      <body>
        <style dangerouslySetInnerHTML={{ __html: tokenStyles }} />
        {children}
      </body>
    </html>
  );
}
