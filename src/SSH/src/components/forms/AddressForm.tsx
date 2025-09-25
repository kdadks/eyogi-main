import React from 'react'
import { Building, MapPin, Mail } from 'lucide-react'
import CountrySelect from './CountrySelect'
import StateSelect from './StateSelect'
import { AddressFormData, countryHasStates } from '../../lib/address-utils'
interface AddressFormProps {
  data: AddressFormData
  onChange: (data: AddressFormData) => void
  className?: string
  disabled?: boolean
  showOptionalFields?: boolean
  required?: boolean
}
const AddressForm: React.FC<AddressFormProps> = ({
  data,
  onChange,
  className = '',
  disabled = false,
  showOptionalFields = true,
  required = false,
}) => {
  const handleChange = (field: keyof AddressFormData, value: string) => {
    const newData = {
      ...data,
      [field]: value,
    }
    // If country changes, clear state if new country doesn't have states
    if (field === 'country') {
      if (!countryHasStates(value)) {
        newData.state = ''
      }
    }
    onChange(newData)
  }
  const inputClass = `
    block w-full px-3 py-2.5 
    border border-gray-300 rounded-lg 
    bg-white text-sm placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
  `
  const inputWithIconClass = `
    block w-full pl-10 pr-3 py-2.5 
    border border-gray-300 rounded-lg 
    bg-white text-sm placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
  `
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Country Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Country {required && <span className="text-red-500">*</span>}
        </label>
        <CountrySelect
          value={data.country}
          onChange={(value) => handleChange('country', value)}
          disabled={disabled}
          required={required}
          showPopularFirst={true}
        />
      </div>
      {/* State/Province Selection - Only show if country has states */}
      {data.country && countryHasStates(data.country) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province {required && <span className="text-red-500">*</span>}
          </label>
          <StateSelect
            countryCode={data.country}
            value={data.state}
            onChange={(value) => handleChange('state', value)}
            disabled={disabled}
            required={required}
          />
        </div>
      )}
      {/* City */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          City {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={data.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="Enter city name"
            disabled={disabled}
            required={required}
            className={inputWithIconClass}
          />
        </div>
      </div>
      {/* Address Line 1 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Address Line 1 {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={data.address_line_1}
            onChange={(e) => handleChange('address_line_1', e.target.value)}
            placeholder="Street address, P.O. box, company name"
            disabled={disabled}
            required={required}
            className={inputWithIconClass}
          />
        </div>
      </div>
      {/* Address Line 2 - Optional */}
      {showOptionalFields && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address Line 2 <span className="text-gray-400 text-xs">(Optional)</span>
          </label>
          <input
            type="text"
            value={data.address_line_2 || ''}
            onChange={(e) => handleChange('address_line_2', e.target.value)}
            placeholder="Apartment, suite, unit, building, floor, etc."
            disabled={disabled}
            className={inputClass}
          />
        </div>
      )}
      {/* ZIP/Postal Code */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ZIP/Postal Code {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Mail className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={data.zip_code}
            onChange={(e) => handleChange('zip_code', e.target.value)}
            placeholder={data.country === 'US' ? 'ZIP Code' : 'Postal Code'}
            disabled={disabled}
            required={required}
            className={inputWithIconClass}
          />
        </div>
      </div>
      {/* Address Summary - Show when form is filled */}
      {data.country && data.city && data.address_line_1 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-1">Address Summary:</p>
          <p className="text-sm text-gray-600">
            {[
              data.address_line_1,
              data.address_line_2,
              data.city,
              data.state,
              data.zip_code,
              data.country,
            ]
              .filter(Boolean)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
export default AddressForm
