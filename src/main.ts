import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { silentRefreshAccessToken } from './services/jwtAuthService'
import './styles/reset.module.css'
import './styles/theme.css'
import './styles/rtl-utils.css'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
// Import Bootstrap JavaScript
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

// Import Font Awesome
import '@fortawesome/fontawesome-free/css/all.min.css'

// Import AOS
import AOS from 'aos'
import 'aos/dist/aos.css'

// Load Google Fonts
const loadFonts = () => {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Tajawal:wght@300;400;600&display=swap'
  link.rel = 'stylesheet'
  document.head.appendChild(link)
}

// Initialize app
const app = createApp(App)
const pinia = createPinia()

// Load fonts
loadFonts()

// Initialize AOS
AOS.init({
  duration: 1000,
  easing: 'ease-out-cubic',
  once: true,
  offset: 100
})

// Setup app
app.use(pinia)
app.use(router)

// Initialize JWT authentication
const initializeAuth = async () => {
  // Attempt silent refresh (refresh cookie -> new access token)
  try {
    await silentRefreshAccessToken()
  } catch {
    // Ignore errors; user will be treated as unauthenticated
  }

  // Mount the app
  app.mount('#app')
}

// Start the application
initializeAuth()
