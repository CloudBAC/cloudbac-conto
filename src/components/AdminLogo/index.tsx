import React from 'react'

const AdminLogo: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '32px',
          height: '32px',
          background: '#d4a853',
          color: '#0a0a0b',
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: '18px',
          fontWeight: 400,
          borderRadius: '7px',
          flexShrink: 0,
        }}
      >
        C
      </div>
      <span
        style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: '20px',
          letterSpacing: '-0.02em',
          color: '#f0ebe3',
        }}
      >
        Conto
      </span>
    </div>
  )
}

export default AdminLogo
