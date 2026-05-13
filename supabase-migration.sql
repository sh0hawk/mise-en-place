-- Run this in your Supabase SQL editor (one-time migration)
-- Prevents duplicate meal_plan rows for the same week

ALTER TABLE meal_plans
  ADD CONSTRAINT meal_plans_week_start_unique UNIQUE (week_start);

-- ─── Storage: recipe-photos bucket ───────────────────────────────────────────
-- Run once in the Supabase SQL editor or Storage UI.
-- Creates a public bucket for recipe photos and allows all users to read/write.

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone (anon + authenticated) to upload
CREATE POLICY "allow upload recipe-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'recipe-photos');

-- Allow public read
CREATE POLICY "allow read recipe-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-photos');
