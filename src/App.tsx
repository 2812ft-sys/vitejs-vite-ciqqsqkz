import React, { useState, useEffect } from 'react';

// ==================== โครงสร้างข้อมูลสำคัญ (Database Schema) ====================

interface UserProfile {
  username: string;
  fullName: string;
  role: 'buyer' | 'seller' | 'admin';
  sellerId: string;
  phone: string;
  bankAccount: string;
  kycVerified: boolean;
  ratingAvg: number;
  reviewCount: number;
}

interface QueueItem {
  queueNumber: number;
  buyerUsername: string;
  reservedAt: string;
  expiresAt: number;
}

interface Book {
  id: number;
  title: string;
  author: string;
  price: number;
  originalPrice: number;
  condition: string;
  defectDetails: string;
  realPhotoVerified: boolean;
  category: string;
  status: 'ว่างพร้อมขาย' | 'ติดจองคิว' | 'พักเงินในบัญชีกลาง (Escrow)' | 'จัดส่งแล้ว' | 'ขายแล้ว';
  imageUrl: string;
  sellerUsername: string;
  sellerId: string;
  sellerContact: string;
  queues: QueueItem[];
}

interface EscrowTransaction {
  id: number;
  bookId: number;
  bookTitle: string;
  buyerUsername: string;
  sellerUsername: string;
  sellerId: string;
  price: number;
  fee: number;
  netIncome: number;
  escrowStatus: 'พักเงินในบัญชีกลาง (รอจัดส่ง)' | 'ผู้ขายแจ้งเลขพัสดุแล้ว (รอผู้ซื้อตรวจรับ)' | 'โอนเงินให้ผู้ขายสำเร็จ' | 'ระงับธุรกรรม (ตรวจสอบข้อพิพาท)';
  trackingNumber: string;
  date: string;
  reviewed: boolean;
}

interface Review {
  id: number;
  bookTitle: string;
  sellerUsername: string;
  sellerId: string;
  reviewer: string;
  rating: number;
  comment: string;
  date: string;
}

// พาเลตต์สี 4 คู่หลักตามภาพต้นฉบับ (Celery, Vanilla Ice, Chenin, Swans Down)
const PALETTE_THEMES = [
  {
    name: 'Celery & Stiletto',
    bg: '#B7C95C',
    softBg: '#EEF3D2',
    text: '#983226',
    subText: '#7D281E',
    border: '#A3B848'
  },
  {
    name: 'Vanilla Ice & Merlot',
    bg: '#F2DADF',
    softBg: '#FAF0F2',
    text: '#761E27',
    subText: '#5E161E',
    border: '#E5C3CA'
  },
  {
    name: 'Chenin & Smoky',
    bg: '#E0CE70',
    softBg: '#F9F4D7',
    text: '#5E5073',
    subText: '#493D5B',
    border: '#D1BD59'
  },
  {
    name: 'Swans Down & Quicksand',
    bg: '#DBECEA',
    softBg: '#EFF7F6',
    text: '#8A6559',
    subText: '#6E4F45',
    border: '#C2DDD9'
  }
];

const CATEGORIES = [
  'ทั้งหมด',
  'นิยาย/วรรณกรรม',
  'จิตวิทยา/พัฒนาตนเอง',
  'การเงิน/การลงทุน/ธุรกิจ',
  'การศึกษา/ตำราเรียน/ภาษา',
  'การ์ตูน/มังงะ/ไลท์โนเวล',
  'ศิลปะ/การออกแบบ/สถาปัตยกรรม',
  'ประวัติศาสตร์/สารคดี/ปรัชญา',
  'สุขภาพ/อาหาร/ไลฟ์สไตล์',
  'หนังสือเด็ก/ครอบครัว',
  'หนังสือสะสม/หายาก'
];

const CONDITIONS = [
  'สภาพมือหนึ่ง 99% (ในซีล/ยังไม่แกะ)',
  'สภาพดีเยี่ยม 95%+ (เหมือนใหม่)',
  'สภาพดี 85-90% (มีร่องรอยการอ่านเล็กน้อย)',
  'สภาพปานกลาง 75-80% (มีรอยพับ/จุดเหลือง)',
  'สภาพอ่าน 60-70% (มีรอยขีดเขียน/เน้นเนื้อหา)',
  'หนังสือสะสมหายาก (ตามกาลเวลา)'
];

// ==================== ข้อมูลเริ่มต้น ====================

const initialUsers: UserProfile[] = [
  {
    username: 'natthawadee',
    fullName: 'ณัฐวดี (เจ้าของร้านยืนยันตัวตน)',
    role: 'seller',
    sellerId: 'B2H-SL-001',
    phone: '081-234-5678',
    bankAccount: 'กสิกรไทย xxx-x-x9876-x',
    kycVerified: true,
    ratingAvg: 4.9,
    reviewCount: 14
  },
  {
    username: 'somchai_reader',
    fullName: 'สมชาย รักการอ่าน',
    role: 'buyer',
    sellerId: 'B2H-BY-102',
    phone: '089-876-5432',
    bankAccount: 'พร้อมเพย์ 0898765432',
    kycVerified: true,
    ratingAvg: 4.7,
    reviewCount: 5
  },
  {
    username: 'admin',
    fullName: 'ผู้ดูแลระบบ Book2Hand',
    role: 'admin',
    sellerId: 'B2H-ADMIN',
    phone: '02-000-0000',
    bankAccount: 'บัญชีกลาง Book2Hand Escrow',
    kycVerified: true,
    ratingAvg: 5.0,
    reviewCount: 99
  }
];

const initialBooks: Book[] = [
  {
    id: 1,
    title: 'กล้าที่จะถูกเกลียด (The Courage to Be Disliked)',
    author: 'Ichiro Kishimi & Fumitake Koga',
    price: 165,
    originalPrice: 280,
    condition: 'สภาพดีเยี่ยม 95%+ (เหมือนใหม่)',
    defectDetails: 'ห่อปกพลาสติกใสเรียบร้อย มุมคมกริบ ไม่มีรอยขีดเขียนหรือไฮไลท์',
    realPhotoVerified: true,
    category: 'จิตวิทยา/พัฒนาตนเอง',
    status: 'ว่างพร้อมขาย',
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    sellerContact: 'Line: @natthawadee_books',
    queues: []
  },
  {
    id: 2,
    title: 'Psychology of Money (จิตวิทยาว่าด้วยเงิน)',
    author: 'Morgan Housel',
    price: 180,
    originalPrice: 320,
    condition: 'สภาพดี 85-90% (มีร่องรอยการอ่านเล็กน้อย)',
    defectDetails: 'มีรอยพับมุมกระดาษหน้า 42 เล็กน้อย 1 จุด สันหนังสือสะอาดสมบูรณ์',
    realPhotoVerified: true,
    category: 'การเงิน/การลงทุน/ธุรกิจ',
    status: 'ติดจองคิว',
    imageUrl: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    sellerContact: 'Line: @natthawadee_books',
    queues: [
      {
        queueNumber: 1,
        buyerUsername: 'somchai_reader',
        reservedAt: '14:20 น.',
        expiresAt: Date.now() + 4 * 3600 * 1000 + 45 * 60 * 1000
      }
    ]
  },
  {
    id: 3,
    title: 'ปาฏิหาริย์ร้านชำของคุณนามิยะ',
    author: 'ฮิงาชิโนะ เคโงะ',
    price: 195,
    originalPrice: 295,
    condition: 'สภาพดีเยี่ยม 95%+ (เหมือนใหม่)',
    defectDetails: 'อ่านครั้งเดียว เก็บในตู้ทึบแสง กระดาษไม่เหลือง แถมที่คั่นหนังสือตรงปก',
    realPhotoVerified: true,
    category: 'นิยาย/วรรณกรรม',
    status: 'ว่างพร้อมขาย',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'somchai_reader',
    sellerId: 'B2H-BY-102',
    sellerContact: 'Tel: 089-876-5432',
    queues: []
  },
  {
    id: 4,
    title: 'การออกแบบบ้านและสถาปัตยกรรมร่วมสมัย',
    author: 'Arch Studio Thailand',
    price: 290,
    originalPrice: 550,
    condition: 'หนังสือสะสมหายาก (ตามกาลเวลา)',
    defectDetails: 'ปกแข็งพิมพ์สีทั้งเล่ม ขอบปกมีรอยถลอกตามมุมเล็กน้อย ภาพด้านในสมบูรณ์ 100%',
    realPhotoVerified: true,
    category: 'ศิลปะ/การออกแบบ/สถาปัตยกรรม',
    status: 'ว่างพร้อมขาย',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    sellerContact: 'Line: @natthawadee_books',
    queues: []
  }
];

