# Country-State Address Utilities for SSH University

## Overview

This comprehensive address utility system provides reusable components and functions for handling country/state selection across all forms in the SSH University application. It supports 200+ countries with detailed state/province data for major countries.

## File Structure

```
src/SSH/src/
├── lib/
│   └── address-utils.ts                    # Core utility functions and data
├── components/
│   ├── forms/
│   │   ├── AddressForm.tsx                # Complete address form component
│   │   ├── CountrySelect.tsx              # Country dropdown component
│   │   └── StateSelect.tsx                # State/Province dropdown component
│   └── examples/
│       └── AddressUtilityExamples.tsx     # Usage examples and demos
└── pages/dashboard/parents/
    └── ParentsDashboard.tsx               # Enhanced with address settings
```

## Components

### 1. AddressForm Component

Complete address form with all fields and validation.

**Props:**
- `data: AddressFormData` - Current address data
- `onChange: (data: AddressFormData) => void` - Change handler
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable all inputs
- `showOptionalFields?: boolean` - Show address line 2
- `required?: boolean` - Mark fields as required

**Usage:**
```tsx
import AddressForm from '../components/forms/AddressForm'
import { AddressFormData } from '../lib/address-utils'

const [address, setAddress] = useState<AddressFormData>({
  country: '',
  state: '',
  city: '',
  address_line_1: '',
  address_line_2: '',
  zip_code: '',
})

<AddressForm
  data={address}
  onChange={setAddress}
  required={true}
  showOptionalFields={true}
/>
```

### 2. CountrySelect Component

Dropdown for country selection with popular countries first.

**Props:**
- `value: string` - Selected country code
- `onChange: (countryCode: string) => void` - Change handler
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the select
- `required?: boolean` - Mark as required
- `placeholder?: string` - Custom placeholder text
- `showPopularFirst?: boolean` - Show popular countries first

**Usage:**
```tsx
import CountrySelect from '../components/forms/CountrySelect'

const [country, setCountry] = useState('')

<CountrySelect
  value={country}
  onChange={setCountry}
  showPopularFirst={true}
  required={true}
/>
```

### 3. StateSelect Component

Smart state/province selector that adapts to selected country.

**Props:**
- `countryCode: string` - The selected country code
- `value: string` - Selected state code
- `onChange: (stateCode: string) => void` - Change handler
- `className?: string` - Additional CSS classes
- `disabled?: boolean` - Disable the select
- `required?: boolean` - Mark as required
- `placeholder?: string` - Custom placeholder text

**Usage:**
```tsx
import StateSelect from '../components/forms/StateSelect'

const [country, setCountry] = useState('US')
const [state, setState] = useState('')

<StateSelect
  countryCode={country}
  value={state}
  onChange={setState}
  required={true}
/>
```

## Utility Functions

### Core Functions

```tsx
import {
  getCountries,
  getStatesForCountry,
  countryHasStates,
  getCountryName,
  getStateName,
  validateAddress,
  formatAddress
} from '../lib/address-utils'
```

#### `getCountries(): Country[]`
Returns all countries sorted alphabetically.

#### `getStatesForCountry(countryCode: string): StateProvince[]`
Returns states/provinces for a specific country.

#### `countryHasStates(countryCode: string): boolean`
Checks if a country has states/provinces.

#### `getCountryName(countryCode: string): string`
Gets country name from country code.

#### `getStateName(countryCode: string, stateCode: string): string`
Gets state name from country and state codes.

#### `validateAddress(addressData: AddressFormData): ValidationResult`
Validates address data and returns validation results.

#### `formatAddress(addressData: AddressFormData): string`
Formats address data into a readable string.

### Types

```tsx
interface Country {
  code: string
  name: string
}

interface StateProvince {
  code: string
  name: string
}

interface AddressFormData {
  country: string
  state: string
  city: string
  address_line_1: string
  address_line_2?: string
  zip_code: string
}
```

## Supported Countries with States/Provinces

