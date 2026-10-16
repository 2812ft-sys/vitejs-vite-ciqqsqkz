export type BookCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor'
export type StockStatus = 'available' | 'reserved' | 'sold'
export type UserRole = 'member' | 'admin'
export type ReservationStatus = 'active' | 'cancelled' | 'completed'
export type TransactionType = 'sale' | 'expense'

export interface Profile {
  id: string
  display_name: string
  role: UserRole
}

export interface Book {
  id: string
  user_id: string | null
  title: string
  author: string
  category: string
  description: string
  price: number
  condition: BookCondition
  image_url: string
  seller_name: string
  contact: string
  created_at: string
  stock_status: StockStatus
  additional_notes: string
}

export interface BookInput {
  title: string
  author: string
  category: string
  description: string
  price: number
  condition: BookCondition
  image_url: string
  seller_name: string
  contact: string
  stock_status: StockStatus
  additional_notes: string
}

export interface Reservation {
  id: string
  book_id: string
  buyer_id: string
  seller_id: string | null
  status: ReservationStatus
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  user_id: string
  book_id: string | null
  type: TransactionType
  amount: number
  platform_fee: number
  description: string
  occurred_at: string
  created_at: string
}

export const CONDITION_LABELS: Record<BookCondition, string> = {
  new: 'มือใหม่',
  'like-new': 'สภาพดีมาก',
  good: 'สภาพดี',
  fair: 'สภาพพอใช้',
  poor: 'สภาพทรุด',
}

export const CONDITION_COLORS: Record<BookCondition, string> = {
  new: '#10b981',
  'like-new': '#22c55e',
  good: '#3b82f6',
  fair: '#f59e0b',
  poor: '#ef4444',
}

export const STOCK_LABELS: Record<StockStatus, string> = {
  available: 'ว่างพร้อมขาย',
  reserved: 'ติดจองคิว',
  sold: 'ขายแล้ว',
}

export const STOCK_COLORS: Record<StockStatus, string> = {
  available: '#10b981',
  reserved: '#f59e0b',
  sold: '#ef4444',
}

export const STOCK_DOT_COLORS: Record<StockStatus, string> = {
  available: '#34d399',
  reserved: '#fbbf24',
  sold: '#f87171',
}

export const CATEGORIES = [
  'ทั่วไป', 'นวนิยาย', 'วรรณกรรม', 'การ์ตูน', 'การศึกษา', 'ธุรกิจ',
  'พัฒนาตนเอง', 'วิทยาศาสตร์', 'ประวัติศาสตร์', 'จิตวิทยา', 'ศาสนา',
  'เด็ก', 'คอมพิวเตอร์', 'สุขภาพ', 'อาหาร', 'ท่องเที่ยว',
]
