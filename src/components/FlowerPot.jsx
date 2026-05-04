export default function FlowerPot({ streak = 0, sessions = 0 }) {
  // Determine flower stage based on streak
  const stage = streak === 0 ? 'seed' : streak < 3 ? 'sprout' : streak < 7 ? 'growing' : streak < 14 ? 'blooming' : 'flourishing'
  
  const stageLabel = {
    seed: 'Just planted 🌱',
    sprout: 'Sprouting! 🌿',
    growing: 'Growing well 🌸',
    blooming: 'Blooming! 🌺',
    flourishing: 'Flourishing! 🌻',
  }

  const stemHeight = Math.min(80, 15 + streak * 8)
  const petalCount = stage === 'blooming' || stage === 'flourishing' ? 8 : stage === 'growing' ? 5 : 0
  const petalColor = streak >= 14 ? '#FFC52D' : streak >= 7 ? '#ff9ed2' : '#a8d4e8'
  const leafVisible = streak >= 3
  const wilt = streak === 0 && sessions > 0

  return (
    <div className="flex flex-col items-center">
      {/* Plant SVG */}
      <svg width="120" height="160" viewBox="0 0 120 160" className="mb-2">
        {/* Soil / pot */}
        <ellipse cx="60" cy="148" rx="34" ry="8" fill="#8B6914" opacity="0.7" />
        <path d="M30 135 Q30 148 60 148 Q90 148 90 135 L85 120 L35 120 Z"
          fill="rgba(139, 105, 20, 0.6)" stroke="rgba(108, 158, 179, 0.3)" strokeWidth="1" />
        <path d="M35 120 L30 135 Q30 148 60 148 Q90 148 90 135 L85 120"
          fill="none" stroke="rgba(252, 233, 151, 0.2)" strokeWidth="1" />

        {/* Soil surface */}
        <ellipse cx="60" cy="122" rx="24" ry="6" fill="#5a3e0a" opacity="0.8" />

        {/* Stem */}
        {streak > 0 && (
          <path
            d={wilt
              ? `M60 122 Q55 ${122 - stemHeight * 0.5} 45 ${122 - stemHeight}`
              : `M60 122 Q62 ${122 - stemHeight * 0.5} 60 ${122 - stemHeight}`}
            fill="none"
            stroke="#4a7c3a"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Seed visual */}
        {streak === 0 && (
          <ellipse cx="60" cy="118" rx="5" ry="4" fill="#8B6914" opacity="0.6" />
        )}

        {/* Leaves */}
        {leafVisible && (
          <>
            <path d={`M60 ${122 - stemHeight * 0.5} Q70 ${118 - stemHeight * 0.5} 68 ${110 - stemHeight * 0.5}`}
              fill="#4a7c3a" opacity="0.9" />
            <path d={`M60 ${122 - stemHeight * 0.6} Q50 ${115 - stemHeight * 0.6} 52 ${108 - stemHeight * 0.6}`}
              fill="#3d6b2e" opacity="0.8" />
          </>
        )}

        {/* Flower petals */}
        {petalCount > 0 && !wilt && (() => {
          const cx = 60
          const cy = 122 - stemHeight
          const petalR = stage === 'flourishing' ? 12 : 9
          return Array.from({ length: petalCount }).map((_, i) => {
            const angle = (i / petalCount) * Math.PI * 2
            const px = cx + Math.cos(angle) * petalR
            const py = cy + Math.sin(angle) * petalR
            return (
              <ellipse key={i} cx={px} cy={py} rx="7" ry="5"
                transform={`rotate(${(angle * 180) / Math.PI + 90} ${px} ${py})`}
                fill={petalColor} opacity="0.9" />
            )
          })
        })()}

        {/* Flower center */}
        {petalCount > 0 && !wilt && (
          <circle cx="60" cy={122 - stemHeight} r="6" fill="#FFC52D" />
        )}

        {/* Sprout leaves if no petals yet */}
        {streak >= 1 && streak < 3 && (
          <>
            <path d={`M60 ${122 - stemHeight} Q68 ${115 - stemHeight} 65 ${108 - stemHeight}`}
              fill="#5a9a48" opacity="0.9" />
            <path d={`M60 ${122 - stemHeight} Q52 ${115 - stemHeight} 55 ${108 - stemHeight}`}
              fill="#4a7c3a" opacity="0.8" />
          </>
        )}
      </svg>

      {/* Stage label */}
      <div className="font-editorial italic text-gold-soft text-sm text-center mb-1">
        {stageLabel[stage]}
      </div>
      <div className="font-mono text-xs text-night-light text-center">
        {streak} day streak · {sessions} sessions
      </div>
      {streak === 0 && sessions === 0 && (
        <div className="font-sans text-xs text-night-blue text-center mt-2 max-w-32 leading-relaxed">
          Start your first session to plant your flower
        </div>
      )}
    </div>
  )
}
