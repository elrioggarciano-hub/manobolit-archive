'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useToast } from '@/lib/context/ToastContext'

export interface Track {
  audioFile: string
  title: string
  narrator?: string | null
  singer?: string | null
  subtitle?: string | null
  duration?: number | null
  textToRecite?: string | null
}

interface AudioContextType {
  currentTrack: Track | null
  isPlaying: boolean
  progress: number
  currentTime: number
  duration: number
  speed: number
  playTrack: (track: Track) => void
  togglePlay: () => void
  pauseTrack: () => void
  closeTrack: () => void
  setPlaybackSpeed: (speed: number) => void
  seek: (ratio: number) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast()
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  // Manage Audio element lifecycle based on currentTrack
  useEffect(() => {
    if (!currentTrack) return

    // Pause and clean previous audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    const audio = new Audio(currentTrack.audioFile)
    audioRef.current = audio
    audio.playbackRate = speed

    // Explicitly set duration if metadata is loaded
    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    })

    // Fallback if duration is passed
    if (currentTrack.duration) {
      setDuration(currentTrack.duration)
    }

    audio.addEventListener('timeupdate', () => {
      const dur = audio.duration || currentTrack.duration || 0
      setCurrentTime(audio.currentTime)
      if (dur > 0) {
        setProgress((audio.currentTime / dur) * 100)
      }
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    })

    audio.addEventListener('error', (e) => {
      console.warn('Audio playback error:', e)
      setIsPlaying(false)
      showToast('error', 'This recording could not be played.')
    })

    if (isPlaying) {
      audio.play().catch((err) => {
        console.warn('Playback failed or restricted:', err)
        setIsPlaying(false)
      })
    }

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [currentTrack]) // eslint-disable-line react-hooks/exhaustive-deps

  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().then(() => {
        setIsPlaying(true)
      }).catch((err) => {
        console.warn('Playback failed:', err)
      })
    }
  }

  const pauseTrack = () => {
    const audio = audioRef.current
    if (audio && isPlaying) {
      audio.pause()
      setIsPlaying(false)
    }
  }

  const closeTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setCurrentTime(0)
    setDuration(0)
  }

  const setPlaybackSpeed = (newSpeed: number) => {
    setSpeed(newSpeed)
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }

  const seek = (ratio: number) => {
    const audio = audioRef.current
    const dur = duration || (audio ? audio.duration : 0)
    if (!audio || !dur) return
    const newTime = ratio * dur
    audio.currentTime = newTime
    setCurrentTime(newTime)
    setProgress(ratio * 100)
  }

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        progress,
        currentTime,
        duration,
        speed,
        playTrack,
        togglePlay,
        pauseTrack,
        closeTrack,
        setPlaybackSpeed,
        seek,
      }}
    >
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider')
  }
  return context
}
