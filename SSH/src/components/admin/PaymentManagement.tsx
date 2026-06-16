import React from 'react'
import ComingSoon from './ComingSoon'
import { CreditCardIcon } from '@heroicons/react/24/outline'

const PaymentManagement: React.FC = () => {
  return (
    <ComingSoon
      title="Payment Management"
      description="Secure payment processing and management system. Handle transactions, refunds, and payment records efficiently."
      icon={CreditCardIcon}
    />
  )
}

export default PaymentManagement
