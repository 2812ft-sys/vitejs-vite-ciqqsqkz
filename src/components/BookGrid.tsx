import { Book as BookIcon, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react'
import { Book as BookType, CONDITION_LABELS, CONDITION_COLORS, STOCK_LABELS, STOCK_COLORS } from '../types'

interface BookGridProps {
  books: BookType[]
  loading: boolean
  onSelectBook: (book: BookType) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function BookGrid({ books, loading, onSelectBook, page, totalPages, onPageChange }: BookGridProps) {
  if (loading) return <div className="book-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="book-card-skeleton" />)}<style>{`.book-card-skeleton { background: linear-gradient(90deg,var(--color-neutral-100) 25%,var(--color-neutral-200) 50%,var(--color-neutral-100) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:24px; height:340px; }`}</style></div>

  if (books.length === 0) return <div className="empty-state"><BookOpen size={48} color="var(--color-neutral-300)" /><p className="empty-title">ไม่พบหนังสือ</p><p className="empty-desc">ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่ดูสิ</p><style>{`.empty-state { text-align:center; padding:64px 24px; display:flex; flex-direction:column; align-items:center; gap:8px; } .empty-title { font-size:18px; font-weight:600; color:var(--color-neutral-700); } .empty-desc { font-size:14px; color:var(--color-neutral-400); }`}</style></div>

  return <>
    <div className="book-grid">
      {books.map((book, i) => <article key={book.id} className="book-card fade-in" style={{ animationDelay: `${i * .05}s` }} onClick={() => onSelectBook(book)}>
        <div className="book-card-image">
          {book.image_url ? <img src={book.image_url} alt={book.title} loading="lazy" /> : <div className="book-card-placeholder"><BookIcon size={40} color="var(--color-neutral-300)" /></div>}
          <span className="book-card-condition" style={{ background: CONDITION_COLORS[book.condition] }}>{CONDITION_LABELS[book.condition]}</span>
          <span className="book-card-stock" style={{ color: STOCK_COLORS[book.stock_status], background: `${STOCK_COLORS[book.stock_status]}18` }}>{STOCK_LABELS[book.stock_status]}</span>
        </div>
        <div className="book-card-body"><span className="book-card-category">{book.category}</span><h3 className="book-card-title">{book.title}</h3><p className="book-card-author">{book.author}</p><p className="book-card-desc">{book.description}</p><div className="book-card-footer"><span className="book-card-price">฿{Number(book.price).toLocaleString()}</span><span className="book-card-seller">โดย {book.seller_name}</span></div></div>
      </article>)}
    </div>
    {totalPages > 1 && <div className="pagination"><button disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={17} /> ก่อนหน้า</button><span>หน้า {page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>ถัดไป <ChevronRight size={17} /></button></div>}
    <style>{`
      .book-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
      .book-card { background:rgba(255,255,255,.94); border-radius:24px; overflow:hidden; cursor:pointer; transition:all .3s cubic-bezier(.4,0,.2,1); border:2px solid #f1e8df; box-shadow:0 5px 0 #f4e3d6; opacity:0; }
      .book-card:hover { transform:translateY(-8px) rotate(-.5deg); box-shadow:0 12px 0 #f2d4c4,0 18px 25px rgba(117,77,51,.12); border-color:#ffd6a8; }
      .book-card-image { position:relative; width:100%; height:200px; background:linear-gradient(135deg,#e5f8f4,#fff0d1); overflow:hidden; }
      .book-card-image img { width:100%; height:100%; object-fit:cover; transition:transform .45s cubic-bezier(.2,.8,.2,1); } .book-card:hover .book-card-image img { transform:scale(1.07); }
      .book-card-placeholder { width:100%; height:100%; display:grid; place-items:center; background:linear-gradient(135deg,#ddf6f0,#ffefd0); }
      .book-card-condition,.book-card-stock { position:absolute; padding:4px 9px; font-size:11px; font-weight:600; border-radius:100px; } .book-card-condition { top:12px; right:12px; color:white; } .book-card-stock { left:12px; bottom:12px; }
      .book-card-body { padding:16px; display:flex; flex-direction:column; gap:4px; } .book-card-category { font-size:12px; font-weight:500; color:var(--color-secondary-700); background:var(--color-secondary-100); padding:3px 9px; border-radius:100px; display:inline-block; width:fit-content; } .book-card-title { font-size:16px; color:var(--color-neutral-900); line-height:1.3; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; } .book-card-author { font-size:14px; color:var(--color-neutral-500); } .book-card-desc { font-size:13px; color:var(--color-neutral-400); line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; margin:4px 0; } .book-card-footer { display:flex; align-items:center; justify-content:space-between; margin-top:8px; padding-top:12px; border-top:1px dashed #eadfd6; } .book-card-price { font-size:18px; font-weight:700; color:var(--color-primary-700); } .book-card-seller { font-size:12px; color:var(--color-neutral-400); }
      .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:28px; color:var(--color-neutral-600); font-size:14px; } .pagination button { display:flex; align-items:center; gap:5px; padding:9px 14px; border-radius:100px; background:white; border:1px solid #e9ddd2; color:var(--color-neutral-600); } .pagination button:hover:not(:disabled) { background:var(--color-secondary-100); color:var(--color-secondary-700); transform:translateY(-1px); } .pagination button:disabled { opacity:.45; cursor:not-allowed; }
    `}</style>
  </>
}
