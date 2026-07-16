/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        asphalt: {
          DEFAULT: '#15181d',
          soft: '#20242b',
          line: '#2e333c',
        },
        concrete: {
          DEFAULT: '#f0efe9',
          card: '#ffffff',
          line: '#e2e0d6',
        },
        barrier: {
          yellow: '#f4c10f',
          amber: '#c9930a',
        },
        signal: {
          green: '#1e8e5a',
          greenSoft: '#e4f5ec',
        },
        alert: {
          red: '#d6432e',
          redSoft: '#fbe9e6',
        },
        steel: {
          DEFAULT: '#5b6472',
          light: '#8a93a1',
        },
      },
      fontFamily: {
        display: ['Archivo', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(21,24,29,0.05), 0 10px 30px -8px rgba(21,24,29,0.10)',
        lift: '0 20px 60px -12px rgba(21,24,29,0.45)',
      },
      backgroundImage: {
        barrier: 'repeating-linear-gradient(-45deg, #f4c10f, #f4c10f 14px, #15181d 14px, #15181d 28px)',
      },
      borderRadius: {
        xl2: '1.1rem',
      },
      keyframes: {
        rise: {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