const initialTransactions: EscrowTransaction[] = [
  {
    id: 1001,
    bookId: 99,
    bookTitle: 'Atomic Habits (เพราะชีวิตดีได้กว่าที่เป็น)',
    buyerUsername: 'somchai_reader',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    price: 200,
    fee: 10,
    netIncome: 190,
    escrowStatus: 'โอนเงินให้ผู้ขายสำเร็จ',
    trackingNumber: 'TH0192837465A',
    date: '2026-10-15',
    reviewed: true
  },
  {
    id: 1002,
    bookId: 98,
    bookTitle: 'คู่มือเตรียมสอบภาษาอังกฤษ TOEIC ฉบับสมบูรณ์',
    buyerUsername: 'somchai_reader',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    price: 300,
    fee: 15,
    netIncome: 285,
    escrowStatus: 'ผู้ขายแจ้งเลขพัสดุแล้ว (รอผู้ซื้อตรวจรับ)',
    trackingNumber: 'KERRY-88990011',
    date: '2026-10-16',
    reviewed: false
  }
];

const initialReviews: Review[] = [
  {
    id: 1,
    bookTitle: 'Atomic Habits (เพราะชีวิตดีได้กว่าที่เป็น)',
    sellerUsername: 'natthawadee',
    sellerId: 'B2H-SL-001',
    reviewer: 'somchai_reader',
    rating: 5,
    comment: 'หนังสือสภาพใหม่มากตรงตามที่แจ้งตำหนิเลยครับ ห่อบับเบิ้ลกันกระแทกมาหนาแน่นมาก จัดส่งไว ประทับใจครับ!',
    date: '2026-10-15'
  }
];

