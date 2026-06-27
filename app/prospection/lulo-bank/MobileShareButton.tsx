'use client'
import { useState } from 'react'

const f = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif`

export default function MobileShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: 'Kepler para Lulo Bank', url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        background: '#E8FF00',
        color: '#121622',
        padding: '14px 36px',
        borderRadius: '60px',
        fontWeight: 800,
        fontSize: '15px',
        border: 'none',
        cursor: 'pointer',
        letterSpacing: '-0.01em',
        fontFamily: f,
      }}
    >
      {copied ? '¡Enlace copiado!' : 'Enviar a mi computador'}
      {!copied && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      )}
    </button>
  )
}
