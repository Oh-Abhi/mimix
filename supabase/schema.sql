-- ============================================================
-- MIMIX — Full Database Schema
-- Paste into: Supabase Dashboard → SQL Editor → Run
-- Uses IF NOT EXISTS so it's safe to run multiple times
-- ============================================================

-- PROFILES (one per auth user)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name text not null default '',
  bio text default '',
  avatar_url text default '',
  theme text default 'paper' check (theme in ('midnight', 'blush', 'paper')),
  is_public boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- SONGS
create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  artist text not null,
  youtube_id text not null,
  clip_start numeric default 0,
  clip_end numeric default 30,
  cover_url text default '',
  emotional_tag text default '',
  card_size text default 'md',
  added_at timestamptz default now()
);

-- MUSIC COLLECTIONS
create table if not exists public.music_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text default '',
  emoji text default '🎵',
  is_public boolean default true,
  play_count integer default 0,
  added_at timestamptz default now()
);

-- SONGS IN COLLECTIONS (many-to-many)
create table if not exists public.collection_songs (
  collection_id uuid references public.music_collections(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  position integer default 0,
  primary key (collection_id, song_id)
);

-- LIKES
create table if not exists public.collection_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  collection_id uuid references public.music_collections(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, collection_id)
);

-- COMMENTS
create table if not exists public.collection_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  collection_id uuid references public.music_collections(id) on delete cascade,
  content text not null check (length(content) <= 500),
  created_at timestamptz default now()
);

-- BETA FEEDBACK
create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  type text check (type in ('bug', 'feature', 'love', 'issue')),
  message text not null,
  rating integer check (rating between 1 and 5),
  page_url text,
  created_at timestamptz default now()
);

-- AUTO updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- AUTO-CREATE PROFILE ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.music_collections enable row level security;
alter table public.collection_songs enable row level security;
alter table public.collection_likes enable row level security;
alter table public.collection_comments enable row level security;
alter table public.feedback enable row level security;

-- Drop existing policies before recreating (safe re-run)
drop policy if exists "Public profiles viewable" on public.profiles;
drop policy if exists "Own profile updatable" on public.profiles;
drop policy if exists "Own profile insertable" on public.profiles;
drop policy if exists "Users manage own songs" on public.songs;
drop policy if exists "Public songs readable" on public.songs;
drop policy if exists "Users manage own collections" on public.music_collections;
drop policy if exists "Public collections readable" on public.music_collections;
drop policy if exists "Collection songs readable" on public.collection_songs;
drop policy if exists "Collection owners manage songs" on public.collection_songs;
drop policy if exists "Likes readable" on public.collection_likes;
drop policy if exists "Auth users can like" on public.collection_likes;
drop policy if exists "Auth users can unlike" on public.collection_likes;
drop policy if exists "Comments readable" on public.collection_comments;
drop policy if exists "Auth users can comment" on public.collection_comments;
drop policy if exists "Users delete own comments" on public.collection_comments;
drop policy if exists "Anyone can submit feedback" on public.feedback;

-- Profiles
create policy "Public profiles viewable" on public.profiles
  for select using (is_public = true or auth.uid() = id);
create policy "Own profile updatable" on public.profiles
  for update using (auth.uid() = id);
create policy "Own profile insertable" on public.profiles
  for insert with check (auth.uid() = id);

-- Songs
create policy "Users manage own songs" on public.songs
  for all using (auth.uid() = user_id);
create policy "Public songs readable" on public.songs
  for select using (
    auth.uid() = user_id or
    exists (
      select 1 from public.collection_songs cs
      join public.music_collections mc on mc.id = cs.collection_id
      where cs.song_id = songs.id and mc.is_public = true
    )
  );

-- Collections
create policy "Users manage own collections" on public.music_collections
  for all using (auth.uid() = user_id);
create policy "Public collections readable" on public.music_collections
  for select using (is_public = true or auth.uid() = user_id);

-- Collection songs
create policy "Collection songs readable" on public.collection_songs
  for select using (
    exists (
      select 1 from public.music_collections mc
      where mc.id = collection_songs.collection_id
        and (mc.is_public = true or mc.user_id = auth.uid())
    )
  );
create policy "Collection owners manage songs" on public.collection_songs
  for all using (
    exists (
      select 1 from public.music_collections mc
      where mc.id = collection_songs.collection_id and mc.user_id = auth.uid()
    )
  );

-- Likes
create policy "Likes readable" on public.collection_likes for select using (true);
create policy "Auth users can like" on public.collection_likes
  for insert with check (auth.uid() = user_id);
create policy "Auth users can unlike" on public.collection_likes
  for delete using (auth.uid() = user_id);

-- Comments
create policy "Comments readable" on public.collection_comments for select using (true);
create policy "Auth users can comment" on public.collection_comments
  for insert with check (auth.uid() = user_id);
create policy "Users delete own comments" on public.collection_comments
  for delete using (auth.uid() = user_id);

-- Feedback
create policy "Anyone can submit feedback" on public.feedback
  for insert with check (true);

-- ── INDEXES ─────────────────────────────────────────────────────────────────
create index if not exists songs_user_id_idx on public.songs(user_id);
create index if not exists collections_user_id_idx on public.music_collections(user_id);
create index if not exists collections_public_idx on public.music_collections(is_public);
create index if not exists likes_collection_idx on public.collection_likes(collection_id);
create index if not exists comments_collection_idx on public.collection_comments(collection_id);
create index if not exists profiles_username_idx on public.profiles(username);
