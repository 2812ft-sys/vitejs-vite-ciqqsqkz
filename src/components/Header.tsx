import { BookOpen, LayoutDashboard, LogIn, LogOut, Plus, UserRound } from 'lucide-react'
import { Session } from '@supabase/supabase-js'
import { Profile } from '../types'

interface HeaderProps {
  session: Session | null
  profile: Profile | null
  onLogoClick: () => void
  onSellClick: () => void
  onAuthClick: () => void
  onDashboardClick: () => void
  onSignOut: () => void
}

export default function Header({ session, profile, onLogoClick, onSellClick, onAuthClick, onDashboardClick, onSignOut }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-inner">
        <button className="header-logo" onClick={onLogoClick}>
          <BookOpen size={24} color="var(--color-primary-600)" />
          <span className="header-logo-text">ร้านหนังสือมือสอง</span>
        </button>
        <nav className="header-nav">
          <button className="header-nav-btn" onClick={onLogoClick}>หน้าแรก</button>
          {session && <button className="header-nav-btn dashboard-nav-btn" onClick={onDashboardClick}><LayoutDashboard size={16} /> <span>แดชบอร์ด</span></button>}
          {session && <button className="btn-sell" onClick={onSellClick}><Plus size={18} /><span>ลงขายหนังสือ</span></button>}
          {session ? (
            <button className="account-btn" onClick={onSignOut} title="ออกจากระบบ"><UserRound size={16} /><span>{profile?.display_name || session.user.email}</span><LogOut size={15} /></button>
          ) : (
            <button className="login-btn" onClick={onAuthClick}><LogIn size={17} /><span>เข้าสู่ระบบ</span></button>
          )}
        </nav>
      </div>
      <style>{`
        .header { position: sticky; top: 0; z-index: 100; background: rgba(255,252,246,.92); backdrop-filter: blur(14px); border-bottom: 2px solid rgba(255,255,255,.9); box-shadow: 0 4px 18px rgba(73,126,121,.08); }
        .header-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; min-height: 64px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .header-logo { display: flex; align-items: center; gap: 8px; background: none; cursor: pointer; padding: 0; }
        .header-logo-text { font-size: 18px; font-weight: 700; color: #287875; white-space: nowrap; }
        .header-nav { display: flex; align-items: center; gap: 8px; }
        .header-nav-btn { display: flex; align-items: center; gap: 6px; background: none; font-size: 14px; font-weight: 500; color: #5f716e; padding: 8px 12px; border-radius: 100px; transition: all .2s; }
        .header-nav-btn:hover { background: var(--color-secondary-100); color: var(--color-secondary-700); }
        .btn-sell, .login-btn { display: flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 100px; font-size: 14px; font-weight: 700; transition: all .2s; }
        .btn-sell { background: var(--color-primary-400); color: #6f431d; box-shadow: 0 4px 0 #d98a2c; }
        .btn-sell:hover { background: var(--color-primary-300); transform: translateY(-2px); box-shadow: 0 6px 0 #d98a2c; }
        .login-btn { background: var(--color-secondary-500); color: white; box-shadow: 0 4px 0 var(--color-secondary-700); }
        .login-btn:hover { transform: translateY(-2px); background: var(--color-secondary-400); }
        .account-btn { display: flex; align-items: center; gap: 6px; max-width: 190px; padding: 8px 11px; background: #e7f8f4; color: #287875; border: 1px solid #c1e9df; border-radius: 100px; font-size: 12px; font-weight: 600; }
        .account-btn span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        @media (max-width: 760px) { .header-inner { padding: 0 16px; } .header-logo-text { font-size: 15px; } .header-nav-btn span, .btn-sell span, .login-btn span, .account-btn span { display: none; } .header-nav-btn, .btn-sell, .login-btn, .account-btn { padding: 9px; } }
      `}</style>
    </header>
  )
}
