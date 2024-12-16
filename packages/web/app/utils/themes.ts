export type ThemeVariant = 'modern' | 'light' | 'dark';

export function getThemeClass(theme: ThemeVariant): string {
  return `theme-${theme}`;
}

export function isValidTheme(theme: string): theme is ThemeVariant {
  return ['modern', 'light', 'dark'].includes(theme);
}
