'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useToast } from '@/lib/context/ToastContext'

export interface Track {
  audioFile?: string | null
  title: string
  narrator?: string | null
  singer?: string | null
  subtitle?: string | null
  duration?: number | null
  textToRecite?: string | null
  entryId?: string | null
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
  // True while the current track is being read aloud via the browser's
  // speech synthesis (entries with no real recording), rather than played
  // from an audio file. Lets togglePlay/pauseTrack/seek branch correctly.
  const ttsActiveRef = useRef(false)

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Manage Audio element / speech synthesis lifecycle based on currentTrack
  useEffect(() => {
    if (!currentTrack) return

    // Guards every event handler below against firing after this effect has
    // been cleaned up (track switched/closed). Without it, clearing the OLD
    // audio's src on cleanup fires a delayed/async 'error' event on that
    // discarded element, which would otherwise stop the NEW track and show
    // a false "could not be played" toast for a recording that's actually
    // playing fine.
    let cancelled = false

    // Pause and clean whatever was previously playing (audio or speech)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    // Entries with no uploaded recording (riddles, proverbs, folktales) are
    // read aloud via the browser's built-in speech synthesis instead.
    if (!currentTrack.audioFile) {
      ttsActiveRef.current = true

      if (!currentTrack.textToRecite || typeof window === 'undefined' || !window.speechSynthesis) {
        setIsPlaying(false)
        return
      }

      const text = currentTrack.textToRecite
      // Rough pace estimate (~13 characters/second of speech) so the
      // progress bar has something reasonable to animate against — the
      // Web Speech API doesn't expose fine-grained playback position.
      const estimatedDuration = Math.max(2, text.length / 13)
      setDuration(currentTrack.duration || estimatedDuration)
      setCurrentTime(0)
      setProgress(0)

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = speed

      let elapsedTimer: ReturnType<typeof setInterval> | null = null
      const startedAt = Date.now()

      utterance.onstart = () => {
        if (cancelled) return
        setIsPlaying(true)
        elapsedTimer = setInterval(() => {
          const elapsed = (Date.now() - startedAt) / 1000
          setCurrentTime(elapsed)
          setProgress(Math.min(100, (elapsed / estimatedDuration) * 100))
        }, 200)
      }
      utterance.onend = () => {
        if (cancelled) return
        if (elapsedTimer) clearInterval(elapsedTimer)
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
      }
      utterance.onerror = () => {
        if (cancelled) return
        if (elapsedTimer) clearInterval(elapsedTimer)
        setIsPlaying(false)
        showToast('error', 'This narration could not be played.')
      }

      window.speechSynthesis.speak(utterance)

      return () => {
        cancelled = true
        if (elapsedTimer) clearInterval(elapsedTimer)
        window.speechSynthesis.cancel()
      }
    }

    ttsActiveRef.current = false
    const audio = new Audio(currentTrack.audioFile)
    audioRef.current = audio
    audio.playbackRate = speed

    // Explicitly set duration if metadata is loaded
    audio.addEventListener('loadedmetadata', () => {
      if (cancelled) return
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration)
      }
    })

    // Fallback if duration is passed
    if (currentTrack.duration) {
      setDuration(currentTrack.duration)
    }

    audio.addEventListener('timeupdate', () => {
      if (cancelled) return
      const dur = audio.duration || currentTrack.duration || 0
      setCurrentTime(audio.currentTime)
      if (dur > 0) {
        setProgress((audio.currentTime / dur) * 100)
      }
    })

    audio.addEventListener('ended', () => {
      if (cancelled) return
      setIsPlaying(false)
      setProgress(0)
      setCurrentTime(0)
    })

    audio.addEventListener('error', (e) => {
      if (cancelled) return
      console.warn('Audio playback error:', e)
      setIsPlaying(false)
      showToast('error', 'This recording could not be played.')
    })

    if (isPlaying) {
      audio.play().catch((err) => {
        if (cancelled) return
        console.warn('Playback failed or restricted:', err)
        setIsPlaying(false)
      })
    }

    return () => {
      cancelled = true
      audio.pause()
      audio.src = ''
    }
  }, [currentTrack]) // eslint-disable-line react-hooks/exhaustive-deps

  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (ttsActiveRef.current) {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      if (isPlaying) {
        window.speechSynthesis.pause()
        setIsPlaying(false)
      } else {
        window.speechSynthesis.resume()
        setIsPlaying(true)
      }
      return
    }

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
    if (ttsActiveRef.current) {
      if (isPlaying && typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause()
        setIsPlaying(false)
      }
      return
    }
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    ttsActiveRef.current = false
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
    // The Web Speech API has no seek capability, so scrubbing is a no-op
    // for narrated (non-recorded) entries.
    if (ttsActiveRef.current) return
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
