import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, BarChart3, BookOpen, CircleDollarSign, Plus, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Book, Transaction, TransactionType } from '../types'

interface DashboardProps {
  userId: string
  onBack: () => void
}

const PLATFORM_FEE_RATE = 0.05

export default function Dashboard({ userId, onBack }: DashboardProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [type, setType] = useState<TransactionType>('sale')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const load = async () => {
    setLoading(true)
    const [bookResult, transactionResult] = await Promise.all([
      supabase.from('books').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('transactions').select('*').eq('user_id', userId).order('occurred_at', { ascending: false }),
    ])
    if (!bookResult.error) setBooks((bookResult.data || []) as Book[])
    if (!transactionResult.error) setTransactions((transactionResult.data || []) as Transaction[])
    setLoading(false)
  }

  useEffect(() => { load() }, [userId])

  const summary = useMemo(() => {
    const sales = transactions.filter((item) => item.type === 'sale')
    const expenses = transactions.filter((item) => item.type === 'expense')
    const grossSales = sales.reduce((total, item) => total + Number(item.amount), 0)
    const platformFees = sales.reduce((total, item) => total + Number(item.platform_fee), 0)
    const totalExpenses = expenses.reduce((total, item) => total + Number(item.amount), 0)
    return { grossSales, platformFees, totalExpenses, net: grossSales - platformFees - totalExpenses }
  }, [transactions])

  const addTransaction = async (event: React.FormEvent) => {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!numericAmount || numericAmount <= 0) return
    setSaving(true)
    const { data, error } = await supabase.from('transactions').insert({
      type,
      amount: numericAmount,
      platform_fee: type === 'sale' ? numericAmount * PLATFORM_FEE_RATE : 0,
      description: description.trim(),
    }).select().maybeSingle()
    setSaving(false)
    if (!error && data) {
      setTransactions((current) => [data as Transaction, ...current])
      setAmount('')
      setDescription('')
    }
  }

  return (
    <main className="dashboard-main">
      <div className="dashboard-head">
        <button className="dashboard-back" onClick={onBack}><ArrowLeft size={18} /> กลับหน้าหลัก</button>
        <div><h1>แดชบอร์ดร้านค้า</h1><p>สรุปหนังสือ ยอดขาย และกระแสเงินของคุณ</p></div>
      </div>
      <div className="dashboard-stat-grid">
        <div className="dashboard-stat sales"><TrendingUp size={20} /><span>ยอดขายรวม</span><strong>฿{summary.grossSales.toLocaleString()}</strong></div>
        <div className="dashboard-stat fees"><Receipt size={20} /><span>ค่าธรรมเนียมแพลตฟอร์ม 5%</span><strong>฿{summary.platformFees.toLocaleString()}</strong></div>
        <div className="dashboard-stat expenses"><TrendingDown size={20} /><span>รายจ่าย</span><strong>฿{summary.totalExpenses.toLocaleString()}</strong></div>
        <div className="dashboard-stat net"><CircleDollarSign size={20} /><span>รายรับสุทธิ</span><strong>฿{summary.net.toLocaleString()}</strong></div>
      </div>
      <div className="dashboard-columns">
        <section className="dashboard-panel">
          <div className="dashboard-panel-title"><BookOpen size={18} /><h2>หนังสือของฉัน</h2></div>
          {loading ? <p className="dashboard-muted">กำลังโหลด...</p> : <div className="dashboard-book-list"><div><span>รายการทั้งหมด</span><strong>{books.length}</strong></div><div><span>ว่างพร้อมขาย</span><strong>{books.filter((book) => book.stock_status === 'available').length}</strong></div><div><span>ติดจองคิว</span><strong>{books.filter((book) => book.stock_status === 'reserved').length}</strong></div><div><span>ขายแล้ว</span><strong>{books.filter((book) => book.stock_status === 'sold').length}</strong></div></div>}
        </section>
        <section className="dashboard-panel">
          <div className="dashboard-panel-title"><BarChart3 size={18} /><h2>เพิ่มรายการเงิน</h2></div>
          <form className="transaction-form" onSubmit={addTransaction}>
            <div className="transaction-toggle"><button type="button" className={type === 'sale' ? 'active' : ''} onClick={() => setType('sale')}>รายรับจากการขาย</button><button type="button" className={type === 'expense' ? 'active expense' : ''} onClick={() => setType('expense')}>รายจ่าย</button></div>
            <input className="dashboard-input" type="number" min="1" placeholder="จำนวนเงิน (บาท)" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            <input className="dashboard-input" placeholder="รายละเอียด เช่น ขายหนังสือเล่มหนึ่ง" value={description} onChange={(e) => setDescription(e.target.value)} />
            <button className="dashboard-add" disabled={saving}><Plus size={17} /> {saving ? 'กำลังบันทึก...' : 'เพิ่มรายการ'}</button>
          </form>
        </section>
      </div>
      <section className="dashboard-panel dashboard-history"><div className="dashboard-panel-title"><Receipt size={18} /><h2>รายการล่าสุด</h2></div>{transactions.length === 0 ? <p className="dashboard-muted">ยังไม่มีรายการเงิน เพิ่มรายการขายหรือรายจ่ายเพื่อเริ่มสรุปผล</p> : <div className="transaction-list">{transactions.slice(0, 8).map((item) => <div className="transaction-row" key={item.id}><div><strong>{item.description || (item.type === 'sale' ? 'รายรับจากการขาย' : 'รายจ่าย')}</strong><small>{new Date(item.occurred_at).toLocaleDateString('th-TH')}</small></div><span className={item.type === 'sale' ? 'positive' : 'negative'}>{item.type === 'sale' ? '+' : '-'}฿{Number(item.amount).toLocaleString()}</span></div>)}</div>}</section>
      <style>{`
        .dashboard-main { max-width: 1100px; margin: 0 auto; padding: 32px 24px 64px; }
        .dashboard-head { margin-bottom: 28px; } .dashboard-head h1 { color: #287875; font-size: 30px; margin-top: 18px; } .dashboard-head p { color: var(--color-neutral-500); margin-top: 5px; }
        .dashboard-back { display: flex; align-items: center; gap: 7px; background: none; color: var(--color-neutral-600); font-size: 14px; }
        .dashboard-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .dashboard-stat { display: grid; gap: 7px; padding: 20px; border-radius: 20px; border: 2px solid transparent; box-shadow: 0 5px 0 rgba(100,80,60,.08); } .dashboard-stat span { font-size: 13px; color: var(--color-neutral-600); } .dashboard-stat strong { font-size: 24px; color: var(--color-neutral-800); } .dashboard-stat svg { color: var(--color-secondary-700); } .dashboard-stat.sales { background: #e8faf4; border-color: #c6efe3; } .dashboard-stat.fees { background: #fff6df; border-color: #f7e2ad; } .dashboard-stat.expenses { background: #fff0ee; border-color: #f7d1cb; } .dashboard-stat.net { background: #eaf1ff; border-color: #d2def7; }
        .dashboard-columns { display: grid; grid-template-columns: 1fr 1.2fr; gap: 20px; margin-bottom: 20px; } .dashboard-panel { background: rgba(255,255,255,.9); border: 2px solid #f0e5db; border-radius: 22px; padding: 24px; box-shadow: 0 5px 0 #f5e8df; } .dashboard-panel-title { display: flex; align-items: center; gap: 9px; margin-bottom: 18px; color: #287875; } .dashboard-panel-title h2 { font-size: 18px; }
        .dashboard-book-list { display: grid; gap: 12px; } .dashboard-book-list div { display: flex; justify-content: space-between; padding: 11px 14px; background: #fffaf4; border-radius: 12px; color: var(--color-neutral-600); } .dashboard-book-list strong { color: #287875; } .dashboard-muted { color: var(--color-neutral-500); font-size: 14px; }
        .transaction-form { display: grid; gap: 10px; } .transaction-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .transaction-toggle button { padding: 9px; border-radius: 10px; background: #f8f1e9; color: var(--color-neutral-600); font-size: 13px; } .transaction-toggle button.active { background: #dff7ef; color: #147a68; font-weight: 700; } .transaction-toggle button.active.expense { background: #fff0ee; color: #b42318; }
        .dashboard-input { height: 43px; border: 2px solid #eee2d7; border-radius: 11px; padding: 0 12px; background: #fffdf9; } .dashboard-input:focus { border-color: var(--color-secondary-400); } .dashboard-add { height: 43px; display: flex; align-items: center; justify-content: center; gap: 7px; border-radius: 100px; background: var(--color-primary-400); color: #70461f; font-weight: 700; box-shadow: 0 3px 0 #d98a2c; } .dashboard-add:disabled { opacity: .6; }
        .dashboard-history { margin-top: 20px; } .transaction-list { display: grid; gap: 9px; } .transaction-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 14px; background: #fffaf4; border-radius: 12px; } .transaction-row div { display: grid; gap: 2px; } .transaction-row small { color: var(--color-neutral-400); } .positive { color: #16836d; font-weight: 700; } .negative { color: #c65348; font-weight: 700; }
        @media (max-width: 820px) { .dashboard-stat-grid { grid-template-columns: repeat(2, 1fr); } .dashboard-columns { grid-template-columns: 1fr; } } @media (max-width: 520px) { .dashboard-main { padding: 24px 16px 48px; } .dashboard-stat-grid { grid-template-columns: 1fr; } .dashboard-stat strong { font-size: 21px; } }
      `}</style>
    </main>
  )
}
