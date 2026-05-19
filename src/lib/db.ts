// lib/db.ts — All Supabase database queries for Mimix
import { createClient } from './supabase'
import { DbCollection, DbSong, Comment, Profile } from './types'

// ── PROFILES ─────────────────────────────────────────────────────────────────
export async function getProfile(username: string): Promise<Profile | null> {
  const sb = createClient()
  const { data } = await sb.from('profiles').select('*').eq('username', username).single()
  return data
}

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const sb = createClient()
  const { data } = await sb.from('profiles').select('*').eq('id', userId).single()
  return data
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const sb = createClient()
  const { error } = await sb.from('profiles').update(updates).eq('id', userId)
  if (error) throw error
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const sb = createClient()
  const { data } = await sb.from('profiles').select('id').eq('username', username).maybeSingle()
  return !data
}

// ── SONGS ─────────────────────────────────────────────────────────────────────
export async function getMySongs(userId: string): Promise<DbSong[]> {
  const sb = createClient()
  const { data } = await sb.from('songs').select('*').eq('user_id', userId).order('added_at', { ascending: false })
  return data ?? []
}

export async function addDbSong(song: Omit<DbSong, 'id' | 'added_at'>): Promise<DbSong> {
  const sb = createClient()
  const { data, error } = await sb.from('songs').insert(song).select().single()
  if (error) throw error
  return data
}

export async function deleteDbSong(id: string) {
  const sb = createClient()
  const { error } = await sb.from('songs').delete().eq('id', id)
  if (error) throw error
}

// ── COLLECTIONS ───────────────────────────────────────────────────────────────
export async function getPublicCollections(limit = 24): Promise<DbCollection[]> {
  const sb = createClient()
  const { data } = await sb
    .from('music_collections')
    .select(`*, profiles(username, display_name, avatar_url, theme)`)
    .eq('is_public', true)
    .order('added_at', { ascending: false })
    .limit(limit)
  // Attach counts
  const ids = (data ?? []).map(c => c.id)
  const { data: likes } = await sb.from('collection_likes').select('collection_id').in('collection_id', ids)
  const { data: songs } = await sb.from('collection_songs').select('collection_id').in('collection_id', ids)
  return (data ?? []).map(c => ({
    ...c,
    like_count: likes?.filter(l => l.collection_id === c.id).length ?? 0,
    song_count: songs?.filter(s => s.collection_id === c.id).length ?? 0,
  }))
}

export async function getUserCollections(userId: string, onlyPublic = false): Promise<DbCollection[]> {
  const sb = createClient()
  let q = sb.from('music_collections').select('*').eq('user_id', userId).order('added_at', { ascending: false })
  if (onlyPublic) q = q.eq('is_public', true)
  const { data } = await q
  const ids = (data ?? []).map(c => c.id)
  if (!ids.length) return []
  const { data: likes } = await sb.from('collection_likes').select('collection_id').in('collection_id', ids)
  const { data: songs } = await sb.from('collection_songs').select('collection_id').in('collection_id', ids)
  return (data ?? []).map(c => ({
    ...c,
    like_count: likes?.filter(l => l.collection_id === c.id).length ?? 0,
    song_count: songs?.filter(s => s.collection_id === c.id).length ?? 0,
  }))
}

export async function getCollection(collectionId: string, viewerId?: string): Promise<DbCollection | null> {
  const sb = createClient()
  const { data } = await sb
    .from('music_collections')
    .select(`*, profiles(username, display_name, avatar_url, theme)`)
    .eq('id', collectionId).single()
  if (!data) return null

  const { data: cSongs } = await sb
    .from('collection_songs')
    .select('songs(*)')
    .eq('collection_id', collectionId)
    .order('position')

  const { count: likeCount } = await sb
    .from('collection_likes')
    .select('*', { count: 'exact', head: true })
    .eq('collection_id', collectionId)

  let likedByMe = false
  if (viewerId) {
    const { data: myLike } = await sb.from('collection_likes')
      .select('id').eq('user_id', viewerId).eq('collection_id', collectionId).maybeSingle()
    likedByMe = !!myLike
  }

  return {
    ...data,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    songs: cSongs?.map((r: any) => r.songs as DbSong).filter(Boolean) ?? [],
    like_count: likeCount ?? 0,
    liked_by_me: likedByMe,
  }
}

export async function createCollection(col: { user_id: string; name: string; description: string; emoji: string; is_public: boolean }) {
  const sb = createClient()
  const { data, error } = await sb.from('music_collections').insert(col).select().single()
  if (error) throw error
  return data
}

