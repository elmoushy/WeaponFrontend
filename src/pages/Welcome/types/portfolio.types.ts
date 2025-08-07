// Navigation Types
export interface NavItem {
  id: string
  label: string
  href: string
}

// Hero Section Types
export interface AnimatedText {
  text: string
  class: string
}

export interface SocialLink {
  icon: string
  href: string
  label: string
}

export interface HeroData {
  greeting: string
  staticText: string
  animatedTexts: AnimatedText[]
  socialLinks: SocialLink[]
}

// About Section Types
export interface Skill {
  name: string
  percentage: number
}

export interface Button {
  text: string
  variant: 'primary' | 'outline'
  href: string
}

export interface AboutData {
  title: string
  subtitle: string
  description: string
  image: string
  skills: Skill[]
  buttons: Button[]
}

// Services Types
export interface Service {
  id: number
  icon: string
  title: string
  description: string
}

// Portfolio Types
export interface PortfolioFilter {
  id: string
  label: string
  filter: string
}

export interface PortfolioItem {
  id: number
  image: string
  category: string
  title: string
  href: string
}

export interface Portfolio {
  title: string
  filters: PortfolioFilter[]
  items: PortfolioItem[]
}

// Testimonials Types
export interface TestimonialItem {
  id: number
  name: string
  role: string
  image: string
  text: string
}

export interface Stat {
  icon: string
  count: number
  label: string
}

export interface Testimonials {
  title: string
  items: TestimonialItem[]
  stats: Stat[]
}

// Team Types
export interface TeamSocialLink {
  icon: string
  href: string
}

export interface TeamMember {
  id: number
  name: string
  role: string
  image: string
  socialLinks: TeamSocialLink[]
}

export interface Team {
  title: string
  members: TeamMember[]
}

// Contact Types
export interface ContactInfo {
  icon: string
  title: string
  text: string
}

export interface ContactData {
  title: string
  info: ContactInfo[]
}

// Form Types
export interface FormData {
  name: string
  email: string
  message: string
}

// Animation Types
export interface CounterAnimation {
  target: number
  current: number
  duration: number
  step: number
}

// Modal Types
export interface ModalState {
  isOpen: boolean
  currentSlide: number
}

// Carousel Types
export interface CarouselState {
  currentIndex: number
  isPaused: boolean
  interval: number | null
}
