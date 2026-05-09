-- Run this in your Supabase SQL editor (one-time migration)
-- Prevents duplicate meal_plan rows for the same week

ALTER TABLE meal_plans
  ADD CONSTRAINT meal_plans_week_start_unique UNIQUE (week_start);
