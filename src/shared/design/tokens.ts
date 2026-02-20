export const designTokens = {
  color: {
    primary: 'var(--color-primario)',
    secondary: 'var(--color-secundario)',
    accent: 'var(--color-acento)',
    text: 'var(--color-texto)',
    background: 'var(--color-fondo)',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
  },
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
} as const;

export type DesignTokens = typeof designTokens;
