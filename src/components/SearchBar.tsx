import { Search, X, Filter } from 'lucide-react'
import { CATEGORIES } from '../types'

interface SearchBarProps {
  query: string
  onQueryChange: (q: string) => void
  selectedCategory: string
  onCategoryChange: (c: string) => void
}

export default function SearchBar({ query, onQueryChange, selectedCategory, onCategoryChange }: SearchBarProps) {
  return (
    <>
      <div className="search-container">
        <div className="search-input-wrap">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="ค้นหาหนังสือ ชื่อผู้แต่ง หรือหมวดหมู่..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
          {query && (
            <button className="search-clear" onClick={() => onQueryChange('')}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="category-bar">
        <div className="category-icon-wrap">
          <Filter size={16} />
          <span>หมวดหมู่</span>
        </div>
        <div className="category-list">
          <button
            className={`category-chip ${!selectedCategory ? 'active' : ''}`}
            onClick={() => onCategoryChange('')}
          >
            ทั้งหมด
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => onCategoryChange(selectedCategory === cat ? '' : cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        .search-container {
          max-width: 720px;
          margin: 0 auto;
        }
        .search-input-wrap {
          position: relative;
          display: flex;
          align-items: center;
          filter: drop-shadow(0 8px 12px rgba(53, 197, 179, 0.14));
          animation: popIn 0.55s ease-out both;
        }
        .search-icon {
          position: absolute;
          left: 20px;
          color: var(--color-secondary-500);
          animation: pulse 2.2s ease-in-out infinite;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          height: 60px;
          padding: 0 52px 0 52px;
          font-size: 16px;
          background: rgba(255,255,255,0.96);
          border: 3px solid #b5ece5;
          border-radius: 100px;
          transition: all 0.25s;
          color: var(--color-neutral-700);
        }
        .search-input:focus {
          border-color: var(--color-secondary-400);
          box-shadow: 0 0 0 5px rgba(53, 197, 179, 0.16);
          transform: scale(1.01);
        }
        .search-clear {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 8px;
          color: var(--color-neutral-400);
          transition: transform 0.2s;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .search-clear:hover {
          background: var(--color-secondary-100);
          color: var(--color-secondary-700);
          transform: rotate(90deg);
        }
        .category-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .category-icon-wrap {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-neutral-500);
          white-space: nowrap;
        }
        .category-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .category-chip {
          padding: 6px 16px;
          font-size: 14px;
          font-weight: 500;
          background: rgba(255,255,255,0.78);
          border: 1px solid #dcece8;
          border-radius: 100px;
          color: var(--color-neutral-600);
          transition: all 0.2s;
          box-shadow: 0 2px 0 rgba(53, 197, 179, 0.08);
          white-space: nowrap;
        }
        .category-chip:hover {
          border-color: var(--color-secondary-300);
          color: var(--color-secondary-700);
          transform: translateY(-2px);
        }
        .category-chip.active {
          background: var(--color-secondary-500);
          border-color: var(--color-secondary-500);
          color: white;
          box-shadow: 0 3px 0 var(--color-secondary-700);
        }
      `}</style>
    </>
  )
}
