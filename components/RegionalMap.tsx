'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'

// Leaflet computes tile/control positions from the container's size at mount
// time. If this card's layout hasn't fully settled yet (web fonts swapping in,
// sibling cards still resizing), that snapshot can be stale — invalidateSize()
// forces Leaflet to re-measure once the surrounding layout has stabilized.
function MapResizeFix() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export interface LocationStat {
  location: string
  municipality: string
  province: string
  count: number
}

// Real coordinates (source: PhilAtlas / Wikipedia barangay profiles), keyed by
// the exact `communityLocation` strings used in the archive's data entry.
// Only locations we could verify against an actual source are plotted —
// anything else is left out of the map rather than guessed.
const KNOWN_COORDS: Record<string, [number, number]> = {
  'trento': [8.0500, 126.0667],
  'sta maria': [8.0211, 126.1614],
  'sitio dam, brgy. tudela': [8.0684, 126.1032],
  'tudela': [8.0684, 126.1032],
}

function resolveCoords(location: string): [number, number] | null {
  return KNOWN_COORDS[location.trim().toLowerCase()] || null
}

export default function RegionalMap({ locationStats }: { locationStats: LocationStat[] }) {
  const maxCount = Math.max(1, ...locationStats.map(l => l.count))
  const plotted = locationStats
    .map(l => ({ ...l, coords: resolveCoords(l.location) }))
    .filter((l): l is LocationStat & { coords: [number, number] } => l.coords !== null)

  return (
    <MapContainer
      center={[8.055, 126.09]}
      zoom={11}
      scrollWheelZoom={false}
      dragging={false}
      touchZoom={false}
      doubleClickZoom={false}
      style={{ width: '100%', height: '100%', position: 'relative', isolation: 'isolate', zIndex: 0 }}
    >
      <MapResizeFix />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {plotted.map(loc => {
        const ratio = loc.count / maxCount
        return (
          <CircleMarker
            key={loc.location}
            center={loc.coords}
            radius={8 + ratio * 14}
            pathOptions={{
              color: '#ffffff',
              weight: 2,
              fillColor: '#8F000D',
              fillOpacity: 0.55 + ratio * 0.25,
            }}
          >
            <Tooltip direction="top" offset={[0, -6]}>
              <strong>{loc.location}</strong>
              <br />
              {loc.count} {loc.count === 1 ? 'entry' : 'entries'}
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
