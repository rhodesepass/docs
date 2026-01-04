import DefaultTheme from 'vitepress/theme'
import './hyperos.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router }) {
    if (typeof window !== 'undefined') {
      let animationFrameId: number | null = null
      let timeoutId: number | null = null

      router.onBeforeRouteChange = () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
          animationFrameId = null
        }
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }

        const content = document.querySelector('.VPContent')
        if (content) {
          (content as HTMLElement).style.willChange = 'auto'
        }

        document.body.classList.remove('page-entering')
        document.body.classList.add('page-leaving')
      }

      router.onAfterRouteChanged = () => {
        animationFrameId = requestAnimationFrame(() => {
          animationFrameId = requestAnimationFrame(() => {
            document.body.classList.remove('page-leaving')
            document.body.classList.add('page-entering')

            timeoutId = window.setTimeout(() => {
              animationFrameId = requestAnimationFrame(() => {
                document.body.classList.remove('page-entering')

                const content = document.querySelector('.VPContent')
                if (content) {
                  (content as HTMLElement).style.willChange = 'auto'
                }
              })
            }, 500)
          })
        })
      }
    }
  }
}
