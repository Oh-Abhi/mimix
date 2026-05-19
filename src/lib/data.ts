// lib/data.ts — Data access layer (swap internals for Supabase anytime)
import { Song, Article, MusicCollection, ArticleCollection } from './types'
import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'src', 'data')

function readJSON<T>(filename: string): T {
  const filePath = path.join(dataDir, filename)
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw) as T
}

function writeJSON(filename: string, data: unknown): void {
  const filePath = path.join(dataDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// ── Songs ────────────────────────────────────────────────────────────────────
export function getSongs(): Song[] {
  return readJSON<Song[]>('songs.json')
}

export function addSong(song: Song): void {
  const songs = getSongs()
  songs.unshift(song)
  writeJSON('songs.json', songs)
}

export function updateSong(id: string, updates: Partial<Song>): void {
  const songs = getSongs()
  const idx = songs.findIndex(s => s.id === id)
  if (idx !== -1) songs[idx] = { ...songs[idx], ...updates }
  writeJSON('songs.json', songs)
}

export function deleteSong(id: string): void {
  const songs = getSongs().filter(s => s.id !== id)
  writeJSON('songs.json', songs)
}

// ── Articles ─────────────────────────────────────────────────────────────────
export function getArticles(): Article[] {
  return readJSON<Article[]>('articles.json')
}

export function addArticle(article: Article): void {
  const articles = getArticles()
  articles.unshift(article)
  writeJSON('articles.json', articles)
}

export function updateArticle(id: string, updates: Partial<Article>): void {
  const articles = getArticles()
  const idx = articles.findIndex(a => a.id === id)
  if (idx !== -1) articles[idx] = { ...articles[idx], ...updates }
  writeJSON('articles.json', articles)
}

export function deleteArticle(id: string): void {
  const articles = getArticles().filter(a => a.id !== id)
  writeJSON('articles.json', articles)
}

// ── Music Collections ─────────────────────────────────────────────────────────
export function getMusicCollections(): MusicCollection[] {
  return readJSON<MusicCollection[]>('music-collections.json')
}

export function addMusicCollection(col: MusicCollection): void {
  const cols = getMusicCollections()
  cols.unshift(col)
  writeJSON('music-collections.json', cols)
}

export function updateMusicCollection(id: string, updates: Partial<MusicCollection>): void {
  const cols = getMusicCollections()
  const idx = cols.findIndex(c => c.id === id)
  if (idx !== -1) cols[idx] = { ...cols[idx], ...updates }
  writeJSON('music-collections.json', cols)
}

// ── Article Collections ───────────────────────────────────────────────────────
export function getArticleCollections(): ArticleCollection[] {
  return readJSON<ArticleCollection[]>('article-collections.json')
}

export function addArticleCollection(col: ArticleCollection): void {
  const cols = getArticleCollections()
  cols.unshift(col)
  writeJSON('article-collections.json', cols)
}

export function updateArticleCollection(id: string, updates: Partial<ArticleCollection>): void {
  const cols = getArticleCollections()
  const idx = cols.findIndex(c => c.id === id)
  if (idx !== -1) cols[idx] = { ...cols[idx], ...updates }
  writeJSON('article-collections.json', cols)
}
