import { NextRequest, NextResponse } from 'next/server'

// Pentatonic scale frequencies simulating traditional Kudlung lute & bamboo flute tones (A4, C5, D5, E5, G5)
const PENTATONIC_FREQS = [440, 523.25, 587.33, 659.25, 783.99]

const TRACK_MELODIES: Record<string, { duration: number; pattern: number[] }> = {
  'agyu.mp3': { duration: 18, pattern: [0, 2, 3, 1, 4, 2, 0, 3] },
  'serenade.mp3': { duration: 22, pattern: [1, 3, 0, 4, 2, 1, 3, 0] },
  'flood.mp3': { duration: 15, pattern: [4, 2, 0, 3, 1, 4, 2, 0] },
  'hunter.mp3': { duration: 16, pattern: [2, 0, 4, 1, 3, 2, 0, 4] },
  'mirror.mp3': { duration: 12, pattern: [3, 1, 2, 0, 4, 3, 1, 2] },
  'nilugdang.mp3': { duration: 25, pattern: [0, 1, 3, 4, 2, 0, 1, 4] },
  'kapoit.mp3': { duration: 20, pattern: [2, 4, 1, 0, 3, 2, 4, 1] },
  'kasaysayan.mp3': { duration: 28, pattern: [4, 3, 2, 1, 0, 2, 4, 3] },
  'opaw.mp3': { duration: 18, pattern: [1, 0, 2, 3, 4, 1, 0, 2] },
  'kadikiluman.mp3': { duration: 22, pattern: [3, 2, 4, 0, 1, 3, 2, 4] }
}

function createWavBuffer(durationSeconds: number, melodyPattern: number[]) {
  const sampleRate = 22050
  const numChannels = 1
  const bytesPerSample = 2
  const numSamples = Math.floor(sampleRate * durationSeconds)
  const dataSize = numSamples * numChannels * bytesPerSample
  const buffer = Buffer.alloc(44 + dataSize)

  // RIFF header
  buffer.write('RIFF', 0)
  buffer.writeUInt32LE(36 + dataSize, 4)
  buffer.write('WAVE', 8)

  // fmt subchunk
  buffer.write('fmt ', 12)
  buffer.writeUInt32LE(16, 16)
  buffer.writeUInt16LE(1, 20)
  buffer.writeUInt16LE(numChannels, 22)
  buffer.writeUInt32LE(sampleRate, 24)
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28)
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32)
  buffer.writeUInt16LE(bytesPerSample * 8, 34)

  // data subchunk
  buffer.write('data', 36)
  buffer.writeUInt32LE(dataSize, 40)

  // Generate pentatonic acoustic melody with decay
  let offset = 44
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const noteIndex = Math.floor((t * 2) % melodyPattern.length)
    const freq = PENTATONIC_FREQS[melodyPattern[noteIndex] % PENTATONIC_FREQS.length]
    
    const noteTime = (t * 2) % 1
    const envelope = Math.exp(-noteTime * 2.8)

    const wave = 0.7 * Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(2 * Math.PI * freq * 2 * t)
    const sampleVal = Math.floor(wave * envelope * 14000)
    
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, sampleVal)), offset)
    offset += 2
  }

  return buffer
}

export async function GET(request: NextRequest, { params }: { params: { name: string } }) {
  const fileName = params.name.toLowerCase()
  const trackInfo = TRACK_MELODIES[fileName] || { duration: 15, pattern: [0, 1, 2, 3, 4] }

  const wavBuffer = createWavBuffer(trackInfo.duration, trackInfo.pattern)

  return new NextResponse(wavBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': wavBuffer.length.toString(),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'public, max-age=3600, immutable',
    },
  })
}
