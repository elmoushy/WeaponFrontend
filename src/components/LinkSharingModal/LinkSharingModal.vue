<template>
  <Teleport to="body">
    <div v-if="isVisible" :class="$style.modalOverlay" @click="handleOverlayClick">
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
            {{ getText('survey.linkSharing.title') }}
          </h2>
          <button :class="$style.closeButton" @click="$emit('close')">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Body -->
        <div :class="$style.modalBody">
          <div v-if="publicLink || passwordProtectedLink" :class="$style.linkContainer">
            <!-- Password Protection Notice -->
            <div v-if="passwordProtectedLink" :class="$style.passwordNotice">
              <div :class="$style.passwordHeader">
                <i class="fas fa-shield-alt" :class="$style.shieldIcon"></i>
                <h3 :class="$style.passwordTitle">{{ getText('survey.access.passwordProtected') }}</h3>
              </div>
              <div :class="$style.passwordInfo">
                <div :class="$style.passwordRow">
                  <label :class="$style.passwordLabel">{{ getText('survey.access.password') }}:</label>
                  <div :class="$style.passwordValue">
                    <span :class="$style.passwordText">{{ passwordProtectedLink.password }}</span>
                    <button 
                      :class="$style.copyPasswordButton"
                      @click="copyToClipboard(passwordProtectedLink.password)"
                      :title="getText('survey.access.copyPassword')"
                    >
                      <i class="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
                <div v-if="passwordProtectedLink.is_contact_restricted" :class="$style.restrictionInfo">
                  <div v-if="passwordProtectedLink.restricted_email" :class="$style.restrictionRow">
                    <i class="fas fa-envelope"></i>
                    <span>{{ getText('survey.access.restrictedToEmail') }}: {{ passwordProtectedLink.restricted_email }}</span>
                  </div>
                  <div v-if="passwordProtectedLink.restricted_phone" :class="$style.restrictionRow">
                    <i class="fas fa-phone"></i>
                    <span>{{ getText('survey.access.restrictedToPhone') }}: {{ passwordProtectedLink.restricted_phone }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Link Display -->
            <div :class="$style.linkDisplay">
              <input 
                type="text" 
                :value="currentLink" 
                :class="$style.linkInput"
                readonly
              />
              <button 
                :class="$style.copyButton"
                @click="copyToClipboard(currentLink)"
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
          </div>
          
          <div v-else :class="$style.generateLinkSection">
            <button :class="$style.generateButton" @click="generateLink" :disabled="isGeneratingLink">
              <div v-if="isGeneratingLink" :class="$style.loadingSpinner"></div>
              <i v-else class="fas fa-link"></i>
              {{ getText('survey.access.generateLink') }}
            </button>
          </div>

          <!-- Status Message -->
          <div v-if="statusMessage" :class="[$style.statusMessage, statusMessage.type]">
            <i :class="statusMessage.icon"></i>
            <span>{{ statusMessage.text }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import QRCode from 'qrcode'
import type { 
  Survey, 
  PublicLinkResponse,
  PasswordProtectedLinkResponse
} from '../../types/survey.types'

// Props
interface Props {
  isVisible: boolean
  survey: Survey
  publicLink: PublicLinkResponse | null
  passwordProtectedLink?: PasswordProtectedLinkResponse | null
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  linkGenerated: [link: PublicLinkResponse]
  statusUpdate: [message: string, type: 'success' | 'error' | 'warning' | 'info']
}>()

// Store
const store = useAppStore()

// Computed
const currentTheme = computed(() => store.currentTheme)
const isRTL = computed(() => store.currentLanguage === 'ar')
const currentLanguage = computed(() => store.currentLanguage)

// Get the current link (password-protected takes precedence)
const currentLink = computed(() => {
  return props.passwordProtectedLink?.link || props.publicLink?.link || ''
})

// State
const isGeneratingLink = ref(false)
const qrCanvas = ref<HTMLCanvasElement | null>(null)

// Status message for user feedback
const statusMessage = ref<{
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
} | null>(null)

// Inline translations
const translations = computed(() => {
  const translationsMap: Record<string, string> = currentLanguage.value === 'ar' ? {
    // Modal
    'survey.linkSharing.title': 'مشاركة الاستطلاع',
    'survey.access.scanToAccess': 'امسح للوصول إلى الاستطلاع',
    'survey.access.generateLink': 'إنشاء رابط',
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
    'common.copy': 'نسخ',
    
    // Password Protection
    'survey.access.passwordProtected': 'استطلاع محمي بكلمة مرور',
    'survey.access.password': 'كلمة المرور',
    'survey.access.copyPassword': 'نسخ كلمة المرور',
    'survey.access.restrictedToEmail': 'مقصور على البريد الإلكتروني',
    'survey.access.restrictedToPhone': 'مقصور على رقم الهاتف'
  } : {
    // Modal
    'survey.linkSharing.title': 'Share Survey Link',
    'survey.access.scanToAccess': 'Scan to access survey',
    'survey.access.generateLink': 'Generate Link',
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
    'common.copy': 'Copy',
    
    // Password Protection
    'survey.access.passwordProtected': 'Password Protected Survey',
    'survey.access.password': 'Password',
    'survey.access.copyPassword': 'Copy Password',
    'survey.access.restrictedToEmail': 'Restricted to email',
    'survey.access.restrictedToPhone': 'Restricted to phone'
  }
  return translationsMap
})

// Translation helper function
const getText = (key: string, fallback?: string) => {
  return translations.value[key] || fallback || key
}

// Methods
const handleOverlayClick = () => {
  emit('close')
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
  
  emit('statusUpdate', text, type)
  
  // Auto-clear after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      statusMessage.value = null
    }, 5000)
  }
}

