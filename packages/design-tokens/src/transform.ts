import type { DesignTokens } from './schema';

export const themeAttribute = 'data-bac-theme';

export function tokenSetToCssVariables(tokens: DesignTokens): Record<string, string> {
  return {
    '--bac-color-primary': tokens.color.primary,
    '--bac-color-secondary': tokens.color.secondary,
    '--bac-color-accent': tokens.color.accent,
    '--bac-color-background': tokens.color.background,
    '--bac-color-surface': tokens.color.surface,
    '--bac-color-text': tokens.color.text,
    '--bac-color-success': tokens.color.success,
    '--bac-color-warning': tokens.color.warning,
    '--bac-color-danger': tokens.color.danger,
    '--bac-font-display': tokens.typography.display,
    '--bac-font-heading': tokens.typography.heading,
    '--bac-font-body': tokens.typography.body,
    '--bac-font-mono': tokens.typography.mono,
    '--bac-space-xs': `${tokens.spacing.xs}px`,
    '--bac-space-sm': `${tokens.spacing.sm}px`,
    '--bac-space-md': `${tokens.spacing.md}px`,
    '--bac-space-lg': `${tokens.spacing.lg}px`,
    '--bac-space-xl': `${tokens.spacing.xl}px`,
    '--bac-radius-sm': `${tokens.radius.sm}px`,
    '--bac-radius-md': `${tokens.radius.md}px`,
    '--bac-radius-lg': `${tokens.radius.lg}px`,
    '--bac-radius-pill': `${tokens.radius.pill}px`,
    '--bac-shadow-low': tokens.elevation.low,
    '--bac-shadow-medium': tokens.elevation.medium,
    '--bac-shadow-high': tokens.elevation.high,
    '--bac-shell-nav-width': `${tokens.components.appShell.navWidth}px`,
    '--bac-shell-header-height': `${tokens.components.appShell.headerHeight}px`,
  };
}

export function createCssVariableBlock(tokens: DesignTokens): string {
  const entries = Object.entries(tokenSetToCssVariables(tokens))
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  return `[${themeAttribute}="${tokens.brandMode}"] {\n${entries}\n}`;
}

export function tokenSetToTailwindTheme(tokens: DesignTokens) {
  return {
    colors: {
      primary: 'var(--bac-color-primary)',
      secondary: 'var(--bac-color-secondary)',
      accent: 'var(--bac-color-accent)',
      background: 'var(--bac-color-background)',
      surface: 'var(--bac-color-surface)',
      text: 'var(--bac-color-text)',
      success: 'var(--bac-color-success)',
      warning: 'var(--bac-color-warning)',
      danger: 'var(--bac-color-danger)',
    },
    spacing: {
      xs: `${tokens.spacing.xs}px`,
      sm: `${tokens.spacing.sm}px`,
      md: `${tokens.spacing.md}px`,
      lg: `${tokens.spacing.lg}px`,
      xl: `${tokens.spacing.xl}px`,
    },
    borderRadius: {
      sm: `${tokens.radius.sm}px`,
      md: `${tokens.radius.md}px`,
      lg: `${tokens.radius.lg}px`,
      pill: `${tokens.radius.pill}px`,
    },
    boxShadow: {
      low: tokens.elevation.low,
      medium: tokens.elevation.medium,
      high: tokens.elevation.high,
    },
    fontFamily: {
      display: [tokens.typography.display],
      heading: [tokens.typography.heading],
      body: [tokens.typography.body],
      mono: [tokens.typography.mono],
    },
  };
}
