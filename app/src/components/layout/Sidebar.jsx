import { NavLink } from 'react-router-dom'

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="2" width="7.5" height="7.5" rx="1.5" fill="currentColor" />
        <rect x="10.5" y="2" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="2" y="10.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.5" />
        <rect x="10.5" y="10.5" width="7.5" height="7.5" rx="1.5" fill="currentColor" opacity="0.3" />
      </svg>
    ),
  },
  {
    to: '/inventory',
    label: 'Inventory',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="16" height="3.5" rx="1" fill="currentColor" />
        <rect x="2" y="8.25" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.65" />
        <rect x="2" y="13.5" width="16" height="3.5" rx="1" fill="currentColor" opacity="0.35" />
      </svg>
    ),
  },
  {
    to: '/recipes',
    label: 'Recipes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7 2v5c0 1.7 1.3 3 3 3s3-1.3 3-3V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M10 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 2v4M14 6c0 1.1-.9 2-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    to: '/groceries',
    label: 'Grocery List',
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 4h2l2.5 8.5h7.5l2-6.5H6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="16" r="1.5" fill="currentColor" />
        <circle cx="14.5" cy="16" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'AI Chatbot',
    icon: (
      <img src="/gemini-white.png" alt="Gibrain" width="20" height="20" className="object-contain" />
    ),
  },
]

export function Sidebar () {
  return (
    <aside className="fixed left-0 top-0 h-full w-[72px] bg-brand-sidebar flex flex-col items-center z-30 py-5">
      {/* Logo */}
      <div className="w-full flex justify-center mb-5">
        <div className="w-10 h-10 flex items-center justify-center">
          <span className="text-white text-2xl select-none" style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontWeight: 700, letterSpacing: '-0.02em' }}>
            n
          </span>
        </div>
      </div>

      {/* User avatar */}
      <div className="w-9 h-9 rounded-full bg-brand-green flex items-center justify-center text-white font-semibold text-xs flex-shrink-0 mb-6">
        BL
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            title={item.label}
            className={({ isActive }) =>
              `w-full h-10 rounded-xl flex items-center justify-center transition-all duration-150 ${
                isActive
                  ? 'bg-brand-green text-white'
                  : 'text-white/50 hover:text-white hover:bg-brand-sidebarHover'
              }`
            }
          >
            {item.icon}
          </NavLink>
        ))}
      </nav>

      {/* Active indicator dot */}
      <div className="mt-4 flex flex-col items-center gap-1">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
      </div>
    </aside>
  )
}
