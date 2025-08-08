<template>
  <div :class="styles.welcomePage" :data-theme="currentTheme" dir="rtl">
    <!-- Header with Logo -->
    <header class="container-fluid mb-4">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <div :class="styles.headerCard">
            <div style="display: flex; justify-content: center !important; align-items: center !important; width: 100%;">
              <img src="/News-Logo.png" alt="شعار الأخبار" :class="styles.logo">
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">جارٍ التحميل...</span>
      </div>
      <p class="mt-2">جارٍ تحميل الأخبار...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-danger mx-3" role="alert">
      <h4 class="alert-heading">خطأ في تحميل الأخبار</h4>
      <p>{{ error }}</p>
      <button @click="refreshData" class="btn btn-outline-danger">
        حاول مرة أخرى
      </button>
    </div>

    <!-- Main Content -->
    <main v-else class="container-fluid">
      <div class="row justify-content-center">
        <div class="col-12 col-xl-10">
          <!-- First Row: Hero Slider (9 cols) + Regular News Card (3 cols) -->
          <div class="row mb-4">
            <!-- Hero Slider - 9 columns -->
            <div class="col-12 col-lg-9">
              <section :class="styles.heroSliderSection">
                <div :class="styles.heroSlider" ref="heroSlider">
                  <div :class="styles.sliderContainer" :style="{ transform: `translateX(-${currentSlideIndex * 100}%)` }">
                    <!-- API Slider Slides with IMG tags -->
                    <div 
                      v-for="(slide, index) in getSliderData" 
                      :key="slide?.id || `slide-${index}`"
                      :class="styles.sliderSlide"
                    >
                      <div :class="styles.cardImageContainer">
                        <!-- Use IMG tag instead of background image -->
                        <img 
                          v-if="slide?.main_image" 
                          :src="getImageSrc(slide.main_image)" 
                          :alt="slide?.title_arabic || slide?.title_english || 'News Image'"
                          :class="styles.sliderImage"
                          @error="handleImageError"
                        />
                        <!-- Fallback gradient if no image -->
                        <div v-else :class="styles.sliderImageFallback"></div>
                        
                        <div :class="styles.overlayText">
                          {{ slide?.title_arabic || 'جارٍ التحميل...' }}
                        </div>
                      </div>
                      <div :class="styles.cardContent">
                        <div :class="styles.cardHeader">
                          <div :class="styles.sourceIcon"></div>
                          <span>{{ slide?.category_display || 'News' }} • {{ slide?.date ? getRelativeTime(slide.date) : 'Now' }}</span>
                        </div>
                        <div :class="styles.cardDescription" v-if="slide?.description">
                          {{ slide.description && slide.description.length > 100 ? slide.description.substring(0, 100) + '...' : (slide.description || '') }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Navigation Arrows -->
                  <button :class="[styles.sliderNav, styles.prev]" @click="moveSlide(-1)" :aria-label="'Previous'">‹</button>
                  <button :class="[styles.sliderNav, styles.next]" @click="moveSlide(1)" :aria-label="'Next'">›</button>

                  <!-- Dots Indicator -->
                  <div :class="styles.sliderControls">
                    <button 
                      v-for="index in (getSliderData?.length || 0)" 
                      :key="index"
                      :class="[styles.sliderDot, { [styles.active]: currentSlideIndex === index - 1 }]" 
                      @click="currentSlide(index - 1)"
                      :aria-label="`Slide ${index}`"
                    ></button>
                  </div>
                </div>
              </section>
            </div>

            <!-- Two Stacked News Cards - 3 columns -->
            <div class="col-12 col-lg-3">
              <div class="d-flex flex-column h-100 gap-3">
                <!-- Featured Cards News -->
                <article 
                  v-for="(card, index) in (Array.isArray(featuredCardsNews) ? featuredCardsNews : []).slice(0, 2)" 
                  :key="card?.id || `featured-${index}`"
                  :class="styles.newsCard" 
                  style="flex: 1;"
                  @click="openNewsDetail(card)"
                  role="button"
                  tabindex="0"
                >
                  <div :class="[styles.cardImage, styles.small]" :style="getSimpleImageStyle(card?.main_image)">
                    <div v-if="!card?.main_image" :class="styles.imageOverlay"></div>
                  </div>
                  <div :class="styles.cardContent">
                    <div :class="styles.cardHeader">
                      <div :class="styles.sourceIcon"></div>
                      <span>{{ card?.category_display }} • {{ getRelativeTime(card?.date) }}</span>
                    </div>
                    <div :class="styles.cardTitle">{{ card?.title_arabic }}</div>
                    <div v-if="card?.description" :class="styles.cardPreview">
                      {{ card.description.length > 60 ? card.description.substring(0, 60) + '...' : card.description }}
                    </div>
                  </div>
                </article>

                <!-- Fallback cards if no featured news - show first cards from cardsNews -->
                <article 
                  v-if="!Array.isArray(featuredCardsNews) || featuredCardsNews.length < 2" 
                  v-for="(fallbackCard, index) in (Array.isArray(cardsNews) ? cardsNews : []).slice(0, 2 - (Array.isArray(featuredCardsNews) ? featuredCardsNews.length : 0))" 
                  :key="`fallback-card-${index}`" 
                  :class="styles.newsCard" 
                  style="flex: 1;" 
                  @click="openNewsDetail(fallbackCard)" 
                  role="button" 
                  tabindex="0"
                >
                  <div :class="[styles.cardImage, styles.small]" :style="getSimpleImageStyle(fallbackCard?.main_image)">
                    <!-- Add subtle overlay for better text contrast -->
                    <div v-if="!fallbackCard?.main_image" :class="styles.imageOverlay"></div>
                  </div>
                  <div :class="styles.cardContent">
                    <div :class="styles.cardHeader">
                      <div :class="styles.sourceIcon"></div>
                      <span>{{ fallbackCard?.category_display || 'News' }} • {{ fallbackCard?.date ? getRelativeTime(fallbackCard.date) : 'Now' }}</span>
                    </div>
                    <div :class="styles.cardTitle">
                      {{ fallbackCard?.title_arabic || 'جارٍ تحميل الأخبار...' }}
                    </div>
                    <!-- Add a subtle description preview if available -->
                    <div 
                      v-if="fallbackCard?.description" 
                      :class="styles.cardPreview" 
                      style="transform: translate(-20px, -60px);"
                    >
                      {{ fallbackCard.description.length > 60 ? fallbackCard.description.substring(0, 150) + '...' : fallbackCard.description }}
                    </div>
                  </div>
                </article>
              </div>
            </div>
          </div>

          <!-- Rest of the content with original grid layout -->
          <div :class="styles.newsGrid">

            <!-- Wrapper for scrollable area and 2x2 grid -->
            <section :class="styles.scrollableAndGridWrapper">
              <!-- Scrollable Achievements Area -->
              <div :class="styles.scrollableNewsArea">
                <div :class="styles.scrollableHeader">
                  <h3>الإنجازات</h3>
                </div>
                <div :class="styles.scrollableContent">
                  <div v-for="achievement in (Array.isArray(achievements) ? achievements : []).slice(0, 10)" :key="achievement?.id || `achievement-${Math.random()}`" :class="styles.miniNewsItem">
                    <div :class="styles.miniIcon" :style="getSimpleImageStyle(achievement?.main_image)"></div>
                    <div :class="styles.miniContent">
                      <div :class="styles.miniTitle">{{ achievement?.title_arabic }}</div>
                      <div :class="styles.miniMeta">{{ achievement?.category_display }} • {{ getRelativeTime(achievement?.achievement_date) }}</div>
                    </div>
                  </div>

                  <!-- Fallback achievements if no API data -->
                  <div v-if="!Array.isArray(achievements) || achievements.length === 0" v-for="index in 7" :key="`fallback-achievement-${index}`" :class="styles.miniNewsItem">
                    <div :class="styles.miniIcon"></div>
                    <div :class="styles.miniContent">
                      <div :class="styles.miniTitle">جارٍ تحميل الإنجازات...</div>
                      <div :class="styles.miniMeta">جارٍ التحميل...</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 2x2 Grid of Cards -->
              <div :class="styles.cardsGrid2x2">
                <article 
                  v-for="(card, index) in (Array.isArray(cardsNews) ? cardsNews : []).slice(0, 4)" 
                  :key="card?.id || `grid-${index}`" 
                  :class="styles.newsCard"
                  @click="openNewsDetail(card)"
                  role="button"
                  tabindex="0"
                >
                  <div :class="[styles.cardImage, styles.small]" :style="getSimpleImageStyle(card?.main_image)"></div>
                  <div :class="styles.cardContent">
                    <div :class="styles.cardHeader">
                      <div :class="styles.sourceIcon"></div>
                      <span>{{ card?.category_display }} • {{ getRelativeTime(card?.date) }}</span>
                    </div>
                    <div :class="styles.cardTitle">{{ card?.title_arabic }}</div>
                  </div>
                </article>

                <!-- Fallback cards for 2x2 grid -->
                <article v-if="!Array.isArray(cardsNews) || cardsNews.length < 4" v-for="index in (4 - (Array.isArray(cardsNews) ? cardsNews.length : 0))" :key="`grid-fallback-${index}`" :class="styles.newsCard">
                  <div :class="[styles.cardImage, styles.small]"></div>
                  <div :class="styles.cardContent">
                    <div :class="styles.cardHeader">
                      <div :class="styles.sourceIcon"></div>
                      <span>جارٍ التحميل...</span>
                    </div>
                    <div :class="styles.cardTitle">جارٍ تحميل الأخبار...</div>
                  </div>
                </article>
              </div>
            </section>

            <!-- Additional News Cards -->
            <article 
              v-for="(newsItem, index) in getAdditionalNewsCards" 
              :key="newsItem?.id || `additional-${index}`" 
              :class="styles.newsCard"
              @click="openNewsDetail(newsItem)"
              role="button"
              tabindex="0"
            >
              <div :class="[styles.cardImage, styles.small]" :style="getSimpleImageStyle(newsItem?.main_image)"></div>
              <div :class="styles.cardContent">
                <div :class="styles.cardHeader">
                  <div :class="styles.sourceIcon"></div>
                  <span>{{ newsItem?.category_display }} • {{ getRelativeTime(newsItem?.date) }}</span>
                </div>
                <div :class="styles.cardTitle">{{ newsItem?.title_arabic }}</div>
                <div :class="styles.cardMeta">
                </div>
              </div>
            </article>

            <!-- Load More Button -->
            <div v-if="hasMoreCardsNews" class="col-12 text-center py-4">
              <button @click="loadMoreNews" :disabled="loading" class="btn btn-primary">
                <span v-if="loading" class="spinner-border spinner-border-sm me-2" role="status"></span>
                تحميل المزيد من الأخبار
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- News Detail Modal -->
    <div v-if="selectedNews" class="modal fade show d-block" tabindex="-1" @click.self="closeNewsDetail">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ selectedNews.title_arabic }}</h5>
            <button type="button" class="btn-close" @click="closeNewsDetail"></button>
          </div>
          <div class="modal-body">
            <img v-if="selectedNews.main_image" :src="getImageSrc(selectedNews.main_image)" class="img-fluid mb-3" :alt="selectedNews.title_arabic">
            <p>{{ selectedNews.description }}</p>
            <div class="d-flex justify-content-between text-muted">
              <span>{{ selectedNews.category_display }}</span>
              <span>{{ formatDate(selectedNews.date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useI18n } from '../../hooks/useI18n'
import { usePublicNews } from '../../composables/useNews'
import type { CardsNews } from '../../types/news.types'
import styles from './Welcome.module.css'

const i18n = useI18n()
const currentTheme = computed(() => i18n.currentTheme)

// News composable - back to full functionality
const {
  sliderNews,
  cardsNews,
  achievements,
  loading,
  error,
  featuredCardsNews,
  hasMoreCardsNews,
  loadSliderNews,
  loadCardsNews,
  loadMoreCardsNews,
  loadAchievements,
  getRelativeTime,
  formatDate
} = usePublicNews()

// Slider state
const currentSlideIndex = ref(0)
const heroSlider = ref<HTMLElement>()
let autoSlideInterval: ReturnType<typeof setInterval> | null = null

// News detail modal state
const selectedNews = ref<CardsNews | null>(null)

// Computed property for slider data with fallback
const getSliderData = computed(() => {
  try {
    if (Array.isArray(sliderNews.value) && sliderNews.value.length > 0) {
      return sliderNews.value
    }
    
    // Fallback static data with simple content
    return [
      {
        id: 1,
        title_arabic: 'أحدث التطورات التكنولوجية العسكرية',
        title_english: 'Latest Military Technology Advances',
        description: 'Breaking developments in defense technology and strategic capabilities showcase the latest innovations in military equipment.',
        category_display: 'Military',
        date: new Date().toISOString(),
        main_image: null
      },
      {
        id: 2,
        title_arabic: 'تحديث العمليات الدفاعية الاستراتيجية',
        title_english: 'Strategic Defense Operations Update',
        description: 'Comprehensive overview of current strategic operations and their impact on regional security frameworks.',
        category_display: 'Operations',
        date: new Date().toISOString(),
        main_image: null
      },
      {
        id: 3,
        title_arabic: 'برامج التدريب المتقدمة',
        title_english: 'Training Excellence Programs',
        description: 'Advanced training programs demonstrate exceptional performance and skill development across all operational units.',
        category_display: 'Training',
        date: new Date().toISOString(),
        main_image: null
      }
    ]
  } catch (error) {
    // Logging removed for production
    return []
  }
})

// Computed property for additional news cards (starts after featured cards and 2x2 grid)
const getAdditionalNewsCards = computed(() => {
  try {
    if (!Array.isArray(cardsNews.value)) return []
    
    // Calculate how many cards are already used
    const featuredCount = Array.isArray(featuredCardsNews.value) ? featuredCardsNews.value.length : 0
    const fallbackFeaturedCount = featuredCount < 2 ? (2 - featuredCount) : 0
    const gridCount = 4 // Always 4 cards in the 2x2 grid
    
    // Start index: featured cards + fallback featured cards + grid cards
    const startIndex = Math.max(featuredCount + fallbackFeaturedCount + gridCount, 6)
    
    return cardsNews.value.slice(startIndex)
  } catch (error) {
    // Logging removed for production
    return []
  }
})

// Image error handler
const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
  
}

// Initialize data
const initializeData = async () => {
  try {
    await Promise.all([
      loadSliderNews({ is_active: true }).catch(_err => {
        // Logging removed for production
        return Promise.resolve()
      }),
      loadCardsNews({ page_size: 20 }).catch(_err => {
        // Logging removed for production
        return Promise.resolve()
      }),
      loadAchievements().catch(_err => {
        // Logging removed for production
        return Promise.resolve()
      })
    ])
  } catch (error) {
    // Logging removed for production
  }
}

// Refresh data
const refreshData = async () => {
  await initializeData()
}

// Load more news
const loadMoreNews = async () => {
  await loadMoreCardsNews()
}

// Open news detail modal
const openNewsDetail = async (newsItem: CardsNews) => {
  selectedNews.value = newsItem
}

// Close news detail modal
const closeNewsDetail = () => {
  selectedNews.value = null
}

// Slider functions
const moveSlide = (direction: number) => {
  const maxSlides = getSliderData.value?.length || 0
  if (maxSlides === 0) return
  
  currentSlideIndex.value += direction
  
  if (currentSlideIndex.value >= maxSlides) {
    currentSlideIndex.value = 0
  } else if (currentSlideIndex.value < 0) {
    currentSlideIndex.value = maxSlides - 1
  }
  
  // Restart auto-slide when manually changing slides
  restartAutoSlide()
}

const currentSlide = (index: number) => {
  const maxSlides = getSliderData.value?.length || 0
  if (index >= 0 && index < maxSlides) {
    currentSlideIndex.value = index
    // Restart auto-slide when manually changing slides
    restartAutoSlide()
  }
}

const startAutoSlide = () => {
  autoSlideInterval = setInterval(() => {
    moveSlide(1)
  }, 5000) // 5 seconds per slide
}

const restartAutoSlide = () => {
  stopAutoSlide()
  startAutoSlide()
}

const stopAutoSlide = () => {
  if (autoSlideInterval) {
    clearInterval(autoSlideInterval)
    autoSlideInterval = null
  }
}

// Simple helper function for news cards (not slider)
const getSimpleImageStyle = (mainImage: string | undefined) => {
  if (!mainImage) {
    return { 
      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)'
    }
  }
  
  // Simple image URL handling
  let imageUrl = mainImage
  if (!mainImage.startsWith('data:') && !mainImage.startsWith('http')) {
    imageUrl = `data:image/jpeg;base64,${mainImage}`
  }
  
  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  }
}

// Helper function to get image src for img tags
const getImageSrc = (mainImage: string | undefined): string => {
  if (!mainImage) return ''
  
  if (!mainImage.startsWith('data:') && !mainImage.startsWith('http')) {
    return `data:image/jpeg;base64,${mainImage}`
  }
  
  return mainImage
}

onMounted(async () => {
  await initializeData()
  startAutoSlide()
})

onUnmounted(() => {
  stopAutoSlide()
})
</script>
