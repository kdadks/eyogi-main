import React, { useCallback } from 'react'
import ReactQuill, { ReactQuillProps } from 'react-quill'
import 'react-quill/dist/quill.snow.css'

/**
 * SafeReactQuill - A wrapper around ReactQuill that adds error handling
 * to prevent uncaught errors in onChange handlers
 */
interface SafeReactQuillProps extends Omit<ReactQuillProps, 'onChange'> {
  onChange?: (value: string) => void
}

export const SafeReactQuill: React.FC<SafeReactQuillProps> = ({
  onChange,
  value,
  theme = 'snow',
  ...props
}) => {
  const handleChange = useCallback(
    (content: string) => {
      try {
        // Ensure content is always a string
        const safeContent = content ?? ''
        onChange?.(safeContent)
      } catch (error) {
        console.error('Error in ReactQuill onChange handler:', error)
        // Attempt to recover by calling onChange with empty string
        try {
          onChange?.('')
        } catch (recoveryError) {
          console.error('Failed to recover from ReactQuill error:', recoveryError)
        }
      }
    },
    [onChange],
  )

  // Ensure value is always a string
  const safeValue = value ?? ''

  return <ReactQuill {...props} value={safeValue} onChange={handleChange} theme={theme} />
}

export default SafeReactQuill
