/*
# Create books table for used bookstore

1. New Tables
- `books` — stores secondhand book listings
  - `id` (uuid, primary key)
  - `title` (text, not null) — book title
  - `author` (text, not null) — book author
  - `category` (text) — genre/category
  - `description` (text) — book description/condition notes
  - `price` (numeric, not null) — asking price in THB
  - `condition` (text, not null) — 'new', 'like-new', 'good', 'fair', 'poor'
  - `image_url` (text) — cover image URL
  - `seller_name` (text, not null) — name of person selling
  - `contact` (text, not null) — contact info (email/phone/line)
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `books`.
- Allow anon + authenticated CRUD because the data is intentionally shared/public (no sign-in).
*/

CREATE TABLE IF NOT EXISTS books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  author text NOT NULL,
  category text DEFAULT 'ทั่วไป',
  description text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  condition text NOT NULL DEFAULT 'good',
  image_url text DEFAULT '',
  seller_name text NOT NULL DEFAULT '',
  contact text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_books" ON books;
CREATE POLICY "anon_select_books" ON books FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_books" ON books;
CREATE POLICY "anon_insert_books" ON books FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_books" ON books;
CREATE POLICY "anon_update_books" ON books FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_books" ON books;
CREATE POLICY "anon_delete_books" ON books FOR DELETE
TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);
CREATE INDEX IF NOT EXISTS idx_books_created_at ON books(created_at DESC);
