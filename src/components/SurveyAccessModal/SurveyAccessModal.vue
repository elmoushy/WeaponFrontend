<template>
  <div :class="$style.modalOverlay" @click="handleOverlayClick">
    <div 
      :class="$style.modalContainer" 
      :data-theme="currentTheme" 
      :dir="isRTL ? 'rtl' : 'ltr'"
      @click.stop
    >
      <!-- Header -->
      <div :class="$style.modalHeader">
        <h2 :class="$style.modalTitle">
          <i class="fas fa-share-alt" :class="$style.modalIcon"></i>
          {{ getText('survey.access.title') }}
        </h2>
        <button :class="$style.closeButton" @click="$emit('cancel')">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <!-- Body -->
      <div :class="$style.modalBody">
        <!-- Compact Access Level Selection -->
        <div :class="$style.accessSection">
          <div :class="$style.sectionHeader">
            <h3 :class="$style.sectionTitle">
              <i class="fas fa-key" :class="$style.sectionIcon"></i>
              {{ getText('survey.access.level') }}
            </h3>
          </div>
          
          <div :class="$style.accessOptions">
            <!-- Public Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'PUBLIC' }]"
              @click="handleAccessChange('PUBLIC')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-globe" :class="[$style.optionIcon, $style.public]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('survey.access.public.title') }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.public.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                  <div :class="$style.radioButton"></div>
                </div>
              </div>
              
              <!-- Compact Public Link Management -->
              <div v-if="selectedAccess === 'PUBLIC'" :class="$style.publicLinkSection">
                <div v-if="publicLink" :class="$style.linkContainer">
                  <!-- Link Display -->
                  <div :class="$style.linkDisplay">
                    <input 
                      type="text" 
                      :value="publicLink.link" 
                      :class="$style.linkInput"
                      readonly
                    />
                    <button 
                      :class="$style.copyButton"
                      @click="copyToClipboard(publicLink.link)"
                      :title="getText('common.copy')"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>

                  <!-- QR Code Display -->
                  <div :class="$style.qrDisplay">
                    <div :class="$style.qrCodeContainer">
                      <canvas 
                        ref="qrCanvas" 
                        :class="$style.qrCanvas"
                        width="200" 
                        height="200"
                      ></canvas>
                      <div :class="$style.qrLabel">
                        {{ getText('survey.access.scanToAccess') }}
                      </div>
                    </div>
                    <div :class="$style.qrActions">
                      <button 
                        :class="$style.qrActionButton"
                        @click="downloadQRCode"
                        :title="getText('survey.access.downloadQR')"
                      >
                        <i class="fas fa-download"></i>
                        {{ getText('survey.access.download') }}
                      </button>
                      <button 
                        :class="$style.qrActionButton"
                        @click="copyQRToClipboard"
                        :title="getText('survey.access.copyQR')"
                      >
                        <i class="fas fa-copy"></i>
                        {{ getText('survey.access.copy') }}
                      </button>
                      <!-- <button 
                        :class="$style.qrActionButton"
                        @click="downloadSharePackage"
                        :title="getText('survey.access.downloadPackage')"
                      >
                        <i class="fas fa-file-archive"></i>
                        {{ getText('survey.access.package') }}
                      </button> -->
                    </div>
                  </div>

                  <!-- Share Actions -->
                  <div :class="$style.shareActions">
                    <button 
                      :class="[$style.shareButton, { [$style.disabled]: !publicLink }]"
                      @click="shareByEmail"
                      :disabled="!publicLink"
                      :title="getText('survey.access.shareByEmail')"
                    >
                      <i class="fas fa-envelope"></i>
                      {{ getText('survey.access.email') }}
                    </button>
                    <button 
                      :class="[$style.shareButton, { [$style.disabled]: !publicLink }]"
                      @click="shareByWhatsApp"
                      :disabled="!publicLink"
                      :title="getText('survey.access.shareByWhatsApp')"
                    >
                      <i class="fab fa-whatsapp"></i>
                      {{ getText('survey.access.whatsapp') }}
                    </button>
                    <button 
                      :class="[$style.shareButton, { [$style.disabled]: !publicLink }]"
                      @click="shareBySMS"
                      :disabled="!publicLink"
                      :title="getText('survey.access.shareBySMS')"
                    >
                      <i class="fas fa-sms"></i>
                      {{ getText('survey.access.sms') }}
                    </button>
                  </div>

                  <!-- Common Actions -->
                  <div :class="$style.linkActions">
                    <button :class="$style.actionButton" @click="regenerateLink">
                      <i class="fas fa-sync-alt"></i>
                      {{ getText('survey.access.regenerate') }}
                    </button>
                    <button :class="[$style.actionButton, $style.danger]" @click="revokeLink">
                      <i class="fas fa-ban"></i>
                      {{ getText('survey.access.revoke') }}
                    </button>
                  </div>
                </div>
                
                <div v-else :class="$style.generateLinkSection">
                  <button :class="$style.generateButton" @click="generateLink" :disabled="isGeneratingLink">
                    <div v-if="isGeneratingLink" :class="$style.loadingSpinner"></div>
                    <i v-else class="fas fa-link"></i>
                    {{ getText('survey.access.generateLink') }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Authenticated Users Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'AUTH' }]"
              @click="handleAccessChange('AUTH')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-users" :class="[$style.optionIcon, $style.auth]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('survey.access.authenticated.title') }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.authenticated.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                  <div :class="$style.radioButton"></div>
                </div>
              </div>
            </div>

            <!-- Group Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'GROUPS' }]"
              @click="handleAccessChange('GROUPS')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-users-cog" :class="[$style.optionIcon, $style.groups]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('survey.access.groups.title') }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.groups.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                  <div :class="$style.radioButton"></div>
                </div>
              </div>
              
              <!-- Compact Group Management -->
              <div v-if="selectedAccess === 'GROUPS'" :class="$style.groupsSection">
                <div :class="$style.groupManagement">
                  <!-- Selected Groups Count -->
                  <div v-if="selectedGroups.length > 0" :class="$style.groupsCount">
                    <i class="fas fa-users-cog"></i>
                    <span>{{ selectedGroups.length }} {{ getText('survey.access.groupsSelected') }}</span>
                    <button 
                      :class="$style.clearAllButton"
                      @click="clearAllGroups"
                      :title="getText('survey.access.clearAll')"
                    >
                      <i class="fas fa-times-circle"></i>
                    </button>
                  </div>
                  
                  <!-- Groups List -->
                  <div v-if="availableGroups.length > 0" :class="$style.groupsList">
                    <div 
                      v-for="group in availableGroups" 
                      :key="group.id"
                      :class="[$style.groupItem, { [$style.selected]: isGroupSelected(group.id) }]"
                      @click="toggleGroupSelection(group)"
                      role="button"
                      :aria-pressed="isGroupSelected(group.id)"
                      :tabindex="0"
                      @keydown.enter="toggleGroupSelection(group)"
                      @keydown.space.prevent="toggleGroupSelection(group)"
                    >
                      <div :class="$style.groupCheckbox">
                        <input 
                          type="checkbox"
                          :checked="isGroupSelected(group.id)"
                          :id="`group-${group.id}`"
                          :class="$style.hiddenCheckbox"
                          @click.stop
                          @change="toggleGroupSelection(group)"
                        />
                        <label 
                          :for="`group-${group.id}`" 
                          :class="$style.customCheckbox"
                          @click.stop
                        >
                          <i :class="isGroupSelected(group.id) ? 'fas fa-check' : ''"></i>
                        </label>
                      </div>
                      <div :class="$style.groupInfo">
                        <span :class="$style.groupName">{{ group.name }}</span>
                        <small :class="$style.groupDescription">
                          {{ group.user_count }} {{ getText('survey.access.members') }}
                          <span v-if="group.admin_level" :class="$style.adminLevel">
                            ({{ getText(`userManagement.adminLevel.${group.admin_level}`) || group.admin_level }})
                          </span>
                        </small>
                      </div>
                      <div :class="$style.groupStatus">
                        <i v-if="isGroupSelected(group.id)" class="fas fa-check-circle" :class="$style.selectedIcon"></i>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Select All/None Actions -->
                  <div v-if="availableGroups.length > 0" :class="$style.bulkActions">
                    <button 
                      :class="$style.bulkActionButton"
                      @click="selectAllGroups"
                      :disabled="selectedGroups.length === availableGroups.length"
                    >
                      <i class="fas fa-check-double"></i>
                      {{ getText('survey.access.selectAll') }}
                    </button>
                    <button 
                      :class="$style.bulkActionButton"
                      @click="clearAllGroups"
                      :disabled="selectedGroups.length === 0"
                    >
                      <i class="fas fa-times"></i>
                      {{ getText('survey.access.clearAll') }}
                    </button>
                  </div>
                  
                  <!-- Loading/Empty State -->
                  <div v-else-if="isLoadingGroups" :class="$style.loadingState">
                    <div :class="$style.loadingSpinner"></div>
                    <span>{{ getText('survey.access.loadingGroups') }}</span>
                  </div>
                  
                  <div v-else :class="$style.emptyState">
                    <i class="fas fa-users-slash"></i>
                    <span>{{ getText('survey.access.noGroups') }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Private Access -->
            <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'PRIVATE' }]"
              @click="handleAccessChange('PRIVATE')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <!-- <i class="fas fa-lock" :class="[$style.optionIcon, $style.private]"></i> -->
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('survey.access.private.title') }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.private.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                  <div :class="$style.radioButton"></div>
                </div>
              </div>
              
              <!-- Compact Private User Management -->
              <div v-if="selectedAccess === 'PRIVATE'" :class="$style.privateUsersSection">
                <div :class="$style.userManagement">
                  <!-- Quick User Search -->
                  <div :class="$style.userSearch">
                    <input
                      type="text"
                      :class="$style.searchInput"
                      :placeholder="getText('survey.access.searchUsers')"
                      v-model="userSearchQuery"
                      @input="handleUserSearch"
                    />
                    <i class="fas fa-search" :class="$style.searchIcon"></i>
                    
                    <!-- Compact Search Results -->
                    <div v-if="userSearchResults.length > 0" :class="$style.searchResults">
                      <div 
                        v-for="user in userSearchResults" 
                        :key="user.id"
                        :class="$style.searchResultItem"
                        @click="addUser(user)"
                      >
                        <span :class="$style.userName">{{ user.name }}</span>
                        <i class="fas fa-plus"></i>
                      </div>
                    </div>
                  </div>

                  <!-- Selected Users Count -->
                  <div v-if="selectedUsers.length > 0" :class="$style.usersCount">
                    <i class="fas fa-users"></i>
                    <span>{{ selectedUsers.length }} {{ getText('survey.access.usersSelected') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Status Message -->
        <!-- <div v-if="statusMessage" :class="[$style.statusMessage, statusMessage.type]">
          <i :class="statusMessage.icon"></i>
          <span>{{ statusMessage.text }}</span>
        </div> -->
      </div>

      <!-- Footer -->
      <div :class="$style.modalFooter">
        <button
          type="button"
          :class="[$style.footerButton, $style.cancelButton]"
          @click="$emit('cancel')"
        >
          {{ getText('common.cancel') }}
        </button>
        
        <button
          type="button"
          :class="[$style.footerButton, $style.saveButton, { [$style.loading]: isSaving }]"
          @click="handleSave"
          :disabled="isSaveDisabled"
          :title="saveButtonTooltip"
        >
          <div v-if="isSaving" :class="$style.loadingSpinner"></div>
          <i v-else class="fas fa-save"></i>
          {{ getText('survey.access.saveChanges') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import QRCode from 'qrcode'
import type { 
  Survey, 
  SurveyVisibility, 
  PublicLinkResponse,
  User,
  ShareRequest,
  AdminGroup
} from '../../types/survey.types'

// Props
interface Props {
  survey: Survey
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  save: [data: { visibility: SurveyVisibility; users: User[]; emails: string[]; groups?: AdminGroup[] }]
  cancel: []
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const currentLanguage = computed(() => store.currentLanguage)

// Check if save button should be disabled
const isSaveDisabled = computed(() => {
  if (isSaving.value) return true
  
  // Disable save if GROUPS is selected but no groups available
  if (selectedAccess.value === 'GROUPS' && availableGroups.value.length === 0 && !isLoadingGroups.value) {
    return true
  }
  
  return false
})

// Tooltip text for disabled save button
const saveButtonTooltip = computed(() => {
  if (isSaving.value) {
    return currentLanguage.value === 'ar' ? 'جاري الحفظ...' : 'Saving...'
  }
  
  if (selectedAccess.value === 'GROUPS' && availableGroups.value.length === 0 && !isLoadingGroups.value) {
    return currentLanguage.value === 'ar' 
      ? 'لا يمكن الحفظ - لا توجد مجموعات متاحة للمشاركة'
      : 'Cannot save - No groups available for sharing'
  }
  
  return currentLanguage.value === 'ar' ? 'حفظ التغييرات' : 'Save Changes'
})

// Inline translations
const translations = computed(() => {
  const translationsMap: Record<string, string> = currentLanguage.value === 'ar' ? {
    // Modal
    'survey.access.title': 'مشاركة الاستطلاع',
    'survey.access.level': 'مستوى الوصول',
    
    // Public Access
    'survey.access.public.title': 'عام',
    'survey.access.public.description': 'أي شخص لديه الرابط',
    'survey.access.linkMode': 'رابط',
    'survey.access.qrMode': 'رمز QR',
    'survey.access.scanToAccess': 'امسح للوصول إلى الاستطلاع',
    'survey.access.generateLink': 'إنشاء رابط',
    'survey.access.regenerate': 'إعادة إنشاء',
    'survey.access.revoke': 'إلغاء',
    'survey.access.download': 'تحميل',
    'survey.access.copy': 'نسخ',
    'survey.access.downloadQR': 'تحميل رمز QR',
    'survey.access.copyQR': 'نسخ رمز QR',
    'survey.access.shareByEmail': 'مشاركة عبر البريد الإلكتروني',
    'survey.access.shareByWhatsApp': 'مشاركة عبر واتساب',
    'survey.access.shareBySMS': 'مشاركة عبر الرسائل النصية',
    'survey.access.email': 'بريد إلكتروني',
    'survey.access.whatsapp': 'واتساب',
    'survey.access.sms': 'رسائل نصية',
    'survey.access.downloadPackage': 'تحميل حزمة المشاركة',
    'survey.access.package': 'حزمة',
    'survey.access.confirmRegenerateLink': 'إعادة إنشاء الرابط العام؟',
    'survey.access.confirmRevokeLink': 'إلغاء الرابط العام؟',
    
    // Authenticated Access
    'survey.access.authenticated.title': 'مصدق',
    'survey.access.authenticated.description': 'المستخدمون المسجلون فقط',
    
    // Group Access
    'survey.access.groups.title': 'مجموعات',
    'survey.access.groups.description': 'مجموعات محددة فقط',
    'survey.access.groupsSelected': 'مجموعات محددة',
    'survey.access.loadingGroups': 'جاري تحميل المجموعات...',
    'survey.access.noGroups': 'لا توجد مجموعات متاحة للمشاركة',
    'survey.access.members': 'أعضاء',
    'survey.access.selectAll': 'تحديد الكل',
    'survey.access.clearAll': 'إلغاء الكل',
    
    // Private Access
    'survey.access.private.title': 'خاص',
    'survey.access.private.description': 'مستخدمون محددون فقط',
    'survey.access.searchUsers': 'البحث عن المستخدمين...',
    'survey.access.usersSelected': 'مستخدمين محددين',
    
    // Common
    'common.cancel': 'إلغاء',
    'common.copy': 'نسخ',
    'survey.access.saveChanges': 'حفظ التغييرات',
    
    // Admin Levels
    'userManagement.adminLevel.admin': 'مدير',
    'userManagement.adminLevel.super_admin': 'مدير عام',
    'userManagement.adminLevel.moderator': 'مشرف'
  } : {
    // Modal
    'survey.access.title': 'Share Survey',
    'survey.access.level': 'Access Level',
    
    // Public Access
    'survey.access.public.title': 'Public',
    'survey.access.public.description': 'Anyone with link',
    'survey.access.linkMode': 'Link',
    'survey.access.qrMode': 'QR Code',
    'survey.access.scanToAccess': 'Scan to access survey',
    'survey.access.generateLink': 'Generate Link',
    'survey.access.regenerate': 'Regenerate',
    'survey.access.revoke': 'Revoke',
    'survey.access.download': 'Download',
    'survey.access.copy': 'Copy',
    'survey.access.downloadQR': 'Download QR Code',
    'survey.access.copyQR': 'Copy QR Code',
    'survey.access.shareByEmail': 'Share by Email',
    'survey.access.shareByWhatsApp': 'Share by WhatsApp',
    'survey.access.shareBySMS': 'Share by SMS',
    'survey.access.email': 'Email',
    'survey.access.whatsapp': 'WhatsApp',
    'survey.access.sms': 'SMS',
    'survey.access.downloadPackage': 'Download Share Package',
    'survey.access.package': 'Package',
    'survey.access.confirmRegenerateLink': 'Regenerate public link?',
    'survey.access.confirmRevokeLink': 'Revoke public link?',
    
    // Authenticated Access
    'survey.access.authenticated.title': 'Authenticated',
    'survey.access.authenticated.description': 'Logged in users only',
    
    // Group Access
    'survey.access.groups.title': 'Groups',
    'survey.access.groups.description': 'Specific groups only',
    'survey.access.groupsSelected': 'groups selected',
    'survey.access.loadingGroups': 'Loading groups...',
    'survey.access.noGroups': 'No groups available for sharing',
    'survey.access.members': 'members',
    'survey.access.selectAll': 'Select All',
    'survey.access.clearAll': 'Clear All',
    
    // Private Access
    'survey.access.private.title': 'Private',
    'survey.access.private.description': 'Specific users only',
    'survey.access.searchUsers': 'Search users...',
    'survey.access.usersSelected': 'users selected',
    
    // Common
    'common.cancel': 'Cancel',
    'common.copy': 'Copy',
    'survey.access.saveChanges': 'Save Changes',
    
    // Admin Levels
    'userManagement.adminLevel.admin': 'Admin',
    'userManagement.adminLevel.super_admin': 'Super Admin',
    'userManagement.adminLevel.moderator': 'Moderator'
  }
  return translationsMap
})

// Translation helper function
const getText = (key: string, fallback?: string) => {
  return translations.value[key] || fallback || key
}

// State
const selectedAccess = ref<SurveyVisibility>(props.survey.visibility)
const publicLink = ref<PublicLinkResponse | null>(null)
const isGeneratingLink = ref(false)
const isSaving = ref(false)

// QR Code State
const qrCanvas = ref<HTMLCanvasElement | null>(null)

// Status message for user feedback
const statusMessage = ref<{
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
} | null>(null)

// User management
const userSearchQuery = ref('')
const userSearchResults = ref<User[]>([])
const selectedUsers = ref<User[]>([])
// Note: Email invitation variables kept for potential future enhancements
// const inviteEmail = ref('')
// const invitedEmails = ref<string[]>([])

// Group management
const availableGroups = ref<AdminGroup[]>([])
const selectedGroups = ref<AdminGroup[]>([])
const isLoadingGroups = ref(false)

// Methods
const handleOverlayClick = () => {
  if (!isSaving.value) {
    emit('cancel')
  }
}

const handleAccessChange = (access: SurveyVisibility) => {
  selectedAccess.value = access
  clearStatusMessage()
}

const setStatusMessage = (text: string, type: 'success' | 'error' | 'warning' | 'info') => {
  const iconMap = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-triangle',
    warning: 'fas fa-exclamation-circle',
    info: 'fas fa-info-circle'
  }
  
  statusMessage.value = {
    text,
    type,
    icon: iconMap[type]
  }
  
  // Auto-clear after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      clearStatusMessage()
    }, 5000)
  }
}

const clearStatusMessage = () => {
  statusMessage.value = null
}

// Public Link Management
const loadPublicLink = async () => {
  if (selectedAccess.value === 'PUBLIC') {
    try {
      const response = await surveyService.getPublicLink(props.survey.id)
      publicLink.value = response.data
      
    } catch (error: any) {
      // Logging removed for production
      if (error.response?.status !== 404) {
        setStatusMessage('Failed to load public link', 'error')
      }
    }
  }
}

const generateLink = async () => {
  try {
    isGeneratingLink.value = true
    clearStatusMessage()
    
    const response = await surveyService.generatePublicLink(props.survey.id, {
      days_to_expire: 30
    })
    
    publicLink.value = response.data
    setStatusMessage('Public link generated successfully', 'success')
  } catch (error: any) {
    // Logging removed for production
    const errorMessage = error.response?.data?.message || error.message || 'Failed to generate public link'
    setStatusMessage(errorMessage, 'error')
  } finally {
    isGeneratingLink.value = false
  }
}

const regenerateLink = async () => {
  if (confirm(getText('survey.access.confirmRegenerateLink'))) {
    await generateLink()
  }
}

const revokeLink = async () => {
  if (confirm(getText('survey.access.confirmRevokeLink'))) {
    try {
      await surveyService.revokePublicLink(props.survey.id)
      publicLink.value = null
      setStatusMessage('Public link revoked successfully', 'success')
    } catch (error: any) {
      // Logging removed for production
      const errorMessage = error.response?.data?.message || error.message || 'Failed to revoke public link'
      setStatusMessage(errorMessage, 'error')
    }
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    setStatusMessage('Link copied to clipboard', 'success')
  } catch (error) {
    // Logging removed for production
    setStatusMessage('Failed to copy link', 'error')
  }
}

// QR Code Functions
const generateQRCode = async (text: string): Promise<void> => {
  if (!qrCanvas.value) return

  try {
    // Use the proper QRCode library to generate a scannable QR code
    await QRCode.toCanvas(qrCanvas.value, text, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'M'  // M = 15% error correction
    })
  } catch (error) {
    // Logging removed for production
    setStatusMessage('Failed to generate QR code', 'error')
  }
}

