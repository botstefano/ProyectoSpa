export default function BrandLogo({ subtitle = '', light = true, href = '/' }) {
  const content = (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
      <span className="payers-brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <div>
        <span
          className="navbar-mark"
          style={{
            display: 'block',
            color: light ? 'var(--color-ink, #F3EEE2)' : 'var(--color-ink-on-contrast, #1B2A21)',
            fontFamily: 'var(--font-display, Fraunces, serif)',
            fontSize: '1.22rem',
            lineHeight: 1.15,
            letterSpacing: '0.01em',
            fontWeight: 500,
          }}
        >
          Origen Spa &amp; Bienestar
        </span>
        {subtitle && (
          <span
            style={{
              display: 'block',
              color: 'var(--color-ink-muted, #B9C4B7)',
              fontSize: '0.72rem',
              letterSpacing: '0.04em',
              fontWeight: 500,
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <a href={href} style={{ textDecoration: 'none', color: 'inherit' }}>
        {content}
      </a>
    )
  }

  return content
}
