'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useToast } from '@/lib/context/ToastContext'

export interface Track {
  // Real recordings set audioFile. Entries with no recorded audio (riddles,
  // proverbs, folktales) instead set speechText, which is read aloud with the
  // browser's built-in speech synthesis rather than a recorded file — always
  // surfaced to the listener as "AI Generated" narration, never presented as
  // an authentic recording.
  audioFile?: string | null
  speechText?: string | null
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

    // Guards every event handler below against firing after this effect has
    // been cleaned up (track switched/closed). Without it, clearing the OLD
    // audio's src on cleanup fires a delayed/async 'error' event on that
    // discarded element, which would otherwise stop the NEW track and show
    // a false "could not be played" toast for a recording that's actually
    // playing fine.
    let cancelled = false

    // Pause and clean up whatever the previous track was using
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    window.speechSynthesis.cancel()

    // --- AI narration branch: no recorded audio, read the transcription aloud ---
    if (!currentTrack.audioFile && currentTrack.speechText) {
      const utterance = new SpeechSynthesisUtterance(currentTrack.speechText)
      utterance.rate = speed

      const totalChars = currentTrack.speechText.length
      // ~2.5 words/sec at normal rate is a reasonable spoken-word estimate;
      // corrected continuously below via onboundary once speech is underway.
      const wordCount = currentTrack.speechText.trim().split(/\s+/).filter(Boolean).length
      const estimatedDuration = Math.max(wordCount / (2.5 * speed), 1)
      setDuration(estimatedDuration)

      let tickInterval: ReturnType<typeof setInterval> | null = null
      let startedAt: number | null = null

      utterance.onstart = () => {
        if (cancelled) return
        startedAt = Date.now()
        tickInterval = setInterval(() => {
          if (cancelled || startedAt === null) return
          const elapsed = (Date.now() - startedAt) / 1000
          const clamped = Math.min(elapsed, estimatedDuration)
          setCurrentTime(clamped)
          setProgress((clamped / estimatedDuration) * 100)
        }, 200)
      }

      utterance.onboundary = (e) => {
        if (cancelled || !totalChars) return
        const ratio = Math.min(e.charIndex / totalChars, 1)
        setProgress(ratio * 100)
        setCurrentTime(ratio * estimatedDuration)
      }

      utterance.onend = () => {
        if (cancelled) return
        if (tickInterval) clearInterval(tickInterval)
        setIsPlaying(false)
        setProgress(0)
        setCurrentTime(0)
      }

      utterance.onerror = (e) => {
        if (cancelled) return
        if (tickInterval) clearInterval(tickInterval)
        console.warn('Speech synthesis error:', e)
        setIsPlaying(false)
        showToast('error', 'This narration could not be played.')
      }

      if (isPlaying) {
        window.speechSynthesis.speak(utterance)
      }

      return () => {
        cancelled = true
        if (tickInterval) clearInterval(tickInterval)
        window.speechSynthesis.cancel()
      }
    }

    // --- Recorded audio branch ---
    const audio = new Audio(currentTrack.audioFile || '')
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
    if (currentTrack && !currentTrack.audioFile && currentTrack.speechText) {
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
    if (currentTrack && !currentTrack.audioFile && currentTrack.speechText) {
      if (isPlaying) {
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
    window.speechSynthesis.cancel()
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
    // Web Speech API utterances can't change rate mid-speech; the new speed
    // takes effect the next time a narration track starts.
  }

  const seek = (ratio: number) => {
    // AI narration doesn't support seeking — there's no reliable cross-browser
    // way to jump speech synthesis to an arbitrary position.
    if (currentTrack && !currentTrack.audioFile && currentTrack.speechText) return

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