const downloadQRCode = () => {
  if (!qrCanvas.value) return

  try {
    const link = document.createElement('a')
    link.download = `survey-qr-${props.survey.id}.png`
    link.href = qrCanvas.value.toDataURL()
    link.click()
    setStatusMessage('QR code downloaded successfully', 'success')
  } catch (error) {
    // Logging removed for production
    setStatusMessage('Failed to download QR code', 'error')
  }
}

const copyQRToClipboard = async () => {
  if (!qrCanvas.value) return

  try {
    const canvas = qrCanvas.value
    canvas.toBlob(async (blob) => {
      if (blob) {
        const item = new ClipboardItem({ 'image/png': blob })
        await navigator.clipboard.write([item])
        setStatusMessage('QR code copied to clipboard', 'success')
      }
    })
  } catch (error) {
    // Logging removed for production
    setStatusMessage('Failed to copy QR code', 'error')
  }
}

// Share Functions
/**
 * Share functionality for survey public links
 * Includes three sharing methods: Email, WhatsApp, and SMS
 * - Email: Opens default email client with subject, message, and QR code data
 * - WhatsApp: Opens WhatsApp web/app with pre-filled message
 * - SMS: Opens default SMS app with pre-filled message
 * All methods include the survey link and QR code reference
 */
const getShareMessage = (platform: 'email' | 'whatsapp' | 'sms' = 'email') => {
  const surveyTitle = props.survey.title
  const link = publicLink.value?.link || ''
  
  // Different formatting for different platforms to ensure link clickability
  if (currentLanguage.value === 'ar') {
    if (platform === 'email') {
      return `مرحباً!\n\nأدعوك للمشاركة في استطلاع: "${surveyTitle}"\n\nيمكنك الوصول إليه من خلال النقر على الرابط:\n\n${link}\n\nأو نسخ الرابط ولصقه في المتصفح.\n\nشكراً لمشاركتك! 🙏`
    } else if (platform === 'whatsapp') {
      return `🔗 مرحباً!\n\nأدعوك للمشاركة في استطلاع:\n*${surveyTitle}*\n\nالرابط:\n${link}\n\nشكراً لمشاركتك! 🙏`
    } else { // SMS
      return `استطلاع: ${surveyTitle}\n\nالرابط:\n${link}\n\nشكراً لك!`
    }
  } else {
    if (platform === 'email') {
      return `Hello!\n\nYou're invited to participate in the survey: "${surveyTitle}"\n\nAccess it by clicking this link:\n\n${link}\n\nOr copy and paste the link into your browser.\n\nThank you for your participation! 🙏`
    } else if (platform === 'whatsapp') {
      return `🔗 Hello!\n\nYou're invited to participate in the survey:\n*${surveyTitle}*\n\nLink:\n${link}\n\nThank you for your participation! 🙏`
    } else { // SMS
      return `Survey: ${surveyTitle}\n\nLink:\n${link}\n\nThank you!`
    }
  }
}

