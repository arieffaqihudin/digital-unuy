export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@nuxtjs/tailwindcss'],
  css: [
    '@fontsource-variable/inter',
    '~/assets/css/main.css'
  ],
  app: {
    head: {
      htmlAttrs: { lang: 'id' },
      titleTemplate: '%s · Direktorat Transformasi Digital UNU Yogyakarta',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#1C1A1A' },
        { name: 'format-detection', content: 'telephone=no' }
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/unu-logo.png' },
        { rel: 'apple-touch-icon', href: '/unu-logo.png' }
      ]
    }
  },
  runtimeConfig: {
    mongodbUri: process.env.NUXT_MONGODB_URI || 'mongodb://127.0.0.1:27017/digital_unuy',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'dev-only-change-this-session-secret',
    uploadDir: process.env.NUXT_UPLOAD_DIR || '.data/uploads',
    siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    smtp: {
      host: process.env.NUXT_SMTP_HOST || '',
      port: Number(process.env.NUXT_SMTP_PORT || 587),
      secure: process.env.NUXT_SMTP_SECURE === 'true',
      user: process.env.NUXT_SMTP_USER || '',
      pass: process.env.NUXT_SMTP_PASS || '',
      from: process.env.NUXT_EMAIL_FROM || 'Direktorat Transformasi Digital UNU Yogyakarta <no-reply@localhost>'
    },
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      environment: process.env.NODE_ENV || 'development'
    }
  },
  routeRules: {
    '/admin/**': { ssr: true },
    '/masuk': { ssr: true },
    '/aktivasi': { ssr: true },
    // Program & Inisiatif module was retired; old URLs go to the homepage.
    '/halaman/tentang-kami': { redirect: { to: '/tentang', statusCode: 301 } },
    '/program/**': { redirect: { to: '/', statusCode: 301 } },
    '/api/**': { cors: false }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  nitro: {
    compressPublicAssets: true
  }
})
