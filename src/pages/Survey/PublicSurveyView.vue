<template>
  <div :class="$style.publicSurveyContainer" :data-theme="currentTheme" dir="rtl">
    <!-- Loading State -->
    <div v-if="isLoading" :class="$style.loadingContainer">
      <div :class="$style.loadingSpinner"></div>
      <p :class="$style.loadingText">جاري تحميل الاستطلاع...</p>
    </div>

    <!-- Access Denied -->
    <div v-else-if="accessDenied" :class="$style.accessDenied">
      <div :class="$style.deniedIcon">
        <i class="fas fa-lock"></i>
      </div>
      <h2 :class="$style.deniedTitle">عذراً، الوصول مرفوض</h2>
      <p :class="$style.deniedMessage">{{ accessMessage }}</p>
      
      <!-- Show additional details if available -->
      <div v-if="surveyData && surveyData.start_date && surveyData.end_date" :class="$style.scheduleInfo">
        <div :class="$style.scheduleItem">
          <i class="fas fa-calendar-plus"></i>
          <span>تاريخ البداية: {{ formatDate(surveyData.start_date) }}</span>
        </div>
        <div :class="$style.scheduleItem">
          <i class="fas fa-calendar-times"></i>
          <span>تاريخ النهاية: {{ formatDate(surveyData.end_date) }}</span>
        </div>
      </div>
    </div>

    <!-- Survey Content -->
    <div v-else-if="survey && !surveyStarted" :class="$style.surveyContent">
      <!-- Survey Header -->
      <div :class="$style.surveyHeader">
        <div :class="$style.surveyBranding">

          <h1 :class="$style.surveyTitle">{{ survey.title }}</h1>
          <p v-if="survey.description" :class="$style.surveyDescription">{{ survey.description }}</p>
        </div>
        
        <div :class="$style.surveyMeta">
          <div :class="$style.metaItem">
            <i class="fas fa-question-circle"></i>
            <span>{{ survey.questions.length }} سؤال</span>
          </div>
          <div :class="$style.metaItem">
            <i class="fas fa-users"></i>
            <span>استطلاع عام</span>
          </div>
        </div>
      </div>

      <!-- Welcome Message -->
      <!-- Direct Arabic text - no i18n -->
      <div :class="$style.welcomeSection">
        <div :class="$style.welcomeContent">
          <div :class="$style.welcomeIcon">
            <i class="fas fa-heart"></i>
          </div>
          <h3 :class="$style.welcomeTitle">أهلاً وسهلاً بك في استطلاعنا</h3>
          <p :class="$style.welcomeText">
            نقدر وقتك وآرائك القيمة. إجاباتك ستساعدنا في تحسين خدماتنا وتطوير تجربة أفضل للجميع.
            الاستطلاع سهل وسريع، وجميع إجاباتك محفوظة بسرية تامة.
          </p>
        </div>
      </div>

      <!-- Survey Questions Preview -->
      <!-- <div :class="$style.questionsPreview">
        <h3 :class="$style.previewTitle">نظرة سريعة على الأسئلة</h3>
        <div :class="$style.questionsList">
          <div 
            v-for="(question, index) in survey.questions.slice(0, 3)" 
            :key="question.id"
            :class="$style.questionItem"
          >
            <div :class="$style.questionNumber">{{ index + 1 }}</div>
            <div :class="$style.questionContent">
              <h4 :class="$style.questionText">{{ question.text }}</h4>
              <div :class="$style.questionType">
                <i :class="getQuestionIcon(question.question_type)"></i>
                <span>{{ getQuestionTypeLabel(question.question_type) }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div :class="$style.previewNote">
          <i class="fas fa-info-circle"></i>
          <span>هذه عينة من الأسئلة المتاحة في الاستطلاع</span>
        </div>
      </div> -->

      <!-- Action Buttons -->
      <div :class="$style.actionButtons">
        <button :class="$style.startButton" @click="startSurvey">
          <i class="fas fa-play"></i>
          <span>ابدأ الاستطلاع الآن</span>
        </button>
        
        <div :class="$style.secondaryActions">
          <button :class="$style.secondaryButton" @click="copyLink">
            <i class="fas fa-share"></i>
            <span>شارك الرابط</span>
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
            <span>يرجى الإجابة على الأسئلة التالية بعناية</span>
          </div>
        </div>
        
        <div :class="$style.progressSection">
          <div :class="$style.progressBar">
            <div :class="$style.progressFill" :style="{ width: progressPercentage + '%' }"></div>
          </div>
          <div :class="$style.progressInfo">
            <span :class="$style.progressText">
              السؤال {{ currentQuestionIndex + 1 }} من {{ survey.questions.length }}
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
              <span>هذا السؤال مطلوب</span>
            </div>
          </div>

          <!-- Text Input -->
          <div v-if="currentQuestion.question_type === 'text'" :class="$style.inputContainer">
            <div :class="$style.inputWrapper">
              <input
                type="text"
                :class="$style.textInput"
                v-model="answers[currentQuestion.id]"
                placeholder="اكتب إجابتك هنا..."
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
                placeholder="اكتب إجابتك المفصلة هنا... يمكنك كتابة عدة أسطر"
                rows="4"
              ></textarea>
              <i class="fas fa-align-right" :class="$style.inputIcon"></i>
            </div>
          </div>

          <!-- Single Choice -->
          <div v-else-if="currentQuestion.question_type === 'single_choice'" :class="$style.choicesContainer">
            <div :class="$style.choicesTitle">
              <i class="fas fa-dot-circle"></i>
              <span>اختر إجابة واحدة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
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
              <span>يمكنك اختيار أكثر من إجابة:</span>
            </div>
            <div
              v-for="(option, index) in getQuestionOptions(currentQuestion.options)"
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
              <span>قيم من {{ getRatingRange(currentQuestion.options) }}:</span>
            </div>
            <div :class="$style.ratingScale">
              <button
                v-for="rating in getRatingOptions(currentQuestion.options)"
                :key="rating"
                :class="[$style.ratingButton, { [$style.selected]: answers[currentQuestion.id] === rating }]"
                @click="answers[currentQuestion.id] = rating"
              >
                <span :class="$style.ratingNumber">{{ rating }}</span>
                <i class="fas fa-star" :class="$style.ratingIcon"></i>
              </button>
            </div>
            <div :class="$style.ratingLabels">
              <span>{{ getRatingLabel('min') }}</span>
              <span>{{ getRatingLabel('max') }}</span>
            </div>
          </div>

          <!-- Yes/No -->
          <div v-else-if="currentQuestion.question_type === 'yes_no'" :class="$style.yesNoWrapper">
            <div :class="$style.yesNoTitle">
              <div :class="$style.yesNoTitleIcon">
                <i class="fas fa-question-circle"></i>
              </div>
              <h3 :class="$style.yesNoTitleText">اختر إجابتك:</h3>
              <p :class="$style.yesNoSubtitle">اختر الخيار الذي يناسب رأيك</p>
            </div>
            <div :class="$style.yesNoContainer">
              <div :class="$style.yesNoButtons">
                <button
                  :class="[$style.yesNoButton, $style.yes, { [$style.selected]: answers[currentQuestion.id] === 'yes' }]"
                  @click="answers[currentQuestion.id] = 'yes'"
                >
                  <div :class="$style.yesNoButtonIcon">
                    <i class="fas fa-check"></i>
                  </div>
                  <span :class="$style.yesNoButtonText">نعم</span>
                  <div :class="$style.yesNoButtonBadge" v-if="answers[currentQuestion.id] === 'yes'">
                    <i class="fas fa-check-circle"></i>
                  </div>
                </button>
                <button
                  :class="[$style.yesNoButton, $style.no, { [$style.selected]: answers[currentQuestion.id] === 'no' }]"
                  @click="answers[currentQuestion.id] = 'no'"
                >
                  <div :class="$style.yesNoButtonIcon">
                    <i class="fas fa-times"></i>
                  </div>
                  <span :class="$style.yesNoButtonText">لا</span>
                  <div :class="$style.yesNoButtonBadge" v-if="answers[currentQuestion.id] === 'no'">
                    <i class="fas fa-check-circle"></i>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="questionError" :class="$style.errorMessage">
            <i class="fas fa-exclamation-triangle"></i>
            <span>{{ questionError }}</span>
          </div>
        </div>
      </div>

      <!-- Email Collection Section -->
      <div v-if="currentQuestionIndex === survey.questions.length - 1 || showEmailForm" :class="$style.emailSection">
        <div :class="$style.emailContainer">
          <div :class="$style.emailHeader">
            <h3 :class="$style.emailTitle">
              <i class="fas fa-envelope"></i>
              البريد الإلكتروني (مطلوب)
            </h3>
            <p :class="$style.emailDescription">
              نحتاج بريدك الإلكتروني لحفظ إجاباتك وإرسال تأكيد المشاركة
            </p>
          </div>
          
          <div :class="$style.emailInputContainer">
            <div :class="$style.emailInputWrapper">
              <input
                type="email"
                :class="[$style.emailInput, { [$style.error]: emailError }]"
                v-model="userEmail"
                placeholder="example@domain.com"
                @input="emailError = ''"
              />
              <i class="fas fa-envelope" :class="$style.emailIcon"></i>
            </div>
            
            <div v-if="emailError" :class="$style.emailError">
              <i class="fas fa-exclamation-triangle"></i>
              <span>{{ emailError }}</span>
            </div>
          </div>
          
          <div :class="$style.emailNote">
            <i class="fas fa-shield-alt"></i>
            <span>بياناتك محمية ولن نشاركها مع أطراف خارجية</span>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div :class="$style.formNavigation">
        <button
          v-if="currentQuestionIndex > 0"
          :class="$style.navButton"
          @click="previousQuestion"
        >
          <i class="fas fa-arrow-right"></i>
          <span>السؤال السابق</span>
        </button>

        <div :class="$style.navSpacer"></div>

        <button
          v-if="currentQuestionIndex < survey.questions.length - 1"
          :class="[$style.navButton, $style.next]"
          @click="nextQuestion"
          :disabled="!canProceed"
        >
          <span>السؤال التالي</span>
          <i class="fas fa-arrow-left"></i>
        </button>

        <button
          v-else
          :class="[$style.navButton, $style.submit]"
          @click="submitSurvey"
          :disabled="!canSubmit || isSubmitting || !isValidEmail"
        >
          <i v-if="isSubmitting" class="fas fa-spinner fa-spin"></i>
          <i v-else class="fas fa-paper-plane"></i>
          <span>{{ isSubmitting ? 'جاري الإرسال...' : 'إرسال الاستطلاع' }}</span>
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else :class="$style.errorState">
      <div :class="$style.errorIcon">
        <i class="fas fa-exclamation-triangle"></i>
      </div>
      <h2 :class="$style.errorTitle">حدث خطأ غير متوقع</h2>
      <p :class="$style.errorMessage">عذراً، لم نتمكن من تحميل الاستطلاع. يرجى المحاولة مرة أخرى.</p>
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
import { useRoute } from 'vue-router'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import { ThankYouModal } from '../../components/ThankYouModal'
import type { Survey } from '../../types/survey.types'

// Router
const route = useRoute()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)

