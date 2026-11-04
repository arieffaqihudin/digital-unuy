const REVEAL_DELAY_CLEANUP_MS = 1200

export default defineNuxtPlugin((nuxtApp) => {
  let observer: IntersectionObserver | null = null

  const show = (el: HTMLElement) => {
    el.setAttribute('data-reveal', 'shown')
    setTimeout(() => {
      el.style.transitionDelay = ''
    }, REVEAL_DELAY_CLEANUP_MS)
  }

  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return

      const delay = Number(binding.value) || 0
      if (delay) el.style.transitionDelay = `${delay}ms`
      el.setAttribute('data-reveal', 'hidden')

      observer ??= new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            show(entry.target as HTMLElement)
            observer?.unobserve(entry.target)
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
      )
      observer.observe(el)
    },
    unmounted(el: HTMLElement) {
      observer?.unobserve(el)
    },
    getSSRProps: () => ({})
  })
})
