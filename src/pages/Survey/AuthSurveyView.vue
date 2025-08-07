<template>
  <div :class="$style.authSurveyContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">{{ t('survey.auth.loading') }}</p>
    </div>

    <!-- Access Denied -->
    <div v-else-if="accessDenied" :class="$style.accessDenied">
      <div :class="$style.deniedIcon">
        <i class="fas fa-lock"></i>
      </div>
      <h2 :class="$style.deniedTitle">{{ t('survey.auth.accessDenied') }}</h2>
      <p :class="$style.deniedMessage">{{ accessMessage }}</p>
      <button :class="$style.backButton" @click="goBack">
        <i class="fas fa-arrow-left"></i>
        {{ t('common.goBack') }}
      </button>
    </div>

    <!-- Error State -->
    <div v-else-if="error" :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 :class="$style.errorTitle">{{ t('survey.auth.error') }}</h2>
      <p :class="$style.errorMessage">{{ error }}</p>
      <button :class="$style.retryButton" @click="loadSurvey">
        <i class="fas fa-redo"></i>
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- Survey Preview (Before Starting) -->
    <div v-else-if="survey && !surveyStarted" :class="$style.surveyContent">
      <!-- Survey Header -->
      <div :class="$style.surveyHeader">
        <div :class="$style.surveyBranding">
          <div :class="$style.surveyIcon">
            <i class="fas fa-clipboard-list"></i>
          </div>
          <h1 :class="$style.surveyTitle">{{ survey.title }}</h1>
          <p v-if="survey.description" :class="$style.surveyDescription">{{ survey.description }}</p>
        </div>
        
        <div :class="$style.surveyMeta">
          <div :class="$style.metaItem">
            <i class="fas fa-question-circle"></i>
            <span>{{ survey.questions_count || survey.questions.length }} {{ t('survey.auth.questionsCount') }}</span>
          </div>
          <div :class="$style.metaItem">
            <i class="fas fa-user-shield"></i>
            <span>{{ t('survey.auth.authenticatedSurvey') }}</span>
          </div>
        </div>
      </div>

      <!-- Welcome Section -->
      <div :class="$style.welcomeSection">
        <div :class="$style.welcomeContent">
          <div :class="$style.welcomeIcon">
            <i class="fas fa-heart"></i>
          </div>
          <h3 :class="$style.welcomeTitle">{{ t('survey.auth.welcomeTitle') }}</h3>
          <p :class="$style.welcomeText">{{ t('survey.auth.welcomeText') }}</p>
        </div>
      </div>


      <!-- Action Buttons -->
      <div :class="$style.actionButtons">
        <button :class="$style.startButton" @click="startSurvey">
          <i class="fas fa-play"></i>
          {{ t('survey.auth.startSurvey') }}
        </button>
        
        <div :class="$style.secondaryActions">
          <button :class="$style.secondaryButton" @click="goBack">
            <i class="fas fa-arrow-left"></i>
            {{ t('common.goBack') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Survey Form (When Started) -->
    <div v-else-if="survey && surveyStarted" :class="$style.surveyForm">
      <!-- Survey Form Header -->
      <div :class="$style.formHeader">
        <div :class="$style.formTitleSection">
          <h1 :class="$style.formTitle">{{ survey.title }}</h1>
          <div :class="$style.formSubtitle">
            <i class="fas fa-user-edit"></i>
            <span>{{ t('survey.auth.pleaseAnswer') }}</span>
          </div>
        </div>
        
        <div :class="$style.progressSection">
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div :class="$style.progressInfo">
            <span :class="$style.progressText">
              {{ t('survey.progress.currentQuestion') }}: {{ currentQuestionIndex + 1 }}/{{ survey.questions.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Current Question -->
      <div :class="$style.questionContainer">
        <div :class="$style.currentQuestion" v-if="currentQuestion">
          <div :class="$style.questionHeader">
            <div :class="$style.questionBadge">
              <span :class="$style.questionIndex">{{ currentQuestionIndex + 1 }}</span>
            </div>
            <h2 :class="$style.questionTitle">
              {{ currentQuestion.text }}
              <span v-if="currentQuestion.is_required" :class="$style.required">*</span>
            </h2>
            <div v-if="currentQuestion.is_required" :class="$style.requiredNote">
              <i class="fas fa-star"></i>
              <span>{{ t('survey.requiredField') }}</span>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="currentQuestion.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                type="text"
                :class="$style.textInput"
                v-model="answers[currentQuestion.id]"
                :placeholder="t('survey.placeholders.shortText')"
              />
              <i class="fas fa-pen" :class="$style.inputIcon"></i>
            </div>
          </div>

          <!-- Textarea Input -->
          <div v-else-if="currentQuestion.question_type === 'textarea'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <textarea
                :class="$style.textArea"
                v-model="answers[currentQuestion.id]"
                :placeholder="t('survey.placeholders.longText')"
                rows="4"
              ></textarea>
              <i class="fas fa-align-right" :class="$style.inputIcon"></i>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="currentQuestion.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>{{ t('survey.singleChoice.instruction') }}</span>
            </div>
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: answers[currentQuestion.id] === option }]"
              @click="answers[currentQuestion.id] = option"
            >
              <div :class="$style.choiceRadio">
                <div v-if="answers[currentQuestion.id] === option" :class="$style.radioSelected"></div>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="answers[currentQuestion.id] === option">
                <i class="fas fa-check"></i>
              </div>
            </div>
          </div>

          <!-- Multiple Choice -->
          <div v-else-if="currentQuestion.question_type === 'multiple_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-check-square"></i>
              <span>{{ t('survey.multipleChoice.instruction') }}</span>
            </div>
            <div
              v-for="(option, index) in currentQuestion.options"
              :key="index"
              :class="[$style.choiceOption, { [$style.selected]: isOptionSelected(currentQuestion.id, option) }]"
              @click="toggleMultipleChoice(currentQuestion.id, option)"
            >
              <div :class="$style.choiceCheckbox">
                <i v-if="isOptionSelected(currentQuestion.id, option)" class="fas fa-check"></i>
              </div>
              <span :class="$style.choiceText">{{ option }}</span>
              <div :class="$style.choiceCheck" v-if="isOptionSelected(currentQuestion.id, option)">
                <i class="fas fa-check-circle"></i>
              </div>
            </div>
          </div>

          <!-- Rating -->
          <div v-else-if="currentQuestion.question_type === 'rating'" :class="$style.ratingContainer">
            <div :class="$style.ratingTitle">
              <i class="fas fa-star"></i>
              <span>{{ t('survey.rating.instruction') }}</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in currentQuestion.options"
                :key="rating"
                :class="[$style.ratingButton, { [$style.selected]: answers[currentQuestion.id] === rating }]"
                @click="answers[currentQuestion.id] = rating"
              >
                <span :class="$style.ratingNumber">{{ rating }}</span>
                <i class="fas fa-star" :class="$style.ratingIcon"></i>
              </button>
            </div>
            <div :class="$style.ratingLabels">
              <span>{{ t('survey.rating.poor') }}</span>
              <span>{{ t('survey.rating.excellent') }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="currentQuestion.question_type === 'yes_no'" :class="$style.yesNoContainer">
            <div :class="$style.yesNoTitle">
              <i class="fas fa-question-circle"></i>
              <span>{{ t('survey.yesNo.instruction') }}</span>
            </div>
            <div :class="$style.yesNoButtons">
              <button
                :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[currentQuestion.id] === 'yes' }]"
                @click="answers[currentQuestion.id] = 'yes'"
              >
                <i class="fas fa-check"></i>
                <span>{{ t('survey.yesNo.yes') }}</span>
              </button>
              <button
                :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[currentQuestion.id] === 'no' }]"
                @click="answers[currentQuestion.id] = 'no'"
              >
                <i class="fas fa-times"></i>
                <span>{{ t('survey.yesNo.no') }}</span>
              </button>
            </div>
          </div>

          <!-- Validation Error -->
          <div v-if="questionError" :class="$style.errorMessage">
            <i class="fas fa-exclamation-circle"></i>
            <span>{{ questionError }}</span>
          </div>
        </div>
      </div>

      <!-- Form Navigation -->
      <div :class="$style.formNavigation">
        <button 
          :class="$style.navButton" 
          @click="previousQuestion" 
          :disabled="currentQuestionIndex === 0"
          v-if="currentQuestionIndex > 0"
        >
          <i class="fas fa-chevron-right" v-if="isRTL"></i>
          <i class="fas fa-chevron-left" v-if="!isRTL"></i>
          {{ t('survey.navigation.previous') }}
        </button>
        
        <div :class="$style.navSpacer"></div>
        
        <button 
          v-if="currentQuestionIndex < survey.questions.length - 1"
          :class="$style.navButton" 
          @click="nextQuestion" 
          :disabled="!canProceed"
        >
          {{ t('survey.navigation.next') }}
          <i class="fas fa-chevron-left" v-if="isRTL"></i>
          <i class="fas fa-chevron-right" v-if="!isRTL"></i>
        </button>
        
        <button 
          v-else
          :class="[$style.navButton, $style.submit]" 
          @click="submitSurvey" 
          :disabled="!canSubmit || isSubmitting"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          {{ isSubmitting ? t('survey.submitting') : t('survey.submit') }}
        </button>
      </div>
    </div>

    <!-- Thank You Modal -->
    <ThankYouModal 
      :isVisible="showThankYouModal" 
      @close="handleModalClose" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/hooks/useI18n'