// State
const survey = ref<Survey | null>(null)
const isLoading = ref(true)
const accessDenied = ref(false)
const accessMessage = ref('')
const surveyData = ref<any>(null) // Store additional survey metadata from response
const surveyStarted = ref(false)
const currentQuestionIndex = ref(0)
const answers = ref<Record<string, any>>({})
const questionError = ref('')
const isSubmitting = ref(false)
const userEmail = ref('')
const emailError = ref('')
const showEmailForm = ref(false)
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

const isValidEmail = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(userEmail.value.trim())
})

// Methods
const loadSurvey = async () => {
  try {
    isLoading.value = true
    const token = route.params.token as string

    if (!token) {
      accessDenied.value = true
      accessMessage.value = 'لم يتم العثور على رمز الوصول'
      return
    }

    // Use validateAccess with the token - backend will find survey by token
    const response = await surveyService.validateAccess(token)
    
    if (response.data.has_access && response.data.survey) {
      survey.value = response.data.survey
      // Initialize answers object
      initializeAnswers()
    } else {
      accessDenied.value = true
      // Store additional data for potential use (like dates)
      surveyData.value = response.data
      // Use the message from the API response if available
      accessMessage.value = response.message || 'ليس لديك صلاحية للوصول إلى هذا الاستطلاع'
    }
  } catch (error: any) {
    console.error('Failed to load survey:', error)
    
    accessDenied.value = true
    
    // Extract message from error response
    let errorMessage = 'فشل في تحميل الاستطلاع'
    
    if (error.response?.data) {
      // Handle structured error response
      const errorData = error.response.data
      if (errorData.message) {
        errorMessage = errorData.message
      } else if (errorData.data?.message) {
        errorMessage = errorData.data.message
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    accessMessage.value = errorMessage
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
  questionError.value = ''
}

const nextQuestion = () => {
  if (!validateCurrentQuestion()) return
  
  if (currentQuestionIndex.value < (survey.value?.questions.length || 0) - 1) {
    currentQuestionIndex.value++
    questionError.value = ''
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    questionError.value = ''
  }
}

const validateCurrentQuestion = (): boolean => {
  if (!currentQuestion.value) return false
  
  const answer = answers.value[currentQuestion.value.id]
  
  if (currentQuestion.value.is_required) {
    if (currentQuestion.value.question_type === 'multiple_choice') {
      if (!Array.isArray(answer) || answer.length === 0) {
        questionError.value = 'هذا السؤال مطلوب، يرجى الإجابة عليه'
        return false
      }
    } else {
      if (answer === undefined || answer === null || answer === '') {
        questionError.value = 'هذا السؤال مطلوب، يرجى الإجابة عليه'
        return false
      }
    }
  }
  
  questionError.value = ''
  return true
}

const validateEmail = (): boolean => {
  if (userEmail.value.trim() === '') {
    emailError.value = 'البريد الإلكتروني مطلوب للمتابعة'
    return false
  }
  
  if (!isValidEmail.value) {
    emailError.value = 'يرجى إدخال بريد إلكتروني صحيح'
    return false
  }
  
  emailError.value = ''
  return true
}

const isOptionSelected = (questionId: string, option: string): boolean => {
  const answer = answers.value[questionId]
  return Array.isArray(answer) && answer.includes(option)
}

const toggleMultipleChoice = (questionId: string, option: string) => {
  if (!Array.isArray(answers.value[questionId])) {
    answers.value[questionId] = []
  }
  
  const currentAnswers = [...answers.value[questionId]]
  const index = currentAnswers.indexOf(option)
  
  if (index > -1) {
    currentAnswers.splice(index, 1)
  } else {
    currentAnswers.push(option)
  }
  
  answers.value[questionId] = currentAnswers
}

const submitSurvey = async () => {
  if (!canSubmit.value || isSubmitting.value) return
  
  // Validate email before submission
  if (!validateEmail()) {
    showEmailForm.value = true
    return
  }
  
  try {
    isSubmitting.value = true
    
    // Prepare the submission data according to the API specification
    const submissionData = {
      survey_id: survey.value!.id,
      token: route.params.token as string,
      email: userEmail.value.trim(),
      answers: formatAnswersForSubmission()
    }
    
    
    
    // Call the API endpoint via surveyService
    await surveyService.submitSurveyResponse(submissionData)
    
    // Success - Show thank you modal
    showThankYouModal.value = true
    
  } catch (error: any) {
    console.error('Failed to submit survey:', error)
    alert('فشل في إرسال الاستطلاع: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const formatAnswersForSubmission = () => {
  const formattedAnswers: Array<{
    question_id: string
    answer: string | string[]
  }> = []
  
  Object.entries(answers.value).forEach(([questionId, answer]) => {
    // Only include answered questions
    if (answer !== '' && answer !== null && answer !== undefined) {
      if (Array.isArray(answer) && answer.length === 0) return
      
      formattedAnswers.push({
        question_id: questionId,
        answer: answer
      })
    }
  })
  
  return formattedAnswers
}

const copyLink = async () => {
  try {
    const currentUrl = window.location.href
    await navigator.clipboard.writeText(currentUrl)
    alert('تم نسخ الرابط بنجاح!')
  } catch (error) {
    console.error('Failed to copy link:', error)
    alert('فشل في نسخ الرابط')
  }
}

const getRatingRange = (options: string | undefined): string => {
  if (!options) return '1 إلى 5'
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) return '1 إلى 5'
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
    
    if (numericOptions.length === 0) return '1 إلى 5'
    
    const min = Math.min(...numericOptions)
    const max = Math.max(...numericOptions)
    
    return `${min} إلى ${max}`
  } catch (error) {
    console.error('Error parsing rating options:', error)
    return '1 إلى 5'
  }
}

const getRatingOptions = (options: string | undefined): any[] => {
  if (!options) return [1, 2, 3, 4, 5]
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return [1, 2, 3, 4, 5]
    }
    
    // Sort the options numerically if they are numbers
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    return numericOptions.length > 0 ? numericOptions : optionsArray
  } catch (error) {
    console.error('Error parsing rating options:', error)
    return [1, 2, 3, 4, 5]
  }
}

const getQuestionOptions = (options: string | undefined): string[] => {
  if (!options) return []
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof options === 'string' ? JSON.parse(options) : options
    
    if (!Array.isArray(optionsArray)) {
      return []
    }
    
    return optionsArray.map((opt: any) => String(opt))
  } catch (error) {
    console.error('Error parsing question options:', error)
    return []
  }
}

