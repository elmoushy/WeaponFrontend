# Phone Input with Country Code Feature

## Overview
This feature adds a comprehensive phone input system with country code selection for anonymous survey responses. When a survey is configured to require phone contact method, users can select their country code and enter their phone number.

## Files Added/Modified

### New Files:
1. **`src/data/countryCodes.json`** - Contains comprehensive list of countries with:
   - English and Arabic names
   - ISO country codes
   - Dial codes
   - Flag emojis

2. **`src/types/country.types.ts`** - TypeScript interface for country data

### Modified Files:
1. **`src/pages/Survey/PublicSurveyView.vue`** - Updated phone input section with:
   - Country code dropdown selector
   - Searchable country list
   - Phone number validation
   - Full phone number preview
   - Click-outside-to-close functionality

2. **`src/pages/Survey/PublicSurveyView.module.css`** - Added comprehensive styling for:
   - Country selector button and dropdown
   - Searchable country list
   - Phone input field
   - Phone number preview
   - Dark theme support
   - RTL (right-to-left) layout support

## Features

### Country Selection
- **Searchable Dropdown**: Users can search countries by Arabic name, English name, or dial code
- **Visual Flags**: Each country shows its flag emoji for easy identification
- **Default Country**: Defaults to Saudi Arabia (+966) but can be changed
- **Click Outside to Close**: Dropdown closes when clicking elsewhere

### Phone Input
- **Separated Input**: Country code and phone number are handled separately
- **Real-time Preview**: Shows the complete phone number as user types
- **Validation**: Validates phone number format (7-15 digits)
- **Error Messages**: Clear Arabic error messages for invalid input

### Internationalization
- **Arabic Interface**: All UI text in Arabic
- **RTL Layout**: Properly formatted for right-to-left reading
- **Bilingual Country Names**: Supports both Arabic and English country names in search

## Usage

When the survey's `public_contact_method` is set to `"phone"`, the phone input section will appear with:

1. **Country Selector**: Button showing selected country flag and dial code
2. **Phone Input**: Text field for entering phone number (without country code)
3. **Preview**: Shows complete international phone number
4. **Validation**: Ensures proper phone number format before submission

## Technical Implementation

### State Management
```javascript
const selectedCountryCode = ref('+966') // Default to Saudi Arabia
const showCountryDropdown = ref(false)
const searchQuery = ref('')
const userPhone = ref('')
```

### Computed Properties
```javascript
const fullPhoneNumber = computed(() => {
  return selectedCountryCode.value + userPhone.value.trim().replace(/\s|-|[()]/g, '')
})

const selectedCountry = computed(() => {
  return countryCodes.find(country => country.dialCode === selectedCountryCode.value) || defaultCountry
})
```

### Validation
- Phone number must be 7-15 digits (excluding country code)
- Accepts various formats with spaces, dashes, or parentheses
- Validates both individual phone format and full number completion

### Submission
The complete phone number (country code + phone number) is sent to the API as:
```javascript
submissionData.phone = fullPhoneNumber.value
```

## Styling Features

### Responsive Design
- Works on desktop and mobile devices
- Dropdown adjusts to available space
- Touch-friendly button sizes

### Theme Support
- Light theme with warm color palette
- Dark theme with blue accent colors
- Smooth transitions and hover effects

### Accessibility
- Keyboard navigation support
- Clear visual feedback
- High contrast for readability
- Semantic HTML structure

## Countries Included

The system includes 70+ countries with focus on:
- All Middle Eastern countries
- Major international countries
- Countries with significant Arabic-speaking populations
- Popular destinations and business centers

Each country entry includes:
- Arabic name (e.g., "المملكة العربية السعودية")
- English name (e.g., "Saudi Arabia")
- ISO code (e.g., "SA")
- Dial code (e.g., "+966")
- Flag emoji (e.g., "🇸🇦")
