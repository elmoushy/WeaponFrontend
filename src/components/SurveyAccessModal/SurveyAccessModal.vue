<template>
  <div :class="$style.modalOverlay">
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
                </div>
              </div>
              
              <!-- Compact Public Link Management -->
              <div v-if="selectedAccess === 'PUBLIC'" :class="$style.publicLinkSection">
                <!-- Per-Device Access Option -->
                <div :class="$style.perDeviceAccessSection">
                  <div :class="$style.perDeviceAccessHeader">
                    <h4 :class="$style.perDeviceAccessTitle">
                      <i class="fas fa-mobile-alt"></i>
                      {{ getText('survey.access.perDeviceAccess') }}
                    </h4>
                    <div :class="$style.perDeviceToggleContainer">
                      <label :class="$style.toggleSwitch">
                        <input 
                          type="checkbox" 
                          v-model="perDeviceAccessEnabled"
                          :class="$style.toggleInput"
                        />
                        <span :class="$style.toggleSlider"></span>
                      </label>
                      <span :class="$style.toggleLabel">
                        {{ getText('survey.access.enablePerDeviceAccess') }}
                      </span>
                    </div>
                  </div>
                  <p :class="$style.perDeviceDescription">
                    {{ getText('survey.access.perDeviceAccessDescription') }}
                  </p>
                </div>

                <!-- Contact Method Selection - Hidden when password protection is enabled with specific email/phone OR per-device access is enabled -->
                <div 
                  v-if="!perDeviceAccessEnabled && (!passwordProtectionEnabled || passwordAccessMode === 'anyone')"
                  :class="$style.contactMethodSection"
                >
                  <div :class="$style.contactMethodHeader">
                    <h4 :class="$style.contactMethodTitle">
                      <i class="fas fa-address-book"></i>
                      {{ getText('survey.access.contactMethod') }}
                    </h4>
                    <p :class="$style.contactMethodDescription">
                      {{ getText('survey.access.contactMethodDescription') }}
                    </p>
                  </div>
                  
                  <div :class="$style.contactMethodOptions">
                    <div 
                      :class="[$style.contactMethodOption, { [$style.selected]: selectedContactMethod === 'email' }]"
                      @click="selectedContactMethod = 'email'"
                    >
                      <div :class="$style.contactMethodRadio">
                        <div v-if="selectedContactMethod === 'email'" :class="$style.radioSelected2"></div>
                      </div>
                      <div :class="$style.contactMethodInfo">
                        <i class="fas fa-envelope" :class="$style.contactMethodIcon"></i>
                        <div>
                          <span :class="$style.contactMethodName">{{ getText('survey.access.emailContact') }}</span>
                          <small :class="$style.contactMethodDesc">{{ getText('survey.access.emailDescription') }}</small>
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      :class="[$style.contactMethodOption, { [$style.selected]: selectedContactMethod === 'phone' }]"
                      @click="selectedContactMethod = 'phone'"
                    >
                      <div :class="$style.contactMethodRadio">
                        <div v-if="selectedContactMethod === 'phone'" :class="$style.radioSelected"></div>
                      </div>
                      <div :class="$style.contactMethodInfo">
                        <i class="fas fa-phone" :class="$style.contactMethodIcon"></i>
                        <div>
                          <span :class="$style.contactMethodName">{{ getText('survey.access.phoneContact') }}</span>
                          <small :class="$style.contactMethodDesc">{{ getText('survey.access.phoneDescription') }}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Password Protection Section - Hidden when per-device access is enabled -->
                <div v-if="!perDeviceAccessEnabled" :class="$style.passwordProtectionSection">
                  <div :class="$style.passwordProtectionHeader">
                    <h4 :class="$style.passwordProtectionTitle">
                      <i class="fas fa-shield-alt"></i>
                      {{ getText('survey.access.passwordProtection') }}
                    </h4>
                    <div :class="$style.passwordToggleContainer">
                      <label :class="$style.toggleSwitch">
                        <input 
                          type="checkbox" 
                          v-model="passwordProtectionEnabled"
                          :class="$style.toggleInput"
                        />
                        <span :class="$style.toggleSlider"></span>
                      </label>
                      <span :class="$style.toggleLabel">
                        {{ getText('survey.access.enablePasswordProtection') }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Password Protection Options -->
                  <div v-if="passwordProtectionEnabled" :class="$style.passwordOptions">
                    <p :class="$style.passwordDescription">
                      {{ getText('survey.access.passwordDescription') }}
                    </p>
                    
                    <!-- Access Control Options -->
                    <div :class="$style.accessControlSection">
                      <h5 :class="$style.accessControlTitle">
                        {{ getText('survey.access.whoCanAccess') }}
                      </h5>
                      
                      <div :class="$style.accessControlOptions">
                        <!-- Anyone with password -->
                        <div 
                          :class="[$style.accessControlOption, { [$style.selected]: passwordAccessMode === 'anyone' }]"
                          @click="passwordAccessMode = 'anyone'"
                        >
                          <div :class="$style.accessControlRadio">
                            <div v-if="passwordAccessMode === 'anyone'" :class="$style.radioSelected"></div>
                          </div>
                          <div :class="$style.accessControlInfo">
                            <i class="fas fa-users" :class="$style.accessControlIcon"></i>
                            <div>
                              <span :class="$style.accessControlName">{{ getText('survey.access.anyoneWithPassword') }}</span>
                              <small :class="$style.accessControlDesc">{{ getText('survey.access.anyoneWithPasswordDesc') }}</small>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Specific email with password -->
                        <div 
                          :class="[$style.accessControlOption, { [$style.selected]: passwordAccessMode === 'email' }]"
                          @click="passwordAccessMode = 'email'"
                        >
                          <div :class="$style.accessControlRadio">
                            <div v-if="passwordAccessMode === 'email'" :class="$style.radioSelected"></div>
                          </div>
                          <div :class="$style.accessControlInfo">
                            <i class="fas fa-envelope-open" :class="$style.accessControlIcon"></i>
                            <div>
                              <span :class="$style.accessControlName">{{ getText('survey.access.specificEmail') }}</span>
                              <small :class="$style.accessControlDesc">{{ getText('survey.access.specificEmailDesc') }}</small>
                            </div>
                          </div>
                        </div>
                        
                        <!-- Specific phone with password -->
                        <div 
                          :class="[$style.accessControlOption, { [$style.selected]: passwordAccessMode === 'phone' }]"
                          @click="passwordAccessMode = 'phone'"
                        >
                          <div :class="$style.accessControlRadio">
                            <div v-if="passwordAccessMode === 'phone'" :class="$style.radioSelected"></div>
                          </div>
                          <div :class="$style.accessControlInfo">
                            <i class="fas fa-phone-alt" :class="$style.accessControlIcon"></i>
                            <div>
                              <span :class="$style.accessControlName">{{ getText('survey.access.specificPhone') }}</span>
                              <small :class="$style.accessControlDesc">{{ getText('survey.access.specificPhoneDesc') }}</small>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <!-- Email/Phone Multi-Input -->
                      <div v-if="passwordAccessMode === 'email'" :class="$style.contactInput">
                        <label :class="$style.inputLabel">
                          <i class="fas fa-envelope"></i>
                          {{ getText('survey.access.restrictToEmails') }}
                        </label>
                        <div :class="$style.multiInputContainer">
                          <!-- Email Tags -->
                          <div v-if="restrictedEmails.length > 0" :class="$style.contactTags">
                            <div 
                              v-for="(email, index) in restrictedEmails" 
                              :key="index"
                              :class="$style.contactTag"
                            >
                              <span :class="$style.tagText">{{ email }}</span>
                              <button 
                                type="button"
                                :class="$style.tagRemove"
                                @click="removeEmail(index)"
                                :title="getText('common.remove')"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                          
                          <!-- Email Input -->
                          <div :class="$style.inputRow">
                            <input 
                              type="email" 
                              v-model="currentEmailInput"
                              :class="$style.textInput"
                              :placeholder="getText('survey.access.enterEmailPlaceholder')"
                              @keydown.enter.prevent="addEmail"
                              @keydown.comma.prevent="addEmail"
                            />
                            <button 
                              type="button"
                              :class="$style.addButton"
                              @click="addEmail"
                              :disabled="!currentEmailInput.trim()"
                              :title="getText('survey.access.addEmail')"
                            >
                              <i class="fas fa-plus"></i>
                            </button>
                          </div>
                          
                          <small :class="$style.inputHint">
                            {{ getText('survey.access.emailInputHint') }}
                          </small>
                        </div>
                      </div>
                      
                      <div v-if="passwordAccessMode === 'phone'" :class="$style.contactInput">
                        <label :class="$style.inputLabel">
                          <i class="fas fa-phone"></i>
                          {{ getText('survey.access.restrictToPhones') }}
                        </label>
                        <div :class="$style.multiInputContainer">
                          <!-- Phone Tags -->
                          <div v-if="restrictedPhones.length > 0" :class="$style.contactTags">
                            <div 
                              v-for="(phone, index) in restrictedPhones" 
                              :key="index"
                              :class="$style.contactTag"
                            >
                              <span :class="$style.tagText">{{ phone }}</span>
                              <button 
                                type="button"
                                :class="$style.tagRemove"
                                @click="removePhone(index)"
                                :title="getText('common.remove')"
                              >
                                <i class="fas fa-times"></i>
                              </button>
                            </div>
                          </div>
                          
                          <!-- Phone Input with Country Dropdown -->
                          <div :class="$style.inputRow">
                            <div :class="$style.phoneInputWrapper">
                              <!-- Country Code Selector -->
                              <div :class="$style.countrySelector" @click.stop>
                                <button 
                                  :class="$style.countryButton"
                                  @click="showCountryDropdown = !showCountryDropdown"
                                  type="button"
                                >
                                  <span :class="$style.countryFlag">{{ selectedCountry.flag }}</span>
                                  <span :class="$style.countryCode">{{ selectedCountryCode }}</span>
                                  <i class="fas fa-chevron-down" :class="$style.dropdownIcon"></i>
                                </button>
                                
                                <!-- Country Dropdown -->
                                <div v-if="showCountryDropdown" :class="$style.countryDropdown" @click.stop>
                                  <div :class="$style.dropdownSearch">
                                    <input 
                                      type="text" 
                                      :class="$style.searchInput"
                                      placeholder="البحث عن دولة..."
                                      @input="filterCountries"
                                      @click.stop
                                    />
                                    <i class="fas fa-search" :class="$style.searchIcon"></i>
                                  </div>
                                  
                                  <div :class="$style.countriesList">
                                    <button
                                      v-for="country in filteredCountries"
                                      :key="country.code"
                                      :class="[$style.countryOption, { [$style.selected]: selectedCountryCode === country.dialCode }]"
                                      @click="selectCountry(country)"
                                      type="button"
                                    >
                                      <span :class="$style.optionFlag">{{ country.flag }}</span>
                                      <span :class="$style.optionName">{{ country.nameAr }}</span>
                                      <span :class="$style.optionCode">{{ country.dialCode }}</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              <!-- Phone Number Input -->
                              <input 
                                type="tel" 
                                v-model="currentPhoneInput"
                                :class="$style.phoneInput"
                                :placeholder="getText('survey.access.enterPhonePlaceholder')"
                                @keydown.enter.prevent="addPhone"
                                @keydown.comma.prevent="addPhone"
                                @focus="showCountryDropdown = false"
                              />
                            </div>
                            
                            <button 
                              type="button"
                              :class="$style.addButton"
                              @click="addPhone"
                              :disabled="!currentPhoneInput.trim()"
                              :title="getText('survey.access.addPhone')"
                            >
                              <i class="fas fa-plus"></i>
                            </button>
                          </div>
                          
                          <small :class="$style.inputHint">
                            {{ getText('survey.access.phoneInputHint') }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
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
            <!-- <div 
              :class="[$style.accessOption, { [$style.selected]: selectedAccess === 'PRIVATE' }]"
              @click="handleAccessChange('PRIVATE')"
            >
              <div :class="$style.optionContent">
                <div :class="$style.optionLeft">
                  <div :class="$style.optionText">
                    <span :class="$style.optionTitle">{{ getText('survey.access.private.title') }}</span>
                    <small :class="$style.optionDescription">{{ getText('survey.access.private.description') }}</small>
                  </div>
                </div>
                <div :class="$style.optionRadio">
                </div>
              </div>
              
              <div v-if="selectedAccess === 'PRIVATE'" :class="$style.privateUsersSection">
                <div :class="$style.userManagement">
                  <div :class="$style.userSearch">
                    <input
                      type="text"
                      :class="$style.searchInput"
                      :placeholder="getText('survey.access.searchUsers')"
                      v-model="userSearchQuery"
                      @input="handleUserSearch"
                    />
                    <i class="fas fa-search" :class="$style.searchIcon"></i>
                    
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

                  <div v-if="selectedUsers.length > 0" :class="$style.usersCount">
                    <i class="fas fa-users"></i>
                    <span>{{ selectedUsers.length }} {{ getText('survey.access.usersSelected') }}</span>
                  </div>
                </div>
              </div>
            </div> -->
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

  <!-- Link Sharing Modal -->
  <LinkSharingModal
    :is-visible="isLinkSharingModalVisible"
    :survey="survey"
    :public-link="publicLink"
    :password-protected-link="passwordProtectedLink"
    @close="closeLinkSharingModal"
    @link-generated="handleLinkGenerated"
    @status-update="handleStatusUpdate"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useAppStore } from '../../stores/useAppStore'
import { surveyService } from '../../services/surveyService'
import LinkSharingModal from '../LinkSharingModal/LinkSharingModal.vue'
import type { 
  Survey, 
  SurveyVisibility, 
  PublicLinkResponse,
  PasswordProtectedLinkResponse,
  PasswordProtectedLinkRequest,
  User,
  ShareRequest,
  AdminGroup,
  PublicContactMethod
} from '../../types/survey.types'
import type { CountryCode } from '../../types/country.types'
import countryCodesData from '../../data/countryCodes.json'

// Props
interface Props {
  survey: Survey
  isSubmissionFlow?: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  save: [data: { visibility: SurveyVisibility; publicContactMethod?: PublicContactMethod; users: User[]; emails: string[]; groups?: AdminGroup[]; passwordProtected?: boolean; passwordOptions?: any; per_device_access?: boolean }]
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

// Country dropdown computed properties
const filteredCountries = computed(() => {
  if (!searchQuery.value.trim()) {
    return countryCodes
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  return countryCodes.filter(country => 
    country.nameAr.toLowerCase().includes(query) ||
    country.name.toLowerCase().includes(query) ||
    country.dialCode.includes(query)
  )
})

const selectedCountry = computed(() => {
  return countryCodes.find(country => country.dialCode === selectedCountryCode.value) || defaultCountry
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
    'survey.access.contactMethod': 'طريقة التواصل',
    'survey.access.contactMethodDescription': 'اختر الطريقة المطلوبة للمشاركة المجهولة',
    'survey.access.emailContact': 'بريد إلكتروني',
    'survey.access.emailDescription': 'المشاركون يحتاجون بريد إلكتروني',
    'survey.access.phoneContact': 'هاتف',
    'survey.access.phoneDescription': 'المشاركون يحتاجون رقم هاتف',
    'survey.access.perDeviceAccess': 'وصول لكل جهاز',
    'survey.access.perDeviceAccessDescription': 'السماح بالوصول بدون متطلبات البريد الإلكتروني أو الهاتف',
    'survey.access.enablePerDeviceAccess': 'تمكين الوصول لكل جهاز',
    
    // Password Protection
    'survey.access.passwordProtection': 'الحماية بكلمة مرور',
    'survey.access.enablePasswordProtection': 'تفعيل الحماية بكلمة مرور',
    'survey.access.passwordDescription': 'سيتم إنشاء كلمة مرور تلقائياً لحماية الاستطلاع',
    'survey.access.whoCanAccess': 'من يمكنه الوصول؟',
    'survey.access.anyoneWithPassword': 'أي شخص لديه كلمة المرور',
    'survey.access.anyoneWithPasswordDesc': 'أي شخص يملك الرابط وكلمة المرور يمكنه الوصول',
    'survey.access.specificEmail': 'بريد إلكتروني محدد',
    'survey.access.specificEmailDesc': 'بريد إلكتروني محدد فقط + كلمة المرور',
    'survey.access.specificPhone': 'هاتف محدد',
    'survey.access.specificPhoneDesc': 'رقم هاتف محدد فقط + كلمة المرور',
    'survey.access.restrictToEmails': 'قصر الوصول على عناوين البريد الإلكتروني',
    'survey.access.restrictToPhones': 'قصر الوصول على أرقام الهاتف',
    'survey.access.enterEmailPlaceholder': 'أدخل البريد الإلكتروني',
    'survey.access.enterPhonePlaceholder': 'أدخل رقم الهاتف',
    'survey.access.addEmail': 'إضافة بريد إلكتروني',
    'survey.access.addPhone': 'إضافة رقم هاتف',
    'survey.access.emailInputHint': 'اضغط Enter أو الفاصلة لإضافة البريد الإلكتروني',
    'survey.access.phoneInputHint': 'اضغط Enter أو الفاصلة لإضافة رقم الهاتف',
    'common.remove': 'حذف',
    
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
    'survey.access.contactMethod': 'Contact Method',
    'survey.access.contactMethodDescription': 'Choose required method for anonymous submissions',
    'survey.access.emailContact': 'Email',
    'survey.access.emailDescription': 'Participants need email address',
    'survey.access.phoneContact': 'Phone',
    'survey.access.phoneDescription': 'Participants need phone number',
    'survey.access.perDeviceAccess': 'Per-Device Access',
    'survey.access.perDeviceAccessDescription': 'Allow access without email or phone requirements',
    'survey.access.enablePerDeviceAccess': 'Enable per-device access',
    
    // Password Protection
    'survey.access.passwordProtection': 'Password Protection',
    'survey.access.enablePasswordProtection': 'Enable password protection',
    'survey.access.passwordDescription': 'A password will be automatically generated to protect the survey',
    'survey.access.whoCanAccess': 'Who can access?',
    'survey.access.anyoneWithPassword': 'Anyone with password',
    'survey.access.anyoneWithPasswordDesc': 'Anyone with the link and password can access',
    'survey.access.specificEmail': 'Specific email',
    'survey.access.specificEmailDesc': 'Specific email only + password',
    'survey.access.specificPhone': 'Specific phone',
    'survey.access.specificPhoneDesc': 'Specific phone number only + password',
    'survey.access.restrictToEmails': 'Restrict to email addresses',
    'survey.access.restrictToPhones': 'Restrict to phone numbers',
    'survey.access.enterEmailPlaceholder': 'Enter email address',
    'survey.access.enterPhonePlaceholder': 'Enter phone number',
    'survey.access.addEmail': 'Add email',
    'survey.access.addPhone': 'Add phone',
    'survey.access.emailInputHint': 'Press Enter or comma to add email',
    'survey.access.phoneInputHint': 'Press Enter or comma to add phone',
    'common.remove': 'Remove',
    
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
const selectedContactMethod = ref<PublicContactMethod>(props.survey.public_contact_method || 'email')
const perDeviceAccessEnabled = ref(props.survey.per_device_access || false)
const publicLink = ref<PublicLinkResponse | null>(null)
const isSaving = ref(false)

// Link Sharing Modal State
const isLinkSharingModalVisible = ref(false)

// Status message for user feedback
const statusMessage = ref<{
  text: string
  type: 'success' | 'error' | 'warning' | 'info'
  icon: string
} | null>(null)

// User management
const selectedUsers = ref<User[]>([])
// Note: Email invitation variables kept for potential future enhancements
// const inviteEmail = ref('')
// const invitedEmails = ref<string[]>([])

// Group management
const availableGroups = ref<AdminGroup[]>([])
const selectedGroups = ref<AdminGroup[]>([])
const isLoadingGroups = ref(false)

// Password protection
const passwordProtectionEnabled = ref(false)
const passwordAccessMode = ref<'anyone' | 'email' | 'phone'>('anyone')
const restrictedEmails = ref<string[]>([])
const restrictedPhones = ref<string[]>([])
const currentEmailInput = ref('')
const currentPhoneInput = ref('')
const passwordProtectedLink = ref<PasswordProtectedLinkResponse | null>(null)

// Phone country code functionality
const countryCodes: CountryCode[] = countryCodesData as CountryCode[]
const selectedCountryCode = ref('+971') // Default to UAE
const showCountryDropdown = ref(false)
const searchQuery = ref('')
const defaultCountry = countryCodes.find(country => country.dialCode === '+971') || countryCodes[0]

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

// LinkSharingModal Methods
const closeLinkSharingModal = () => {
  isLinkSharingModalVisible.value = false
  
  // Emit save when LinkSharingModal closes for PUBLIC access
  if (selectedAccess.value === 'PUBLIC') {
    const saveData = {
      visibility: selectedAccess.value,
      publicContactMethod: selectedContactMethod.value,
      users: selectedUsers.value,
      emails: [] as string[], // Email invitations removed from compact UI
      groups: selectedGroups.value,
      passwordProtected: passwordProtectionEnabled.value,
      passwordOptions: passwordProtectionEnabled.value ? {
        passwordAccessMode: passwordAccessMode.value,
        restrictedEmails: [...restrictedEmails.value],
        restrictedPhones: [...restrictedPhones.value]
      } : undefined,
      per_device_access: perDeviceAccessEnabled.value
    }
    emit('save', saveData)
  }
}

const handleLinkGenerated = (link: PublicLinkResponse) => {
  publicLink.value = link
  setStatusMessage('Public link generated successfully', 'success')
}

const handleStatusUpdate = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
  setStatusMessage(message, type)
}

// Public Link Management - Only called when user explicitly saves
const loadPublicLink = async () => {
  try {
    if (!props.survey?.id) {
      throw new Error('Survey ID is required')
    }
    const surveyId = String(props.survey.id)
    const response = await surveyService.getPublicLink(surveyId)
    publicLink.value = response.data
    
  } catch (error: any) {
    // Logging removed for production
    if (error.response?.status !== 404) {
      setStatusMessage('Failed to load public link', 'error')
    }
  }
}

// Email and Phone Management
const addEmail = () => {
  const email = currentEmailInput.value.trim()
  if (!email) return
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'البريد الإلكتروني غير صالح'
        : 'Invalid email address',
      'error'
    )
    return
  }
  
  // Check for duplicates
  if (restrictedEmails.value.includes(email)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'البريد الإلكتروني موجود بالفعل'
        : 'Email already added',
      'warning'
    )
    return
  }
  
  restrictedEmails.value.push(email)
  currentEmailInput.value = ''
  setStatusMessage(
    currentLanguage.value === 'ar' 
      ? 'تم إضافة البريد الإلكتروني بنجاح'
      : 'Email added successfully',
    'success'
  )
}

const removeEmail = (index: number) => {
  if (index >= 0 && index < restrictedEmails.value.length) {
    const removed = restrictedEmails.value.splice(index, 1)[0]
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? `تم حذف ${removed}`
        : `Removed ${removed}`,
      'success'
    )
  }
}