const getRatingLabel = (type: 'min' | 'max'): string => {
  if (!currentQuestion.value || !currentQuestion.value.options) {
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
  
  try {
    // Parse the JSON string to get the actual options array
    const optionsArray = typeof currentQuestion.value.options === 'string' 
      ? JSON.parse(currentQuestion.value.options) 
      : currentQuestion.value.options
      
    if (!Array.isArray(optionsArray) || optionsArray.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    // Convert options to numbers for proper sorting
    const numericOptions = optionsArray
      .map((opt: any) => Number(opt))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b)
    
    if (numericOptions.length === 0) {
      return type === 'min' ? 'ضعيف' : 'ممتاز'
    }
    
    // Dynamic labels based on the range
    const min = numericOptions[0]
    const max = numericOptions[numericOptions.length - 1]
    
    if (type === 'min') {
      if (min === 1) return 'ضعيف جداً'
      if (min === 0) return 'سيء'
      return `الأدنى (${min})`
    } else {
      if (max === 5) return 'ممتاز'
      if (max === 10) return 'مثالي'
      return `الأعلى (${max})`
    }
  } catch (error) {
    console.error('Error parsing rating options:', error)
    return type === 'min' ? 'ضعيف' : 'ممتاز'
  }
}

const handleModalClose = () => {
  showThankYouModal.value = false
  // Reset form
  surveyStarted.value = false
  userEmail.value = ''
  showEmailForm.value = false
  // Optionally redirect or reload the page
}

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return dateString
  }
}

// Lifecycle
onMounted(() => {
  loadSurvey()
})
</script>

<style module src="./PublicSurveyView.module.css">
/* CSS Module styles are imported from PublicSurveyView.module.css */
</style>
