// lib/types.ts — All shared types (localStorage + Supabase social layer)

// ── Original types (kept for localStorage compatibility) ─────────────────────
export interface Song {
  id: string
  title: string
  artist: string
  emotionalTag: string
  coverUrl: string
  youtubeId: string
  audioUrl?: string
  clipStart: number
  clipEnd: number
  collections: string[]
  addedAt: string
  cardSize: 'xs' | 'sm' | 'md' | 'lg'
}

export interface Article {
  id: string; url: string; title: string; description: string
  imageUrl: string; publication: string; readingTime: number
  tags: string[]; collections: string[]; addedAt: string
}

export interface MusicCollection {
  id: string; name: string; description: string; emoji: string
  songIds: string[]; addedAt: string
}

export interface ArticleCollection {
  id: string; name: string; description: string; emoji: string
  articleIds: string[]; addedAt: string
}

export interface PlayerState {
  currentSong: Song | null; isPlaying: boolean; progress: number
  duration: number; volume: number; minimized: boolean; fullscreen: boolean
}

// ── Mimix Social types (Supabase) ────────────────────────────────────────────
export interface Profile {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url: string
  theme: 'midnight' | 'blush' | 'paper'
  is_public: boolean
  created_at: string
  updated_at: string
}

export interface DbSong {
  id: string; user_id: string; title: string; artist: string
  youtube_id: string; clip_start: number; clip_end: number
  cover_url: string; emotional_tag: string; card_size: string
  added_at: string
}

export interface DbCollection {
  id: string; user_id: string; name: string; description: string
  emoji: string; is_public: boolean; play_count: number; added_at: string
  // joined
  profiles?: Profile
  song_count?: number
  like_count?: number
  liked_by_me?: boolean
  songs?: DbSong[]
}

export interface Comment {
  id: string; user_id: string; collection_id: string
  content: string; created_at: string
  profiles?: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
}

export interface FeedbackItem {
  id: string; user_id?: string; type: 'bug' | 'feature' | 'love' | 'issue'
  message: string; rating: number; page_url: string; created_at: string
}

// Convert DbSong → Song (for the existing player)
export function dbSongToSong(s: DbSong): Song {
  return {
    id: s.id, title: s.title, artist: s.artist,
    emotionalTag: s.emotional_tag, coverUrl: s.cover_url,
    youtubeId: s.youtube_id, clipStart: s.clip_start, clipEnd: s.clip_end,
    collections: [], addedAt: s.added_at,
    cardSize: (s.card_size as Song['cardSize']) ?? 'md',
  }
}