const shareByEmail = async () => {
  if (!publicLink.value) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('email')
    const subject = currentLanguage.value === 'ar' 
      ? `دعوة للمشاركة في استطلاع: ${props.survey.title}`
      : `Survey Invitation: ${props.survey.title}`
    
    // Create email body with better formatting for clickable links
    const emailBody = currentLanguage.value === 'ar' 
      ? `${message}\n\n💡 تلميح: يمكنك أيضاً تحميل رمز QR من صفحة مشاركة الاستطلاع لسهولة المشاركة مع الآخرين.`
      : `${message}\n\n💡 Tip: You can also download the QR code from the survey sharing page for easy sharing with others.`
    
    // Create and open mailto link
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    
    // Try to open email client, fallback to copying
    try {
      window.location.href = mailtoLink
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح تطبيق البريد الإلكتروني' : 'Email client opened', 'success')
    } catch (e) {
      // Fallback: copy email content to clipboard
      const fullEmailContent = `${currentLanguage.value === 'ar' ? 'الموضوع' : 'Subject'}: ${subject}\n\n${emailBody}`
      await navigator.clipboard.writeText(fullEmailContent)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ محتوى البريد الإلكتروني - يمكنك لصقه في تطبيق البريد الإلكتروني المفضل لديك'
          : 'Email content copied - you can paste it in your preferred email app', 
        'info'
      )
    }
  } catch (error) {
    // Logging removed for production
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر البريد الإلكتروني' : 'Failed to share by email', 'error')
  }
}

