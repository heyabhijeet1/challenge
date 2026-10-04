/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  // Preflight is off so the original stylesheet renders exactly as before.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        brand: 'var(--blue)', accent: 'var(--accent)', card: 'var(--card)', mute: 'var(--mute)',
        line: 'var(--line)', danger: 'var(--danger)',
      },
      keyframes: {
        fup: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'none' } },
      },
      animation: { fup: 'fup .3s both' },
    },
  },
  plugins: [],
}
