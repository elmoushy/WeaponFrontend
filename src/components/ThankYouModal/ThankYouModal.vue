<template>
  <Teleport to="body">
    <Transition name="modal" appear>
      <div 
        v-if="isVisible" 
        :class="$style.modalOverlay" 
        @click.self="handleClose"
        @keydown.esc="handleClose"
        tabindex="-1"
        dir="rtl"
      >
        <div :class="$style.modalContainer">
          <div :class="[$style.modal, `theme-${currentTheme}`]">
            <!-- Success Icon -->
            <div :class="$style.iconContainer">
              <div :class="$style.successIcon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div :class="$style.iconGlow"></div>
            </div>

            <!-- Modal Content -->
            <div :class="$style.modalContent">
              <h2 :class="$style.title">شكرًا لمشاركتك!</h2>
              <p :class="$style.message">
                نود أن نعبر عن خالص شكرنا وتقديرنا لمشاركتك في استطلاع الرأي.
              </p>
              <div :class="$style.appreciation">
                <i class="fas fa-heart"></i>
                <span>رأيك يهمنا ويساعدنا في التطوير والتحسين</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div :class="$style.actionButtons">
              <button 
                :class="$style.primaryButton"
                @click="handleClose"
                ref="closeButton"
              >
                <i class="fas fa-home"></i>
                <span>العودة للصفحة الرئيسية</span>
              </button>
            </div>

            <!-- Close Button -->
            <button 
              :class="$style.closeBtn" 
              @click="handleClose"
              :aria-label="'إغلاق'"
            >
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { useAppStore } from '@/stores/useAppStore'

// Props
interface Props {
  isVisible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)

// Refs
const closeButton = ref<HTMLButtonElement>()

// Methods
const handleClose = () => {
  emit('close')
}

// Focus management
const focusCloseButton = async () => {
  await nextTick()
  closeButton.value?.focus()
}

// Watch for visibility to manage focus
import { watch } from 'vue'
watch(() => props.isVisible, (newVal) => {
  if (newVal) {
    focusCloseButton()
  }
})
</script>

<style module src="./ThankYouModal.module.css"></style>