export default function App() {
  // โหลดข้อมูลจาก localStorage
  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('b2h_users');
    return saved ? JSON.parse(saved) : initialUsers;
  });
  const [currentUsername, setCurrentUsername] = useState<string>('natthawadee');
  const currentUser = users.find(u => u.username === currentUsername) || users[0];

  const [books, setBooks] = useState<Book[]>(() => {
    const saved = localStorage.getItem('b2h_books');
    return saved ? JSON.parse(saved) : initialBooks;
  });

  const [transactions, setTransactions] = useState<EscrowTransaction[]>(() => {
    const saved = localStorage.getItem('b2h_tx');
    return saved ? JSON.parse(saved) : initialTransactions;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const saved = localStorage.getItem('b2h_reviews');
    return saved ? JSON.parse(saved) : initialReviews;
  });

  const [keywordAlerts, setKeywordAlerts] = useState<string[]>(() => {
    const saved = localStorage.getItem('b2h_keywords');
    return saved ? JSON.parse(saved) : ['จิตวิทยา', 'การเงิน', 'นิยายสืบสวน'];
  });

  useEffect(() => { localStorage.setItem('b2h_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('b2h_books', JSON.stringify(books)); }, [books]);
  useEffect(() => { localStorage.setItem('b2h_tx', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('b2h_reviews', JSON.stringify(reviews)); }, [reviews]);
  useEffect(() => { localStorage.setItem('b2h_keywords', JSON.stringify(keywordAlerts)); }, [keywordAlerts]);

  const [now, setNow] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [activeTab, setActiveTab] = useState<'shop' | 'escrow' | 'dashboard' | 'reviews'>('shop');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Modals
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isRandomOpen, setIsRandomOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedTxForReview, setSelectedTxForReview] = useState<EscrowTransaction | null>(null);

  const [notificationBanner, setNotificationBanner] = useState<string>('');
  const [newKeywordInput, setNewKeywordInput] = useState('');

  const [isSpinning, setIsSpinning] = useState(false);
  const [randomResult, setRandomResult] = useState<Book | null>(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    price: '',
    originalPrice: '',
    category: 'จิตวิทยา/พัฒนาตนเอง',
    condition: 'สภาพดีเยี่ยม 95%+ (เหมือนใหม่)',
    defectDetails: '',
    sellerContact: '',
    imageUrl: '',
    realPhotoVerified: true
  });

  const [regForm, setRegForm] = useState({
    username: '',
    fullName: '',
    role: 'seller' as 'buyer' | 'seller',
    phone: '',
    bankAccount: '',
    nationalId: ''
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: ''
  });

  // ==================== ฟังก์ชันการทำงานหลัก ====================

  const formatTimeRemaining = (expiresAt: number) => {
    const diff = Math.max(0, expiresAt - now);
    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleRegisterUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.username || !regForm.fullName || !regForm.phone) return;
    if (users.some(u => u.username === regForm.username)) {
      alert('ชื่อผู้ใช้นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่นครับ');
      return;
    }

    const prefix = regForm.role === 'seller' ? 'B2H-SL-' : 'B2H-BY-';
    const generatedId = `${prefix}${String(users.length + 1).padStart(3, '0')}`;

    const createdUser: UserProfile = {
      username: regForm.username.trim(),
      fullName: regForm.fullName.trim(),
      role: regForm.role,
      sellerId: generatedId,
      phone: regForm.phone,
      bankAccount: regForm.bankAccount || 'รอระบุเลขบัญชี',
      kycVerified: regForm.nationalId.length >= 4,
      ratingAvg: 5.0,
      reviewCount: 0
    };

    setUsers([...users, createdUser]);
    setCurrentUsername(createdUser.username);
    setIsRegisterModalOpen(false);
    setRegForm({ username: '', fullName: '', role: 'seller', phone: '', bankAccount: '', nationalId: '' });
    alert(`🎉 ลงทะเบียนสำเร็จ! รหัสประจำตัวของคุณคือ ${generatedId}`);
  };

  const handleAddBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBook.title || !newBook.price || !newBook.defectDetails) {
      alert('กรุณากรอกชื่อหนังสือ ราคา และระบุรายละเอียดตำหนิหนังสือให้ครบถ้วนครับ');
      return;
    }

    const createdBook: Book = {
      id: Date.now(),
      title: newBook.title,
      author: newBook.author || 'ไม่ระบุผู้แต่ง',
      price: Number(newBook.price),
      originalPrice: Number(newBook.originalPrice) || Math.round(Number(newBook.price) * 1.4),
      condition: newBook.condition,
      defectDetails: newBook.defectDetails,
      realPhotoVerified: newBook.realPhotoVerified,
      category: newBook.category,
      status: 'ว่างพร้อมขาย',
      imageUrl: newBook.imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
      sellerUsername: currentUser.username,
      sellerId: currentUser.sellerId,
      sellerContact: newBook.sellerContact || `Tel: ${currentUser.phone}`,
      queues: []
    };

    setBooks([createdBook, ...books]);
    setIsSellModalOpen(false);

    const matchedKeyword = keywordAlerts.find(kw =>
      createdBook.title.toLowerCase().includes(kw.toLowerCase()) ||
      createdBook.category.toLowerCase().includes(kw.toLowerCase())
    );

    if (matchedKeyword) {
      setNotificationBanner(`🔔 แจ้งเตือนคำค้นหาตรงกัน! มีการลงขายหนังสือใหม่ "${createdBook.title}" ตรงกับคำว่า "${matchedKeyword}"`);
    } else {
      setNotificationBanner(`✨ ลงขายหนังสือ "${createdBook.title}" เรียบร้อยแล้ว!`);
    }

    setNewBook({
      title: '', author: '', price: '', originalPrice: '',
      category: 'จิตวิทยา/พัฒนาตนเอง', condition: 'สภาพดีเยี่ยม 95%+ (เหมือนใหม่)',
      defectDetails: '', sellerContact: '', imageUrl: '', realPhotoVerified: true
    });
  };

  const handleReserveQueue = (book: Book) => {
    if (book.queues.length >= 3) {
      alert('ขออภัยครับ หนังสือเล่มนี้มีผู้จองเต็มครบ 3 คิวแล้ว');
      return;
    }
    if (book.queues.some(q => q.buyerUsername === currentUser.username)) {
      alert('คุณอยู่ในคิวจองของหนังสือเล่มนี้เรียบร้อยแล้วครับ');
      return;
    }

    const nextQueueNum = book.queues.length + 1;
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
    const fiveHoursLater = Date.now() + 5 * 60 * 60 * 1000;

    const updatedQueues: QueueItem[] = [
      ...book.queues,
      {
        queueNumber: nextQueueNum,
        buyerUsername: currentUser.username,
        reservedAt: nowTime,
        expiresAt: fiveHoursLater
      }
    ];

    setBooks(prev => prev.map(b => b.id === book.id ? {
      ...b,
      status: 'ติดจองคิว',
      queues: updatedQueues
    } : b));

    alert(`⏳ จองคิวที่ ${nextQueueNum} สำเร็จ! คิวที่ 1 มีเวลาชำระเงินเข้าบัญชีกลางภายใน 5 ชั่วโมง`);
  };

  const handleExpireFirstQueue = (book: Book) => {
    if (book.queues.length === 0) return;
    const droppedUser = book.queues[0].buyerUsername;
    const remaining = book.queues.slice(1).map((q, idx) => ({
      ...q,
      queueNumber: idx + 1,
      expiresAt: Date.now() + 5 * 60 * 60 * 1000
    }));

    setBooks(prev => prev.map(b => b.id === book.id ? {
      ...b,
      status: remaining.length > 0 ? 'ติดจองคิว' : 'ว่างพร้อมขาย',
      queues: remaining
    } : b));

    if (remaining.length > 0) {
      setNotificationBanner(`⏰ คิวที่ 1 (@${droppedUser}) หมดเวลา 5 ชั่วโมง! ระบบเลื่อนคิวให้ @${remaining[0].buyerUsername} ขึ้นมาเป็นคิวที่ 1 อัตโนมัติ`);
    } else {
      setNotificationBanner(`⏰ คิวที่ 1 (@${droppedUser}) หมดเวลา 5 ชั่วโมง หนังสือ "${book.title}" กลับมาว่างพร้อมขายอีกครั้ง!`);
    }
  };

  const handlePayToEscrow = (book: Book) => {
    const fee = Math.round(book.price * 0.05);
    const net = book.price - fee;

    const newTx: EscrowTransaction = {
      id: Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      buyerUsername: book.queues[0]?.buyerUsername || currentUser.username,
      sellerUsername: book.sellerUsername,
      sellerId: book.sellerId,
      price: book.price,
      fee,
      netIncome: net,
      escrowStatus: 'พักเงินในบัญชีกลาง (รอจัดส่ง)',
      trackingNumber: '',
      date: new Date().toISOString().split('T')[0],
      reviewed: false
    };

    setTransactions([newTx, ...transactions]);
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, status: 'พักเงินในบัญชีกลาง (Escrow)' } : b));
    setNotificationBanner(`🛡️ ชำระเงิน ฿${book.price} เข้าบัญชีกลาง (Escrow) สำเร็จ! เงินจะถูกพักไว้จนกว่าคุณจะได้รับหนังสือตรงปก`);
    setActiveTab('escrow');
  };

  const handleAddTracking = (txId: number) => {
    const tracking = prompt('กรุณากรอกหมายเลขพัสดุ (Tracking Number):', 'FLASH-TH99887766');
    if (!tracking) return;
    setTransactions(prev => prev.map(t => t.id === txId ? {
      ...t,
      trackingNumber: tracking,
      escrowStatus: 'ผู้ขายแจ้งเลขพัสดุแล้ว (รอผู้ซื้อตรวจรับ)'
    } : t));
  };

  const handleConfirmReceived = (tx: EscrowTransaction) => {
    setTransactions(prev => prev.map(t => t.id === tx.id ? {
      ...t,
      escrowStatus: 'โอนเงินให้ผู้ขายสำเร็จ'
    } : t));
    setBooks(prev => prev.map(b => b.id === tx.bookId ? { ...b, status: 'ขายแล้ว', queues: [] } : b));
    setSelectedTxForReview(tx);
    setIsReviewModalOpen(true);
  };

  const handleDisputeEscrow = (txId: number) => {
    if (confirm('⚠️ ยืนยันการแจ้งปัญหาสินค้าไม่ตรงปก/ไม่จัดส่ง เพื่ออายัดเงินในบัญชีกลางไว้ตรวจสอบใช่หรือไม่?')) {
      setTransactions(prev => prev.map(t => t.id === txId ? {
        ...t,
        escrowStatus: 'ระงับธุรกรรม (ตรวจสอบข้อพิพาท)'
      } : t));
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForReview) return;

    const newRev: Review = {
      id: Date.now(),
      bookTitle: selectedTxForReview.bookTitle,
      sellerUsername: selectedTxForReview.sellerUsername,
      sellerId: selectedTxForReview.sellerId,
      reviewer: currentUser.username,
      rating: reviewForm.rating,
      comment: reviewForm.comment || 'ได้รับหนังสือเรียบร้อย สภาพดีตรงปกครับ!',
      date: new Date().toISOString().split('T')[0]
    };

    const updatedReviews = [newRev, ...reviews];
    setReviews(updatedReviews);

    setUsers(prev => prev.map(u => {
      if (u.username === selectedTxForReview.sellerUsername) {
        const sellerRevs = updatedReviews.filter(r => r.sellerUsername === u.username);
        const avg = sellerRevs.reduce((sum, r) => sum + r.rating, 0) / sellerRevs.length;
        return {
          ...u,
          ratingAvg: Number(avg.toFixed(1)),
          reviewCount: sellerRevs.length
        };
      }
      return u;
    }));

    setTransactions(prev => prev.map(t => t.id === selectedTxForReview.id ? { ...t, reviewed: true } : t));
    setIsReviewModalOpen(false);
    setReviewForm({ rating: 5, comment: '' });
    alert('⭐ ขอบคุณสำหรับรีวิวครับ! ระบบได้อัปเดตคะแนนความน่าเชื่อถือของผู้ขายเรียบร้อยแล้ว');
  };

  const handleDeleteBook = (book: Book) => {
    if (currentUser.role !== 'admin' && currentUser.username !== book.sellerUsername) {
      alert('⚠️ เฉพาะเจ้าของโพสต์หรือ Admin เท่านั้นที่สามารถลบหนังสือเล่มนี้ได้');
      return;
    }
    if (confirm(`ยืนยันการลบหนังสือ "${book.title}" ใช่หรือไม่?`)) {
      setBooks(prev => prev.filter(b => b.id !== book.id));
    }
  };

  const handleRandomBook = () => {
    const availableBooks = books.filter(b => b.status === 'ว่างพร้อมขาย');
    if (availableBooks.length === 0) {
      alert('ขณะนี้ไม่มีหนังสือสถานะว่างพร้อมขายให้สุ่มเลยครับ');
      return;
    }
    setIsRandomOpen(true);
    setIsSpinning(true);
    setRandomResult(null);
    setTimeout(() => {
      const idx = Math.floor(Math.random() * availableBooks.length);
      setRandomResult(availableBooks[idx]);
      setIsSpinning(false);
    }, 1400);
  };

  const handleAskAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    setAiResponse('');
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
    const briefCatalog = books.slice(0, 8).map(b => `${b.title} (${b.category}, ฿${b.price}, ${b.status})`).join('; ');

    if (!apiKey || apiKey.includes('ใส่รหัส')) {
      setTimeout(() => {
        setAiResponse(`✨ คำแนะนำสำหรับ "${aiPrompt}": ขอแนะนำเล่ม "กล้าที่จะถูกเกลียด" (฿165, สภาพ 95%+) หรือ "ปาฏิหาริย์ร้านชำของคุณนามิยะ" (฿195) ครับ ตรวจเช็กตำหนิและชำระผ่านบัญชีกลางได้อย่างปลอดภัย!`);
        setIsAiLoading(false);
      }, 700);
      return;
    }

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `คุณคือผู้ช่วยร้านหนังสือมือสอง Book2Hand ตอบสั้นกระชับ อบอุ่น เป็นกันเอง มีหนังสือดังนี้: [${briefCatalog}] ลูกค้าถามว่า: "${aiPrompt}"`
            }]
          }]
        })
      });
      const data = await res.json();
      setAiResponse(data.candidates?.[0]?.content?.parts?.[0]?.text || 'ไม่สามารถประมวลผลคำตอบได้ในขณะนี้');
    } catch {
      setAiResponse('เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini API');
    } finally {
      setIsAiLoading(false);
    }
  };

  const filteredBooks = books.filter(b => {
    const matchSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        b.sellerId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = selectedCategory === 'ทั้งหมด' || b.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage) || 1;
  const currentBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const completedTx = transactions.filter(t => t.escrowStatus === 'โอนเงินให้ผู้ขายสำเร็จ');
  const holdingTx = transactions.filter(t => t.escrowStatus.includes('พักเงิน') || t.escrowStatus.includes('แจ้งเลขพัสดุ'));
  const totalSales = completedTx.reduce((s, t) => s + t.price, 0);
  const totalFees = completedTx.reduce((s, t) => s + t.fee, 0);
  const totalNet = completedTx.reduce((s, t) => s + t.netIncome, 0);
  const totalEscrowHold = holdingTx.reduce((s, t) => s + t.price, 0);

  return (
    <div style={styles.container}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&display=swap');
        * { font-family: 'Prompt', sans-serif; box-sizing: border-box; }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade { animation: fadeIn 0.35s ease-out forwards; }

        .smooth-btn {
          transition: all 0.22s ease;
        }
        .smooth-btn:hover {
          transform: translateY(-2px);
          filter: brightness(0.97);
          box-shadow: 0 8px 20px rgba(94, 80, 115, 0.12);
        }
        .smooth-btn:active { transform: scale(0.98); }

        .editorial-card {
          transition: all 0.28s ease;
        }
        .editorial-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 18px 36px rgba(94, 80, 115, 0.12);
        }
      `}</style>

      {/* แถบแจ้งเตือนด้านบน */}
      {notificationBanner && (
        <div style={styles.alertBanner}>
          <span>{notificationBanner}</span>
          <button onClick={() => setNotificationBanner('')} style={styles.alertCloseBtn}>✕</button>
        </div>
      )}

      {/* ==================== HEADER (โปร่ง สะอาดตา ตัวหนังสือใหญ่) ==================== */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoGroup} onClick={() => setActiveTab('shop')}>
            <div style={styles.logoMark}>B2H</div>
            <div>
              <span style={styles.logoText}>Book2Hand.</span>
              <span style={styles.logoSub}>คอมมูนิตี้หนังสือมือสองปลอดภัย</span>
            </div>
          </div>

          <nav style={styles.navTabs}>
            <button onClick={() => setActiveTab('shop')} className="smooth-btn" style={{ ...styles.tabBtn, ...(activeTab === 'shop' ? styles.tabBtnActive : {}) }}>
              ตลาดหนังสือ ({books.length})
            </button>
            <button onClick={() => setActiveTab('escrow')} className="smooth-btn" style={{ ...styles.tabBtn, ...(activeTab === 'escrow' ? styles.tabBtnActive : {}) }}>
              บัญชีกลาง Escrow ({transactions.length})
            </button>
            <button onClick={() => setActiveTab('reviews')} className="smooth-btn" style={{ ...styles.tabBtn, ...(activeTab === 'reviews' ? styles.tabBtnActive : {}) }}>
              รีวิวผู้ขาย ({reviews.length})
            </button>
            <button onClick={() => setActiveTab('dashboard')} className="smooth-btn" style={{ ...styles.tabBtn, ...(activeTab === 'dashboard' ? styles.tabBtnActive : {}) }}>
              แดชบอร์ด & ข้อมูลระบบ
            </button>
          </nav>

          <div style={styles.userSection}>
            <div style={styles.userBadge}>
              <span style={styles.sellerIdChip}>{currentUser.sellerId}</span>
              <select
                value={currentUsername}
                onChange={e => setCurrentUsername(e.target.value)}
                style={styles.userSelect}
              >
                {users.map(u => (
                  <option key={u.username} value={u.username}>
                    @{u.username} ({u.role === 'admin' ? 'Admin' : u.role === 'seller' ? 'ผู้ขาย' : 'ผู้ซื้อ'})
                  </option>
                ))}
              </select>
              {currentUser.kycVerified && <span style={styles.kycBadge}>KYC ✓</span>}
            </div>
            <button onClick={() => setIsRegisterModalOpen(true)} className="smooth-btn" style={styles.regBtn}>
              ลงทะเบียน / KYC
            </button>
          </div>
        </div>
      </header>

      {/* ==================== หน้าแรก: ตลาดหนังสือ ==================== */}
      {activeTab === 'shop' && (
        <div className="animate-fade">
          {/* แบนเนอร์ 4 คู่สีสมูทตามภาพต้นฉบับ (Celery, Vanilla Ice, Chenin, Swans Down) */}
          <section style={styles.heroSection}>
            <div style={styles.heroTopRow}>
              <div>
                <span style={styles.heroEyebrow}>CURATED SECONDHAND BOOKSTORE —</span>
                <h1 style={styles.heroTitle}>ส่งต่อหนังสือเล่มโปรด อย่างปลอดภัยและมีสไตล์</h1>
                <p style={styles.heroDesc}>
                  ตรวจสอบตำหนิชัดเจน • จองคิวได้สูงสุด 3 คิว (คิวละ 5 ชั่วโมง) • คุ้มครองเงินทุกบาทด้วยระบบบัญชีกลาง (Escrow)
                </p>
              </div>
              <div style={styles.heroActionGroup}>
                <button onClick={handleRandomBook} className="smooth-btn" style={styles.btnChenin}>
                  🎲 สุ่มหนังสือเสี่ยงทาย
                </button>
                <button onClick={() => setIsAiModalOpen(true)} className="smooth-btn" style={styles.btnVanilla}>
                  ✨ ให้ AI ช่วยเลือก
                </button>
                <button onClick={() => setIsSellModalOpen(true)} className="smooth-btn" style={styles.btnCelery}>
                  + ลงขายหนังสือมือสอง
                </button>
              </div>
            </div>

            {/* การ์ดไฮไลท์ 4 โทนสีจากภาพต้นฉบับ */}
            <div style={styles.paletteBannerGrid}>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#B7C95C', color: '#983226' }}>
                <div style={styles.paletteCardTitle}>Verified Seller</div>
                <div style={styles.paletteCardSub}>& รหัสประจำตัว KYC —</div>
                <p style={styles.paletteCardBody}>ผู้ขายทุกคนมีรหัส Seller ID และยืนยันบัญชีธนาคารจริง ตรวจสอบประวัติย้อนหลังได้</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#F2DADF', color: '#761E27' }}>
                <div style={styles.paletteCardTitle}>3-Queue System</div>
                <div style={styles.paletteCardSub}>& โอนใน 5 ชั่วโมง —</div>
                <p style={styles.paletteCardBody}>เข้าคิวจองได้สูงสุด 3 คิว หากคิวแรกไม่ชำระภายใน 5 ชม. ระบบเลื่อนสิทธิ์ให้คิวถัดไปทันที</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#E0CE70', color: '#5E5073' }}>
                <div style={styles.paletteCardTitle}>Escrow Safe</div>
                <div style={styles.paletteCardSub}>& บัญชีกลาง 100% —</div>
                <p style={styles.paletteCardBody}>พักเงินไว้ในระบบจนกว่าจะได้รับหนังสือตรงปก ป้องกันมิจฉาชีพและการโกงทุกรูปแบบ</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#DBECEA', color: '#8A6559' }}>
                <div style={styles.paletteCardTitle}>True Condition</div>
                <div style={styles.paletteCardSub}>& แจ้งตำหนิชัดเจน —</div>
                <p style={styles.paletteCardBody}>บังคับระบุรายละเอียดตำหนิหนังสือและยืนยันภาพถ่ายจริงก่อนลงขายทุกเล่ม</p>
              </div>
            </div>

            {/* แถบคำค้นหาแจ้งเตือนอัตโนมัติ (จัดเรียงสะอาดตา ตัวหนังสืออ่านง่าย) */}
            <div style={styles.keywordBar}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#5E5073' }}>🔔 แจ้งเตือนคำค้นหาอัตโนมัติ:</span>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                {keywordAlerts.map((kw, i) => (
                  <span key={i} style={styles.keywordChip}>
                    #{kw}
                    <button
                      onClick={() => setKeywordAlerts(keywordAlerts.filter((_, idx) => idx !== i))}
                      style={styles.removeChipBtn}
                    >×</button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="พิมพ์คำค้นที่อยากให้แจ้งเตือน..."
                  value={newKeywordInput}
                  onChange={e => setNewKeywordInput(e.target.value)}
                  style={styles.keywordInput}
                />
                <button
                  onClick={() => {
                    if (newKeywordInput.trim()) {
                      setKeywordAlerts([...keywordAlerts, newKeywordInput.trim()]);
                      setNewKeywordInput('');
                    }
                  }}
                  className="smooth-btn"
                  style={styles.keywordAddBtn}
                >เพิ่มคำค้น</button>
              </div>
            </div>
          </section>

          {/* ช่องค้นหาและหมวดหมู่หนังสือครบ 11 หมวด */}
          <section style={styles.filterSection}>
            <div style={styles.searchWrapper}>
              <span style={{ fontSize: '22px' }}>🔍</span>
              <input
                type="text"
                placeholder="ค้นหาชื่อหนังสือ, ผู้แต่ง, หรือรหัสผู้ขาย (เช่น B2H-SL-001)..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                style={styles.searchInput}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={styles.clearBtn}>ล้างคำค้น</button>
              )}
            </div>

            <div style={styles.categoryScroll}>
              {CATEGORIES.map((cat, idx) => {
                const isActive = selectedCategory === cat;
                const theme = PALETTE_THEMES[idx % PALETTE_THEMES.length];
                return (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                    className="smooth-btn"
                    style={{
                      ...styles.categoryPill,
                      backgroundColor: isActive ? theme.bg : '#FAF8F5',
                      color: isActive ? theme.text : '#57534E',
                      borderColor: isActive ? theme.border : '#E5DEC9',
                      fontWeight: isActive ? 700 : 500
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </section>

          {/* ตารางแสดงรายการหนังสือ (จัดสัดส่วนใหม่ โปร่ง ตัวหนังสือใหญ่) */}
          <main style={styles.mainGridWrapper}>
            <div style={styles.grid}>
              {currentBooks.map((book, idx) => {
                const theme = PALETTE_THEMES[idx % PALETTE_THEMES.length];
                const sellerInfo = users.find(u => u.username === book.sellerUsername);
                const isOwner = currentUser.role === 'admin' || currentUser.username === book.sellerUsername;
                const activeQueue1 = book.queues[0];

                return (
                  <article key={book.id} className="editorial-card" style={styles.bookCard}>
                    {/* แถบหัวการ์ดไล่ตาม 4 คู่สีต้นฉบับ */}
                    <div style={{ ...styles.cardColorHeader, backgroundColor: theme.bg, color: theme.text }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '15px', fontWeight: 700 }}>{book.category}</span>
                        <span style={{
                          backgroundColor: 'rgba(255,255,255,0.88)',
                          color: theme.text,
                          padding: '4px 12px',
                          borderRadius: '99px',
                          fontSize: '14px',
                          fontWeight: 700
                        }}>
                          {book.status} ({book.queues.length}/3 คิว)
                        </span>
                      </div>
                      <h3 style={{ ...styles.bookTitle, color: theme.text }}>{book.title}</h3>
                      <div style={{ ...styles.bookAuthor, color: theme.subText }}>
                        & {book.author} —
                      </div>
                    </div>

                    {/* รูปภาพหนังสือ */}
                    <div style={styles.imgBox}>
                      <img src={book.imageUrl} alt={book.title} style={styles.bookImg} />
                      {book.realPhotoVerified && (
                        <span style={styles.verifiedPhotoBadge}>📸 ภาพถ่ายจริงตรงปก</span>
                      )}
                    </div>

                    {/* รายละเอียดหนังสือ (สะอาดตา ตัวหนังสือขนาดใหญ่ 16-18px) */}
                    <div style={styles.cardContent}>
                      <div style={{ ...styles.infoBlock, backgroundColor: theme.softBg, color: theme.text }}>
                        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
                          ✨ {book.condition}
                        </div>
                        <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.55, color: theme.subText }}>
                          <strong>ตำหนิ/รายละเอียด:</strong> {book.defectDetails}
                        </p>
                      </div>

                      {/* ข้อมูลผู้ขาย & คะแนนรีวิว */}
                      <div style={styles.sellerRow}>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 700, color: '#292524' }}>
                            ผู้ขาย: @{book.sellerUsername} <span style={styles.sellerIdTag}>{book.sellerId}</span>
                          </div>
                          <div style={{ fontSize: '14px', color: '#57534E', marginTop: '2px' }}>
                            {sellerInfo?.kycVerified ? '✓ ยืนยันบัตรประชาชน & บัญชีแล้ว' : 'รอยืนยันตัวตน'} • {book.sellerContact}
                          </div>
                        </div>
                        <div style={styles.ratingBadge} onClick={() => setActiveTab('reviews')}>
                          ★ {sellerInfo?.ratingAvg || 5.0} ({sellerInfo?.reviewCount || 0})
                        </div>
                      </div>

                      {/* สถานะคิวจอง 1-3 และเวลา 5 ชั่วโมง */}
                      <div style={styles.queueSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '15px', fontWeight: 700, color: '#5E5073' }}>
                          <span>⏳ คิวจอง ({book.queues.length}/3 คิว)</span>
                          {activeQueue1 && (
                            <span style={{ color: '#983226' }}>
                              คิว 1 เหลือเวลา: {formatTimeRemaining(activeQueue1.expiresAt)}
                            </span>
                          )}
                        </div>

                        {book.queues.length === 0 ? (
                          <p style={{ margin: '6px 0 0 0', fontSize: '15px', color: '#78716C' }}>
                            ว่างพร้อมจำหน่าย สามารถกดจองคิวที่ 1 หรือโอนเข้าบัญชีกลางได้ทันที
                          </p>
                        ) : (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {book.queues.map(q => (
                              <div key={q.queueNumber} style={styles.queueItemRow}>
                                <span>คิวที่ {q.queueNumber}: <strong>@{q.buyerUsername}</strong> ({q.reservedAt})</span>
                                {q.queueNumber === 1 && <span style={styles.q1Badge}>สิทธิ์โอนเงิน 5 ชม.</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ราคาและปุ่มกดขนาดใหญ่ */}
                      <div style={styles.priceFooter}>
                        <div>
                          <span style={{ ...styles.priceText, color: theme.text }}>฿{book.price}</span>
                          <span style={styles.origPriceText}>ราคาปก ฿{book.originalPrice}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '14px' }}>
                        {book.status !== 'ขายแล้ว' && !book.status.includes('Escrow') && (
                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={() => handleReserveQueue(book)}
                              disabled={book.queues.length >= 3}
                              className="smooth-btn"
                              style={{
                                ...styles.actionBtnSecondary,
                                opacity: book.queues.length >= 3 ? 0.5 : 1
                              }}
                            >
                              🕒 จองคิว ({book.queues.length}/3)
                            </button>

                            <button
                              onClick={() => handlePayToEscrow(book)}
                              className="smooth-btn"
                              style={{
                                ...styles.actionBtnPrimary,
                                backgroundColor: theme.bg,
                                color: theme.text
                              }}
                            >
                              🛡️ ซื้อผ่านบัญชีกลาง
                            </button>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                          {activeQueue1 && (
                            <button
                              onClick={() => handleExpireFirstQueue(book)}
                              style={styles.simulateExpireBtn}
                            >
                              ⚡ จำลองคิว 1 ครบ 5 ชม. (เลื่อนคิวถัดไป)
                            </button>
                          )}
                          {isOwner && (
                            <button onClick={() => handleDeleteBook(book)} style={styles.deleteBtn}>
                              ลบโพสต์
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div style={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className="smooth-btn"
                  style={{
                    ...styles.pageBtn,
                    backgroundColor: currentPage === page ? '#5E5073' : '#FFFFFF',
                    color: currentPage === page ? '#FFFFFF' : '#57534E'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>
          </main>
        </div>
      )}

      {/* ==================== หน้าบัญชีกลาง (Escrow Service) ==================== */}
      {activeTab === 'escrow' && (
        <div style={styles.pageContainer} className="animate-fade">
          <div style={styles.sectionSurface}>
            <h2 style={styles.pageHeading}>🛡️ ระบบบัญชีกลาง (Escrow Service) คุ้มครองผู้ซื้อ-ผู้ขาย</h2>
            <p style={styles.pageSubHeading}>
              เงินค่าหนังสือจะถูกพักไว้ในระบบกลางจนกว่าผู้ขายจะแจ้งเลขพัสดุ และผู้ซื้อกดรับสินค้าว่าตรงตามรายละเอียดที่แจ้งไว้
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '24px' }}>
              {transactions.map((tx, idx) => {
                const theme = PALETTE_THEMES[idx % PALETTE_THEMES.length];
                return (
                  <div key={tx.id} style={{ ...styles.escrowCard, borderLeft: `8px solid ${theme.bg}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ ...styles.txBadge, backgroundColor: theme.softBg, color: theme.text }}>
                          รายการ #{tx.id} • วันที่ {tx.date}
                        </span>
                        <h3 style={{ margin: '10px 0 6px 0', fontSize: '22px', color: '#292524' }}>{tx.bookTitle}</h3>
                        <p style={{ margin: 0, fontSize: '16px', color: '#57534E' }}>
                          ผู้ซื้อ: <strong>@{tx.buyerUsername}</strong> • ผู้ขาย: <strong>@{tx.sellerUsername} ({tx.sellerId})</strong>
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ ...styles.statusPillLarge, backgroundColor: theme.bg, color: theme.text }}>
                          {tx.escrowStatus}
                        </div>
                        <div style={{ fontSize: '16px', marginTop: '10px', color: '#44403C' }}>
                          ราคาหนังสือ: <strong>฿{tx.price}</strong> | ค่าธรรมเนียม 5%: <span style={{ color: '#983226' }}>-฿{tx.fee}</span> | ผู้ขายรับสุทธิ: <strong style={{ color: '#5E5073', fontSize: '18px' }}>฿{tx.netIncome}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={styles.escrowActionRow}>
                      <div style={{ fontSize: '16px', color: '#292524' }}>
                        📦 เลขพัสดุ (Tracking): <strong>{tx.trackingNumber || 'รอผู้ขายแจ้งหมายเลขพัสดุ'}</strong>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {tx.escrowStatus === 'พักเงินในบัญชีกลาง (รอจัดส่ง)' && (
                          <button onClick={() => handleAddTracking(tx.id)} className="smooth-btn" style={styles.btnChenin}>
                            🚚 แจ้งเลขพัสดุจัดส่ง
                          </button>
                        )}

                        {(tx.escrowStatus === 'ผู้ขายแจ้งเลขพัสดุแล้ว (รอผู้ซื้อตรวจรับ)' || tx.escrowStatus === 'พักเงินในบัญชีกลาง (รอจัดส่ง)') && (
                          <>
                            <button onClick={() => handleConfirmReceived(tx)} className="smooth-btn" style={styles.btnCelery}>
                              ✓ ยืนยันรับสินค้าตรงปก (โอนเงินให้ผู้ขาย)
                            </button>
                            <button onClick={() => handleDisputeEscrow(tx.id)} className="smooth-btn" style={styles.btnVanilla}>
                              🚨 แจ้งปัญหา / อายัดเงิน
                            </button>
                          </>
                        )}

                        {tx.escrowStatus === 'โอนเงินให้ผู้ขายสำเร็จ' && !tx.reviewed && (
                          <button
                            onClick={() => { setSelectedTxForReview(tx); setIsReviewModalOpen(true); }}
                            className="smooth-btn"
                            style={styles.btnChenin}
                          >
                            ⭐ ให้คะแนนและรีวิวผู้ขาย
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================== หน้ารีวิวและความน่าเชื่อถือผู้ขาย ==================== */}
      {activeTab === 'reviews' && (
        <div style={styles.pageContainer} className="animate-fade">
          <div style={styles.sectionSurface}>
            <h2 style={styles.pageHeading}>⭐ คะแนนรีวิวและประวัติความน่าเชื่อถือของผู้ขาย</h2>
            <p style={styles.pageSubHeading}>
              คะแนนคำนวณจากผู้ซื้อจริงที่ทำการซื้อขายผ่านบัญชีกลาง (Escrow) สำเร็จแล้วเท่านั้น
            </p>

            <div style={styles.paletteBannerGrid}>
              {users.filter(u => u.role !== 'buyer').map((u, idx) => {
                const theme = PALETTE_THEMES[idx % PALETTE_THEMES.length];
                return (
                  <div key={u.username} style={{ ...styles.paletteFeatureCard, backgroundColor: theme.bg, color: theme.text }}>
                    <div style={{ fontSize: '22px', fontWeight: 800 }}>@{u.username}</div>
                    <div style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0 10px 0' }}>
                      & รหัส {u.sellerId} {u.kycVerified ? '(KYC ✓)' : ''} —
                    </div>
                    <div style={{ fontSize: '16px', marginBottom: '8px' }}>{u.fullName}</div>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>
                      ★ {u.ratingAvg} / 5.0 ({u.reviewCount} รีวิว)
                    </div>
                  </div>
                );
              })}
            </div>

            <h3 style={{ fontSize: '22px', marginTop: '36px', marginBottom: '16px', color: '#292524' }}>
              ความคิดเห็นจากผู้ซื้อจริง
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {reviews.map(r => (
                <div key={r.id} style={styles.reviewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <strong style={{ fontSize: '18px', color: '#292524' }}>
                      📚 {r.bookTitle} — ผู้ขาย @{r.sellerUsername} ({r.sellerId})
                    </strong>
                    <span style={{ fontSize: '18px', color: '#983226', fontWeight: 800 }}>
                      {'★'.repeat(r.rating)} ({r.rating}/5)
                    </span>
                  </div>
                  <p style={{ margin: '10px 0', fontSize: '17px', color: '#44403C', lineHeight: 1.6 }}>
                    "{r.comment}"
                  </p>
                  <span style={{ fontSize: '14px', color: '#78716C' }}>
                    รีวิวโดย @{r.reviewer} • วันที่ {r.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== หน้าแดชบอร์ดหลังบ้าน (4 การ์ดสีตามภาพต้นฉบับ) ==================== */}
      {activeTab === 'dashboard' && (
        <div style={styles.pageContainer} className="animate-fade">
          <div style={styles.sectionSurface}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '24px' }}>
              <div>
                <h2 style={styles.pageHeading}>📊 แดชบอร์ดสรุปยอดขายและฐานข้อมูลระบบ</h2>
                <p style={styles.pageSubHeading}>สรุปรายรับ-รายจ่าย การหักค่าธรรมเนียมแพลตฟอร์ม 5% และข้อมูลยืนยันตัวตน (KYC)</p>
              </div>
              <button
                onClick={() => {
                  if (confirm('ต้องการรีเซ็ตข้อมูลกลับเป็นค่าเริ่มต้นทั้งหมดหรือไม่?')) {
                    localStorage.clear();
                    window.location.reload();
                  }
                }}
                style={styles.resetBtn}
              >
                รีเซ็ตข้อมูลเริ่มต้น
              </button>
            </div>

            {/* 4 การ์ดสรุปยอดด้วยพาเลตต์ 4 สีตามภาพ */}
            <div style={styles.paletteBannerGrid}>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#B7C95C', color: '#983226' }}>
                <div style={styles.paletteCardTitle}>฿{totalSales}</div>
                <div style={styles.paletteCardSub}>& ยอดขายสำเร็จรวม —</div>
                <p style={styles.paletteCardBody}>ยอดรวมรายการที่ผู้ซื้อตรวจรับหนังสือเรียบร้อยแล้ว</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#F2DADF', color: '#761E27' }}>
                <div style={styles.paletteCardTitle}>฿{totalEscrowHold}</div>
                <div style={styles.paletteCardSub}>& พักในบัญชีกลาง —</div>
                <p style={styles.paletteCardBody}>ยอดเงินที่กำลังพักไว้ในระบบ Escrow รอผู้ซื้อยืนยันรับของ</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#E0CE70', color: '#5E5073' }}>
                <div style={styles.paletteCardTitle}>-฿{totalFees}</div>
                <div style={styles.paletteCardSub}>& ค่าธรรมเนียม 5% —</div>
                <p style={styles.paletteCardBody}>ค่าดูแลระบบบัญชีกลางและการตรวจสอบความปลอดภัย</p>
              </div>
              <div style={{ ...styles.paletteFeatureCard, backgroundColor: '#DBECEA', color: '#8A6559' }}>
                <div style={styles.paletteCardTitle}>฿{totalNet}</div>
                <div style={styles.paletteCardSub}>& รายรับสุทธิผู้ขาย —</div>
                <p style={styles.paletteCardBody}>ยอดเงินสุทธิที่โอนเข้าบัญชีธนาคารของผู้ขายสำเร็จ</p>
              </div>
            </div>

            <h3 style={{ fontSize: '22px', marginTop: '36px', marginBottom: '16px', color: '#292524' }}>
              🗂️ ตารางฐานข้อมูลสมาชิกและการยืนยันตัวตน (Users & KYC Database)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr style={{ backgroundColor: '#EAE4DC' }}>
                    <th style={styles.th}>รหัสประจำตัว</th>
                    <th style={styles.th}>ชื่อผู้ใช้</th>
                    <th style={styles.th}>ชื่อ-นามสกุลจริง</th>
                    <th style={styles.th}>บทบาท</th>
                    <th style={styles.th}>เบอร์โทรศัพท์</th>
                    <th style={styles.th}>บัญชีธนาคาร</th>
                    <th style={styles.th}>สถานะ KYC</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.username} style={{ borderBottom: '1px solid #E5DEC9' }}>
                      <td style={styles.td}><strong>{u.sellerId}</strong></td>
                      <td style={styles.td}>@{u.username}</td>
                      <td style={styles.td}>{u.fullName}</td>
                      <td style={styles.td}>{u.role}</td>
                      <td style={styles.td}>{u.phone}</td>
                      <td style={styles.td}>{u.bankAccount}</td>
                      <td style={styles.td}>{u.kycVerified ? '✓ ยืนยันตัวตนแล้ว' : 'รอตรวจสอบ'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL 1: ลงขายหนังสือ ==================== */}
      {isSellModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade">
            <h3 style={styles.modalHeading}>
              📦 ลงขายหนังสือมือสอง (@{currentUser.username} • {currentUser.sellerId})
            </h3>
            <form onSubmit={handleAddBook} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                type="text"
                placeholder="ชื่อหนังสือ *"
                required
                value={newBook.title}
                onChange={e => setNewBook({ ...newBook, title: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                placeholder="ชื่อผู้แต่ง / สำนักพิมพ์"
                value={newBook.author}
                onChange={e => setNewBook({ ...newBook, author: e.target.value })}
                style={styles.input}
              />

              <div>
                <label style={styles.label}>เลือกหมวดหมู่หนังสือ *</label>
                <select
                  value={newBook.category}
                  onChange={e => setNewBook({ ...newBook, category: e.target.value })}
                  style={styles.input}
                >
                  {CATEGORIES.filter(c => c !== 'ทั้งหมด').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>สภาพหนังสือ *</label>
                <select
                  value={newBook.condition}
                  onChange={e => setNewBook({ ...newBook, condition: e.target.value })}
                  style={styles.input}
                >
                  {CONDITIONS.map(cond => (
                    <option key={cond} value={cond}>{cond}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <input
                  type="number"
                  placeholder="ราคาขาย (บาท) *"
                  required
                  value={newBook.price}
                  onChange={e => setNewBook({ ...newBook, price: e.target.value })}
                  style={styles.input}
                />
                <input
                  type="number"
                  placeholder="ราคาปกเต็ม (บาท)"
                  value={newBook.originalPrice}
                  onChange={e => setNewBook({ ...newBook, originalPrice: e.target.value })}
                  style={styles.input}
                />
              </div>

              <textarea
                rows={3}
                required
                placeholder="ระบุรายละเอียดตำหนิหนังสือตามจริง * (เช่น รอยพับ, จุดเหลือง, รอยขีดเขียน หรือสภาพใหม่กริบไม่มีตำหนิ)"
                value={newBook.defectDetails}
                onChange={e => setNewBook({ ...newBook, defectDetails: e.target.value })}
                style={styles.textarea}
              />

              <input
                type="text"
                placeholder="ช่องทางติดต่อ (Line ID / เบอร์โทร)"
                value={newBook.sellerContact}
                onChange={e => setNewBook({ ...newBook, sellerContact: e.target.value })}
                style={styles.input}
              />
              <input
                type="url"
                placeholder="ลิงก์รูปภาพหนังสือจริง (เว้นว่างเพื่อใช้ภาพตัวอย่างได้)"
                value={newBook.imageUrl}
                onChange={e => setNewBook({ ...newBook, imageUrl: e.target.value })}
                style={styles.input}
              />

              <label style={{ fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', color: '#44403C' }}>
                <input
                  type="checkbox"
                  checked={newBook.realPhotoVerified}
                  onChange={e => setNewBook({ ...newBook, realPhotoVerified: e.target.checked })}
                />
                ยืนยันว่าเป็นภาพถ่ายหนังสือจริงคู่กับป้ายชื่อรหัสผู้ขาย ({currentUser.sellerId})
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="smooth-btn" style={{ ...styles.btnCelery, flex: 1 }}>
                  ยืนยันลงขายหนังสือ
                </button>
                <button type="button" onClick={() => setIsSellModalOpen(false)} style={styles.cancelBtn}>
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 2: ลงทะเบียน & KYC ==================== */}
      {isRegisterModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade">
            <h3 style={styles.modalHeading}>📝 ลงทะเบียนสมาชิก & ยืนยันตัวตน (KYC)</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '15px', color: '#57534E' }}>
              สร้างรหัสประจำตัวผู้ขาย/ผู้ซื้ออัตโนมัติ พร้อมบันทึกข้อมูลยืนยันตัวตนเพื่อความโปร่งใส
            </p>
            <form onSubmit={handleRegisterUser} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                required
                placeholder="ชื่อผู้ใช้ (Username) *"
                value={regForm.username}
                onChange={e => setRegForm({ ...regForm, username: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                required
                placeholder="ชื่อ-นามสกุลจริง (ตรงกับบัญชีธนาคาร) *"
                value={regForm.fullName}
                onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                style={styles.input}
              />
              <select
                value={regForm.role}
                onChange={e => setRegForm({ ...regForm, role: e.target.value as 'buyer' | 'seller' })}
                style={styles.input}
              >
                <option value="seller">ผู้ขายหนังสือ (รับรหัส B2H-SL-XXX)</option>
                <option value="buyer">ผู้ซื้อหนังสือ (รับรหัส B2H-BY-XXX)</option>
              </select>
              <input
                type="tel"
                required
                placeholder="เบอร์โทรศัพท์ติดต่อ *"
                value={regForm.phone}
                onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                required
                placeholder="ธนาคารและเลขบัญชีสำหรับรับเงินจากบัญชีกลาง *"
                value={regForm.bankAccount}
                onChange={e => setRegForm({ ...regForm, bankAccount: e.target.value })}
                style={styles.input}
              />
              <input
                type="text"
                required
                placeholder="เลขท้ายบัตรประชาชน 4 หลัก เพื่อยืนยันตัวตน (KYC) *"
                value={regForm.nationalId}
                onChange={e => setRegForm({ ...regForm, nationalId: e.target.value })}
                style={styles.input}
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="submit" className="smooth-btn" style={{ ...styles.btnChenin, flex: 1 }}>
                  ลงทะเบียนและรับรหัสประจำตัว
                </button>
                <button type="button" onClick={() => setIsRegisterModalOpen(false)} style={styles.cancelBtn}>
                  ปิด
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 3: รีวิวผู้ขาย ==================== */}
      {isReviewModalOpen && selectedTxForReview && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade">
            <h3 style={styles.modalHeading}>⭐ ให้คะแนนและรีวิวผู้ขาย</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#44403C' }}>
              หนังสือ: <strong>{selectedTxForReview.bookTitle}</strong> (ผู้ขาย: @{selectedTxForReview.sellerUsername})
            </p>
            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <select
                value={reviewForm.rating}
                onChange={e => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                style={styles.input}
              >
                <option value={5}>★★★★★ (5 ดาว - ประทับใจมาก สภาพตรงปก)</option>
                <option value={4}>★★★★ (4 ดาว - ดีมาก)</option>
                <option value={3}>★★★ (3 ดาว - ปานกลาง)</option>
                <option value={2}>★★ (2 ดาว - พอใช้)</option>
                <option value={1}>★ (1 ดาว - ต้องปรับปรุง)</option>
              </select>
              <textarea
                rows={3}
                placeholder="เขียนรีวิวสภาพหนังสือ การแพ็กสินค้า และการจัดส่ง..."
                value={reviewForm.comment}
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                style={styles.textarea}
              />
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="smooth-btn" style={{ ...styles.btnCelery, flex: 1 }}>
                  บันทึกรีวิว
                </button>
                <button type="button" onClick={() => setIsReviewModalOpen(false)} style={styles.cancelBtn}>
                  ไว้คราวหลัง
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL 4: สุ่มหนังสือ ==================== */}
      {isRandomOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalCard, textAlign: 'center', backgroundColor: '#F2DADF', color: '#761E27' }} className="animate-fade">
            <h3 style={{ margin: '0 0 16px 0', fontSize: '28px', fontWeight: 800 }}>🎲 สุ่มหนังสือเสี่ยงทาย</h3>
            {isSpinning ? (
              <div style={{ padding: '36px 0', fontSize: '20px', fontWeight: 600 }}>
                กำลังค้นหาหนังสือสภาพดีให้คุณ...
              </div>
            ) : randomResult && (
              <div>
                <img src={randomResult.imageUrl} alt={randomResult.title} style={{ width: '180px', height: '230px', objectFit: 'cover', borderRadius: '14px' }} />
                <h4 style={{ margin: '16px 0 6px 0', fontSize: '22px' }}>{randomResult.title}</h4>
                <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}>หมวด: {randomResult.category}</p>
                <p style={{ margin: '0 0 20px 0', fontSize: '26px', fontWeight: 800 }}>฿{randomResult.price}</p>
                <button onClick={() => setIsRandomOpen(false)} className="smooth-btn" style={{ ...styles.btnCelery, width: '100%' }}>
                  ถูกใจเล่มนี้เลย!
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL 5: ปรึกษา AI ==================== */}
      {isAiModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard} className="animate-fade">
            <h3 style={styles.modalHeading}>✨ ผู้ช่วย AI แนะนำหนังสือ</h3>
            <textarea
              rows={3}
              placeholder="บอกแนวหนังสือที่อยากอ่าน หรือบอกงบประมาณได้เลย..."
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              style={styles.textarea}
            />
            <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
              <button onClick={handleAskAI} disabled={isAiLoading} className="smooth-btn" style={{ ...styles.btnChenin, flex: 1 }}>
                {isAiLoading ? 'กำลังวิเคราะห์...' : 'ถาม AI เลย'}
              </button>
              <button onClick={() => setIsAiModalOpen(false)} style={styles.cancelBtn}>ปิด</button>
            </div>
            {aiResponse && <div style={styles.aiResultBox}>{aiResponse}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== สไตล์โทนสมูทตามภาพต้นฉบับ + ตัวหนังสือใหญ่ชัดเจน ====================

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F4F0EA', // สีครีมเบจละมุนตามขอบภาพต้นฉบับ
    color: '#292524',
    paddingBottom: '90px'
  },
  alertBanner: {
    backgroundColor: '#E0CE70',
    color: '#5E5073',
    padding: '14px 28px',
    fontSize: '16px',
    fontWeight: 700,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  alertCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#5E5073',
    fontSize: '20px',
    cursor: 'pointer',
    fontWeight: 800
  },
  header: {
    backgroundColor: '#FAF8F5',
    borderBottom: '1px solid #E5DEC9',
    padding: '18px 28px',
    position: 'sticky',
    top: 0,
    zIndex: 40
  },
  headerContent: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px'
  },
  logoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    cursor: 'pointer'
  },
  logoMark: {
    backgroundColor: '#B7C95C',
    color: '#983226',
    fontWeight: 800,
    fontSize: '20px',
    padding: '10px 14px',
    borderRadius: '14px'
  },
  logoText: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#761E27',
    display: 'block',
    lineHeight: 1.1
  },
  logoSub: {
    fontSize: '14px',
    color: '#78716C',
    fontWeight: 500
  },
  navTabs: {
    display: 'flex',
    gap: '8px',
    backgroundColor: '#EAE4DC',
    padding: '6px',
    borderRadius: '16px',
    flexWrap: 'wrap'
  },
  tabBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#57534E',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  tabBtnActive: {
    backgroundColor: '#FAF8F5',
    color: '#761E27',
    fontWeight: 700,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  userBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#DBECEA',
    padding: '8px 14px',
    borderRadius: '14px'
  },
  sellerIdChip: {
    backgroundColor: '#FFFFFF',
    color: '#8A6559',
    fontSize: '14px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '8px'
  },
  userSelect: {
    border: 'none',
    background: 'transparent',
    fontSize: '15px',
    fontWeight: 700,
    color: '#5E5073',
    outline: 'none',
    cursor: 'pointer'
  },
  kycBadge: {
    backgroundColor: '#B7C95C',
    color: '#983226',
    fontSize: '13px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '8px'
  },
  regBtn: {
    backgroundColor: '#F2DADF',
    color: '#761E27',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '14px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  heroSection: {
    maxWidth: '1280px',
    margin: '32px auto 24px auto',
    padding: '0 28px'
  },
  heroTopRow: {
    backgroundColor: '#FAF8F5',
    borderRadius: '24px',
    padding: '36px 40px',
    border: '1px solid #E5DEC9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '24px',
    marginBottom: '24px'
  },
  heroEyebrow: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#983226',
    letterSpacing: '0.5px'
  },
  heroTitle: {
    fontSize: '38px',
    fontWeight: 800,
    margin: '8px 0 10px 0',
    color: '#292524',
    lineHeight: 1.25
  },
  heroDesc: {
    fontSize: '18px',
    color: '#57534E',
    margin: 0,
    lineHeight: 1.6
  },
  heroActionGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap'
  },
  btnCelery: {
    backgroundColor: '#B7C95C',
    color: '#983226',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnVanilla: {
    backgroundColor: '#F2DADF',
    color: '#761E27',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnChenin: {
    backgroundColor: '#E0CE70',
    color: '#5E5073',
    border: 'none',
    padding: '14px 24px',
    borderRadius: '16px',
    fontSize: '17px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  paletteBannerGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  paletteFeatureCard: {
    padding: '28px 26px',
    borderRadius: '18px',
    minHeight: '190px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  paletteCardTitle: {
    fontSize: '30px',
    fontWeight: 800,
    lineHeight: 1.2,
    marginBottom: '8px'
  },
  paletteCardSub: {
    fontSize: '18px',
    fontWeight: 700,
    marginBottom: '12px'
  },
  paletteCardBody: {
    fontSize: '15px',
    margin: 0,
    lineHeight: 1.55,
    opacity: 0.92
  },
  keywordBar: {
    backgroundColor: '#FAF8F5',
    border: '1px solid #E5DEC9',
    padding: '16px 24px',
    borderRadius: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  keywordChip: {
    backgroundColor: '#E0CE70',
    color: '#5E5073',
    padding: '6px 14px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px'
  },
  removeChipBtn: {
    border: 'none',
    background: 'none',
    color: '#761E27',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 800
  },
  keywordInput: {
    padding: '10px 16px',
    borderRadius: '12px',
    border: '1px solid #D6D3D1',
    fontSize: '15px',
    outline: 'none',
    backgroundColor: '#FFFFFF'
  },
  keywordAddBtn: {
    backgroundColor: '#5E5073',
    color: '#FFFFFF',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  filterSection: {
    maxWidth: '1280px',
    margin: '0 auto 28px auto',
    padding: '0 28px'
  },
  searchWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#FAF8F5',
    padding: '16px 24px',
    borderRadius: '20px',
    border: '1px solid #E5DEC9'
  },
  searchInput: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '18px',
    backgroundColor: 'transparent',
    color: '#292524'
  },
  clearBtn: {
    backgroundColor: '#EAE4DC',
    border: 'none',
    padding: '8px 14px',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  categoryScroll: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    marginTop: '16px',
    paddingBottom: '10px'
  },
  categoryPill: {
    padding: '10px 20px',
    borderRadius: '14px',
    fontSize: '16px',
    border: '1px solid',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  mainGridWrapper: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 28px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))',
    gap: '28px'
  },
  bookCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: '24px',
    border: '1px solid #E5DEC9',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  cardColorHeader: {
    padding: '24px 26px 20px 26px'
  },
  bookTitle: {
    fontSize: '23px',
    fontWeight: 800,
    margin: '12px 0 6px 0',
    lineHeight: 1.35
  },
  bookAuthor: {
    fontSize: '16px',
    fontWeight: 700
  },
  imgBox: {
    height: '230px',
    position: 'relative',
    backgroundColor: '#EAE4DC'
  },
  bookImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  verifiedPhotoBadge: {
    position: 'absolute',
    bottom: '12px',
    right: '12px',
    backgroundColor: 'rgba(250, 248, 245, 0.95)',
    color: '#761E27',
    padding: '6px 14px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700
  },
  cardContent: {
    padding: '24px 26px',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    gap: '14px'
  },
  infoBlock: {
    padding: '16px 18px',
    borderRadius: '16px'
  },
  sellerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #E5DEC9'
  },
  sellerIdTag: {
    backgroundColor: '#EAE4DC',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '13px'
  },
  ratingBadge: {
    backgroundColor: '#E0CE70',
    color: '#5E5073',
    padding: '6px 12px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  queueSection: {
    backgroundColor: '#F4F0EA',
    padding: '14px 16px',
    borderRadius: '16px'
  },
  queueItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '15px',
    color: '#44403C'
  },
  q1Badge: {
    backgroundColor: '#B7C95C',
    color: '#983226',
    padding: '2px 8px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700
  },
  priceFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 'auto',
    paddingTop: '8px'
  },
  priceText: {
    fontSize: '30px',
    fontWeight: 800
  },
  origPriceText: {
    fontSize: '16px',
    color: '#78716C',
    textDecoration: 'line-through',
    marginLeft: '10px'
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: '#EAE4DC',
    color: '#44403C',
    border: 'none',
    padding: '14px',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer'
  },
  actionBtnPrimary: {
    flex: 1,
    border: 'none',
    padding: '14px',
    borderRadius: '14px',
    fontWeight: 800,
    fontSize: '16px',
    cursor: 'pointer'
  },
  simulateExpireBtn: {
    flex: 1,
    backgroundColor: '#F2DADF',
    color: '#761E27',
    border: 'none',
    padding: '10px 14px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  deleteBtn: {
    backgroundColor: '#EAE4DC',
    color: '#983226',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '44px'
  },
  pageBtn: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    border: '1px solid #E5DEC9',
    fontSize: '18px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  pageContainer: {
    maxWidth: '1280px',
    margin: '32px auto',
    padding: '0 28px'
  },
  sectionSurface: {
    backgroundColor: '#FAF8F5',
    borderRadius: '24px',
    padding: '36px',
    border: '1px solid #E5DEC9'
  },
  pageHeading: {
    margin: '0 0 8px 0',
    fontSize: '30px',
    fontWeight: 800,
    color: '#292524'
  },
  pageSubHeading: {
    margin: 0,
    fontSize: '17px',
    color: '#57534E'
  },
  escrowCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5DEC9',
    borderRadius: '18px',
    padding: '24px'
  },
  txBadge: {
    fontSize: '14px',
    fontWeight: 700,
    padding: '4px 12px',
    borderRadius: '8px'
  },
  statusPillLarge: {
    display: 'inline-block',
    padding: '6px 16px',
    borderRadius: '99px',
    fontSize: '15px',
    fontWeight: 800
  },
  escrowActionRow: {
    marginTop: '18px',
    paddingTop: '16px',
    borderTop: '1px solid #EAE4DC',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px'
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5DEC9',
    padding: '22px',
    borderRadius: '18px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '16px'
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    color: '#5E5073',
    fontWeight: 800
  },
  td: {
    padding: '16px',
    color: '#292524'
  },
  resetBtn: {
    backgroundColor: '#F2DADF',
    color: '#761E27',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(41, 37, 36, 0.45)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    padding: '20px'
  },
  modalCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: '24px',
    padding: '32px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    border: '1px solid #E5DEC9',
    boxShadow: '0 24px 48px rgba(0,0,0,0.18)'
  },
  modalHeading: {
    margin: '0 0 16px 0',
    fontSize: '24px',
    fontWeight: 800,
    color: '#292524'
  },
  label: {
    display: 'block',
    fontSize: '15px',
    fontWeight: 700,
    color: '#5E5073',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid #D6D3D1',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#FFFFFF'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '1px solid #D6D3D1',
    fontSize: '16px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    resize: 'vertical'
  },
  cancelBtn: {
    backgroundColor: '#EAE4DC',
    color: '#57534E',
    border: 'none',
    padding: '12px 22px',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '16px',
    cursor: 'pointer'
  },
  aiResultBox: {
    marginTop: '16px',
    backgroundColor: '#DBECEA',
    color: '#6E4F45',
    padding: '16px',
    borderRadius: '14px',
    fontSize: '16px',
    lineHeight: 1.6
  }
};