import { useEffect } from 'react'

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(28,25,23,0.5)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--elevated)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        zIndex: 201,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
      }}>
        {/* Handle */}
        <div style={{
          width: 36,
          height: 4,
          background: 'var(--border)',
          borderRadius: 2,
          margin: '12px auto 0',
          flexShrink: 0,
        }} />
        {title && (
          <div style={{
            padding: '16px 20px 12px',
            fontSize: 17,
            fontWeight: 600,
            color: 'var(--fg1)',
            fontFamily: 'var(--font-ui)',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}>
            {title}
          </div>
        )}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
      `}</style>
    </>
  )
}
