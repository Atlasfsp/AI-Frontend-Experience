import { z } from 'zod';

export const DesignTokensSchema = z
  .object({
    brandMode: z.enum(['enterprise', 'consumer']),
    color: z
      .object({
        primary: z.string().min(1),
        secondary: z.string().min(1),
        accent: z.string().min(1),
        background: z.string().min(1),
        surface: z.string().min(1),
        text: z.string().min(1),
        success: z.string().min(1),
        warning: z.string().min(1),
        danger: z.string().min(1),
      })
      .strict(),
    typography: z
      .object({
        display: z.string().min(1),
        heading: z.string().min(1),
        body: z.string().min(1),
        mono: z.string().min(1),
        scale: z
          .object({
            xs: z.string().min(1),
            sm: z.string().min(1),
            md: z.string().min(1),
            lg: z.string().min(1),
            xl: z.string().min(1),
            '2xl': z.string().min(1),
          })
          .strict(),
      })
      .strict(),
    spacing: z
      .object({
        xs: z.number().positive(),
        sm: z.number().positive(),
        md: z.number().positive(),
        lg: z.number().positive(),
        xl: z.number().positive(),
      })
      .strict(),
    radius: z
      .object({
        sm: z.number().nonnegative(),
        md: z.number().nonnegative(),
        lg: z.number().nonnegative(),
        pill: z.number().nonnegative(),
      })
      .strict(),
    elevation: z
      .object({
        low: z.string().min(1),
        medium: z.string().min(1),
        high: z.string().min(1),
      })
      .strict(),
    components: z
      .object({
        appShell: z
          .object({
            navWidth: z.number().positive(),
            headerHeight: z.number().positive(),
          })
          .strict(),
        card: z
          .object({
            padding: z.number().positive(),
            gap: z.number().positive(),
          })
          .strict(),
        table: z
          .object({
            rowHeight: z.number().positive(),
            headerHeight: z.number().positive(),
          })
          .strict(),
        form: z
          .object({
            fieldHeight: z.number().positive(),
            fieldGap: z.number().positive(),
          })
          .strict(),
      })
      .strict(),
  })
  .strict();

export type DesignTokens = z.infer<typeof DesignTokensSchema>;
