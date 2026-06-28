/**
 * Simple Tabs component for admin UI
 */
import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/utilities/cn'

interface TabsContextValue {
  selectedIndex: number
  onChange: (index: number) => void
}

const TabsContext = createContext<TabsContextValue>({ selectedIndex: 0, onChange: () => {} })

interface TabsProps {
  selectedIndex?: number
  onChange?: (index: number) => void
  children: React.ReactNode
  className?: string
}

export function Tabs({ selectedIndex = 0, onChange = () => {}, children, className }: TabsProps) {
  return (
    <TabsContext.Provider value={{ selectedIndex, onChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: React.ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  return (
    <div className={cn('flex border-b border-gray-200 mb-4', className)}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { _index: index })
        }
        return child
      })}
    </div>
  )
}

interface TabProps {
  children: React.ReactNode
  className?: string
  _index?: number
}

export function Tab({ children, className, _index = 0 }: TabProps) {
  const { selectedIndex, onChange } = useContext(TabsContext)
  const isSelected = selectedIndex === _index
  return (
    <button
      type="button"
      onClick={() => onChange(_index)}
      className={cn(
        'flex items-center px-4 py-2 text-sm font-medium border-b-2 transition-colors',
        isSelected
          ? 'border-orange-600 text-orange-600'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300',
        className,
      )}
    >
      {children}
    </button>
  )
}

interface TabPanelsProps {
  children: React.ReactNode
  className?: string
}

export function TabPanels({ children, className }: TabPanelsProps) {
  const { selectedIndex } = useContext(TabsContext)
  const childArray = React.Children.toArray(children)
  return <div className={className}>{childArray[selectedIndex] || null}</div>
}

interface TabPanelProps {
  children: React.ReactNode
  className?: string
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={cn('py-4', className)}>{children}</div>
}