import { surveyService } from '@/services/surveyService'
import { ThankYouModal } from '@/components/ThankYouModal'
import type { 
  AuthSurvey, 
  AuthResponseSubmission
} from '@/types/survey.types'

// Composables
const route = useRoute()
const router = useRouter()
const { t, currentTheme, isRTL } = useI18n()

// State
const survey = ref<AuthSurvey | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const accessDenied = ref(false)
const accessMessage = ref('')
const surveyStarted = ref(false)
const currentQuestionIndex = ref(0)
const answers = ref<Record<string, any>>({})
const questionError = ref('')
const isSubmitting = ref(false)
const showThankYouModal = ref(false)

// Computed
const currentQuestion = computed(() => {
  if (!survey.value || !survey.value.questions) return null
  return survey.value.questions[currentQuestionIndex.value]
})

const progressPercentage = computed(() => {
  if (!survey.value) return 0
  return ((currentQuestionIndex.value + 1) / survey.value.questions.length) * 100
})

const canProceed = computed(() => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  // If question is required, answer must be provided
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0
    }
    return answer !== undefined && answer !== null && answer !== ''
  }
  
  // If not required, can always proceed
  return true
})

const canSubmit = computed(() => {
  if (!survey.value) return false
  
  // Check all required questions have answers
  for (const question of survey.value.questions) {
    if (question.is_required) {
      const answer = answers.value[question.id]
      if (question.question_type === 'multiple_choice') {
        if (!Array.isArray(answer) || answer.length === 0) return false
      } else {
        if (answer === undefined || answer === null || answer === '') return false
      }
    }
  }
  
  return true
})

