import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.{vue,js,ts}',
    './pages/**/*.{vue,js,ts}',
    './composables/**/*.{js,ts}',
    './app.vue',
    './error.vue'
  ],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF8ED',
        'soft-white': '#FAFAF9',
        charcoal: '#1C1A1A',
        'charcoal-soft': '#2B2828',
        gold: '#BF8B15',
        'gold-dark': '#7D5800',
        'gold-soft': '#E8C766',
        sage: '#D7D49A',
        'sage-soft': '#F0EFD9',
        'unu-green': '#337449',
        'unu-green-dark': '#245B37',
        'unu-green-soft': '#EAF3ED',
        'slate-ink': '#334155',
        'ink-muted': '#5B6572',
        'line-warm': '#E4E0D3',
        'admin-bg': '#F6F8FA',
        'admin-sidebar': '#F4F7FA',
        'admin-border': '#E5E7EB',
        'admin-text': '#1E293B',
        'admin-muted': '#64748B'
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '4xl': '2rem'
      },
      maxWidth: {
        '8xl': '90rem'
      },
      letterSpacing: {
        editorial: '0.18em'
      },
      boxShadow: {
        soft: '0 24px 70px -40px rgba(28, 26, 26, 0.35)',
        card: '0 1px 2px rgba(28,26,26,0.03), 0 18px 45px -38px rgba(28,26,26,0.28)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-up': 'fade-up .55s ease-out both',
        shimmer: 'shimmer 1.8s infinite'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
