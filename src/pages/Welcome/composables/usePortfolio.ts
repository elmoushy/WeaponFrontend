import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable for managing scroll-based animations and effects
 */
export function useScrollEffects() {
  const isScrolled = ref(false)
  const scrollY = ref(0)

  const handleScroll = () => {
    scrollY.value = window.scrollY
    isScrolled.value = window.scrollY > 50
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial check
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    isScrolled,
    scrollY
  }
}

/**
 * Composable for managing intersection observer animations
 */
export function useIntersectionObserver(
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = { threshold: 0.3 }
) {
  let observer: IntersectionObserver | null = null

  const observe = (element: HTMLElement) => {
    if (!element) return

    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        callback(entry.isIntersecting)
      })
    }, options)

    observer.observe(element)
  }

  const disconnect = () => {
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  onUnmounted(() => {
    disconnect()
  })

  return {
    observe,
    disconnect
  }
}

/**
 * Composable for managing counter animations
 */
export function useCounterAnimation() {
  const animatedCounts = ref<Record<string, number>>({})
  const counterTimers: ReturnType<typeof setInterval>[] = []

  const countUp = (targetValue: number, key: string, duration = 2000) => {
    const step = targetValue / duration * 10 // Update every 10ms
    let current = 0

    const timer = setInterval(() => {
      current += step
      animatedCounts.value[key] = Math.floor(current)

      if (current >= targetValue) {
        animatedCounts.value[key] = targetValue
        clearInterval(timer)
      }
    }, 10)

    counterTimers.push(timer)
  }

  const resetCounters = (keys: string[]) => {
    // Clear all active timers
    counterTimers.forEach(timer => clearInterval(timer))
    counterTimers.length = 0

    // Reset counter values
    keys.forEach(key => {
      animatedCounts.value[key] = 0
    })
  }

  onUnmounted(() => {
    counterTimers.forEach(timer => clearInterval(timer))
  })

  return {
    animatedCounts,
    countUp,
    resetCounters
  }
}

/**
 * Composable for managing carousel functionality
 */
export function useCarousel(itemsLength: number, interval = 2500) {
  const currentIndex = ref(0)
  const isPaused = ref(false)
  let carouselInterval: ReturnType<typeof setInterval> | null = null

  const start = () => {
    if (carouselInterval) clearInterval(carouselInterval)

    carouselInterval = setInterval(() => {
      if (!isPaused.value) {
        currentIndex.value = (currentIndex.value + 1) % itemsLength
      }
    }, interval)
  }

  const pause = () => {
    isPaused.value = true
  }

  const resume = () => {
    isPaused.value = false
  }

  const goTo = (index: number) => {
    if (index >= 0 && index < itemsLength) {
      currentIndex.value = index
    }
  }

  const next = () => {
    currentIndex.value = (currentIndex.value + 1) % itemsLength
  }

  const previous = () => {
    currentIndex.value = currentIndex.value === 0 ? itemsLength - 1 : currentIndex.value - 1
  }

  const stop = () => {
    if (carouselInterval) {
      clearInterval(carouselInterval)
      carouselInterval = null
    }
  }

  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    stop()
  })

  return {
    currentIndex,
    isPaused,
    start,
    pause,
    resume,
    goTo,
    next,
    previous,
    stop
  }
}

/**
 * Composable for managing modal functionality
 */
export function useModal() {
  const isOpen = ref(false)
  const modalElement = ref<HTMLElement>()

  const open = async () => {
    isOpen.value = true

    await new Promise(resolve => setTimeout(resolve, 0)) // Wait for next tick

    if (modalElement.value) {
      modalElement.value.classList.add('show')
      modalElement.value.style.display = 'block'
      document.body.classList.add('modal-open')

      // Create backdrop
      const backdrop = document.createElement('div')
      backdrop.className = 'modal-backdrop fade show'
      backdrop.id = 'dynamicModalBackdrop'
      document.body.appendChild(backdrop)

      // Close on backdrop click
      backdrop.addEventListener('click', close)
    }
  }

  const close = () => {
    isOpen.value = false

    if (modalElement.value) {
      modalElement.value.classList.remove('show')
      modalElement.value.style.display = 'none'
      document.body.classList.remove('modal-open')

      // Remove backdrop
      const backdrop = document.getElementById('dynamicModalBackdrop')
      if (backdrop) {
        backdrop.remove()
      }
    }
  }

  // Handle escape key
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleEscape)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape)
    close() // Cleanup on unmount
  })

  return {
    isOpen,
    modalElement,
    open,
    close
  }
}

/**
 * Composable for smooth scrolling to elements
 */
export function useSmoothScroll() {
  const scrollToElement = (elementId: string, offset = 0) => {
    const element = document.getElementById(elementId)
    if (element) {
      const targetPosition = element.offsetTop - offset
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      })
    }
  }

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return {
    scrollToElement,
    scrollToTop
  }
}
