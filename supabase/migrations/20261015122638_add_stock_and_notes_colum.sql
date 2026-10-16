/*
# Add stock_status and additional_notes columns to books table

1. Modified Tables
- `books`
  - `stock_status` (text, default 'available') — 'available', 'reserved', 'sold'
  - `additional_notes` (text, default '') — extra notes shown on detail page

2. Security
- No security changes. Existing RLS policies already cover new columns.
*/

ALTER TABLE books ADD COLUMN IF NOT EXISTS stock_status text NOT NULL DEFAULT 'available';
ALTER TABLE books ADD COLUMN IF NOT EXISTS additional_notes text NOT NULL DEFAULT '';
