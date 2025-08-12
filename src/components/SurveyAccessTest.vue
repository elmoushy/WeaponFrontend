<!-- Test Component for Survey Access Integration -->
<template>
  <div style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <h1>Survey Access Control Test</h1>
    
    <!-- Survey Selection -->
    <div style="margin-bottom: 20px;">
      <label>Test Survey ID:</label>
      <input 
        v-model="testSurveyId" 
        type="text" 
        placeholder="Enter survey ID"
        style="margin-left: 10px; padding: 5px; width: 300px;"
      />
    </div>

    <!-- Test Buttons -->
    <div style="margin-bottom: 30px; display: flex; gap: 10px; flex-wrap: wrap;">
      <button @click="testGenerateLink" :disabled="!testSurveyId || loading.generate">
        {{ loading.generate ? 'Generating...' : 'Generate Public Link' }}
      </button>
      
      <button @click="testGetLink" :disabled="!testSurveyId || loading.get">
        {{ loading.get ? 'Loading...' : 'Get Existing Link' }}
      </button>
      
      <button @click="testValidateAccess" :disabled="!testToken || loading.validate">
        {{ loading.validate ? 'Validating...' : 'Validate Access' }}
      </button>
      
      <button @click="testRevokeLink" :disabled="!testSurveyId || loading.revoke">
        {{ loading.revoke ? 'Revoking...' : 'Revoke Link' }}
      </button>
      
      <button @click="testSearchUsers" :disabled="loading.search">
        {{ loading.search ? 'Searching...' : 'Search Users' }}
      </button>
    </div>

    <!-- Results Display -->
    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h3>Results:</h3>
      <pre style="white-space: pre-wrap; word-wrap: break-word;">{{ resultText }}</pre>
    </div>

    <!-- Generated Link Display -->
    <div v-if="generatedLink" style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h3>Generated Public Link:</h3>
      <div style="margin: 10px 0;">
        <strong>URL:</strong> 
        <a :href="generatedLink.link" target="_blank" style="word-break: break-all;">
          {{ generatedLink.link }}
        </a>
      </div>
      <div style="margin: 10px 0;">
        <strong>Token:</strong> 
        <code style="background: #fff; padding: 2px 4px; border-radius: 3px;">{{ generatedLink.token }}</code>
      </div>
      <div style="margin: 10px 0;">
        <strong>Expires At:</strong> {{ generatedLink.expires_at }}
      </div>
      <button @click="copyLink" style="margin-top: 10px;">Copy Link</button>
      <input 
        v-model="testToken" 
        type="text" 
        placeholder="Token for validation test"
        style="margin-left: 10px; padding: 5px; width: 200px;"
        readonly
      />
    </div>

    <!-- Error Display -->
    <div v-if="error" style="background: #ffe8e8; padding: 15px; border-radius: 5px; color: #d00;">
      <h3>Error:</h3>
      <pre>{{ error }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { surveyService } from '../services/surveyService'

// State
const testSurveyId = ref('')
const testToken = ref('')
const generatedLink = ref<any>(null)
const resultText = ref('Ready for testing...')
const error = ref('')

const loading = ref({
  generate: false,
  get: false,
  validate: false,
  revoke: false,
  search: false
})

// Test Methods
const testGenerateLink = async () => {
  try {
    loading.value.generate = true
    error.value = ''
    resultText.value = 'Generating public link...'
    
    const response = await surveyService.generatePublicLink(testSurveyId.value, {
      days_to_expire: 30
    })
    
    generatedLink.value = response.data
    testToken.value = response.data.token
    resultText.value = `✅ Public link generated successfully!\n\nResponse:\n${JSON.stringify(response, null, 2)}`
    
  } catch (err: any) {
    error.value = `Failed to generate link: ${err.message}`
    resultText.value = '❌ Failed to generate public link'
    // Logging removed for production
  } finally {
    loading.value.generate = false
  }
}

const testGetLink = async () => {
  try {
    loading.value.get = true
    error.value = ''
    resultText.value = 'Getting existing public link...'
    
    const response = await surveyService.getPublicLink(testSurveyId.value)
    
    if (response.data) {
      generatedLink.value = response.data
      testToken.value = response.data.token
      resultText.value = `✅ Found existing public link!\n\nResponse:\n${JSON.stringify(response, null, 2)}`
    } else {
      resultText.value = '📝 No existing public link found'
    }
    
  } catch (err: any) {
    error.value = `Failed to get link: ${err.message}`
    resultText.value = '❌ Failed to get existing link'
    // Logging removed for production
  } finally {
    loading.value.get = false
  }
}

const testValidateAccess = async () => {
  try {
    loading.value.validate = true
    error.value = ''
    resultText.value = 'Validating access with token...'
    
    const response = await surveyService.validateAccess(testToken.value)
    
    resultText.value = `✅ Access validation completed!\n\nResponse:\n${JSON.stringify(response, null, 2)}`
    
  } catch (err: any) {
    error.value = `Failed to validate access: ${err.message}`
    resultText.value = '❌ Failed to validate access'
    // Logging removed for production
  } finally {
    loading.value.validate = false
  }
}

const testRevokeLink = async () => {
  if (!confirm('Are you sure you want to revoke the public link?')) return
  
  try {
    loading.value.revoke = true
    error.value = ''
    resultText.value = 'Revoking public link...'
    
    const response = await surveyService.revokePublicLink(testSurveyId.value)
    
    generatedLink.value = null
    testToken.value = ''
    resultText.value = `✅ Public link revoked successfully!\n\nResponse:\n${JSON.stringify(response, null, 2)}`
    
  } catch (err: any) {
    error.value = `Failed to revoke link: ${err.message}`
    resultText.value = '❌ Failed to revoke public link'
    // Logging removed for production
  } finally {
    loading.value.revoke = false
  }
}

const testSearchUsers = async () => {
  const query = prompt('Enter search query (name or email):')
  if (!query) return
  
  try {
    loading.value.search = true
    error.value = ''
    resultText.value = 'Searching users...'
    
    const response = await surveyService.searchUsers(query)
    
    resultText.value = `✅ User search completed!\n\nFound ${response.data.users.length} users:\n\n${JSON.stringify(response, null, 2)}`
    
  } catch (err: any) {
    error.value = `Failed to search users: ${err.message}`
    resultText.value = '❌ Failed to search users'
    // Logging removed for production
  } finally {
    loading.value.search = false
  }
}

const copyLink = async () => {
  if (generatedLink.value?.link) {
    try {
      await navigator.clipboard.writeText(generatedLink.value.link)
      alert('Link copied to clipboard!')
    } catch (err) {
      // Logging removed for production
    }
  }
}
</script>

<style scoped>
button {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

input {
  border: 1px solid #ddd;
  border-radius: 4px;
}

pre {
  font-size: 12px;
  max-height: 400px;
  overflow-y: auto;
}
</style>
