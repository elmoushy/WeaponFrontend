<template>
  <div :class="$style.editorContainer" :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
    <!-- Header -->
    <div :class="$style.editorHeader">
      <div :class="$style.headerContent">
        <button :class="$style.backButton" @click="handleBack">
          <i class="fas fa-arrow-right"></i>
          <span>{{ isRTL ? 'رجوع' : 'Back' }}</span>
        </button>
        <div :class="$style.headerTitle">
          <i class="fas fa-poll-h"></i>
          <span>{{ isRTL ? 'تصميم الاستطلاع' : 'Survey Builder' }}</span>
        </div>
        <div :class="$style.headerActions">
          <button :class="[$style.headerButton, $style.settingsButton]" @click="openSchedulingModal" :title="isRTL ? 'إعدادات الجدولة' : 'Scheduling Settings'">
            <i class="fas fa-calendar-alt"></i>
          </button>
          <button :class="[$style.headerButton, $style.settingsButton]" @click="openSurveySettingsModal" :title="isRTL ? 'إعدادات الاستطلاع' : 'Survey Settings'">
            <i class="fas fa-cog"></i>
          </button>
          <button :class="[$style.headerButton, $style.previewButton]" @click="togglePreview">
            <i class="fas fa-eye"></i>
            <span>{{ isRTL ? 'معاينة' : 'Preview' }}</span>
          </button>
          <button :class="[$style.headerButton, $style.draftButton]" @click="handleSaveAsDraft" :disabled="!canPublish">
            <i class="fas fa-save"></i>
            <span>{{ isRTL ? 'حفظ كمسودة' : 'Save as Draft' }}</span>
          </button>
          <button :class="[$style.headerButton, $style.publishButton]" @click="handlePublish" :disabled="!canPublish">
            <i class="fas fa-paper-plane"></i>
            <span>{{ isRTL ? 'نشر' : 'Publish' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div :class="$style.editorMain">
      <!-- Info Banner for Template Creation -->
      <div v-if="isCreatingTemplate" :class="$style.infoBanner">
        <i class="fas fa-info-circle"></i>
        <div :class="$style.infoContent">
          <strong>{{ isRTL ? 'إنشاء قالب جديد' : 'Creating New Template' }}</strong>
          <p>{{ isRTL ? 'قم بإنشاء الاستطلاع الخاص بك، وعند النشر يمكنك حفظه كقالب لاستخدامه لاحقاً.' : 'Create your survey, and when you publish it, you can save it as a template for future use.' }}</p>
        </div>
      </div>
      
      <!-- Survey Header Section -->
      <div :class="$style.surveyHeaderSection">
        <div :class="$style.surveyHeaderCard">
          <input
            type="text"
            :class="$style.surveyTitle"
            v-model="surveyData.title"
            :placeholder="isRTL ? 'عنوان الاستطلاع' : 'Survey Title'"
            @blur="validateTitle"
          />
          <div v-if="errors.title" :class="$style.errorMessage">
            {{ errors.title }}
          </div>
          <textarea
            :class="$style.surveyDescription"
            v-model="surveyData.description"
            :placeholder="isRTL ? 'وصف الاستطلاع (اختياري)' : 'Survey Description (optional)'"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Questions Section -->
      <div :class="$style.questionsSection">
        <div
          v-for="(question, index) in surveyData.questions"
          :key="question.tempId"
          :class="[$style.questionCard, { [$style.dragging]: draggedQuestionIndex === index }]"
          draggable="true"
          @dragstart="handleDragStart(index, $event)"
          @dragend="handleDragEnd"
          @dragover="handleDragOver($event)"
          @drop="handleDrop(index, $event)"
        >
          <!-- Question Header -->
          <div :class="$style.questionHeader">
            <div :class="$style.questionNumber">{{ index + 1 }}</div>
            <div :class="$style.questionDragHandle">
              <i class="fas fa-grip-vertical"></i>
            </div>
          </div>

          <!-- Question Content -->
          <div :class="$style.questionContent">
            <!-- Question Text Input -->
            <div :class="$style.questionTextRow">
              <input
                type="text"
                :class="$style.questionTextInput"
                v-model="question.text"
                :placeholder="isRTL ? 'نص السؤال' : 'Question Text'"
                @focus="setActiveQuestion(index)"
              />
              
              <!-- Question Type Dropdown -->
              <div :class="$style.questionTypeDropdown">
                <select v-model="question.question_type" :class="$style.typeSelect">
                  <option value="text">{{ isRTL ? 'نص قصير' : 'Short Text' }}</option>
                  <option value="textarea">{{ isRTL ? 'نص طويل' : 'Long Text' }}</option>
                  <option value="single_choice">{{ isRTL ? 'اختيار واحد' : 'Single Choice' }}</option>
                  <option value="multiple_choice">{{ isRTL ? 'اختيار متعدد' : 'Multiple Choice' }}</option>
                  <option value="rating">{{ isRTL ? 'تقييم' : 'Rating' }}</option>
                  <option value="yes_no">{{ isRTL ? 'نعم/لا' : 'Yes/No' }}</option>
                </select>
                <i class="fas fa-chevron-down" :class="$style.dropdownIcon"></i>
              </div>
            </div>

            <!-- Options Section (for choice-based questions) -->
            <div v-if="needsOptions(question.question_type)" :class="$style.optionsSection">
              <div
                v-for="(_option, optIndex) in getQuestionOptions(question)"
                :key="optIndex"
                :class="$style.optionRow"
              >
                <div :class="$style.optionBullet">
                  <i :class="getOptionIcon(question.question_type)"></i>
                </div>
                <input
                  type="text"
                  :class="$style.optionInput"
                  v-model="getQuestionOptions(question)[optIndex]"
                  :placeholder="`${isRTL ? 'خيار' : 'Option'} ${optIndex + 1}`"
                  @input="updateQuestionOptions(question, getQuestionOptions(question))"
                />
                <button
                  v-if="getQuestionOptions(question).length > 1"
                  :class="$style.removeOptionButton"
                  @click="removeOption(question, optIndex)"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
              <button :class="$style.addOptionButton" @click="addOption(question)">
                <i class="fas fa-plus"></i>
                <span>{{ isRTL ? 'إضافة خيار' : 'Add Option' }}</span>
              </button>
            </div>

            <!-- Rating Preview (for rating questions) -->
            <div v-if="question.question_type === 'rating'" :class="$style.ratingPreview">
              <div :class="$style.ratingStars">
                <i v-for="n in 5" :key="n" class="fas fa-star" :class="$style.ratingStar"></i>
              </div>
            </div>
          </div>

          <!-- Question Actions -->
          <div :class="$style.questionActions">
            <button
              :class="$style.actionButton"
              @click="duplicateQuestion(index)"
              :title="isRTL ? 'تكرار السؤال' : 'Duplicate'"
            >
              <i class="fas fa-copy"></i>
            </button>
            <button
              :class="$style.actionButton"
              @click="deleteQuestion(index)"
              :title="isRTL ? 'حذف السؤال' : 'Delete'"
            >
              <i class="fas fa-trash"></i>
            </button>
            <div :class="$style.actionDivider"></div>
            <label :class="$style.requiredToggle">
              <input type="checkbox" v-model="question.is_required" />
              <span>{{ isRTL ? 'مطلوب' : 'Required' }}</span>
            </label>
          </div>
        </div>

        <!-- Add Question Button -->
        <div :class="$style.addQuestionSection">
          <button :class="$style.addQuestionButton" @click="addQuestion">
            <i class="fas fa-plus-circle"></i>
            <span>{{ isRTL ? 'إضافة سؤال' : 'Add Question' }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreview" :class="$style.previewOverlay" @click="togglePreview">
      <div :class="$style.previewModal" @click.stop>
        <div :class="$style.previewHeader">
          <h2>{{ isRTL ? 'معاينة الاستطلاع' : 'Survey Preview' }}</h2>
          <button :class="$style.closePreview" @click="togglePreview">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div :class="$style.previewContent">
          <div :class="$style.previewSurveyHeader">
            <h1>{{ surveyData.title || (isRTL ? 'عنوان الاستطلاع' : 'Survey Title') }}</h1>
            <p v-if="surveyData.description">{{ surveyData.description }}</p>
          </div>
          <div :class="$style.previewQuestions">
            <div v-for="(question, index) in surveyData.questions" :key="index" :class="$style.previewQuestion">
              <div :class="$style.previewQuestionText">
                {{ index + 1 }}. {{ question.text || (isRTL ? 'نص السؤال' : 'Question Text') }}
                <span v-if="question.is_required" :class="$style.requiredMark">*</span>
              </div>
              <div :class="$style.previewAnswer">
                <div v-if="question.question_type === 'text'" :class="$style.previewInput">
                  {{ isRTL ? 'إجابة نصية قصيرة' : 'Short text answer' }}
                </div>
                <div v-else-if="question.question_type === 'textarea'" :class="$style.previewTextarea">
                  {{ isRTL ? 'إجابة نصية طويلة' : 'Long text answer' }}
                </div>
                <div v-else-if="question.question_type === 'yes_no'" :class="$style.previewOptions">
                  <div :class="$style.previewOption">○ {{ isRTL ? 'نعم' : 'Yes' }}</div>
                  <div :class="$style.previewOption">○ {{ isRTL ? 'لا' : 'No' }}</div>
                </div>
                <div v-else-if="needsOptions(question.question_type)" :class="$style.previewOptions">
                  <div
                    v-for="(option, optIndex) in getQuestionOptions(question)"
                    :key="optIndex"
                    :class="$style.previewOption"
                  >
                    {{ question.question_type === 'multiple_choice' ? '☐' : '○' }} {{ option }}
                  </div>
                </div>
                <div v-else-if="question.question_type === 'rating'" :class="$style.previewRating">
                  <i v-for="n in 5" :key="n" class="fas fa-star"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scheduling Settings Modal -->
    <Teleport to="body">
      <div v-if="showSchedulingModal" :class="$style.modalOverlay" @click="closeSchedulingModal">
        <div :class="$style.modalContainer" @click.stop :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
          <div :class="$style.modalHeader">
            <h3>
              <i class="fas fa-calendar-alt"></i>
              {{ isRTL ? 'إعدادات الجدولة' : 'Scheduling Settings' }}
            </h3>
            <button :class="$style.closeButton" @click="closeSchedulingModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div :class="$style.modalBody">
            <p :class="$style.helpText">{{ isRTL ? 'حدد متى سيكون الاستطلاع نشطًا. اترك الحقول فارغة للبدء فورًا والاستمرار إلى أجل غير مسمى.' : 'Set when the survey will be active. Leave fields empty to start immediately and run indefinitely.' }}</p>
            
            <div :class="$style.formGrid">
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-play" :class="$style.labelIcon"></i>
                  {{ isRTL ? 'تاريخ البداية' : 'Start Date' }}
                </label>
                <FlatPickr
                  v-model="schedulingSettings.start_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  :placeholder="isRTL ? 'اختر تاريخ ووقت البداية' : 'Select start date and time'"
                />
                <div :class="$style.fieldHelp">
                  {{ isRTL ? 'متى سيكون الاستطلاع متاحًا للمستجيبين' : 'When the survey will become available to respondents' }}
                </div>
              </div>
              
              <div :class="$style.formGroup">
                <label :class="$style.formLabel">
                  <i class="fas fa-stop" :class="$style.labelIcon"></i>
                  {{ isRTL ? 'تاريخ النهاية' : 'End Date' }}
                </label>
                <FlatPickr
                  v-model="schedulingSettings.end_date"
                  :config="fpConfig"
                  :class="$style.formInput"
                  :placeholder="isRTL ? 'اختر تاريخ ووقت النهاية' : 'Select end date and time'"
                />
                <div :class="$style.fieldHelp">
                  {{ isRTL ? 'متى سيتوقف الاستطلاع عن قبول الردود' : 'When the survey will stop accepting responses' }}
                </div>
              </div>
            </div>

            <!-- Scheduling Preview -->
            <div v-if="schedulingPreview" :class="$style.schedulingPreview">
              <div :class="[$style.previewItem, $style[schedulingPreview.status]]">
                <i :class="[schedulingPreview.icon, $style.previewIcon]"></i>
                <div :class="$style.previewContent">
                  <h4 :class="$style.previewTitle">{{ schedulingPreview.title }}</h4>
                  <p :class="$style.previewDescription">{{ schedulingPreview.description }}</p>
                </div>
              </div>
            </div>
          </div>
          <div :class="$style.modalFooter">
            <button :class="[$style.modalButton, $style.cancelButton]" @click="closeSchedulingModal">
              {{ isRTL ? 'إلغاء' : 'Cancel' }}
            </button>
            <button :class="[$style.modalButton, $style.saveButton]" @click="saveSchedulingSettings">
              <i class="fas fa-check"></i>
              {{ isRTL ? 'حفظ' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Survey Settings Modal -->
    <Teleport to="body">
      <div v-if="showSurveySettingsModal" :class="$style.modalOverlay" @click="closeSurveySettingsModal">
        <div :class="$style.modalContainer" @click.stop :data-theme="currentTheme" :dir="isRTL ? 'rtl' : 'ltr'">
          <div :class="$style.modalHeader">
            <h3>
              <i class="fas fa-cog"></i>
              {{ isRTL ? 'إعدادات الاستطلاع' : 'Survey Settings' }}
            </h3>
            <button :class="$style.closeButton" @click="closeSurveySettingsModal">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div :class="$style.modalBody">
            <div :class="$style.settingItem">
              <div :class="$style.settingContent">
                <h4 :class="$style.settingTitle">
                  <i class="fas fa-toggle-on"></i>
                  {{ isRTL ? 'حالة الاستطلاع' : 'Survey Status' }}
                </h4>
                <p :class="$style.settingDescription">
                  {{ isRTL ? 'تفعيل أو تعطيل الاستطلاع' : 'Activate or deactivate the survey' }}
                </p>
              </div>
              <button
                type="button"
                :class="[$style.toggle, { [$style.active]: surveySettings.is_active }]"
                @click="surveySettings.is_active = !surveySettings.is_active"
              >
                <span :class="$style.toggleSlider"></span>
              </button>
            </div>
          </div>
          <div :class="$style.modalFooter">
            <button :class="[$style.modalButton, $style.cancelButton]" @click="closeSurveySettingsModal">
              {{ isRTL ? 'إلغاء' : 'Cancel' }}
            </button>
            <button :class="[$style.modalButton, $style.saveButton]" @click="saveSurveySettings">
              <i class="fas fa-check"></i>
              {{ isRTL ? 'حفظ' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import type { PredefinedTemplate, SurveyTemplate, RecentSurvey, Survey, QuestionType } from '../../types/survey.types'
import FlatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import Swal from 'sweetalert2'

// Props
interface Props {
  template?: PredefinedTemplate | SurveyTemplate | RecentSurvey | Survey | null
  mode?: 'create' | 'edit'
  surveyId?: string
}

const props = withDefaults(defineProps<Props>(), {
  template: null,
  mode: 'create',
  surveyId: undefined
})

// Emits
const emit = defineEmits<{
  back: []
  publish: [surveyData: any]
  saveDraft: [surveyData: any]
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')

// Check if we're creating a template (no template prop provided)
const isCreatingTemplate = computed(() => !props.template)

// State
const surveyData = ref<{
  title: string
  description: string
  questions: Array<{
    tempId: string
    text: string
    question_type: QuestionType
    options?: string[]
    is_required: boolean
    order: number
  }>
}>({
  title: '',
  description: '',
  questions: []
})

const errors = ref<Record<string, string>>({})
const activeQuestionIndex = ref<number | null>(null)
const showPreview = ref(false)
const draggedQuestionIndex = ref<number | null>(null)

// Scheduling and Settings State
const showSchedulingModal = ref(false)
const showSurveySettingsModal = ref(false)
const schedulingSettings = ref({
  start_date: null as string | null,
  end_date: null as string | null
})
const surveySettings = ref({
  is_active: true
})

// Computed
const canPublish = computed(() => {
  return (
    surveyData.value.title.trim().length > 0 &&
    surveyData.value.questions.length > 0 &&
    surveyData.value.questions.every(q => q.text.trim().length > 0)
  )
})

// Flatpickr configuration
const fpConfig = computed(() => ({
  enableTime: true,
  time_24hr: true,              // Force 24-hour UI (no AM/PM)
  altInput: true,               // Show a nice 24h value to the user
  altFormat: 'Y-m-d H:i',       // UI display format (24h)
  dateFormat: "Y-m-d\\TH:i:S",  // Backend value format (unchanged)
  allowInput: true,
  minuteIncrement: 1
}))

// Scheduling preview
const schedulingPreview = computed(() => {
  const now = new Date()
  const startDate = schedulingSettings.value.start_date ? new Date(schedulingSettings.value.start_date) : null
  const endDate = schedulingSettings.value.end_date ? new Date(schedulingSettings.value.end_date) : null

  // Scenario 1: No dates
  if (!startDate && !endDate) {
    return {
      status: 'active',
      icon: 'fas fa-play-circle',
      title: isRTL.value ? 'يبدأ فورًا ويستمر إلى أجل غير مسمى' : 'Starts immediately, runs indefinitely',
      description: isRTL.value ? 'الاستطلاع سيكون نشطًا فور الإنشاء ولن ينتهي حتى يتم إيقافه يدوياً' : 'Survey will be active immediately after creation and won\'t expire until manually deactivated'
    }
  }

  // Scenario 2: Start only
  if (startDate && !endDate) {
    const isScheduled = startDate > now
    return {
      status: isScheduled ? 'scheduled' : 'active',
      icon: isScheduled ? 'fas fa-clock' : 'fas fa-play-circle',
      title: isRTL.value 
        ? (isScheduled ? `مجدول للبدء ${startDate.toLocaleDateString('ar')}` : 'يبدأ فورًا ويستمر إلى أجل غير مسمى')
        : (isScheduled ? `Scheduled to start ${startDate.toLocaleDateString()}` : 'Starts immediately, runs indefinitely'),
      description: isRTL.value 
        ? (isScheduled ? 'الاستطلاع سيبدأ في التاريخ المحدد ويستمر حتى يتم إيقافه يدوياً' : 'الاستطلاع نشط حالياً ويستمر حتى يتم إيقافه يدوياً')
        : (isScheduled ? 'Survey will start on the specified date and run indefinitely until manually deactivated' : 'Survey is active now and will run indefinitely until manually deactivated')
    }
  }

  // Scenario 3: End only
  if (!startDate && endDate) {
    const isExpired = endDate < now
    return {
      status: isExpired ? 'expired' : 'active',
      icon: isExpired ? 'fas fa-stop-circle' : 'fas fa-play-circle',
      title: isRTL.value 
        ? (isExpired ? 'منتهي الصلاحية' : `يبدأ الآن، ينتهي ${endDate.toLocaleDateString('ar')}`)
        : (isExpired ? 'Expired' : `Starts now, expires ${endDate.toLocaleDateString()}`),
      description: isRTL.value 
        ? (isExpired ? 'انتهت صلاحية الاستطلاع' : 'الاستطلاع نشط حالياً وسينتهي في التاريخ المحدد')
        : (isExpired ? 'Survey has expired' : 'Survey is active now and will expire on the specified date')
    }
  }

  // Scenario 4: Both dates
  if (startDate && endDate) {
    const isScheduled = startDate > now
    const isExpired = endDate < now
    const isActive = startDate <= now && endDate > now
    
    let status: string, icon: string, title: string, description: string

    if (isExpired) {
      status = 'expired'
      icon = 'fas fa-stop-circle'
      title = isRTL.value ? 'منتهي الصلاحية' : 'Expired'
      description = isRTL.value ? 'انتهت صلاحية الاستطلاع' : 'Survey has expired'
    } else if (isScheduled) {
      status = 'scheduled'
      icon = 'fas fa-clock'
      title = isRTL.value 
        ? `مجدول من ${startDate.toLocaleDateString('ar')} إلى ${endDate.toLocaleDateString('ar')}`
        : `Scheduled from ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`
      description = isRTL.value ? 'الاستطلاع سيعمل خلال النافذة الزمنية المحددة' : 'Survey will run within the specified time window'
    } else if (isActive) {
      status = 'active'
      icon = 'fas fa-play-circle'
      title = isRTL.value 
        ? `نشط حتى ${endDate.toLocaleDateString('ar')}`
        : `Active until ${endDate.toLocaleDateString()}`
      description = isRTL.value ? 'الاستطلاع نشط حالياً وسينتهي في التاريخ المحدد' : 'Survey is currently active and will expire on the specified date'
    } else {
      status = 'inactive'
      icon = 'fas fa-pause-circle'
      title = isRTL.value ? 'غير نشط' : 'Inactive'
      description = isRTL.value ? 'حالة غير متوقعة' : 'Unexpected state'
    }

    return { status, icon, title, description }
  }

  return null
})

// Methods
const initializeSurvey = () => {
  if (props.template) {
    // Check if it's a full Survey object
    if ('questions' in props.template && Array.isArray(props.template.questions)) {
      surveyData.value = {
        title: (props.template as any).name || (props.template as any).title || '',
        description: (props.template as any).description || '',
        questions: props.template.questions.map((q: any, index: number) => ({
          tempId: `temp-${Date.now()}-${index}`,
          text: q.text || '',
          question_type: q.question_type,
          options: q.options ? (typeof q.options === 'string' ? JSON.parse(q.options) : q.options) : [],
          is_required: q.is_required || false,
          order: index + 1
        }))
      }
    }
  } else {
    // Start with empty survey and one default question
    addQuestion()
  }
}

const validateTitle = () => {
  if (!surveyData.value.title.trim()) {
    errors.value.title = isRTL.value ? 'العنوان مطلوب' : 'Title is required'
  } else {
    delete errors.value.title
  }
}

const setActiveQuestion = (index: number) => {
  activeQuestionIndex.value = index
}

const needsOptions = (questionType: QuestionType): boolean => {
  return ['single_choice', 'multiple_choice'].includes(questionType)
}

const getQuestionOptions = (question: any): string[] => {
  if (!question.options) {
    question.options = [isRTL.value ? 'خيار 1' : 'Option 1']
  }
  return question.options
}

const updateQuestionOptions = (question: any, newOptions: string[]) => {
  question.options = newOptions
}

const addOption = (question: any) => {
  const options = getQuestionOptions(question)
  const newOptionNumber = options.length + 1
  options.push(isRTL.value ? `خيار ${newOptionNumber}` : `Option ${newOptionNumber}`)
}

const removeOption = (question: any, optionIndex: number) => {
  const options = getQuestionOptions(question)
  if (options.length > 1) {
    options.splice(optionIndex, 1)
  }
}

const getOptionIcon = (questionType: QuestionType): string => {
  return questionType === 'multiple_choice' ? 'far fa-square' : 'far fa-circle'
}

const addQuestion = () => {
  const newQuestion = {
    tempId: `temp-${Date.now()}`,
    text: '',
    question_type: 'text' as QuestionType,
    options: [],
    is_required: false,
    order: surveyData.value.questions.length + 1
  }
  surveyData.value.questions.push(newQuestion)
  
  // Auto-focus on the new question
  setTimeout(() => {
    setActiveQuestion(surveyData.value.questions.length - 1)
  }, 100)
}

const duplicateQuestion = (index: number) => {
  const originalQuestion = surveyData.value.questions[index]
  const duplicatedQuestion = {
    ...originalQuestion,
    tempId: `temp-${Date.now()}`,
    order: index + 2
  }
  surveyData.value.questions.splice(index + 1, 0, duplicatedQuestion)
  
  // Update order for subsequent questions
  updateQuestionOrders()
}

const deleteQuestion = async (index: number) => {
  if (surveyData.value.questions.length === 1) {
    Swal.fire({
      icon: 'warning',
      title: isRTL.value ? 'تحذير' : 'Warning',
      text: isRTL.value ? 'يجب أن يحتوي الاستطلاع على سؤال واحد على الأقل' : 'Survey must have at least one question',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الحذف' : 'Confirm Delete',
    text: isRTL.value ? 'هل تريد حذف هذا السؤال؟' : 'Do you want to delete this question?',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'حذف' : 'Delete',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    surveyData.value.questions.splice(index, 1)
    updateQuestionOrders()
  }
}

const updateQuestionOrders = () => {
  surveyData.value.questions.forEach((question, index) => {
    question.order = index + 1
  })
}

// Drag and Drop handlers
const handleDragStart = (index: number, event: DragEvent) => {
  draggedQuestionIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', index.toString())
  }
}

const handleDragEnd = () => {
  draggedQuestionIndex.value = null
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

const handleDrop = (dropIndex: number, event: DragEvent) => {
  event.preventDefault()
  
  if (draggedQuestionIndex.value === null || draggedQuestionIndex.value === dropIndex) {
    return
  }

  const draggedIndex = draggedQuestionIndex.value
  const questions = [...surveyData.value.questions]
  
  // Remove the dragged item
  const [draggedItem] = questions.splice(draggedIndex, 1)
  
  // Insert at new position
  questions.splice(dropIndex, 0, draggedItem)
  
  // Update the questions array
  surveyData.value.questions = questions
  
  // Update order numbers
  updateQuestionOrders()
  
  // Clear dragged index
  draggedQuestionIndex.value = null
}

const togglePreview = () => {
  showPreview.value = !showPreview.value
}

// Scheduling Modal Methods
const openSchedulingModal = () => {
  showSchedulingModal.value = true
}

const closeSchedulingModal = () => {
  showSchedulingModal.value = false
}

const saveSchedulingSettings = () => {
  closeSchedulingModal()
  Swal.fire({
    icon: 'success',
    title: isRTL.value ? 'تم الحفظ' : 'Saved',
    text: isRTL.value ? 'تم حفظ إعدادات الجدولة بنجاح' : 'Scheduling settings saved successfully',
    timer: 1500,
    showConfirmButton: false
  })
}

// Survey Settings Modal Methods
const openSurveySettingsModal = () => {
  showSurveySettingsModal.value = true
}

const closeSurveySettingsModal = () => {
  showSurveySettingsModal.value = false
}

const saveSurveySettings = () => {
  closeSurveySettingsModal()
  Swal.fire({
    icon: 'success',
    title: isRTL.value ? 'تم الحفظ' : 'Saved',
    text: isRTL.value ? 'تم حفظ إعدادات الاستطلاع بنجاح' : 'Survey settings saved successfully',
    timer: 1500,
    showConfirmButton: false
  })
}

const handleBack = async () => {
  const result = await Swal.fire({
    icon: 'warning',
    title: isRTL.value ? 'تأكيد الخروج' : 'Confirm Exit',
    text: isRTL.value ? 'هل تريد الخروج؟ لن يتم حفظ التغييرات.' : 'Do you want to exit? Changes will not be saved.',
    showCancelButton: true,
    confirmButtonText: isRTL.value ? 'نعم، اخرج' : 'Yes, Exit',
    cancelButtonText: isRTL.value ? 'إلغاء' : 'Cancel',
    confirmButtonColor: '#d33'
  })

  if (result.isConfirmed) {
    emit('back')
  }
}

const prepareSurveyData = () => {
  return {
    title: surveyData.value.title,
    description: surveyData.value.description,
    visibility: 'AUTH',
    is_active: surveySettings.value.is_active,
    start_date: schedulingSettings.value.start_date,
    end_date: schedulingSettings.value.end_date,
    questions: surveyData.value.questions.map(q => ({
      text: q.text,
      question_type: q.question_type,
      options: needsOptions(q.question_type) ? JSON.stringify(q.options) : undefined,
      is_required: q.is_required,
      order: q.order
    }))
  }
}

const handleSaveAsDraft = () => {
  validateTitle()
  
  if (!canPublish.value) {
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ' : 'Error',
      text: isRTL.value ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const draftData = prepareSurveyData()
  emit('saveDraft', draftData)
}

const handlePublish = () => {
  validateTitle()
  
  if (!canPublish.value) {
    Swal.fire({
      icon: 'error',
      title: isRTL.value ? 'خطأ' : 'Error',
      text: isRTL.value ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields',
      confirmButtonText: isRTL.value ? 'موافق' : 'OK'
    })
    return
  }

  const publishData = prepareSurveyData()
  emit('publish', publishData)
}

// Lifecycle
onMounted(() => {
  initializeSurvey()
})
</script>

<style module src="./SurveyEditor.module.css">
/* CSS Module styles are imported from SurveyEditor.module.css */
</style>
