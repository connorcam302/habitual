/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        'surface-3': 'var(--surface-3)',
        'app-border': 'var(--border)',
        'app-text': 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-dim': 'var(--text-dim)',
        football: 'var(--football)',
        strength: 'var(--strength)',
        speed: 'var(--speed)',
        cardio: 'var(--cardio)',
        chinese: 'var(--chinese)',
        done: 'var(--done)',
        injured: 'var(--injured)',
        cancelled: 'var(--cancelled)',
        skipped: 'var(--skipped)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
