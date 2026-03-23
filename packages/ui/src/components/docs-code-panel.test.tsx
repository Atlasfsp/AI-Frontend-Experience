import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DocsCodePanel } from './docs-code-panel';

describe('DocsCodePanel', () => {
  it('switches between narrative and code tabs', () => {
    render(
      <DocsCodePanel
        title="Explorer notes"
        tabs={[
          {
            id: 'notes',
            label: 'Notes',
            content: 'Read this first.\n\nThen move to the code sample.',
          },
          {
            id: 'code',
            label: 'Code',
            kind: 'code',
            content: 'const route = "/software-factory/swagger";',
          },
        ]}
      />,
    );

    expect(screen.getByText('Read this first.')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Code' }));

    expect(screen.getByText('const route = "/software-factory/swagger";')).toBeTruthy();
  });
});
