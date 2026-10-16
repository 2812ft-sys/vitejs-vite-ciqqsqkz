import { useState } from 'react'
import { ArrowLeft, ImageIcon } from 'lucide-react'
import { BookInput, BookCondition, CATEGORIES, CONDITION_LABELS, STOCK_LABELS, StockStatus } from '../types'

interface SellFormProps {
  onSubmit: (input: BookInput) => Promise<void>
  onBack: () => void
}

export default function SellForm({ onSubmit, onBack }: SellFormProps) {
  const [form, setForm] = useState<BookInput>({
    title: '',
    author: '',
    category: 'ทั่วไป',
    description: '',
    price: 0,
    condition: 'good',
    image_url: '',
    seller_name: '',
    contact: '',
    stock_status: 'available',
    additional_notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.author.trim() || !form.seller_name.trim() || !form.contact.trim()) {
      setError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    if (form.price <= 0) {
      setError('กรุณาระบุราคาที่มากกว่า 0')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(form)
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการลงขาย กรุณาลองอีกครั้ง')
    } finally {
      setSubmitting(false)
    }
  }

  const update = (field: keyof BookInput, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <main className="sell-main">
      <div className="sell-container">
        <button className="sell-back" onClick={onBack}>
          <ArrowLeft size={20} />
          <span>กลับ</span>
        </button>

        <div className="sell-header slide-up">
          <h1 className="sell-title">ลงขายหนังสือ</h1>
          <p className="sell-subtitle">กรอกข้อมูลหนังสือที่ต้องการขาย</p>
        </div>

        <form className="sell-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">ชื่อหนังสือ *</label>
              <input
                type="text"
                className="form-input"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="เช่น ปรัชญาสำหรับผู้เริ่มต้น"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อผู้แต่ง *</label>
              <input
                type="text"
                className="form-input"
                value={form.author}
                onChange={(e) => update('author', e.target.value)}
                placeholder="เช่น สมชาย ใจดี"
              />
            </div>

            <div className="form-group">
              <label className="form-label">หมวดหมู่</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">ราคา (บาท) *</label>
              <input
                type="number"
                className="form-input"
                value={form.price || ''}
                onChange={(e) => update('price', parseFloat(e.target.value) || 0)}
                placeholder="เช่น 150"
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">สภาพหนังสือ</label>
              <select
                className="form-input"
                value={form.condition}
                onChange={(e) => update('condition', e.target.value as BookCondition)}
              >
                {Object.entries(CONDITION_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL รูปปกหนังสือ</label>
              <input
                type="text"
                className="form-input"
                value={form.image_url}
                onChange={(e) => update('image_url', e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">ชื่อผู้ขาย *</label>
              <input
                type="text"
                className="form-input"
                value={form.seller_name}
                onChange={(e) => update('seller_name', e.target.value)}
                placeholder="ชื่อของคุณ"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ช่องทางติดต่อ *</label>
              <input
                type="text"
                className="form-input"
                value={form.contact}
                onChange={(e) => update('contact', e.target.value)}
                placeholder="เช่น email, เบอร์โทร, Line ID"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">รายละเอียดเพิ่มเติม</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="เล่าเกี่ยวกับหนังสือเล่มนี้ เช่น สภาพ, ตำราเรียน, ความรู้สึกตอนอ่าน..."
              rows={4}
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onBack}>
              ยกเลิก
            </button>
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'กำลังบันทึก...' : 'ลงขายหนังสือ'}
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .sell-main {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .sell-back {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          font-size: 15px;
          font-weight: 500;
          color: var(--color-neutral-600);
          padding: 8px 0;
          margin-bottom: 24px;
          transition: color 0.2s;
        }
        .sell-back:hover {
          color: var(--color-primary-600);
        }
        .sell-header {
          margin-bottom: 32px;
        }
        .sell-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--color-neutral-900);
        }
        .sell-subtitle {
          font-size: 16px;
          color: var(--color-neutral-500);
          margin-top: 4px;
        }
        .sell-form {
          background: white;
          border-radius: var(--radius-xl);
          padding: 32px;
          border: 1px solid var(--color-neutral-200);
          box-shadow: var(--shadow-md);
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 14px;
          font-weight: 500;
          color: var(--color-neutral-700);
        }
        .form-input {
          height: 44px;
          padding: 0 16px;
          font-size: 15px;
          background: var(--color-neutral-50);
          border: 2px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .form-input:focus {
          border-color: var(--color-primary-400);
          background: white;
          box-shadow: 0 0 0 4px var(--color-primary-50);
        }
        .form-textarea {
          padding: 12px 16px;
          font-size: 15px;
          background: var(--color-neutral-50);
          border: 2px solid var(--color-neutral-200);
          border-radius: var(--radius-md);
          resize: vertical;
          transition: all 0.2s;
        }
        .form-textarea:focus {
          border-color: var(--color-primary-400);
          background: white;
          box-shadow: 0 0 0 4px var(--color-primary-50);
        }
        .form-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: var(--color-error);
          padding: 12px 16px;
          border-radius: var(--radius-md);
          font-size: 14px;
          margin-bottom: 16px;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        .btn-cancel {
          background: var(--color-neutral-100);
          color: var(--color-neutral-600);
          font-size: 15px;
          font-weight: 500;
          padding: 12px 24px;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .btn-cancel:hover {
          background: var(--color-neutral-200);
        }
        .btn-submit {
          background: var(--color-primary-600);
          color: white;
          font-size: 15px;
          font-weight: 600;
          padding: 12px 28px;
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          background: var(--color-primary-700);
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .sell-form {
            padding: 20px;
          }
          .form-actions {
            flex-direction: column-reverse;
          }
          .btn-cancel, .btn-submit {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>
    </main>
  )
}
