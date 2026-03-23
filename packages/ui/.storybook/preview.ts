import type { Preview } from '@storybook/react';

/**
 * BAC design token CSS variables applied as a global decorator so that
 * all stories render inside the enterprise theme context.
 */
const BAC_CSS_VARIABLES = {
  '--bac-radius-sm': '6px',
  '--bac-radius-md': '10px',
  '--bac-radius-lg': '14px',
  '--bac-shadow-low': '0 2px 8px rgba(0, 0, 0, 0.35)',
  '--bac-shadow-mid': '0 4px 16px rgba(0, 0, 0, 0.45)',
  '--bac-shadow-high': '0 8px 32px rgba(0, 0, 0, 0.55)',
  '--bac-surface-primary': '#0d1117',
  '--bac-surface-secondary': '#161b22',
  '--bac-surface-elevated': '#1c2129',
  '--bac-text-primary': '#e6edf3',
  '--bac-text-secondary': '#8b949e',
  '--bac-accent-primary': '#67e8f9',
  '--bac-accent-secondary': '#22d3ee',
} as const;

const preview: Preview = {
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'bac-surface',
      values: [
        { name: 'bac-surface', value: '#0d1117' },
        { name: 'bac-elevated', value: '#1c2129' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  decorators: [
    (Story) => {
      const styleEntries = Object.entries(BAC_CSS_VARIABLES)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

      return (
        <div
          style={{
            ...Object.fromEntries(
              Object.entries(BAC_CSS_VARIABLES).map(([k, v]) => [k, v]),
            ),
            fontFamily:
              'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            color: 'var(--bac-text-primary)',
            padding: '2rem',
          }}
          data-bac-theme="enterprise"
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
