/*
# Add authentication, ownership, reservations, and financial tracking

1. Modified Tables
- `books`
  - `user_id` (uuid, nullable for legacy listings) — owner from the signed-in session for new listings
  - Existing public book details remain readable so visitors can browse before signing in.
  - New listings receive `auth.uid()` automatically and can only be changed by their owner or an admin.

2. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users)
  - `display_name` (text)
  - `role` (text, default 'member') — member or admin; users cannot change their own role
- `reservations`
  - `id` (uuid, primary key)
  - `book_id` (uuid) — reserved book
  - `buyer_id` (uuid) — signed-in buyer
  - `seller_id` (uuid) — book owner
  - `status` (text) — active, cancelled, completed
  - `created_at`, `updated_at` (timestamps)
- `transactions`
  - `id` (uuid, primary key)
  - `user_id` (uuid) — account owning the financial record
  - `book_id` (uuid, nullable) — related book when applicable
  - `type` (text) — sale or expense
  - `amount` (numeric) — gross amount
  - `platform_fee` (numeric) — fee deducted from a sale
  - `description` (text)
  - `occurred_at` (timestamptz)

3. Security
- Enable RLS on every new table.
- Public visitors can read book listings, but only authenticated users can create listings.
- Book updates/deletes are limited to the listing owner or an admin.
- Reservation reads are limited to the buyer, seller, or an admin.
- Reservation creation and stock changes happen atomically through `reserve_book`.
- Financial records are limited to their owner or an admin.
- Role values are protected from client updates.

4. Important Notes
- Existing legacy books without an owner remain browsable but are not editable or deletable through the client.
- Admin accounts are created by setting `profiles.role = 'admin'` through trusted database administration.
*/

ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE books ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('sale', 'expense')),
  amount numeric(10,2) NOT NULL CHECK (amount >= 0),
  platform_fee numeric(10,2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
  description text NOT NULL DEFAULT '',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_user_id ON books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_stock_status ON books(stock_status);
CREATE INDEX IF NOT EXISTS idx_reservations_book_id ON reservations(book_id);
CREATE INDEX IF NOT EXISTS idx_reservations_buyer_id ON reservations(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_occurred_at ON transactions(occurred_at DESC);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR EXISTS (SELECT 1 FROM profiles admin_profile WHERE admin_profile.id = auth.uid() AND admin_profile.role = 'admin'));

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT TO authenticated
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own_display_name" ON profiles;
CREATE POLICY "profiles_update_own_display_name" ON profiles FOR UPDATE TO authenticated
USING (id = auth.uid()) WITH CHECK (id = auth.uid() AND role = (SELECT old_profile.role FROM profiles old_profile WHERE old_profile.id = auth.uid()));

DROP POLICY IF EXISTS "books_select_public" ON books;
CREATE POLICY "books_select_public" ON books FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "books_insert_authenticated" ON books;
CREATE POLICY "books_insert_authenticated" ON books FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "books_update_owner_or_admin" ON books;
CREATE POLICY "books_update_owner_or_admin" ON books FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "books_delete_owner_or_admin" ON books;
CREATE POLICY "books_delete_owner_or_admin" ON books FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "reservations_select_participants" ON reservations;
CREATE POLICY "reservations_select_participants" ON reservations FOR SELECT TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "reservations_insert_buyer" ON reservations;
CREATE POLICY "reservations_insert_buyer" ON reservations FOR INSERT TO authenticated
WITH CHECK (buyer_id = auth.uid());

DROP POLICY IF EXISTS "reservations_update_participants" ON reservations;
CREATE POLICY "reservations_update_participants" ON reservations FOR UPDATE TO authenticated
USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "reservations_delete_buyer" ON reservations;
CREATE POLICY "reservations_delete_buyer" ON reservations FOR DELETE TO authenticated
USING (buyer_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "transactions_select_own_or_admin" ON transactions;
CREATE POLICY "transactions_select_own_or_admin" ON transactions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "transactions_insert_own" ON transactions;
CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "transactions_update_own_or_admin" ON transactions;
CREATE POLICY "transactions_update_own_or_admin" ON transactions FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "transactions_delete_own_or_admin" ON transactions;
CREATE POLICY "transactions_delete_own_or_admin" ON transactions FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

CREATE OR REPLACE FUNCTION reserve_book(p_book_id uuid)
RETURNS reservations
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  selected_book books;
  created_reservation reservations;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO selected_book FROM books WHERE id = p_book_id FOR UPDATE;
  IF selected_book.id IS NULL THEN
    RAISE EXCEPTION 'Book not found';
  END IF;
  IF selected_book.stock_status <> 'available' THEN
    RAISE EXCEPTION 'Book is not available';
  END IF;
  IF selected_book.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Owner cannot reserve own book';
  END IF;

  UPDATE books SET stock_status = 'reserved' WHERE id = p_book_id;
  INSERT INTO reservations (book_id, buyer_id, seller_id)
  VALUES (p_book_id, auth.uid(), selected_book.user_id)
  RETURNING * INTO created_reservation;
  RETURN created_reservation;
END;
$$;

REVOKE EXECUTE ON FUNCTION reserve_book(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION reserve_book(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'display_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

REVOKE UPDATE (role) ON profiles FROM authenticated;
GRANT UPDATE (display_name) ON profiles TO authenticated;
