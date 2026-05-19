// lib/songGradients.ts
// Beautiful aesthetic gradient identities for song cards
// Each song gets a consistent unique gradient based on its ID hash

export interface SongGradient {
  from: string
  to: string
  via?: string
  glowRgb: string  // "r,g,b" for rgba()
}

const GRADIENTS: SongGradient[] = [
  { from: '#2d1b69', to: '#11998e', glowRgb: '45,27,105' },       // deep violet → teal
  { from: '#1a0533', to: '#c471ed', via: '#f64f59', glowRgb: '196,113,237' }, // dark → pink
  { from: '#0f2027', to: '#2c5364', via: '#203a43', glowRgb: '44,83,100' },   // midnight ocean
  { from: '#41295a', to: '#2F0743', glowRgb: '65,41,90' },         // deep plum
  { from: '#134e5e', to: '#71b280', glowRgb: '19,78,94' },         // teal → sage
  { from: '#3a1c71', to: '#d76d77', via: '#ffaf7b', glowRgb: '215,109,119' }, // violet → rose gold
  { from: '#0d0d0d', to: '#434343', via: '#5c5c5c', glowRgb: '67,67,67' },   // charcoal
  { from: '#642B73', to: '#C6426E', glowRgb: '198,66,110' },       // plum → crimson
  { from: '#1e3c72', to: '#2a5298', glowRgb: '42,82,152' },        // royal blue
  { from: '#4a1942', to: '#c74b50', glowRgb: '199,75,80' },        // burgundy → vermillion
  { from: '#16222A', to: '#3A6073', glowRgb: '58,96,115' },        // dark teal
  { from: '#4568DC', to: '#B06AB3', glowRgb: '176,106,179' },      // electric → lavender
  { from: '#1d2b64', to: '#f8cdda', glowRgb: '248,205,218' },      // navy → blush
  { from: '#2c3e50', to: '#4ca1af', glowRgb: '76,161,175' },       // slate → aqua
  { from: '#3d0c02', to: '#b31217', via: '#e52d27', glowRgb: '179,18,23' }, // deep red
  { from: '#0a3d0a', to: '#1e8449', glowRgb: '30,132,73' },        // forest
  { from: '#12c2e9', to: '#c471ed', via: '#f64f59', glowRgb: '18,194,233' }, // cyan → purple
  { from: '#373737', to: '#bc4e9c', via: '#f80759', glowRgb: '188,78,156' }, // ash → pink
  { from: '#1e130c', to: '#9a8478', glowRgb: '154,132,120' },      // espresso
  { from: '#2b5876', to: '#4e4376', glowRgb: '78,67,118' },        // ocean night
]

// Deterministic hash so same song always gets same gradient
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function getSongGradient(songId: string): SongGradient {
  return GRADIENTS[hashString(songId) % GRADIENTS.length]
}

export function gradientStyle(g: SongGradient): string {
  if (g.via) return `linear-gradient(135deg, ${g.from}, ${g.via}, ${g.to})`
  return `linear-gradient(135deg, ${g.from}, ${g.to})`
}