const addPhone = () => {
  const phoneNumber = currentPhoneInput.value.trim()
  if (!phoneNumber) return
  
  // Create full phone number with country code
  const fullPhone = selectedCountryCode.value + phoneNumber.replace(/^\+/, '')
  
  // Basic phone validation (allow international format)
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
  if (!phoneRegex.test(fullPhone.replace(/[\s-()]/g, ''))) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'رقم الهاتف غير صالح'
        : 'Invalid phone number',
      'error'
    )
    return
  }
  
  // Check for duplicates
  if (restrictedPhones.value.includes(fullPhone)) {
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? 'رقم الهاتف موجود بالفعل'
        : 'Phone number already added',
      'warning'
    )
    return
  }
  
  restrictedPhones.value.push(fullPhone)
  currentPhoneInput.value = ''
  setStatusMessage(
    currentLanguage.value === 'ar' 
      ? 'تم إضافة رقم الهاتف بنجاح'
      : 'Phone number added successfully',
    'success'
  )
}

const removePhone = (index: number) => {
  if (index >= 0 && index < restrictedPhones.value.length) {
    const removed = restrictedPhones.value.splice(index, 1)[0]
    setStatusMessage(
      currentLanguage.value === 'ar' 
        ? `تم حذف ${removed}`
        : `Removed ${removed}`,
      'success'
    )
  }
}

