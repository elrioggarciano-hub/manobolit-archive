'use client'

import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet'
import type { LocationStat } from '@/lib/geo'

export type { LocationStat }

function MapAutoFit({ coords }: { coords: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (coords.length === 0) return
    const timer = setTimeout(() => {
      map.invalidateSize()
      if (coords.length === 1) {
        map.setView(coords[0], 12)
      } else {
        map.fitBounds(L.latLngBounds(coords), { padding: [36, 36], maxZoom: 11 })
      }
    }, 200)
    return () => clearTimeout(timer)
  }, [coords, map])
  return null
}

// Markers are placed only at verified barangay coordinates (data/barangay-coordinates.json, from PhilAtlas).
// Circle AREA is proportional to the number of entries, and the count is printed on each marker.
export default function RegionalMap({ locationStats }: { locationStats: LocationStat[] }) {
  const plotted = locationStats.filter((l): l is LocationStat & { coords: [number, number] } => l.coords !== null)
  const maxCount = Math.max(1, ...plotted.map(l => l.count))
  const allCoords = plotted.map(l => l.coords)

  return (
    <MapContainer
      center={[8.12, 126.05]}
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
        const ratio = Math.sqrt(loc.count / maxCount)
        return (
          <CircleMarker
            key={`${loc.barangay}|${loc.municipality}`}
            center={loc.coords}
            radius={9 + ratio * 15}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#8F000D', fillOpacity: 0.6 + ratio * 0.25 }}
          >
            {/* Count printed on the marker */}
            <Tooltip permanent direction="center" opacity={1} className="map-count-label">
              {loc.count}
            </Tooltip>
          </CircleMarker>
        )
      })}
      {plotted.map(loc => (
        <CircleMarker key={`hover-${loc.barangay}|${loc.municipality}`} center={loc.coords} radius={9 + Math.sqrt(loc.count / maxCount) * 15} pathOptions={{ opacity: 0, fillOpacity: 0 }}>
          <Tooltip direction="top" offset={[0, -10]}>
            <strong>{loc.location}</strong>
            <br />
            {loc.count} {loc.count === 1 ? 'entry' : 'entries'}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