export async function updateCollection(id: string, updates: { name?: string; description?: string; emoji?: string; is_public?: boolean }) {
  const sb = createClient()
  const { error } = await sb.from('music_collections').update(updates).eq('id', id)
  if (error) throw error
}

export async function deleteCollection(id: string) {
  const sb = createClient()
  // cascade deletes collection_songs rows first (or rely on DB cascade)
  await sb.from('collection_songs').delete().eq('collection_id', id)
  const { error } = await sb.from('music_collections').delete().eq('id', id)
  if (error) throw error
}

export async function getTagRecommendations(userId: string): Promise<{ tag: string; collections: DbCollection[] }[]> {
  const sb = createClient()
  // Get user's top tags
  const { data: userSongs } = await sb.from('songs').select('emotional_tag').eq('user_id', userId)
  const tagCount: Record<string, number> = {}
  userSongs?.forEach(s => { if (s.emotional_tag) tagCount[s.emotional_tag] = (tagCount[s.emotional_tag] ?? 0) + 1 })
  const topTags = Object.entries(tagCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t]) => t)
  if (!topTags.length) return []

  const results: { tag: string; collections: DbCollection[] }[] = []
  for (const tag of topTags) {
    // Find public collections that have songs with this tag (from other users)
    const { data: songMatches } = await sb
      .from('songs')
      .select('id')
      .ilike('emotional_tag', `%${tag}%`)
      .neq('user_id', userId)
    const songIds = (songMatches ?? []).map((s: { id: string }) => s.id)
    if (!songIds.length) continue

    const { data: colSongs } = await sb
      .from('collection_songs')
      .select('collection_id')
      .in('song_id', songIds)
    const colIds = [...new Set((colSongs ?? []).map((r: { collection_id: string }) => r.collection_id))].slice(0, 8)
    if (!colIds.length) continue

    const { data: cols } = await sb
      .from('music_collections')
      .select('*, profiles(username, display_name, avatar_url, theme)')
      .in('id', colIds)
      .eq('is_public', true)
      .limit(8)
    if (cols?.length) results.push({ tag, collections: cols })
  }
  return results
}

export async function addSongToCollection(collectionId: string, songId: string) {
  const sb = createClient()
  // Check not already in collection
  const { data: existing } = await sb.from('collection_songs')
    .select('song_id').eq('collection_id', collectionId).eq('song_id', songId).maybeSingle()
  if (existing) return // already in there
  const { data: max } = await sb.from('collection_songs').select('position')
    .eq('collection_id', collectionId).order('position', { ascending: false }).limit(1).maybeSingle()
  const { error } = await sb.from('collection_songs')
    .insert({ collection_id: collectionId, song_id: songId, position: (max?.position ?? 0) + 1 })
  if (error) throw error
}

export async function removeSongFromCollection(collectionId: string, songId: string) {
  const sb = createClient()
  await sb.from('collection_songs').delete().match({ collection_id: collectionId, song_id: songId })
}

// ── SOCIAL ────────────────────────────────────────────────────────────────────
export async function toggleLike(userId: string, collectionId: string): Promise<boolean> {
  const sb = createClient()
  const { data: existing } = await sb.from('collection_likes')
    .select('id').eq('user_id', userId).eq('collection_id', collectionId).maybeSingle()
  if (existing) {
    await sb.from('collection_likes').delete().eq('id', existing.id)
    return false
  } else {
    await sb.from('collection_likes').insert({ user_id: userId, collection_id: collectionId })
    return true
  }
}

export async function getComments(collectionId: string): Promise<Comment[]> {
  const sb = createClient()
  const { data } = await sb
    .from('collection_comments')
    .select(`*, profiles(username, display_name, avatar_url)`)
    .eq('collection_id', collectionId)
    .order('created_at', { ascending: true })
  return data ?? []
}

export async function addComment(userId: string, collectionId: string, content: string) {
  const sb = createClient()
  const { error } = await sb.from('collection_comments').insert({ user_id: userId, collection_id: collectionId, content })
  if (error) throw error
}

export async function deleteComment(commentId: string) {
  const sb = createClient()
  await sb.from('collection_comments').delete().eq('id', commentId)
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────
export async function submitFeedback(item: { user_id?: string; type: string; message: string; rating: number; page_url: string }) {
  const sb = createClient()
  const { error } = await sb.from('feedback').insert(item)
  if (error) throw error
}
