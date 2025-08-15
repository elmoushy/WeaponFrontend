<template>
  <div class="test-page" dir="rtl">
    <h1>اختبار الرابط المحمي بكلمة مرور</h1>
    
    <div class="test-section">
      <h2>إنشاء رابط محمي</h2>
      <div class="form-group">
        <label>معرف الاستطلاع:</label>
        <input 
          v-model="surveyId" 
          type="text" 
          placeholder="أدخل معرف الاستطلاع"
          class="input-field"
        />
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="emailRestricted" />
          قصر الوصول على بريد إلكتروني محدد
        </label>
        <input 
          v-if="emailRestricted"
          v-model="restrictedEmail" 
          type="email" 
          placeholder="أدخل البريد الإلكتروني"
          class="input-field"
        />
      </div>
      
      <div class="form-group">
        <label>
          <input type="checkbox" v-model="phoneRestricted" />
          قصر الوصول على رقم هاتف محدد
        </label>
        <input 
          v-if="phoneRestricted"
          v-model="restrictedPhone" 
          type="tel" 
          placeholder="أدخل رقم الهاتف"
          class="input-field"
        />
      </div>
      
      <button @click="generatePasswordLink" :disabled="!surveyId || isGenerating" class="generate-btn">
        {{ isGenerating ? 'جاري الإنشاء...' : 'إنشاء رابط محمي' }}
      </button>
    </div>
    
    <div v-if="generatedLink" class="result-section">
      <h2>الرابط المحمي</h2>
      <div class="link-info">
        <div class="info-row">
          <strong>الرابط:</strong>
          <div class="link-container">
            <input 
              :value="generatedLink.link" 
              readonly 
              class="link-input"
            />
            <button @click="copyToClipboard(generatedLink.link)" class="copy-btn">نسخ</button>
          </div>
        </div>
        <div class="info-row">
          <strong>كلمة المرور:</strong>
          <div class="password-container">
            <span class="password-text">{{ generatedLink.password }}</span>
            <button @click="copyToClipboard(generatedLink.password)" class="copy-btn">نسخ</button>
          </div>
        </div>
        <div v-if="generatedLink.restricted_email" class="info-row">
          <strong>مقصور على البريد الإلكتروني:</strong>
          <span>{{ generatedLink.restricted_email }}</span>
        </div>
        <div v-if="generatedLink.restricted_phone" class="info-row">
          <strong>مقصور على رقم الهاتف:</strong>
          <span>{{ generatedLink.restricted_phone }}</span>
        </div>
        <div class="info-row">
          <strong>تاريخ انتهاء الصلاحية:</strong>
          <span>{{ formatDate(generatedLink.expires_at) }}</span>
        </div>
      </div>
      
      <div class="share-message">
        <h3>رسالة المشاركة (مثال)</h3>
        <textarea 
          :value="getShareMessage()"
          readonly 
          class="share-textarea"
          rows="6"
        ></textarea>
        <button @click="copyToClipboard(getShareMessage())" class="copy-btn">نسخ الرسالة</button>
      </div>
    </div>
    
    <div v-if="error" class="error-message">
      <strong>خطأ:</strong> {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { surveyService } from '../services/surveyService'
import type { PasswordProtectedLinkResponse } from '../types/survey.types'

// State
const surveyId = ref('')
const emailRestricted = ref(false)
const phoneRestricted = ref(false)
const restrictedEmail = ref('')
const restrictedPhone = ref('')
const isGenerating = ref(false)
const generatedLink = ref<PasswordProtectedLinkResponse | null>(null)
const error = ref('')

// Methods
const generatePasswordLink = async () => {
  if (!surveyId.value.trim()) {
    error.value = 'يرجى إدخال معرف الاستطلاع'
    return
  }

  try {
    isGenerating.value = true
    error.value = ''
    
    const options: any = {
      days_to_expire: 30
    }
    
    if (emailRestricted.value && restrictedEmail.value.trim()) {
      options.email = restrictedEmail.value.trim()
    }
    
    if (phoneRestricted.value && restrictedPhone.value.trim()) {
      options.phone = restrictedPhone.value.trim()
    }
    
    const response = await surveyService.generatePasswordProtectedLink(surveyId.value.trim(), options)
    generatedLink.value = response.data
    
  } catch (err: any) {
    error.value = err.response?.data?.message || err.message || 'فشل في إنشاء الرابط المحمي'
  } finally {
    isGenerating.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    alert('تم نسخ النص بنجاح!')
  } catch (err) {
    console.error('Failed to copy:', err)
    alert('فشل في نسخ النص')
  }
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

const getShareMessage = (): string => {
  if (!generatedLink.value) return ''
  
  const surveyTitle = `الاستطلاع ${surveyId.value}` // Would normally get from survey data
  const link = generatedLink.value.link
  const password = generatedLink.value.password
  
  let message = `🔒 مرحباً!\n\nأدعوك للمشاركة في استطلاع محمي:\n*${surveyTitle}*\n\n`
  message += `🌐 الرابط:\n${link}\n\n`
  message += `🔑 كلمة المرور: ${password}\n\n`
  
  if (generatedLink.value.restricted_email) {
    message += `📧 ملاحظة: يمكن الوصول فقط باستخدام البريد الإلكتروني: ${generatedLink.value.restricted_email}\n\n`
  }
  
  if (generatedLink.value.restricted_phone) {
    message += `📱 ملاحظة: يمكن الوصول فقط باستخدام رقم الهاتف: ${generatedLink.value.restricted_phone}\n\n`
  }
  
  message += `خطوات الوصول:\n1. انقر على الرابط أعلاه\n2. أدخل كلمة المرور\n`
  
  if (generatedLink.value.restricted_email || generatedLink.value.restricted_phone) {
    message += `3. أدخل ${generatedLink.value.restricted_email ? 'البريد الإلكتروني' : 'رقم الهاتف'} المطلوب\n`
  }
  
  message += `\nشكراً لمشاركتك! 🙏`
  
  return message
}
</script>

<style scoped>
.test-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.test-section {
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.generate-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.generate-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.result-section {
  background: #e8f5e8;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.link-info {
  margin-bottom: 20px;
}

.info-row {
  margin-bottom: 15px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.info-row strong {
  min-width: 150px;
  flex-shrink: 0;
}

.link-container, .password-container {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.link-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
}

.password-text {
  font-family: monospace;
  background: #f0f0f0;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
  color: #333;
}

.copy-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.share-message {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.share-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 10px;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}

h1, h2, h3 {
  color: #333;
}

h1 {
  text-align: center;
  margin-bottom: 30px;
}
</style>
