-- FEED: public read
alter table public.feed_items disable row level security;
-- or if you must keep RLS enabled:
-- alter table public.feed_items enable row level security;
-- create policy "feed public read" on public.feed_items for select using (true);

-- PROFILES
create policy "profiles self read"
  on public.profiles for select using (auth.uid() = id);
create policy "profiles self upsert"
  on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update"
  on public.profiles for update using (auth.uid() = id);

-- NOTES
create policy "notes read own"
  on public.notes for select using (auth.uid() = user_id);
create policy "notes write own"
  on public.notes for insert with check (auth.uid() = user_id);
create policy "notes update own"
  on public.notes for update using (auth.uid() = user_id);
create policy "notes delete own"
  on public.notes for delete using (auth.uid() = user_id);

-- TASKS
create policy "tasks read own"
  on public.tasks for select using (auth.uid() = user_id);
create policy "tasks write own"
  on public.tasks for insert with check (auth.uid() = user_id);
create policy "tasks update own"
  on public.tasks for update using (auth.uid() = user_id);
create policy "tasks delete own"
  on public.tasks for delete using (auth.uid() = user_id);

-- FAVORITES
create policy "favorites read own"
  on public.favorites for select using (auth.uid() = user_id);
create policy "favorites write own"
  on public.favorites for insert with check (auth.uid() = user_id);
create policy "favorites delete own"
  on public.favorites for delete using (auth.uid() = user_id);

-- METRICS
create policy "metrics read own"
  on public.metrics for select using (auth.uid() = user_id);
create policy "metrics upsert own"
  on public.metrics for insert with check (auth.uid() = user_id);
create policy "metrics update own"
  on public.metrics for update using (auth.uid() = user_id);
