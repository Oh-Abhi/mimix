'use client'
import { Song } from '@/lib/types'
import SongCard from './SongCard'
import { usePlayer } from '@/components/providers/PlayerProvider'

interface MasonryGridProps { songs: Song[] }

export default function MasonryGrid({ songs }: MasonryGridProps) {
  const { playSong } = usePlayer()
  return (
    <div className="masonry-grid">
      {songs.map((song, i) => (
        <SongCard key={song.id} song={song} index={i} onClick={() => playSong(song)} />
      ))}
    </div>
  )
}