const generateLink = async () => {
  try {
    isGeneratingLink.value = true
    
    const response = await surveyService.generatePublicLink(props.survey.id, {
      days_to_expire: 30
    })
    
    emit('linkGenerated', response.data)
    setStatusMessage('Public link generated successfully', 'success')
    
    // Generate QR code immediately after link generation
    await nextTick()
    if (response.data?.link) {
      console.log('Generating QR code immediately after link generation')
      generateQRCode(response.data.link)
    }
  } catch (error: any) {
    const errorMessage = error.response?.data?.message || error.message || 'Failed to generate public link'
    setStatusMessage(errorMessage, 'error')
  } finally {
    isGeneratingLink.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    setStatusMessage('Link copied to clipboard', 'success')
  } catch (error) {
    setStatusMessage('Failed to copy link', 'error')
  }
}

// QR Code Functions
const generateQRCode = async (text: string): Promise<void> => {
  if (!qrCanvas.value || !text) return

  try {
    // Clear the canvas first
    const ctx = qrCanvas.value.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, 200, 200)
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, 200, 200)
    }

    await QRCode.toCanvas(qrCanvas.value, text, {
      width: 200,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',  // Black foreground
        light: '#FFFFFF'  // White background
      }
    })
    
    console.log('QR Code generated successfully for:', text)
  } catch (error) {
    console.error('QR Code generation error:', error)
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
    setStatusMessage('Failed to copy QR code', 'error')
  }
}

// Share Functions
const getShareMessage = (platform: 'email' | 'whatsapp' | 'sms' = 'email') => {
  const surveyTitle = props.survey.title
  const link = currentLink.value
  const isPasswordProtected = !!props.passwordProtectedLink
  const password = props.passwordProtectedLink?.password
  
  if (currentLanguage.value === 'ar') {
    if (platform === 'email') {
      let message = `مرحباً!\n\nأدعوك للمشاركة في استطلاع: "${surveyTitle}"\n\nيمكنك الوصول إليه من خلال النقر على الرابط:\n\n${link}\n\n`
      
      if (isPasswordProtected && password) {
        message += `⚠️ هذا الاستطلاع محمي بكلمة مرور\nكلمة المرور: ${password}\n\nتأكد من إدخال كلمة المرور بعد النقر على الرابط.\n\n`
        
        if (props.passwordProtectedLink?.is_contact_restricted) {
          if (props.passwordProtectedLink.restricted_email) {
            message += `📧 تقييد البريد الإلكتروني: ${props.passwordProtectedLink.restricted_email}\n`
          }
          if (props.passwordProtectedLink.restricted_phone) {
            message += `📱 تقييد رقم الهاتف: ${props.passwordProtectedLink.restricted_phone}\n`
          }
          message += '\n'
        }
      } else {
        message += `أو نسخ الرابط ولصقه في المتصفح.\n\n`
      }
      
      message += `شكراً لمشاركتك! 🙏`
      return message
    } else if (platform === 'whatsapp') {
      let message = `🔗 مرحباً!\n\nأدعوك للمشاركة في استطلاع:\n*${surveyTitle}*\n\nالرابط:\n${link}\n`
      
      if (isPasswordProtected && password) {
        message += `\n🔒 كلمة المرور: *${password}*\n`
        
        if (props.passwordProtectedLink?.is_contact_restricted) {
          if (props.passwordProtectedLink.restricted_email) {
            message += `📧 البريد المطلوب: ${props.passwordProtectedLink.restricted_email}\n`
          }
          if (props.passwordProtectedLink.restricted_phone) {
            message += `📱 الهاتف المطلوب: ${props.passwordProtectedLink.restricted_phone}\n`
          }
        }
      }
      
      message += `\nشكراً لمشاركتك! 🙏`
      return message
    } else { // SMS
      let message = `استطلاع: ${surveyTitle}\n\nالرابط:\n${link}\n`
      
      if (isPasswordProtected && password) {
        message += `\nكلمة المرور: ${password}\n`
      }
      
      message += `\nشكراً لك!`
      return message
    }
  } else {
    if (platform === 'email') {
      let message = `Hello!\n\nYou're invited to participate in the survey: "${surveyTitle}"\n\nAccess it by clicking this link:\n\n${link}\n\n`
      
      if (isPasswordProtected && password) {
        message += `⚠️ This survey is password protected\nPassword: ${password}\n\nMake sure to enter the password after clicking the link.\n\n`
        
        if (props.passwordProtectedLink?.is_contact_restricted) {
          if (props.passwordProtectedLink.restricted_email) {
            message += `📧 Email restriction: ${props.passwordProtectedLink.restricted_email}\n`
          }
          if (props.passwordProtectedLink.restricted_phone) {
            message += `📱 Phone restriction: ${props.passwordProtectedLink.restricted_phone}\n`
          }
          message += '\n'
        }
      } else {
        message += `Or copy and paste the link into your browser.\n\n`
      }
      
      message += `Thank you for your participation! 🙏`
      return message
    } else if (platform === 'whatsapp') {
      let message = `🔗 Hello!\n\nYou're invited to participate in the survey:\n*${surveyTitle}*\n\nLink:\n${link}\n`
      
      if (isPasswordProtected && password) {
        message += `\n🔒 Password: *${password}*\n`
        
        if (props.passwordProtectedLink?.is_contact_restricted) {
          if (props.passwordProtectedLink.restricted_email) {
            message += `📧 Required email: ${props.passwordProtectedLink.restricted_email}\n`
          }
          if (props.passwordProtectedLink.restricted_phone) {
            message += `📱 Required phone: ${props.passwordProtectedLink.restricted_phone}\n`
          }
        }
      }
      
      message += `\nThank you for your participation! 🙏`
      return message
    } else { // SMS
      let message = `Survey: ${surveyTitle}\n\nLink:\n${link}\n`
      
      if (isPasswordProtected && password) {
        message += `\nPassword: ${password}\n`
      }
      
      message += `\nThank you!`
      return message
    }
  }
}