// Methods
const loadSurvey = async () => {
  try {
    isLoading.value = true
    error.value = null
    accessDenied.value = false
    
    const surveyId = route.params.id as string

    if (!surveyId) {
      error.value = t('survey.auth.errors.noSurveyId')
      return
    }

    const response = await surveyService.getAuthSurvey(surveyId)
    
    if (response.data && response.data.survey) {
      survey.value = response.data.survey
      initializeAnswers()
    } else {
      error.value = t('survey.auth.errors.surveyNotFound')
    }
  } catch (err: any) {
    console.error('Failed to load survey:', err)
    
    if (err.message?.includes('403') || err.message?.includes('Access denied')) {
      accessDenied.value = true
      accessMessage.value = t('survey.auth.errors.accessDenied')
    } else if (err.message?.includes('404')) {
      error.value = t('survey.auth.errors.surveyNotFound')
    } else if (err.message?.includes('401')) {
      accessDenied.value = true
      accessMessage.value = t('survey.auth.errors.authenticationRequired')
    } else {
      error.value = err.message || t('survey.auth.errors.loadFailed')
    }
  } finally {
    isLoading.value = false
  }
}

const initializeAnswers = () => {
  if (!survey.value) return
  
  const initialAnswers: Record<string, any> = {}
  survey.value.questions.forEach(question => {
    if (question.question_type === 'multiple_choice') {
      initialAnswers[question.id] = []
    } else {
      initialAnswers[question.id] = ''
    }
  })
  answers.value = initialAnswers
}

const startSurvey = () => {
  surveyStarted.value = true
  currentQuestionIndex.value = 0
}

const nextQuestion = () => {
  if (!canProceed.value) {
    questionError.value = t('survey.validation.answerRequired')
    return
  }
  
  questionError.value = ''
  if (currentQuestionIndex.value < survey.value!.questions.length - 1) {
    currentQuestionIndex.value++
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    questionError.value = ''
  }
}

const submitSurvey = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  
  try {
    isSubmitting.value = true
    
    // Prepare submission data
    const submissionData: AuthResponseSubmission = {
      survey_id: survey.value!.id,
      answers: []
    }
    
    // Convert answers to API format
    for (const question of survey.value!.questions) {
      const answer = answers.value[question.id]
      if (answer !== undefined && answer !== null && answer !== '') {
        let answerText: string
        
        if (question.question_type === 'multiple_choice') {
          answerText = Array.isArray(answer) ? answer.join(', ') : answer.toString()
        } else {
          answerText = answer.toString()
        }
        
        submissionData.answers.push({
          question_id: question.id,
          answer_text: answerText
        })
      }
    }
    
    await surveyService.submitAuthResponse(submissionData)
    
    // Show thank you modal instead of redirecting immediately
    showThankYouModal.value = true
    
  } catch (err: any) {
    console.error('Failed to submit survey:', err)
    questionError.value = err.message || t('survey.auth.errors.submitFailed')
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  router.push('/surveys')
}

const handleModalClose = () => {
  showThankYouModal.value = false
  // Redirect to surveys page after modal is closed
  router.push('/surveys')
}

// Helper methods for question types
const isOptionSelected = (questionId: string, option: string): boolean => {
  const answer = answers.value[questionId]
  return Array.isArray(answer) && answer.includes(option)
}

const toggleMultipleChoice = (questionId: string, option: string) => {
  if (!Array.isArray(answers.value[questionId])) {
    answers.value[questionId] = []
  }
  
  const currentAnswers = answers.value[questionId] as string[]
  const index = currentAnswers.indexOf(option)
  
  if (index > -1) {
    currentAnswers.splice(index, 1)
  } else {
    currentAnswers.push(option)
  }
}

// Lifecycle
onMounted(() => {
  loadSurvey()
})
</script>

<style module src="./AuthSurveyView.module.css"></style>