// Phone country code functions
const selectCountry = (country: CountryCode) => {
  selectedCountryCode.value = country.dialCode
  showCountryDropdown.value = false
  searchQuery.value = ''
}

const filterCountries = (event: Event) => {
  const target = event.target as HTMLInputElement
  searchQuery.value = target.value
}

const closeCountryDropdown = () => {
  showCountryDropdown.value = false
  searchQuery.value = ''
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

    // Validate survey ID is present
    if (!props.survey?.id) {
      const message = currentLanguage.value === 'ar' 
        ? 'معرف الاستطلاع مطلوب ولا يمكن أن يكون فارغاً'
        : 'Survey ID is required and cannot be undefined'
      setStatusMessage(message, 'error')
      return
    }

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
    const contactMethod = selectedAccess.value === 'PUBLIC' && !perDeviceAccessEnabled.value ? selectedContactMethod.value : undefined
    const surveyId = String(props.survey.id) // Ensure ID is string
    
    // Debug logging
    console.log('Modal Debug - Before service call:', {
      selectedAccess: selectedAccess.value,
      perDeviceAccessEnabled: perDeviceAccessEnabled.value,
      selectedContactMethod: selectedContactMethod.value,
      contactMethod,
      accessLevel
    })
    
    await surveyService.updateSurveyAccess(surveyId, accessLevel, contactMethod, perDeviceAccessEnabled.value)
    
    // Handle private access sharing if needed
    if (selectedAccess.value === 'PRIVATE' && selectedUsers.value.length > 0) {
      const shareData: ShareRequest = {
        user_ids: selectedUsers.value.map(user => user.id),
        emails: [] // Email invitations removed from compact UI
      }
      await surveyService.shareSurvey(surveyId, shareData)
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

    // Open LinkSharingModal automatically if PUBLIC access is selected (but not in submission flow)
    if (selectedAccess.value === 'PUBLIC' && !props.isSubmissionFlow) {
      // Handle password protection
      if (passwordProtectionEnabled.value) {
        try {
          const passwordLinkOptions: PasswordProtectedLinkRequest = {
            days_to_expire: 30
          }
          
          
          if (passwordAccessMode.value === 'email' && restrictedEmails.value.length > 0) {
            // Convert reactive proxy to plain array and send the entire array of restricted emails
            passwordLinkOptions.restricted_email = [...restrictedEmails.value]
          } 
          
          if (passwordAccessMode.value === 'phone' && restrictedPhones.value.length > 0) {
            // Convert reactive proxy to plain array and send the entire array of restricted phones
            passwordLinkOptions.restricted_phone = [...restrictedPhones.value]
          }
          
          
          const passwordLinkResponse = await surveyService.generatePasswordProtectedLink(surveyId, passwordLinkOptions)
          passwordProtectedLink.value = passwordLinkResponse.data
          
          setStatusMessage(
            currentLanguage.value === 'ar' 
              ? 'تم إنشاء رابط محمي بكلمة مرور بنجاح'
              : 'Password-protected link generated successfully',
            'success'
          )
          
          // Show modal with password-protected link
          setTimeout(() => {
            isLinkSharingModalVisible.value = true
          }, 100)
        } catch (error: any) {
          const errorMessage = currentLanguage.value === 'ar' 
            ? 'فشل في إنشاء رابط محمي بكلمة مرور'
            : 'Failed to generate password-protected link'
          setStatusMessage(errorMessage, 'error')
        }
      } else {
        // Load regular public link when user explicitly saves, then open the modal
        await loadPublicLink()
        // Open the modal first, emit save later when modal closes
        setTimeout(() => {
          isLinkSharingModalVisible.value = true
        }, 100)
      }
      // Don't emit save immediately for PUBLIC access - let the modal handle it (unless in submission flow)
      if (props.isSubmissionFlow) {
        // In submission flow, emit save immediately even for PUBLIC access
        const saveData = {
          visibility: selectedAccess.value,
          publicContactMethod: selectedContactMethod.value,
          users: selectedUsers.value,
          emails: [] as string[],
          groups: selectedGroups.value,
          passwordProtected: passwordProtectionEnabled.value,
          passwordOptions: passwordProtectionEnabled.value ? {
            passwordAccessMode: passwordAccessMode.value,
            restrictedEmails: [...restrictedEmails.value],
            restrictedPhones: [...restrictedPhones.value]
          } : undefined,
          per_device_access: perDeviceAccessEnabled.value
        }
        emit('save', saveData)
      }
    } else {
      // For non-PUBLIC access or submission flow, emit save immediately
      const saveData = {
        visibility: selectedAccess.value,
        publicContactMethod: selectedAccess.value === 'PUBLIC' ? selectedContactMethod.value : undefined,
        users: selectedUsers.value,
        emails: [] as string[], // Email invitations removed from compact UI
        groups: selectedGroups.value,
        passwordProtected: selectedAccess.value === 'PUBLIC' ? passwordProtectionEnabled.value : false,
        passwordOptions: selectedAccess.value === 'PUBLIC' && passwordProtectionEnabled.value ? {
          passwordAccessMode: passwordAccessMode.value,
          restrictedEmails: [...restrictedEmails.value],
          restrictedPhones: [...restrictedPhones.value]
        } : undefined,
        per_device_access: selectedAccess.value === 'PUBLIC' ? perDeviceAccessEnabled.value : false
      }
      emit('save', saveData)
    }
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
      if (!props.survey?.id) {
        throw new Error('Survey ID is required')
      }
      const surveyId = String(props.survey.id)
      const response = await surveyService.getSharedUsers(surveyId)
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
  // Only load admin groups for GROUPS access (no need to prevent initialization for this)
  if (newAccess === 'GROUPS') {
    loadAdminGroups()
  }
})

