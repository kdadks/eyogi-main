import { Button, type ButtonProps } from '@/components/ui/button'
import { cn } from 'src/utilities/cn'
import { Link } from 'react-router-dom'
import React from 'react'

import type { Media, Post } from '@/payload-types'

type CMSLinkType = {
  appearance?: 'inline' | ButtonProps['variant']
  children?: React.ReactNode
  className?: string
  label?: string | null
  newTab?: boolean | null
  reference?:
    | { relationTo: 'media'; value: number | Media }
    | { relationTo: 'posts'; value: number | Post }
    | null
    | undefined
  size?: ButtonProps['size'] | null
  type?: 'custom' | 'reference' | null
  url?: string | null
}

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const {
    type,
    appearance = 'inline',
    children,
    className,
    label,
    newTab,
    reference,
    size: sizeFromProps,
    url,
  } = props

  const href =
    type === 'reference' && typeof reference?.value === 'object'
      ? reference.relationTo === 'media'
        ? reference.value.url || '#'
        : `/${reference.relationTo}/${reference.value.slug || ''}`
      : url || '#'

  if (!href) return null

  const size = appearance === 'link' ? 'default' : sizeFromProps
  const newTabProps = newTab ? { rel: 'noopener noreferrer', target: '_blank' } : {}

  const resolvedHref = href || url || ''
  const isExternal = resolvedHref.startsWith('http')

  /* Ensure we don't break any styles set by richText */
  if (appearance === 'inline') {
    if (isExternal) {
      return (
        <a className={cn(className)} href={resolvedHref} {...newTabProps}>
          {label && label}
          {children && children}
        </a>
      )
    }
    return (
      <Link className={cn(className)} to={resolvedHref} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    )
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      {isExternal ? (
        <a className={cn(className)} href={resolvedHref} {...newTabProps}>
          {label && label}
          {children && children}
        </a>
      ) : (
        <Link className={cn(className)} to={resolvedHref} {...newTabProps}>
          {label && label}
          {children && children}
        </Link>
      )}
    </Button>
  )
}
