import { useTheme } from '~/context/ThemeContext';
import type { ThemeVariant } from '~/styles/themes';

const themes: { label: string; value: ThemeVariant }[] = [
  { label: 'macOS', value: 'macos' },
  { label: 'Material', value: 'material' },
  { label: 'Minimal', value: 'minimal' },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm font-medium">Theme:</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeVariant)}
        className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
      >
        {themes.map(({ label, value }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
