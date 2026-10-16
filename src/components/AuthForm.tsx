import { useState } from 'react'
import { ArrowLeft, BookOpen, LogIn, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface AuthFormProps {
  onBack: () => void
}

export default function AuthForm({ onBack }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } })

    setLoading(false)
    if (result.error) {
      setError(mode === 'login' ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'ไม่สามารถสร้างบัญชีได้ กรุณาตรวจสอบข้อมูลอีกครั้ง')
      return
    }

    if (mode === 'signup' && !result.data.session) {
      setMessage('สร้างบัญชีแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี')
      return
    }
    onBack()
  }

  return (
    <main className="auth-main">
      <div className="auth-card slide-up">
        <button className="auth-back" onClick={onBack}><ArrowLeft size={18} /> กลับหน้าหลัก</button>
        <div className="auth-icon"><BookOpen size={28} /></div>
        <h1>{mode === 'login' ? 'ยินดีต้อนรับกลับ' : 'สร้างบัญชีผู้ขาย'}</h1>
        <p className="auth-subtitle">{mode === 'login' ? 'เข้าสู่ระบบเพื่อจัดการหนังสือและการจอง' : 'สมัครสมาชิกเพื่อเริ่มลงขายหนังสือ'}</p>
        <form onSubmit={submit} className="auth-form">
          {mode === 'signup' && <input className="auth-input" placeholder="ชื่อที่แสดง" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />}
          <input className="auth-input" type="email" placeholder="อีเมล" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="รหัสผ่านอย่างน้อย 6 ตัวอักษร" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
          {error && <p className="auth-error">{error}</p>}
          {message && <p className="auth-message">{message}</p>}
          <button className="auth-submit" disabled={loading} type="submit">
            {mode === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
            {loading ? 'กำลังดำเนินการ...' : mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </button>
        </form>
        <button className="auth-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setMessage('') }}>
          {mode === 'login' ? 'ยังไม่มีบัญชี? สมัครสมาชิก' : 'มีบัญชีแล้ว? เข้าสู่ระบบ'}
        </button>
      </div>
      <style>{`
        .auth-main { min-height: calc(100vh - 64px); display: grid; place-items: center; padding: 32px 20px; background: linear-gradient(135deg, #e5faf5, #fff4dc); }
        .auth-card { width: min(100%, 440px); background: rgba(255,255,255,.94); border: 2px solid #d6efe8; border-radius: 28px; padding: 32px; box-shadow: 0 8px 0 #cde7df, var(--shadow-xl); }
        .auth-back { display: flex; align-items: center; gap: 7px; background: none; color: var(--color-neutral-600); font-size: 14px; margin-bottom: 24px; }
        .auth-icon { width: 56px; height: 56px; display: grid; place-items: center; color: white; background: linear-gradient(135deg, #53d3c0, #23a99b); border-radius: 18px; margin-bottom: 18px; }
        .auth-card h1 { color: #287875; font-size: 26px; }
        .auth-subtitle { color: var(--color-neutral-500); margin: 8px 0 24px; }
        .auth-form { display: grid; gap: 12px; }
        .auth-input { height: 48px; border: 2px solid #e8e2d8; border-radius: 14px; padding: 0 15px; font-size: 15px; background: #fffdf9; }
        .auth-input:focus { border-color: var(--color-secondary-400); box-shadow: 0 0 0 4px rgba(53,197,179,.14); }
        .auth-submit { height: 48px; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--color-primary-400); color: #70461f; border-radius: 100px; font-weight: 700; box-shadow: 0 4px 0 #d98a2c; transition: all .2s; }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); background: var(--color-primary-300); }
        .auth-submit:disabled { opacity: .6; cursor: not-allowed; }
        .auth-switch { width: 100%; background: none; color: var(--color-secondary-700); font-size: 14px; margin-top: 20px; }
        .auth-error, .auth-message { font-size: 14px; padding: 10px 12px; border-radius: 10px; }
        .auth-error { color: #b42318; background: #fff0ee; }
        .auth-message { color: #147a68; background: #eafaf5; }
      `}</style>
    </main>
  )
}
