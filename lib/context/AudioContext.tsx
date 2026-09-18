'use client'

import { createContext, useContext, useState, useEffect, useRef } from 'react'

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
  speakText: (text: string, title?: string) => void
}

const AudioContext = createContext<AudioContextType | undefined>(undefined)

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Clean up audio & speech on unmount
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

  // Speech Synthesis fallback helper
  const speakText = (text: string, title?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
    }

    const track: Track = {
      audioFile: `tts-${Date.now()}`,
      title: title || 'Oral Reading Recitation',
      narrator: 'Web Speech Engine',
      duration: Math.max(10, Math.ceil(text.length / 15)),
      textToRecite: text,
    }

    setCurrentTrack(track)
    setDuration(track.duration || 15)
    setCurrentTime(0)
    setProgress(0)

    const utterance = new SpeechSynthesisUtterance(text)
    speechUtteranceRef.current = utterance
    utterance.rate = speed

    utterance.onstart = () => setIsPlaying(true)
    utterance.onend = () => {
      setIsPlaying(false)
      setProgress(100)
    }
    utterance.onerror = () => setIsPlaying(false)

    window.speechSynthesis.speak(utterance)
  }

  // Manage Audio element lifecycle based on currentTrack
  useEffect(() => {
    if (!currentTrack) return

    // If track is TTS based, skip HTML5 audio loading
    if (currentTrack.audioFile.startsWith('tts-')) return

    // Cancel any running speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

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
      console.warn('Audio file playback encounter error, falling back to speech recitation if available:', e)
      if (currentTrack.textToRecite) {
        speakText(currentTrack.textToRecite, currentTrack.title)
      } else {
        setIsPlaying(false)
      }
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
  }, [currentTrack])

  const playTrack = (track: Track) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  const togglePlay = () => {
    if (currentTrack?.audioFile.startsWith('tts-')) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        if (isPlaying) {
          window.speechSynthesis.pause()
          setIsPlaying(false)
        } else {
          window.speechSynthesis.resume()
          setIsPlaying(true)
        }
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
    if (currentTrack?.audioFile.startsWith('tts-')) {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
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
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
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
        speakText,
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

