import React from 'react'
import { Globe } from 'lucide-react'
import { getCountries, getCountriesWithPopularFirst } from '../../lib/address-utils'
interface CountrySelectProps {
  value: string
  onChange: (countryCode: string) => void
  className?: string
  disabled?: boolean
  required?: boolean
  placeholder?: string
  showPopularFirst?: boolean
}
const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
  required = false,
  placeholder = 'Select Country',
  showPopularFirst = true,
}) => {
  const countries = showPopularFirst ? getCountriesWithPopularFirst() : getCountries()
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <div
        className="absolute inset-y-0 left-0 flex items-center pointer-events-none z-10"
        style={{ left: isMobile ? '6px' : '8px' }}
      >
        <Globe
          className="text-gray-400"
          style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }}
        />
      </div>
      <select
        value={value}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`
          appearance-none block w-full py-2 
          border border-gray-300 rounded-lg 
          bg-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
          cursor-pointer
          ${className}
        `}
        style={{
          fontSize: isMobile ? '12px' : '13px',
          paddingLeft: isMobile ? '28px' : '32px',
          paddingRight: isMobile ? '32px' : '36px',
          height: isMobile ? '36px' : '40px',
          maxWidth: '100%',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {showPopularFirst && (
          <>
            <optgroup label="Popular Countries">
              {countries.slice(0, 13).map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="All Countries">
              {countries.slice(13).map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </optgroup>
          </>
        )}
        {!showPopularFirst &&
          countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
      </select>
      {/* Custom dropdown arrow */}
      <div
        className="absolute inset-y-0 right-0 flex items-center pointer-events-none z-10"
        style={{ right: isMobile ? '6px' : '8px' }}
      >
        <svg
          className="text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ width: isMobile ? '12px' : '14px', height: isMobile ? '12px' : '14px' }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  )
}
export default CountrySelect
