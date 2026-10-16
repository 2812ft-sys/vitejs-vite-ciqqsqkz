import { useState } from 'react'
import { Sparkles, Loader2, Send, BookOpen, ArrowRight } from 'lucide-react'
import { Book } from '../types'

interface AIRecommendProps {
  books: Book[]
  onSelectBook: (book: Book) => void
}

interface Recommendation extends Book {
  reason: string
}

export default function AIRecommend({ books, onSelectBook }: AIRecommendProps) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const handleRecommend = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setError('')
    setRecommendations([])
    setSummary('')

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-recommend`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`)
      }

      const data = await response.json()
      if (data.error) {
        setError(data.error)
      } else {
        setRecommendations(data.recommendations || [])
        setSummary(data.summary || '')
      }
    } catch {
      setError('ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาลองอีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRecommend()
    }
  }

  const suggestions = [
    'หนังสือพัฒนาตนเอง',
    'นวนิยายรักโรแมนติก',
    'หนังสือธุรกิจสตาร์ทอัพ',
    'การ์ตูนญี่ปุ่น',
  ]

  return (
    <>
      <div className="ai-card">
        <div className="ai-header">
          <div className="ai-icon">
            <Sparkles size={22} />
          </div>
          <div>
            <h2 className="ai-title">AI แนะนำหนังสือ</h2>
            <p className="ai-desc">บอก AI ว่าคุณสนใจหนังสือแนวไหน แล้วให้ AI ช่วยเลือกให้</p>
          </div>
        </div>

        <div className="ai-input-wrap">
          <input
            type="text"
            className="ai-input"
            placeholder="เช่น อยากอ่านหนังสือที่สอนให้คิดบวก..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button className="ai-btn" onClick={handleRecommend} disabled={loading || !query.trim()}>
            {loading ? <Loader2 size={20} className="ai-spin" /> : <Send size={18} />}
            <span>{loading ? 'กำลังคิด...' : 'แนะนำ'}</span>
          </button>
        </div>

        <div className="ai-suggestions">
          {suggestions.map((s) => (
            <button
              key={s}
              className="ai-suggestion-chip"
              onClick={() => setQuery(s)}
              disabled={loading}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <div className="ai-error">{error}</div>}

        {summary && (
          <div className="ai-summary">
            <div className="ai-summary-icon">
              <Sparkles size={16} />
            </div>
            <p>{summary}</p>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="ai-recs">
            {recommendations.map((book, i) => (
              <div
                key={book.id}
                className="ai-rec-card fade-in"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => onSelectBook(book)}
              >
                <div className="ai-rec-image">
                  {book.image_url ? (
                    <img src={book.image_url} alt={book.title} />
                  ) : (
                    <div className="ai-rec-placeholder">
                      <BookOpen size={24} color="var(--color-neutral-300)" />
                    </div>
                  )}
                </div>
                <div className="ai-rec-info">
                  <h4 className="ai-rec-title">{book.title}</h4>
                  <p className="ai-rec-author">{book.author}</p>
                  <p className="ai-rec-reason">{book.reason}</p>
                  <div className="ai-rec-meta">
                    <span className="ai-rec-price">฿{Number(book.price).toLocaleString()}</span>
                    <span className="ai-rec-go">
                      ดูรายละเอียด <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && recommendations.length === 0 && summary && (
          <div className="ai-no-recs">
            <BookOpen size={32} color="var(--color-neutral-300)" />
            <p>ไม่พบหนังสือที่ตรงกับความสนใจในร้านตอนนี้</p>
          </div>
        )}
      </div>

      <style>{`
        .ai-card {
          max-width: 800px;
          margin: 0 auto;
          background: linear-gradient(135deg, #fff8df, #e8faf5);
          border: 2px solid #c8eee6;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 7px 0 #cce8df, 0 15px 25px rgba(68, 133, 123, 0.1);
          animation: popIn 0.6s ease-out both;
        }
        .ai-header {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .ai-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, #ffca55, #ee9232);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
          box-shadow: var(--shadow-md);
        }
        .ai-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-neutral-900);
        }
        .ai-desc {
          font-size: 14px;
          color: var(--color-neutral-500);
          margin-top: 2px;
        }
        .ai-input-wrap {
          display: flex;
          gap: 10px;
          margin-bottom: 12px;
        }
        .ai-input {
          flex: 1;
          height: 48px;
          padding: 0 16px;
          font-size: 15px;
          background: white;
          border: 2px solid var(--color-primary-200);
          border-radius: var(--radius-md);
          transition: all 0.2s;
        }
        .ai-input:focus {
          border-color: var(--color-primary-400);
          box-shadow: 0 0 0 4px var(--color-primary-50);
        }
        .ai-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--color-primary-600);
          color: white;
          font-size: 15px;
          font-weight: 600;
          padding: 0 20px;
          height: 48px;
          border-radius: 100px;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 0 #c87525;
        }
        .ai-btn:hover:not(:disabled) {
          background: var(--color-primary-300);
          color: #6f431d;
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #c87525;
        }
        .ai-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ai-spin {
          animation: spin 1s linear infinite;
        }
        .ai-suggestions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .ai-suggestion-chip {
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          background: white;
          border: 1px solid #f4d99f;
          border-radius: 100px;
          color: #bd742b;
          transition: all 0.2s;
        }
        .ai-suggestion-chip:hover:not(:disabled) {
          background: #fff2c9;
          transform: translateY(-2px);
        }
        .ai-suggestion-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ai-error {
          margin-top: 16px;
          padding: 12px 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: var(--color-error);
          border-radius: var(--radius-md);
          font-size: 14px;
        }
        .ai-summary {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 16px;
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-primary-100);
        }
        .ai-summary-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-primary-100);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary-600);
          flex-shrink: 0;
        }
        .ai-summary p {
          font-size: 14px;
          color: var(--color-neutral-700);
          line-height: 1.5;
        }
        .ai-recs {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }
        .ai-rec-card {
          display: flex;
          gap: 16px;
          background: rgba(255,255,255,0.88);
          border-radius: 20px;
          padding: 16px;
          border: 1px solid #d7eee8;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0;
        }
        .ai-rec-card:hover {
          border-color: #f4c772;
          box-shadow: 0 6px 0 #e9e0c9;
          transform: translateX(4px) rotate(0.3deg);
        }
        .ai-rec-image {
          width: 70px;
          height: 90px;
          border-radius: var(--radius-sm);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-neutral-100);
        }
        .ai-rec-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .ai-rec-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-neutral-100);
        }
        .ai-rec-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ai-rec-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-neutral-900);
        }
        .ai-rec-author {
          font-size: 14px;
          color: var(--color-neutral-500);
        }
        .ai-rec-reason {
          font-size: 13px;
          color: var(--color-neutral-600);
          line-height: 1.5;
          margin: 4px 0;
        }
        .ai-rec-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .ai-rec-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary-600);
        }
        .ai-rec-go {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 500;
          color: var(--color-secondary-600);
        }
        .ai-no-recs {
          text-align: center;
          padding: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .ai-no-recs p {
          font-size: 15px;
          color: var(--color-neutral-500);
        }
        @media (max-width: 640px) {
          .ai-card {
            padding: 20px;
          }
          .ai-input-wrap {
            flex-direction: column;
          }
          .ai-btn {
            justify-content: center;
          }
          .ai-rec-card {
            flex-direction: column;
          }
          .ai-rec-image {
            width: 100%;
            height: 160px;
          }
        }
      `}</style>
    </>
  )
}
