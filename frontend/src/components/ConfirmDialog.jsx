/**
 * Reusable confirmation dialog built on the shared Modal.
 *
 * Replaces the native window.confirm() with a styled in-app popup. The parent
 * controls visibility (render it only when needed) and handles the actions.
 */
import Modal from './Modal'

export default function ConfirmDialog({
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="confirm-msg">{message}</p>
      <div className="confirm-actions">
        <button className="btn btn-ghost" onClick={onCancel}>{cancelLabel}</button>
        <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