const shareByEmail = async () => {
  if (!props.publicLink) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('email')
    const subject = currentLanguage.value === 'ar' 
      ? `دعوة للمشاركة في استطلاع: ${props.survey.title}`
      : `Survey Invitation: ${props.survey.title}`
    
    const emailBody = currentLanguage.value === 'ar' 
      ? `${message}\n\n💡 تلميح: يمكنك أيضاً تحميل رمز QR من صفحة مشاركة الاستطلاع لسهولة المشاركة مع الآخرين.`
      : `${message}\n\n💡 Tip: You can also download the QR code from the survey sharing page for easy sharing with others.`
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`
    
    try {
      window.location.href = mailtoLink
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح تطبيق البريد الإلكتروني' : 'Email client opened', 'success')
    } catch (e) {
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
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر البريد الإلكتروني' : 'Failed to share by email', 'error')
  }
}

const shareByWhatsApp = async () => {
  if (!props.publicLink) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('whatsapp')
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    
    try {
      window.open(whatsappUrl, '_blank')
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح واتساب' : 'WhatsApp opened', 'success')
    } catch (e) {
      await navigator.clipboard.writeText(message)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ الرسالة - يمكنك لصقها في واتساب'
          : 'Message copied - you can paste it in WhatsApp', 
        'info'
      )
    }
  } catch (error) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر واتساب' : 'Failed to share by WhatsApp', 'error')
  }
}

const shareBySMS = async () => {
  if (!props.publicLink) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'يجب إنشاء رابط عام أولاً' : 'Please generate a public link first', 'warning')
    return
  }
  
  try {
    const message = getShareMessage('sms')
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`
    
    try {
      window.open(smsUrl, '_blank')
      setStatusMessage(currentLanguage.value === 'ar' ? 'تم فتح تطبيق الرسائل النصية' : 'SMS app opened', 'success')
    } catch (e) {
      await navigator.clipboard.writeText(message)
      setStatusMessage(
        currentLanguage.value === 'ar' 
          ? 'تم نسخ الرسالة - يمكنك لصقها في تطبيق الرسائل النصية'
          : 'Message copied - you can paste it in SMS app', 
        'info'
      )
    }
  } catch (error) {
    setStatusMessage(currentLanguage.value === 'ar' ? 'فشل في مشاركة عبر الرسائل النصية' : 'Failed to share by SMS', 'error')
  }
}

// Watchers
watch(() => props.publicLink, async (newLink) => {
  if (newLink?.link && props.isVisible && !props.passwordProtectedLink) {
    await nextTick()
    console.log('Generating QR code for public link:', newLink.link)
    generateQRCode(newLink.link)
  }
}, { immediate: true })

watch(() => props.passwordProtectedLink, async (newLink) => {
  if (newLink?.link && props.isVisible) {
    await nextTick()
    console.log('Generating QR code for password-protected link:', newLink.link)
    generateQRCode(newLink.link)
  }
}, { immediate: true })

watch(() => props.isVisible, async (visible) => {
  if (visible) {
    await nextTick()
    const link = currentLink.value
    if (link) {
      console.log('Modal visible, generating QR code for:', link)
      generateQRCode(link)
    }
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  // Generate QR code if modal is visible and link is available
  if (props.isVisible) {
    const link = currentLink.value
    if (link) {
      nextTick(() => {
        console.log('Component mounted, generating QR code')
        generateQRCode(link)
      })
    }
  }
})
</script>

<style module src="./LinkSharingModal.module.css">
/* CSS Module styles are imported from LinkSharingModal.module.css */
</style>
