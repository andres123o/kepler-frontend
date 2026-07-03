'use client'
import { useState } from 'react'

const f = `var(--font-inter), "Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif`
const GRADIENT = `linear-gradient(115deg, #4A0072 0%, #C2185B 50%, #FF8C00 100%)`

export default function MobileShareButton() {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: 'Kepler para KOA', url }) } catch {}
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
        backgroundImage: GRADIENT,
        color: '#FFFFFF',
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
