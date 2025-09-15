import React from 'react'

interface RollingTextProps {
  text: string
  className?: string
}

export default function RollingText({ text, className = '' }: RollingTextProps) {
  return (
    <div className={`rolling-text-container ${className}`}>
      <div className="rolling-text">
        <span className="rolling-text-item">{text}</span>
        <span className="rolling-text-item">{text}</span>
      </div>
    </div>
  )
}
