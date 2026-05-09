-- Mise en Place — Supabase Schema
-- Run this in your Supabase SQL editor

-- Recipes
create table recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  categories text[] not null default '{}',
  ingredients jsonb not null default '[]',
  directions jsonb not null default '[]',
  prep_time text,
  cook_time text,
  servings_base integer,
  yield text,
  author_notes text,
  serving_suggestions text,
  source_label text,
  source_url text,
  photo_url text,
  nutrition jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Meal Plans
create table meal_plans (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  week_end date not null,
  status text not null default 'active', -- active | previous | archived
  created_at timestamptz default now()
);

-- Meal Slots
create table meal_slots (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id) on delete cascade,
  date date not null,
  mealtime text not null, -- breakfast | lunch | dinner | dessert | snack
  recipe_id uuid references recipes(id),
  servings_scaled integer,
  created_at timestamptz default now()
);

-- Shopping Lists
create table shopping_lists (
  id uuid primary key default gen_random_uuid(),
  meal_plan_id uuid references meal_plans(id),
  generated_at timestamptz default now(),
  last_updated timestamptz default now()
);

-- Shopping Items
create table shopping_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid references shopping_lists(id) on delete cascade,
  ingredient text not null,
  quantity text,
  unit text,
  category text not null,
  is_checked boolean default false,
  is_manual boolean default false,
  source_recipe_ids uuid[] default '{}',
  created_at timestamptz default now()
);

-- Enable Realtime
alter publication supabase_realtime add table shopping_items;
alter publication supabase_realtime add table meal_slots;

-- RLS: disable for now (single household, no auth needed initially)
-- If you add auth later:
-- alter table recipes enable row level security;
-- alter table meal_plans enable row level security;
-- alter table meal_slots enable row level security;
-- alter table shopping_lists enable row level security;
-- alter table shopping_items enable row level security;