// Watch password access mode to automatically set contact method
watch(() => passwordAccessMode.value, (newMode) => {
  if (passwordProtectionEnabled.value) {
    if (newMode === 'email') {
      selectedContactMethod.value = 'email'
    } else if (newMode === 'phone') {
      selectedContactMethod.value = 'phone'
    }
  }
})

// Watch password protection enabled state
watch(() => passwordProtectionEnabled.value, (isEnabled) => {
  if (isEnabled && passwordAccessMode.value !== 'anyone') {
    // Set contact method based on current password access mode
    if (passwordAccessMode.value === 'email') {
      selectedContactMethod.value = 'email'
    } else if (passwordAccessMode.value === 'phone') {
      selectedContactMethod.value = 'phone'
    }
  }
})

// Watch per-device access enabled state
watch(() => perDeviceAccessEnabled.value, (isEnabled) => {
  if (isEnabled) {
    // Disable password protection when per-device access is enabled
    passwordProtectionEnabled.value = false
  }
})

// Lifecycle
onMounted(() => {
  loadSharedUsers()
  if (props.survey.visibility === 'GROUPS') {
    loadAdminGroups()
  }
  
  // Add global click listener to close country dropdown
  const handleGlobalClick = () => {
    if (showCountryDropdown.value) {
      closeCountryDropdown()
    }
  }
  
  document.addEventListener('click', handleGlobalClick)
  
  // Cleanup on unmount
  const cleanup = () => {
    document.removeEventListener('click', handleGlobalClick)
  }
  
  // Store cleanup function for potential manual cleanup
  ;(window as any).__countryDropdownCleanup = cleanup
})
</script>

<style module src="./SurveyAccessModal.module.css">
/* CSS Module styles are imported from SurveyAccessModal.module.css */
</style>
