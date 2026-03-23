import { describe, expect, it } from 'vitest';

import { createCssVariableBlock, tokenSets, tokenSetToCssVariables } from './index';

describe('design tokens', () => {
  it('creates CSS variables for enterprise mode', () => {
    const variables = tokenSetToCssVariables(tokenSets.enterprise);
    expect(variables['--bac-color-primary']).toBe('#1f5eff');
    expect(variables['--bac-shell-nav-width']).toBe('320px');
  });

  it('creates a themed CSS block', () => {
    const css = createCssVariableBlock(tokenSets.consumer);
    expect(css).toContain('[data-bac-theme="consumer"]');
    expect(css).toContain('--bac-color-accent');
  });
});
