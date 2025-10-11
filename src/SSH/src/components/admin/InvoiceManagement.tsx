import React from 'react'
import ComingSoon from './ComingSoon'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

const InvoiceManagement: React.FC = () => {
  return (
    <ComingSoon
      title="Invoice Management"
      description="Comprehensive invoice management system for tracking and managing all invoices. Create, send, and track invoices with ease."
      icon={DocumentTextIcon}
    />
  )
}

export default InvoiceManagement
