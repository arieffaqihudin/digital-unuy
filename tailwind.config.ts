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
        charcoal: '#1C1A1A',
        gold: '#C99517',
        sage: '#D7D49A',
        'gold-dark': '#8C6406',
        'gold-soft': '#E8C766',
        'charcoal-soft': '#2B2828',
        'ink-muted': '#68625C',
        'line-warm': '#E6E1D3',
        'sage-soft': '#F0EFD9'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        '4xl': '2rem'
      },
      maxWidth: {
        '8xl': '90rem'
      },
      boxShadow: {
        soft: '0 18px 60px -32px rgba(28, 26, 26, 0.28)',
        card: '0 1px 0 rgba(28,26,26,0.04), 0 16px 40px -30px rgba(28,26,26,0.32)'
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        'fade-up': 'fade-up .5s ease-out both',
        shimmer: 'shimmer 1.8s infinite'
      }
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
