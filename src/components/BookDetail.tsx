import { useState } from 'react'
import { ArrowLeft, BookOpen, Check, Info, Package, PenLine, Save, Stamp, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Book, StockStatus, CONDITION_COLORS, CONDITION_LABELS, STOCK_COLORS, STOCK_DOT_COLORS, STOCK_LABELS } from '../types'

interface BookDetailProps {
  book: Book
  currentUserId: string | null
  onBack: () => void
  onDelete: (id: string) => void
  onReserve: (bookId: string) => Promise<void>
  onRequireAuth: () => void
}

export default function BookDetail({ book, currentUserId, onBack, onDelete, onReserve, onRequireAuth }: BookDetailProps) {
  const isOwner = Boolean(currentUserId && book.user_id === currentUserId)
  const [notes, setNotes] = useState(book.additional_notes || '')
  const [stockStatus, setStockStatus] = useState<StockStatus>(book.stock_status || 'available')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reserving, setReserving] = useState(false)
  const [reserveError, setReserveError] = useState('')

  const handleSave = async () => {
    if (!isOwner) return
    setSaving(true)
    const { error } = await supabase.from('books').update({ additional_notes: notes, stock_status: stockStatus }).eq('id', book.id)
    setSaving(false)
    if (!error) { setSaved(true); window.setTimeout(() => setSaved(false), 2000) }
  }

  const handleReserve = async () => {
    if (!currentUserId) { onRequireAuth(); return }
    setReserving(true)
    setReserveError('')
    try { await onReserve(book.id) } catch { setReserveError('หนังสือเล่มนี้อาจถูกจองไปแล้ว กรุณาลองใหม่อีกครั้ง') }
    setReserving(false)
  }

  return <main className="detail-main">
    <button className="detail-back" onClick={onBack}><ArrowLeft size={20} /> <span>กลับ</span></button>
    <div className="notebook">
      <div className="notebook-binding">{Array.from({ length: 14 }).map((_, i) => <div key={i} className="notebook-ring" />)}</div>
      <div className="notebook-page">
        <div className="notebook-header"><span className="notebook-date">{new Date(book.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span><span className="notebook-stock-badge" style={{ borderColor: STOCK_COLORS[stockStatus], color: STOCK_COLORS[stockStatus], background: `${STOCK_COLORS[stockStatus]}10` }}><span className="notebook-stock-dot" style={{ background: STOCK_DOT_COLORS[stockStatus] }} />{STOCK_LABELS[stockStatus]}</span></div>

        <section className="notebook-section"><div className="notebook-section-label"><BookOpen size={15} />ข้อมูลหนังสือ</div><div className="notebook-book-info"><div className="notebook-cover">{book.image_url ? <img src={book.image_url} alt={book.title} /> : <div className="notebook-cover-placeholder"><BookOpen size={48} color="var(--color-neutral-300)" /></div>}<span className="notebook-condition-tag" style={{ background: CONDITION_COLORS[book.condition] }}>{CONDITION_LABELS[book.condition]}</span></div><div className="notebook-book-meta"><span className="notebook-category-tag">{book.category}</span><h1 className="notebook-title">{book.title}</h1><p className="notebook-author">โดย {book.author}</p><div className="notebook-price-line"><span className="notebook-price">฿{Number(book.price).toLocaleString()}</span><span className="notebook-price-note">ราคามือสอง</span></div></div></div></section>

        <div className="notebook-divider" />
        <section className="notebook-section"><div className="notebook-section-label"><PenLine size={15} />โน้ตย่อ / รีวิวจากผู้ขาย</div><div className="notebook-review-card"><p className={book.description ? 'notebook-review-text' : 'notebook-review-empty'}>{book.description || 'ไม่มีโน้ตย่อจากผู้ขาย'}</p></div><div className="notebook-seller-line"><span className="notebook-seller-name">— {book.seller_name}</span><span className="notebook-seller-contact">ติดต่อ: {book.contact}</span></div></section>

        <div className="notebook-divider" />
        <section className="notebook-section"><div className="notebook-section-label"><Package size={15} />สถานะสต๊อก</div>{isOwner ? <div className="notebook-stock-options">{(Object.keys(STOCK_LABELS) as StockStatus[]).map((status) => <button key={status} className={`notebook-stock-option ${stockStatus === status ? 'active' : ''}`} style={stockStatus === status ? { borderColor: STOCK_COLORS[status], background: `${STOCK_COLORS[status]}08` } : {}} onClick={() => setStockStatus(status)}><span className="notebook-stock-option-dot" style={{ background: STOCK_DOT_COLORS[status] }} /><span style={stockStatus === status ? { color: STOCK_COLORS[status] } : {}}>{STOCK_LABELS[status]}</span></button>)}</div> : <div className="notebook-buyer-action">{stockStatus === 'available' ? <><p>เล่มนี้ยังว่างพร้อมขาย กดจองคิวซื้อได้เลย</p><button className="notebook-reserve-btn" onClick={handleReserve} disabled={reserving}>{reserving ? 'กำลังจองคิว...' : 'จองคิวซื้อหนังสือ'}</button></> : <p>หนังสือเล่มนี้{stockStatus === 'reserved' ? 'ติดจองคิวแล้ว' : 'ขายแล้ว'}</p>}{reserveError && <span className="notebook-reserve-error">{reserveError}</span>}</div>}</section>

        {isOwner && <><div className="notebook-divider" /><section className="notebook-section"><div className="notebook-section-label"><Info size={15} />บันทึกเพิ่มเติม</div><div className="notebook-notes-area"><textarea className="notebook-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="สถานะการจอง หมายเหตุ หรือข้อตกลงกับผู้ซื้อ..." rows={5} /><div className="notebook-save-row"><button className="notebook-save-btn" onClick={handleSave} disabled={saving}>{saved ? <Check size={16} /> : <Save size={16} />}<span>{saved ? 'บันทึกแล้ว' : saving ? 'กำลังบันทึก...' : 'บันทึก'}</span></button><button className="notebook-delete-btn" onClick={() => onDelete(book.id)}><Trash2 size={15} />ลบรายการ</button></div></div></section></>}
        <div className="notebook-stamp"><Stamp size={14} />เลขที่รายการ: {book.id.slice(0, 8).toUpperCase()}</div>
      </div>
    </div>
    <style>{`
      .detail-main{max-width:820px;margin:0 auto;padding:32px 24px 64px}.detail-back{display:flex;align-items:center;gap:8px;background:none;font-size:15px;color:var(--color-neutral-600);padding:8px 0;margin-bottom:24px}.detail-back:hover{color:var(--color-primary-600)}
      .notebook{position:relative;background:#fffcf5;border-radius:4px 16px 16px 4px;box-shadow:0 2px 8px rgba(0,0,0,.06),0 8px 24px rgba(0,0,0,.08);overflow:hidden}.notebook-binding{position:absolute;left:0;top:0;bottom:0;width:36px;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:16px 0;background:linear-gradient(180deg,#f5f0e6,#ede7d8);border-right:1px solid #e0d8c6;z-index:2}.notebook-ring{width:18px;height:18px;border:2.5px solid #b8b0a0;border-radius:50%;background:#fffcf5;box-shadow:inset 0 1px 2px rgba(0,0,0,.15)}.notebook-page{padding:36px 40px 32px 56px;min-height:500px;background-image:linear-gradient(to bottom,transparent 31px,#e8e2d4 31px,#e8e2d4 32px,transparent 32px);background-size:100% 32px;background-position:0 8px}.notebook-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:12px;border-bottom:2px solid #d4cdb8}.notebook-date{font-size:13px;color:var(--color-neutral-500);font-style:italic}.notebook-stock-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;font-size:13px;font-weight:600;border:1.5px solid;border-radius:100px}.notebook-stock-dot{width:7px;height:7px;border-radius:50%}.notebook-section{margin-bottom:24px}.notebook-section-label{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--color-neutral-400);letter-spacing:.5px;margin-bottom:14px}.notebook-book-info{display:flex;gap:24px;align-items:flex-start}.notebook-cover{position:relative;width:120px;height:160px;border-radius:4px;overflow:hidden;flex-shrink:0;background:var(--color-neutral-100);box-shadow:0 2px 8px rgba(0,0,0,.1)}.notebook-cover img{width:100%;height:100%;object-fit:cover}.notebook-cover-placeholder{width:100%;height:100%;display:grid;place-items:center;background:linear-gradient(135deg,#f0ebe0,#e8e2d4)}.notebook-condition-tag{position:absolute;bottom:6px;left:6px;padding:3px 8px;font-size:11px;font-weight:600;color:white;border-radius:4px}.notebook-book-meta{flex:1}.notebook-category-tag{display:inline-block;font-size:12px;color:#9a8c6a;margin-bottom:6px}.notebook-title{font-size:24px;color:var(--color-neutral-800);line-height:1.25;margin-bottom:4px}.notebook-author{font-size:15px;color:var(--color-neutral-500);margin-bottom:14px}.notebook-price-line{display:flex;align-items:baseline;gap:10px}.notebook-price{font-size:28px;font-weight:700;color:#b8762d}.notebook-price-note{font-size:12px;color:var(--color-neutral-400);font-style:italic}.notebook-divider{height:1px;background:repeating-linear-gradient(90deg,#d4cdb8 0,#d4cdb8 6px,transparent 6px,transparent 12px);margin:20px 0}.notebook-review-card{background:rgba(255,248,220,.5);border-left:3px solid #d4b896;padding:16px 20px;border-radius:0 8px 8px 0}.notebook-review-text{font-size:15px;color:var(--color-neutral-700);line-height:1.7}.notebook-review-empty{font-size:14px;color:var(--color-neutral-400);font-style:italic}.notebook-seller-line{display:flex;align-items:center;justify-content:space-between;margin-top:10px;padding-left:4px}.notebook-seller-name{font-size:14px;color:var(--color-neutral-600);font-style:italic}.notebook-seller-contact{font-size:13px;color:var(--color-neutral-400)}.notebook-stock-options{display:flex;gap:10px;flex-wrap:wrap}.notebook-stock-option{display:flex;align-items:center;gap:8px;padding:8px 18px;font-size:14px;background:rgba(255,255,255,.6);border:1.5px solid #d4cdb8;border-radius:8px;color:var(--color-neutral-600);transition:all .2s}.notebook-stock-option:hover{border-color:var(--color-neutral-400)}.notebook-stock-option-dot{width:8px;height:8px;border-radius:50%}.notebook-buyer-action{padding:16px 18px;background:rgba(255,255,255,.55);border:1px dashed #d4cdb8;border-radius:12px;color:var(--color-neutral-600)}.notebook-buyer-action p{font-size:14px;margin-bottom:12px}.notebook-reserve-btn{padding:10px 18px;border-radius:100px;background:var(--color-primary-400);color:#70461f;font-weight:700;box-shadow:0 3px 0 #d98a2c}.notebook-reserve-btn:disabled{opacity:.6}.notebook-reserve-error{display:block;color:var(--color-error);font-size:13px;margin-top:8px}.notebook-notes-area{display:flex;flex-direction:column;gap:16px}.notebook-textarea{width:100%;padding:14px 18px;font-size:15px;line-height:1.8;background:rgba(255,252,240,.7);border:1.5px dashed #ccc4ac;border-radius:8px;resize:vertical}.notebook-textarea:focus{border-color:#b8a886;border-style:solid;outline:none}.notebook-save-row{display:flex;align-items:center;justify-content:space-between}.notebook-save-btn{display:flex;align-items:center;gap:7px;background:#b8762d;color:white;padding:10px 22px;border-radius:8px;font-weight:600}.notebook-delete-btn{display:flex;align-items:center;gap:7px;background:none;border:1px solid #d4cdb8;color:var(--color-neutral-500);padding:9px 16px;border-radius:8px}.notebook-delete-btn:hover{border-color:var(--color-error);color:var(--color-error)}.notebook-stamp{display:flex;align-items:center;gap:6px;margin-top:28px;padding-top:16px;border-top:1px dashed #d4cdb8;font-size:12px;color:#b8b0a0;font-style:italic}
      @media(max-width:640px){.detail-main{padding:20px 16px 48px}.notebook-binding{width:28px}.notebook-ring{width:14px;height:14px}.notebook-page{padding:24px 20px 24px 40px}.notebook-header{flex-direction:column;align-items:flex-start;gap:8px}.notebook-book-info{flex-direction:column;gap:16px}.notebook-cover{width:100px;height:134px}.notebook-title{font-size:20px}.notebook-stock-options{flex-direction:column}.notebook-stock-option{width:100%}.notebook-save-row{flex-direction:column-reverse;gap:10px}.notebook-save-btn,.notebook-delete-btn{width:100%;justify-content:center}.notebook-seller-line{flex-direction:column;align-items:flex-start;gap:4px}}
    `}</style>
  </main>
}
