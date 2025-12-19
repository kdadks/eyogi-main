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
  // Store the last value to prevent onChange loops
  const lastValueRef = React.useRef<string>('')

  const handleChange = useCallback(
    (content: string) => {
      try {
        // Ensure content is always a string
        const safeContent = content ?? ''

        // Prevent onChange loop by checking if value actually changed
        if (safeContent === lastValueRef.current) {
          return
        }

        lastValueRef.current = safeContent

        // Call onChange in a try-catch to prevent any errors from propagating
        if (onChange) {
          try {
            onChange(safeContent)
          } catch (onChangeError) {
            console.error('Error in onChange callback:', onChangeError)
          }
        }
      } catch (error) {
        console.error('Error in ReactQuill onChange handler:', error)
        // Attempt to recover by calling onChange with empty string
        if (onChange) {
          try {
            onChange('')
          } catch (recoveryError) {
            console.error('Failed to recover from ReactQuill error:', recoveryError)
          }
        }
      }
    },
    [onChange],
  )

  // Ensure value is always a string and handle potential undefined/null
  const safeValue = React.useMemo(() => {
    try {
      if (value === null || value === undefined) return ''
      if (typeof value !== 'string') {
        console.warn('ReactQuill value is not a string:', typeof value, value)
        return String(value)
      }
      return value
    } catch (error) {
      console.error('Error processing ReactQuill value:', error)
      return ''
    }
  }, [value])

  // Update ref when value changes from props
  React.useEffect(() => {
    lastValueRef.current = safeValue
  }, [safeValue])

  return <ReactQuill {...props} value={safeValue} onChange={handleChange} theme={theme} />
}

export default SafeReactQuill
