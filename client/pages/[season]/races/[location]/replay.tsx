import Layout from '@/components/Layout'
import { COLORS_BY_CONSTRUCTOR } from '@/constants/index'
import { normalizeConstructorName } from '@/helpers/cars'
import { raceColumns } from '@/helpers/supabase'
import { getLocationParam, getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { RaceWithSeason } from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'

interface DriverInfo {
  number: string
  abbrev: string
  constructor: string
}

interface Frame {
  t: number
  positions: Record<string, [number, number]>
}

interface ReplayData {
  race_name: string
  duration_seconds: number
  sample_rate_hz: number
  drivers: DriverInfo[]
  frames: Frame[]
}

interface Props {
  race: RaceWithSeason
  raceId: string
}

const getGradient = (location: string) => {
  let hash = 0
  for (let i = 0; i < location.length; i++) {
    hash = location.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue1 = Math.abs(hash % 360)
  const hue2 = (hue1 + 40) % 360
  const hue3 = (hue1 + 80) % 360
  return `linear-gradient(135deg, hsl(${hue1}, 45%, 25%) 0%, hsl(${hue2}, 40%, 20%) 50%, hsl(${hue3}, 45%, 22%) 100%)`
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0)
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

const SPEEDS = [1, 2, 5, 10] as const
type Speed = (typeof SPEEDS)[number]

const RaceReplay = ({ race, raceId }: Props) => {
  const { query } = useRouter()
  const season = query.season as string

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const accumulatedTimeRef = useRef<number>(0)

  const [replayData, setReplayData] = useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  // Derived driver colors
  const driverColors = useRef<Record<string, string>>({})

  useEffect(() => {
    fetch(`/api/races/${raceId}/replay`)
      .then((res) => {
        if (res.status === 404) {
          setNotAvailable(true)
          setLoading(false)
          return null
        }
        return res.json()
      })
      .then((data: ReplayData | null) => {
        if (!data) return
        setReplayData(data)
        setLoading(false)
      })
      .catch(() => {
        setNotAvailable(true)
        setLoading(false)
      })
  }, [raceId])

  // Precompute driver colors when data + season are available
  useEffect(() => {
    if (!replayData || !season) return
    const colors: Record<string, string> = {}
    for (const d of replayData.drivers) {
      const normalized = normalizeConstructorName(d.constructor)
      const constructorColors = COLORS_BY_CONSTRUCTOR[season]?.[normalized]
      colors[d.number] = constructorColors?.numberBackground ?? '#888888'
    }
    driverColors.current = colors
  }, [replayData, season])

  // Draw a single frame to canvas
  const drawFrame = useCallback((frameIndex: number, data: ReplayData) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const PAD = 32

    ctx.clearRect(0, 0, W, H)

    // Draw track outline (all historical positions as faint dots, sampled)
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    const step = Math.max(1, Math.floor(data.frames.length / 2000))
    for (let i = 0; i < data.frames.length; i += step) {
      const frame = data.frames[i]
      for (const pos of Object.values(frame.positions)) {
        const px = PAD + pos[0] * (W - PAD * 2)
        const py = PAD + (1 - pos[1]) * (H - PAD * 2)
        ctx.fillRect(px - 1, py - 1, 2, 2)
      }
    }

    // Draw driver dots at current frame
    const frame = data.frames[Math.min(frameIndex, data.frames.length - 1)]
    for (const driver of data.drivers) {
      const pos = frame.positions[driver.number]
      if (!pos) continue
      const px = PAD + pos[0] * (W - PAD * 2)
      const py = PAD + (1 - pos[1]) * (H - PAD * 2)
      const color = driverColors.current[driver.number] ?? '#888888'

      // Dot
      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'
      ctx.lineWidth = 1
      ctx.stroke()

      // Label
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.font = 'bold 10px monospace'
      ctx.fillText(driver.abbrev, px + 8, py + 4)
    }
  }, [])

  // Redraw when frame or data changes (while paused)
  useEffect(() => {
    if (!replayData) return
    drawFrame(currentFrame, replayData)
  }, [currentFrame, replayData, drawFrame])

  // Animation loop
  useEffect(() => {
    if (!playing || !replayData) return

    const totalFrames = replayData.frames.length

    const tick = (timestamp: number) => {
      if (lastTimestampRef.current === null) {
        lastTimestampRef.current = timestamp
      }
      const delta = timestamp - lastTimestampRef.current
      lastTimestampRef.current = timestamp

      // Each real second advances `speed` frames (1Hz data, speed multiplier)
      accumulatedTimeRef.current += (delta / 1000) * speed

      const newFrame = Math.floor(accumulatedTimeRef.current)

      if (newFrame >= totalFrames - 1) {
        setCurrentFrame(totalFrames - 1)
        setPlaying(false)
        lastTimestampRef.current = null
        return
      }

      setCurrentFrame(newFrame)
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current !== null)
        cancelAnimationFrame(animFrameRef.current)
      lastTimestampRef.current = null
    }
  }, [playing, replayData, speed])

  const handlePlayPause = () => {
    if (
      !playing &&
      replayData &&
      currentFrame >= replayData.frames.length - 1
    ) {
      // Restart
      accumulatedTimeRef.current = 0
      setCurrentFrame(0)
    }
    accumulatedTimeRef.current = currentFrame
    setPlaying((p) => !p)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = Number(e.target.value)
    accumulatedTimeRef.current = frame
    setCurrentFrame(frame)
    if (playing) setPlaying(false)
  }

  const handleSpeedChange = (s: Speed) => {
    accumulatedTimeRef.current = currentFrame
    lastTimestampRef.current = null
    setSpeed(s)
  }

  const totalFrames = replayData?.frames.length ?? 0

  return (
    <Layout
      documentTitle={`${race.name} Replay`}
      description={`Race replay for ${race.name}`}
    >
      {/* Race header */}
      <div
        className='w-screen absolute h-48 sm:h-64 left-0 top-[64px] sm:top-[72px]'
        style={{ background: getGradient(race.location) }}
      />

      {/* Race info */}
      <div className='relative flex flex-col items-center justify-end text-center min-h-[5rem] pt-4 sm:min-h-[10rem] sm:pt-0'>
        <h1 className='px-2 font-bold tracking-normal leading-tight text-gray-200 uppercase text-[clamp(1.25rem,6vw,2rem)] sm:text-5xl font-primary'>
          {race.name}
        </h1>
        <p className='mt-1 text-lg tracking-wide text-gray-300 sm:text-2xl font-tertiary'>
          {race.location}, {race.country}
        </p>
      </div>

      {/* Back link */}
      <div className='relative z-10 mx-2 mt-4 sm:mx-4'>
        <Link
          href={`/${season}/races/${query.location}`}
          className='text-gray-400 hover:text-gray-200 font-tertiary text-sm sm:text-base'
        >
          ← Back to Results
        </Link>
      </div>

      {/* Main content */}
      <div className='relative z-10 mx-2 mt-4 sm:mx-4'>
        {loading && (
          <div className='flex items-center justify-center h-64 text-gray-400 font-tertiary text-xl'>
            Loading replay...
          </div>
        )}

        {notAvailable && (
          <div className='flex items-center justify-center h-64 text-gray-400 font-tertiary text-xl'>
            Replay not available for this race.
          </div>
        )}

        {replayData && (
          <>
            {/* Canvas */}
            <div className='w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-700'>
              <canvas
                ref={canvasRef}
                width={900}
                height={500}
                className='w-full h-auto'
                style={{ display: 'block' }}
              />
            </div>

            {/* Controls */}
            <div className='mt-4 space-y-3'>
              {/* Play/pause + speed + time */}
              <div className='flex flex-wrap items-center gap-3 font-tertiary'>
                <button
                  onClick={handlePlayPause}
                  className='px-5 py-2 text-lg font-medium rounded-lg bg-gray-600 text-white hover:bg-gray-500 transition-colors'
                >
                  {playing ? '⏸ Pause' : '▶ Play'}
                </button>

                <div className='flex items-center gap-1'>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSpeedChange(s)}
                      className={`px-3 py-2 text-base font-medium rounded-lg transition-colors ${
                        speed === s
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                      }`}
                    >
                      {s}×
                    </button>
                  ))}
                </div>

                <span className='text-gray-300 text-base ml-auto'>
                  {formatTime(currentFrame)} / {formatTime(totalFrames)}
                </span>
              </div>

              {/* Scrub bar */}
              <input
                type='range'
                min={0}
                max={totalFrames - 1}
                value={currentFrame}
                onChange={handleScrub}
                className='w-full accent-gray-400'
              />

              {/* Driver legend */}
              <div className='flex flex-wrap gap-2 mt-2'>
                {replayData.drivers.map((d) => (
                  <div key={d.number} className='flex items-center gap-1'>
                    <div
                      className='w-3 h-3 rounded-full border border-white/30 flex-shrink-0'
                      style={{
                        backgroundColor:
                          driverColors.current[d.number] ?? '#888',
                      }}
                    />
                    <span className='text-gray-300 text-xs font-secondary uppercase'>
                      {d.abbrev}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const season = getSeasonParam(context)
  const locationParam = decodeURIComponent(getLocationParam(context))
  const raceId = locationParam.split('-')[0]

  const { data: race } = await supabase
    .from('race')
    .select(raceColumns)
    .eq('season.year', season)
    .eq('id', raceId)
    .returns<RaceWithSeason[]>()
    .single()

  if (!race) {
    return { notFound: true }
  }

  return {
    props: {
      race,
      raceId,
    },
  }
}

export default RaceReplay
