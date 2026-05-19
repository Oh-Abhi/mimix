// lib/clientData.ts
// Client-side localStorage data layer — persists across Netlify deploys
// Falls back to seed JSON files on first visit

import { Song, Article, MusicCollection, ArticleCollection } from './types'

const KEYS = {
  songs: 'avi-songs',
  articles: 'avi-articles',
  musicCols: 'avi-music-collections',
  articleCols: 'avi-article-collections',
  seeded: 'avi-seeded',
}

function read<T>(key: string): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T : null
  } catch { return null }
}

function write(key: string, data: unknown) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

// ── Seed from bundled JSON on first visit ───────────────────────────────────
export async function ensureSeeded() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(KEYS.seeded)) return
  try {
    const [s, a, mc, ac] = await Promise.all([
      fetch('/api/seed/songs').then(r => r.json()),
      fetch('/api/seed/articles').then(r => r.json()),
      fetch('/api/seed/music-collections').then(r => r.json()),
      fetch('/api/seed/article-collections').then(r => r.json()),
    ])
    write(KEYS.songs, s)
    write(KEYS.articles, a)
    write(KEYS.musicCols, mc)
    write(KEYS.articleCols, ac)
    localStorage.setItem(KEYS.seeded, '1')
  } catch { /* seed failed, continue with empty */ }
}

// ── Songs ────────────────────────────────────────────────────────────────────
export function getSongs(): Song[] { return read<Song[]>(KEYS.songs) ?? [] }
export function addSong(song: Song) {
  const songs = getSongs()
  songs.unshift(song)
  write(KEYS.songs, songs)
}
export function deleteSong(id: string) {
  write(KEYS.songs, getSongs().filter(s => s.id !== id))
}
export function updateSong(id: string, patch: Partial<Song>) {
  write(KEYS.songs, getSongs().map(s => s.id === id ? { ...s, ...patch } : s))
}

// ── Articles ─────────────────────────────────────────────────────────────────
export function getArticles(): Article[] { return read<Article[]>(KEYS.articles) ?? [] }
export function addArticle(article: Article) {
  const arts = getArticles()
  arts.unshift(article)
  write(KEYS.articles, arts)
}
export function deleteArticle(id: string) {
  write(KEYS.articles, getArticles().filter(a => a.id !== id))
}

// ── Music Collections ─────────────────────────────────────────────────────────
export function getMusicCollections(): MusicCollection[] { return read<MusicCollection[]>(KEYS.musicCols) ?? [] }
export function addMusicCollection(col: MusicCollection) {
  const cols = getMusicCollections(); cols.unshift(col); write(KEYS.musicCols, cols)
}

// ── Article Collections ───────────────────────────────────────────────────────
export function getArticleCollections(): ArticleCollection[] { return read<ArticleCollection[]>(KEYS.articleCols) ?? [] }
export function addArticleCollection(col: ArticleCollection) {
  const cols = getArticleCollections(); cols.unshift(col); write(KEYS.articleCols, cols)
}

// ── Export / Import (backup) ──────────────────────────────────────────────────
export function exportData() {
  return JSON.stringify({
    songs: getSongs(),
    articles: getArticles(),
    musicCollections: getMusicCollections(),
    articleCollections: getArticleCollections(),
  }, null, 2)
}

export function importData(json: string) {
  const d = JSON.parse(json)
  if (d.songs) write(KEYS.songs, d.songs)
  if (d.articles) write(KEYS.articles, d.articles)
  if (d.musicCollections) write(KEYS.musicCols, d.musicCollections)
  if (d.articleCollections) write(KEYS.articleCols, d.articleCollections)
}
