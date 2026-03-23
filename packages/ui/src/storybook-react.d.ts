declare module '@storybook/react' {
  export type Meta<T = unknown> = {
    title?: string;
    component?: T;
    tags?: string[];
    argTypes?: Record<string, unknown>;
  };

  export type StoryObj<T = unknown> = {
    name?: string;
    args?: Record<string, unknown>;
    render?: (args: Record<string, unknown>) => React.ReactNode;
  };
}
