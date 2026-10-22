'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'

function MapAutoFit({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    const timer = setTimeout(() => {
      map.invalidateSize()
      if (coords.length === 1) {
        map.setView(coords[0], 12)
      } else {
        const bounds = L.latLngBounds(coords)
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 11 })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [coords, map])
  return null
}

export interface LocationStat {
  location: string
  municipality: string
  province: string
  count: number
}

// Real coordinates (source: PhilAtlas official barangay profiles), keyed by
// the exact `communityLocation` strings used in the archive's data entry.
const KNOWN_COORDS: Record<string, [number, number]> = {
  'trento': [8.0500, 126.0667],
  'sta maria': [8.0211, 126.1614],
  'sitio dam, brgy. tudela': [8.0684, 126.1032],
  'tudela': [8.0684, 126.1032],
  'san andres, bunawan': [8.2066, 125.9944],
  'san andres': [8.2066, 125.9944],
  'bunawan': [8.1633, 125.9902],
}

function resolveCoords(location: string): [number, number] | null {
  const norm = (location || '').trim().toLowerCase()
  if (KNOWN_COORDS[norm]) return KNOWN_COORDS[norm]
  if (norm.includes('san andres')) return [8.2066, 125.9944]
  if (norm.includes('bunawan')) return [8.1633, 125.9902]
  if (norm.includes('sta maria') || norm.includes('santa maria')) return [8.0211, 126.1614]
  if (norm.includes('dam') || norm.includes('tudela')) return [8.0684, 126.1032]
  if (norm.includes('trento')) return [8.0500, 126.0667]
  return null
}

export default function RegionalMap({ locationStats }: { locationStats: LocationStat[] }) {
  const maxCount = Math.max(1, ...locationStats.map(l => l.count))
  const plotted = locationStats
    .map(l => ({ ...l, coords: resolveCoords(l.location) }))
    .filter((l): l is LocationStat & { coords: [number, number] } => l.coords !== null)

  const allCoords = plotted.map(l => l.coords)

  return (
    <MapContainer
      center={[8.16, 126.05]}
      zoom={9}
      scrollWheelZoom={false}
      dragging={true}
      touchZoom={true}
      doubleClickZoom={true}
      style={{ width: '100%', height: '100%', position: 'relative', isolation: 'isolate', zIndex: 0 }}
    >
      <MapAutoFit coords={allCoords} />
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