const shareByWhatsApp = async () => {
  if (!publicLink.value) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('whatsapp')
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    
    // Try to open WhatsApp, fallback to copying
    try {
      window.open(whatsappUrl, '_blank')
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح واتساب' : 'WhatsApp opened', 'success')
    } catch (e) {
      // Fallback: copy message to clipboard
      await navigator.clipboard.writeText(message)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ الرسالة - يمكنك لصقها في واتساب'
          : 'Message copied - you can paste it in WhatsApp', 
        'info'
      )
    }
  } catch (error) {
    // Logging removed for production
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر واتساب' : 'Failed to share by WhatsApp', 'error')
  }
}

const shareBySMS = async () => {
  if (!publicLink.value) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('sms')
    
    // SMS URL with better handling
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`
    
    // Try to open SMS, fallback to copying
    try {
      window.open(smsUrl, '_blank')
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح تطبيق الرسائل النصية' : 'SMS app opened', 'success')
    } catch (e) {
      // Fallback: copy message to clipboard
      await navigator.clipboard.writeText(message)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ الرسالة - يمكنك لصقها في تطبيق الرسائل النصية'
          : 'Message copied - you can paste it in SMS app', 
        'info'
      )
    }
  } catch (error) {
    // Logging removed for production
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر الرسائل النصية' : 'Failed to share by SMS', 'error')
  }
}

// Additional function to download both link and QR code as a package
// Currently unused but kept for future enhancement
// const downloadSharePackage = async () => {
//   if (!publicLink.value || !qrCanvas.value) {
//     setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
//     return
//   }

//   try {
//     // Create a text file with the survey information
//     const textContent = getShareMessage('email')
//     const textBlob = new Blob([textContent], { type: 'text/plain' })
    
//     // Download the text file
//     const textLink = document.createElement('a')
//     textLink.href = URL.createObjectURL(textBlob)
//     textLink.download = `survey-invitation-${props.survey.id}.txt`
//     textLink.click()
    
//     // Download the QR code
//     setTimeout(() => {
//       downloadQRCode()
//     }, 500)
    
//     setStatusMessage(currentLanguage.value === 'ar' ? 'تم تحميل حزمة المشاركة' : 'Share package downloaded', 'success')
//   } catch (error) {
//     // Logging removed for production
//     setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في تحميل حزمة المشاركة' : 'Failed to download share package', 'error')
//   }
// }

// User Search and Management
const handleUserSearch = async () => {
  if (userSearchQuery.value.length < 2) {
    userSearchResults.value = []
    return
  }

  try {
    const response = await surveyService.searchUsers(userSearchQuery.value)
    userSearchResults.value = response.data.users.filter(user => 
      !selectedUsers.value.some(selected => selected.id === user.id)
    )
  } catch (error) {
    // Logging removed for production
    setStatusMessage('Failed to search users', 'error')
  }
}

const addUser = (user: User) => {
  if (!selectedUsers.value.some(selected => selected.id === user.id)) {
    selectedUsers.value.push(user)
    userSearchResults.value = userSearchResults.value.filter(result => result.id !== user.id)
    userSearchQuery.value = ''
    setStatusMessage(`Added ${user.name} to shared users`, 'success')
  }
}

// Group Management
const loadAdminGroups = async () => {
  if (selectedAccess.value === 'GROUPS') {
    try {
      isLoadingGroups.value = true
      // Fallback to service method
      const response = await surveyService.getMyAdminGroups()
      
      // The service returns ApiResponse<AdminGroupsResponse> where AdminGroupsResponse has .groups property
      availableGroups.value = response.data?.groups || []
    
      
      if (availableGroups.value.length === 0) {
        setStatusMessage(currentLanguage.value === 'ar' ? 'لا توجد مجموعات متاحة' : 'No groups available', 'info')
      } else {
        // Logging removed for production // Debug
      }
    } catch (error: any) {
      // Logging removed for production
      // Logging removed for production // Debug
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load groups'
      setStatusMessage(errorMessage, 'error')
      availableGroups.value = []
    } finally {
      isLoadingGroups.value = false
    }
  }
}

const isGroupSelected = (groupId: number): boolean => {
  return selectedGroups.value.some(group => group.id === groupId)
}

const toggleGroupSelection = (group: AdminGroup) => {
  const index = selectedGroups.value.findIndex(selected => selected.id === group.id)
  if (index >= 0) {
    selectedGroups.value.splice(index, 1)
    setStatusMessage(`Removed ${group.name} from shared groups`, 'success')
  } else {
    selectedGroups.value.push(group)
    setStatusMessage(`Added ${group.name} to shared groups`, 'success')
  }
}

// Multi-select helper methods
const selectAllGroups = () => {
  selectedGroups.value = [...availableGroups.value]
  setStatusMessage(currentLanguage.value === 'ar' ? 'تم تحديد جميع المجموعات' : 'All groups selected', 'success')
}

const clearAllGroups = () => {
  selectedGroups.value = []
  setStatusMessage(currentLanguage.value === 'ar' ? 'تم إلغاء تحديد جميع المجموعات' : 'All groups deselected', 'success')
}

// Save Changes using PATCH API
const handleSave = async () => {
  try {
    isSaving.value = true
    clearStatusMessage()

    // Validate groups access
    if (selectedAccess.value === 'GROUPS' && availableGroups.value.length === 0) {
      const message = currentLanguage.value === 'ar' 
        ? 'لا يمكن حفظ الاستطلاع مع مستوى وصول المجموعات - لا توجد مجموعات متاحة للمشاركة'
        : 'Cannot save survey with Groups access - No groups available for sharing'
      setStatusMessage(message, 'error')
      return
    }

    // Map visibility to access level for the PATCH API
    let accessLevel: 'public' | 'authenticated' | 'private' | 'groups'
    switch (selectedAccess.value) {
      case 'PUBLIC':
        accessLevel = 'public'
        break
      case 'AUTH':
        accessLevel = 'authenticated'
        break
      case 'PRIVATE':
        accessLevel = 'private'
        break
      case 'GROUPS':
        accessLevel = 'groups'
        break
      default:
        accessLevel = 'private'
    }

    // Call the survey service to update using the existing updateSurveyAccess method
    await surveyService.updateSurveyAccess(props.survey.id, accessLevel)
    
    // Handle private access sharing if needed
    if (selectedAccess.value === 'PRIVATE' && selectedUsers.value.length > 0) {
      const shareData: ShareRequest = {
        user_ids: selectedUsers.value.map(user => user.id),
        emails: [] // Email invitations removed from compact UI
      }
      await surveyService.shareSurvey(props.survey.id, shareData)
    }

    // Handle group access sharing if needed
    if (selectedAccess.value === 'GROUPS' && selectedGroups.value.length > 0) {
      // Note: Group sharing would require an additional API endpoint
      // For now, we just save the groups selection to the visibility
      // Logging removed for production)
    }

    setStatusMessage('Survey access updated successfully', 'success')
    
    // Show information about token invalidation if visibility changed from PUBLIC
    if (props.survey.visibility === 'PUBLIC' && selectedAccess.value !== 'PUBLIC') {
      setTimeout(() => {
        setStatusMessage('Public access tokens have been automatically invalidated for security', 'info')
      }, 2000)
    }

    emit('save', {
      visibility: selectedAccess.value,
      users: selectedUsers.value,
      emails: [], // Email invitations removed from compact UI
      groups: selectedGroups.value
    })
  } catch (error: any) {
    // Logging removed for production
    
    // Enhanced error handling based on API response
    let errorMessage = 'Failed to save access settings'
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error.response?.data?.data) {
      // Handle validation errors
      const validationErrors = Object.values(error.response.data.data).flat()
      errorMessage = validationErrors.join(', ')
    } else if (error.message) {
      errorMessage = error.message
    }
    
    setStatusMessage(errorMessage, 'error')
  } finally {
    isSaving.value = false
  }
}

// Load existing shared users for private surveys
const loadSharedUsers = async () => {
  if (props.survey.visibility === 'PRIVATE') {
    try {
      const response = await surveyService.getSharedUsers(props.survey.id)
      selectedUsers.value = response.data.shared_users || []
      // Note: invited emails are not tracked separately in the current backend implementation
    } catch (error) {
      // Logging removed for production
      setStatusMessage('Failed to load shared users', 'error')
    }
  }
}

// Watchers
watch(() => selectedAccess.value, (newAccess) => {
  if (newAccess === 'PUBLIC') {
    loadPublicLink()
  } else if (newAccess === 'GROUPS') {
    loadAdminGroups()
  }
})

watch(() => publicLink.value, async (newLink) => {
  if (newLink) {
    await nextTick()
    generateQRCode(newLink.link)
  }
})

// Lifecycle
onMounted(() => {
  loadPublicLink()
  loadSharedUsers()
  if (props.survey.visibility === 'GROUPS') {
    loadAdminGroups()
  }
})
</script>

<style module src="./SurveyAccessModal.module.css">
/* CSS Module styles are imported from SurveyAccessModal.module.css */
</style>
