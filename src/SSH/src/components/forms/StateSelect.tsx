import React from 'react'
import { MapPin } from 'lucide-react'
import { getStatesForCountry, countryHasStates, getCountryName } from '../../lib/address-utils'
interface StateSelectProps {
  countryCode: string
  value: string
  onChange: (stateCode: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
}
const StateSelect: React.FC<StateSelectProps> = ({
  countryCode,
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  placeholder = 'Select State/Province',
}) => {
  const hasStates = countryHasStates(countryCode)
  const states = hasStates ? getStatesForCountry(countryCode) : []
  const countryName = getCountryName(countryCode)
  // Don't render if country doesn't have states or no country selected
  if (!countryCode || !hasStates) {
    return null
  }
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }
  // Generate dynamic placeholder based on country
  const getDynamicPlaceholder = () => {
    if (countryCode === 'US') return 'Select State'
    if (countryCode === 'CA') return 'Select Province'
    if (countryCode === 'IN') return 'Select State'
    if (countryCode === 'AU') return 'Select State/Territory'
    if (countryCode === 'DE') return 'Select State'
    if (countryCode === 'BR') return 'Select State'
    if (countryCode === 'MX') return 'Select State'
    if (countryCode === 'AR') return 'Select Province'
    if (countryCode === 'IT') return 'Select Region'
    if (countryCode === 'ES') return 'Select Community'
    if (countryCode === 'FR') return 'Select Region'
    if (countryCode === 'GB') return 'Select Country'
    return placeholder
  }
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <MapPin className="h-4 w-4 text-gray-400" />
      </div>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled || states.length === 0}
        required={required}
        className={`
          appearance-none block w-full pl-10 pr-8 py-2 
          border border-gray-300 rounded-lg 
          bg-white text-xs sm:text-sm placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          h-9 sm:h-10
          ${className}
        `}
        style={{
          fontSize: '13px',
        }}
      >
        <option value="" disabled>
          {getDynamicPlaceholder()}
        </option>
        {states.map((state) => (
          <option key={state.code} value={state.code}>
            {state.name}
          </option>
        ))}
      </select>
      {/* Custom dropdown arrow */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {/* Helpful text */}
      {states.length === 0 && countryName && (
        <p className="text-xs text-gray-500 mt-1">
          No states/provinces available for {countryName}
        </p>
      )}
    </div>
  )
}
export default StateSelect
