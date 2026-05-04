import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'

export default function TopNav() {
  const { streak, mode, toggleMode } = useApp()
  const navigate = useNavigate()
  const isGolden = mode === 'golden'

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-3 gap-3"
      style={{
        background: isGolden
          ? 'rgba(26, 8, 0, 0.6)'
          : 'rgba(10, 15, 30, 0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${isGolden ? 'rgba(255,140,40,0.2)' : 'rgba(108,158,179,0.2)'}`,
        transition: 'background 0.8s ease, border-color 0.8s ease',
      }}
    >
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1.5 flex-shrink-0">
        <span className="font-editorial italic text-2xl font-light leading-none"
          style={{ color: isGolden ? '#FFD97D' : '#FFC52D' }}>Dev</span>
        <span className="font-display text-xl text-paper tracking-widest leading-none">_Speaks</span>
      </button>

      {/* Nav links */}
      <div className="hidden md:flex items-center gap-1">
        {[{ to: '/', label: 'Home' }, { to: '/topics', label: 'Topics' }, { to: '/progress', label: 'Progress' }].map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `px-4 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200 ${isActive ? '' : 'text-night-light hover:text-paper'}`
            }
            style={({ isActive }) => isActive ? {
              background: isGolden ? 'rgba(255,180,50,0.12)' : 'rgba(252,233,151,0.12)',
              border: `1px solid ${isGolden ? 'rgba(255,180,50,0.3)' : 'rgba(252,233,151,0.25)'}`,
              color: isGolden ? '#FFD97D' : '#FCE997',
            } : {}}
          >
            {label}
          </NavLink>
        ))}
      </div>

      {/* Right side: streak + mode toggle */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Streak */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
          style={{
            background: isGolden ? 'rgba(255,160,50,0.12)' : 'rgba(255,197,45,0.12)',
            border: `1px solid ${isGolden ? 'rgba(255,160,50,0.3)' : 'rgba(255,197,45,0.3)'}`,
          }}>
          <span className="text-sm">🔥</span>
          <span className="font-mono text-xs font-bold" style={{ color: isGolden ? '#FFD97D' : '#FFC52D' }}>
            Day_{String(streak).padStart(2, '0')}
          </span>
        </div>

        {/* Magic Hour toggle */}
        <button
          onClick={toggleMode}
          title={isGolden ? 'Switch to Starlit Night' : 'Switch to Golden Hour'}
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 text-base"
          style={{
            background: isGolden ? 'rgba(255,160,50,0.15)' : 'rgba(108,158,179,0.15)',
            border: `1px solid ${isGolden ? 'rgba(255,160,50,0.35)' : 'rgba(108,158,179,0.3)'}`,
          }}
        >
          {isGolden ? '🌙' : '☀️'}
        </button>
      </div>
    </nav>
  )
}
