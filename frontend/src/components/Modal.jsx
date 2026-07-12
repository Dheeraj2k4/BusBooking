/**
 * Minimal reusable modal dialog.
 *
 * Renders its children in a centered overlay. Closing is handled by the
 * parent via the `onClose` callback (clicking the backdrop or the X).
 */
export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      {/* stopPropagation so clicks inside the card don't close the modal */}
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