- **United States** - All 50 states + DC
- **Canada** - All provinces and territories
- **Australia** - States and territories
- **India** - All states and union territories
- **United Kingdom** - England, Scotland, Wales, Northern Ireland
- **Germany** - All federal states
- **Brazil** - All states
- **Mexico** - All states
- **Argentina** - All provinces
- **Italy** - All regions
- **Spain** - All autonomous communities
- **France** - All regions
- **South Africa** - All provinces
- **Malaysia** - All states
- **Ireland** - All counties

## Integration Examples

### 1. Registration Form
```tsx
function RegistrationForm() {
  const [address, setAddress] = useState<AddressFormData>({
    country: '',
    state: '',
    city: '',
    address_line_1: '',
    address_line_2: '',
    zip_code: '',
  })

  return (
    <form>
      {/* Other fields */}
      <AddressForm
        data={address}
        onChange={setAddress}
        required={true}
      />
    </form>
  )
}
```

### 2. Profile Settings
```tsx
function ProfileSettings({ user }) {
  const [address, setAddress] = useState(user.address || {})

  const handleSave = async () => {
    const validation = validateAddress(address)
    if (!validation.isValid) {
      alert('Address validation failed: ' + validation.errors.join(', '))
      return
    }
    
    // Save address
    await updateProfile({ address })
  }

  return (
    <div>
      <AddressForm data={address} onChange={setAddress} />
      <button onClick={handleSave}>Save</button>
    </div>
  )
}
```

### 3. Custom Form Integration
```tsx
function CustomForm() {
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')

  return (
    <div>
      <CountrySelect
        value={country}
        onChange={(newCountry) => {
          setCountry(newCountry)
          setState('') // Clear state when country changes
        }}
      />
      
      {countryHasStates(country) && (
        <StateSelect
          countryCode={country}
          value={state}
          onChange={setState}
        />
      )}
    </div>
  )
}
```

## Implementation in Parents Dashboard

The Parents Dashboard now includes a comprehensive Settings tab with profile editing functionality:

### Features Added:
1. **Profile Information Display** - Shows current user details
2. **Address Management** - Complete address form with country/state selection
3. **Edit Profile Modal** - Popup with personal info and address editing
4. **Notification Preferences** - Email, SMS, and report settings
5. **Visual Address Summary** - Shows formatted address when available

### How to Access:
1. Navigate to Parents Dashboard
2. Click on "Settings" tab in the navigation
3. Use "Edit Profile" button to update address information

## Best Practices

### 1. State Management
- Always clear state when country changes
- Validate address data before submission
- Use the provided TypeScript interfaces

### 2. User Experience
- Show popular countries first (`showPopularFirst={true}`)
- Provide helpful placeholder text
- Handle loading states appropriately

### 3. Validation
- Use `validateAddress()` before form submission
- Display validation errors clearly
- Check if country has states before showing state selector

### 4. Performance
- Components are optimized with proper sorting
- Use React.memo for frequently re-rendered components
- Consider lazy loading for large forms

## Future Enhancements

### Potential Additions:
1. **City Autocomplete** - API integration for city suggestions
2. **Address Validation** - Third-party address verification
3. **Geolocation** - Auto-detect country from user location
4. **Address History** - Recent addresses for quick selection
5. **Internationalization** - Multi-language support for country/state names

### API Integration Ready:
The utility is designed to easily integrate with address validation APIs:
```tsx
const validateAddressWithAPI = async (address: AddressFormData) => {
  // Integrate with Google Places, SmartyStreets, etc.
  const response = await fetch('/api/validate-address', {
    method: 'POST',
    body: JSON.stringify(address)
  })
  return response.json()
}
```

## Testing

The components include comprehensive examples in `AddressUtilityExamples.tsx` that demonstrate:
- Complete address form usage
- Individual component usage
- Custom form integration
- Utility function usage

To test the components:
1. Import the examples component
2. Add it to your routing
3. Navigate to see live examples

## Support

For questions or issues with the address utilities:
1. Check the examples in `AddressUtilityExamples.tsx`
2. Review the TypeScript interfaces in `address-utils.ts`
3. Test with different countries to understand behavior
4. Ensure proper imports and component props

The system is now ready for use across all forms in the SSH University application, providing consistent and reliable address collection functionality.