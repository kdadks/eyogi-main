import React from 'react'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

export function useConfirmDialog() {
  const [state, setState] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
  })

  const show = (options: Partial<typeof state> & { onConfirm: () => void }) => {
    setState({
      ...state,
      ...options,
      isOpen: true,
    })
  }

  const hide = () => setState((prev) => ({ ...prev, isOpen: false }))

  const Dialog = (
    <ConfirmDialog
      isOpen={state.isOpen}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      onConfirm={() => {
        state.onConfirm()
        hide()
      }}
      onCancel={hide}
      variant={state.variant as 'danger' | 'warning' | 'info'}
    />
  )

  return { show, hide, Dialog }
}
