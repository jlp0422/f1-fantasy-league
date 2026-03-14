import Layout from '@/components/Layout'
import { raceColumns } from '@/helpers/supabase'
import { getLocationParam, getSeasonParam } from '@/helpers/utils'
import { supabase } from '@/lib/database'
import { RaceWithSeason } from '@/types/Unions'
import { GetServerSidePropsContext } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useRef, useState } from 'react'

interface DriverInfo {
  number: string
  abbrev: string
  constructor: string
}

interface Frame {
  t: number
  positions: Record<string, [number, number]>
}

interface LapEvent {
  t: number
  driver: string
  lap: number
  position: number | null
}

interface ReplayData {
  race_name: string
  duration_seconds: number
  sample_rate_hz: number
  drivers: DriverInfo[]
  frames: Frame[]
  lap_events?: LapEvent[]
}

interface LeaderboardEntry {
  position: number
  abbrev: string
  number: string
  constructor: string
  lap: number
}

interface Props {
  race: RaceWithSeason
  raceId: string
}

const F1_TEAM_COLORS: Record<string, string> = {
  'red-bull-racing': '#3671C6',
  ferrari: '#E8002D',
  mercedes: '#27F4D2',
  mclaren: '#FF8000',
  'aston-martin': '#229971',
  alpine: '#FF87BC',
  williams: '#64C4FF',
  'haas-f1-team': '#B6BABD',
  haas: '#B6BABD',
  'visa-cash-app-rb': '#6692FF',
  'racing-bulls': '#6692FF',
  rb: '#6692FF',
  'kick-sauber': '#52E252',
  sauber: '#52E252',
  audi: '#FF0000',
  cadillac: '#CC1B17',
}

const getTeamColor = (constructorSlug: string) =>
  F1_TEAM_COLORS[constructorSlug] ?? '#888888'

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

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const SPEEDS = [10, 20, 50, 100] as const
type Speed = (typeof SPEEDS)[number]
const SPEED_LABELS: Record<Speed, string> = {
  10: '1×',
  20: '2×',
  50: '5×',
  100: '10×',
}

const RaceReplay = ({ race, raceId }: Props) => {
  const { query } = useRouter()
  const season = query.season as string

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastTimestampRef = useRef<number | null>(null)
  const frameFloatRef = useRef<number>(0)
  const speedRef = useRef<Speed>(10)
  const playingRef = useRef<boolean>(false)
  const replayDataRef = useRef<ReplayData | null>(null)
  const trackCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [replayData, setReplayData] = useState<ReplayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notAvailable, setNotAvailable] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(10)

  const driverColors = useRef<Record<string, string>>({})
  // Per-driver sorted lap events for O(log n) lookup
  const driverLapEvents = useRef<Map<string, LapEvent[]>>(new Map())

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
        replayDataRef.current = data
        setReplayData(data)
        setLoading(false)
      })
      .catch(() => {
        setNotAvailable(true)
        setLoading(false)
      })
  }, [raceId])

  useEffect(() => {
    if (!replayData) return

    // Driver colors
    const colors: Record<string, string> = {}
    for (const d of replayData.drivers) {
      colors[d.number] = getTeamColor(d.constructor)
    }
    driverColors.current = colors

    // Per-driver lap event lookup
    const map = new Map<string, LapEvent[]>()
    for (const evt of replayData.lap_events ?? []) {
      if (!map.has(evt.driver)) map.set(evt.driver, [])
      map.get(evt.driver)!.push(evt)
    }
    driverLapEvents.current = map

    // Pre-render track outline
    const W = 900
    const H = 500
    const PAD = 40
    const offscreen = document.createElement('canvas')
    offscreen.width = W
    offscreen.height = H
    const ctx = offscreen.getContext('2d')!
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    const step = Math.max(1, Math.floor(replayData.frames.length / 3000))
    for (let i = 0; i < replayData.frames.length; i += step) {
      const frame = replayData.frames[i]
      for (const pos of Object.values(frame.positions)) {
        const px = PAD + pos[0] * (W - PAD * 2)
        const py = PAD + (1 - pos[1]) * (H - PAD * 2)
        ctx.fillRect(px - 1, py - 1, 2, 2)
      }
    }
    trackCanvasRef.current = offscreen

    drawFrameFloat(0, replayData)
  }, [replayData]) // eslint-disable-line react-hooks/exhaustive-deps

  const drawFrameFloat = (frameFloat: number, data: ReplayData) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const PAD = 40

    ctx.clearRect(0, 0, W, H)
    if (trackCanvasRef.current) ctx.drawImage(trackCanvasRef.current, 0, 0)

    const frameA = Math.floor(frameFloat)
    const frameB = Math.min(frameA + 1, data.frames.length - 1)
    const t = frameFloat - frameA
    const posA = data.frames[frameA].positions
    const posB = data.frames[frameB].positions

    for (const driver of data.drivers) {
      const pA = posA[driver.number]
      const pB = posB[driver.number]
      if (!pA) continue
      const px = PAD + lerp(pA[0], pB ? pB[0] : pA[0], t) * (W - PAD * 2)
      const py = PAD + (1 - lerp(pA[1], pB ? pB[1] : pA[1], t)) * (H - PAD * 2)
      const color = driverColors.current[driver.number] ?? '#888888'

      ctx.beginPath()
      ctx.arc(px, py, 6, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.95)'
      ctx.font = 'bold 10px monospace'
      ctx.fillText(driver.abbrev, px + 9, py + 4)
    }
  }

  // Binary search: last lap event for a driver with t <= frame
  const getDriverLapState = (driverNum: string, frame: number) => {
    const events = driverLapEvents.current.get(driverNum)
    if (!events || events.length === 0) return null
    let lo = 0,
      hi = events.length - 1,
      result = null
    while (lo <= hi) {
      const mid = (lo + hi) >> 1
      if (events[mid].t <= frame) {
        result = events[mid]
        lo = mid + 1
      } else {
        hi = mid - 1
      }
    }
    return result
  }

  // Leaderboard derived from currentFrame
  const leaderboard = useMemo((): LeaderboardEntry[] => {
    if (!replayData) return []
    const entries: LeaderboardEntry[] = []
    for (const driver of replayData.drivers) {
      const state = getDriverLapState(driver.number, currentFrame)
      entries.push({
        position: state?.position ?? 99,
        abbrev: driver.abbrev,
        number: driver.number,
        constructor: driver.constructor,
        lap: state?.lap ?? 0,
      })
    }
    return entries.sort((a, b) => a.position - b.position)
  }, [currentFrame, replayData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || !replayData) return
    playingRef.current = true
    const totalFrames = replayData.frames.length
    let lastStateUpdate = 0

    const tick = (timestamp: number) => {
      if (!playingRef.current) return
      if (lastTimestampRef.current === null)
        lastTimestampRef.current = timestamp
      const delta = Math.min(timestamp - lastTimestampRef.current, 100)
      lastTimestampRef.current = timestamp
      frameFloatRef.current += (delta / 1000) * speedRef.current

      if (frameFloatRef.current >= totalFrames - 1) {
        frameFloatRef.current = totalFrames - 1
        drawFrameFloat(frameFloatRef.current, replayData)
        setCurrentFrame(totalFrames - 1)
        setPlaying(false)
        playingRef.current = false
        return
      }

      drawFrameFloat(frameFloatRef.current, replayData)

      if (timestamp - lastStateUpdate > 100) {
        setCurrentFrame(Math.floor(frameFloatRef.current))
        lastStateUpdate = timestamp
      }

      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)
    return () => {
      playingRef.current = false
      if (animFrameRef.current !== null)
        cancelAnimationFrame(animFrameRef.current)
      lastTimestampRef.current = null
    }
  }, [playing, replayData]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    speedRef.current = speed
  }, [speed])

  const handlePlayPause = () => {
    if (
      !playing &&
      replayData &&
      frameFloatRef.current >= replayData.frames.length - 1
    ) {
      frameFloatRef.current = 0
      setCurrentFrame(0)
    }
    setPlaying((p) => !p)
  }

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const frame = Number(e.target.value)
    frameFloatRef.current = frame
    setCurrentFrame(frame)
    if (playing) setPlaying(false)
    if (replayData) drawFrameFloat(frame, replayData)
  }

  const handleSpeedChange = (s: Speed) => {
    lastTimestampRef.current = null
    setSpeed(s)
  }

  const totalFrames = replayData?.frames.length ?? 0

  return (
    <Layout
      documentTitle={`${race.name} Replay`}
      description={`Race replay for ${race.name}`}
    >
      <div
        className='w-screen absolute h-48 sm:h-64 left-0 top-[64px] sm:top-[72px]'
        style={{ background: getGradient(race.location) }}
      />

      <div className='relative flex flex-col items-center justify-end text-center min-h-[5rem] pt-4 sm:min-h-[10rem] sm:pt-0'>
        <h1 className='px-2 font-bold tracking-normal leading-tight text-gray-200 uppercase text-[clamp(1.25rem,6vw,2rem)] sm:text-5xl font-primary'>
          {race.name}
        </h1>
        <p className='mt-1 text-lg tracking-wide text-gray-300 sm:text-2xl font-tertiary'>
          {race.location}, {race.country}
        </p>
      </div>

      <div className='relative z-10 mx-2 mt-4 sm:mx-4'>
        <Link
          href={`/${season}/races/${query.location}`}
          className='text-gray-400 hover:text-gray-200 font-tertiary text-sm sm:text-base'
        >
          ← Back to Results
        </Link>
      </div>

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
            {/* Canvas + leaderboard side by side on desktop */}
            <div className='flex flex-col lg:flex-row gap-3'>
              {/* Canvas */}
              <div className='flex-1 min-w-0 rounded-lg overflow-hidden bg-gray-900 border border-gray-700'>
                <canvas
                  ref={canvasRef}
                  width={900}
                  height={500}
                  className='w-full h-auto'
                  style={{ display: 'block' }}
                />
              </div>

              {/* Live leaderboard */}
              {leaderboard.length > 0 && (
                <div className='lg:w-44 rounded-lg bg-gray-900 border border-gray-700 overflow-hidden flex-shrink-0'>
                  <div className='px-3 py-2 bg-gray-800 border-b border-gray-700'>
                    <span className='text-white text-sm font-bold font-secondary uppercase tracking-wide'>
                      Leaderboard
                    </span>
                  </div>
                  <div className='divide-y divide-gray-800'>
                    {leaderboard.map((entry, idx) => (
                      <div
                        key={entry.number}
                        className='flex items-center gap-2 px-3 py-1.5'
                      >
                        <span className='text-gray-400 text-xs font-secondary w-5 text-right flex-shrink-0'>
                          {entry.position < 99 ? entry.position : idx + 1}
                        </span>
                        <div
                          className='w-2.5 h-2.5 rounded-full flex-shrink-0'
                          style={{
                            backgroundColor: getTeamColor(entry.constructor),
                          }}
                        />
                        <span className='text-white text-sm font-bold font-secondary flex-1'>
                          {entry.abbrev}
                        </span>
                        {entry.lap > 0 && (
                          <span className='text-gray-400 text-xs font-secondary'>
                            L{entry.lap}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className='mt-4 space-y-3'>
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
                      {SPEED_LABELS[s]}
                    </button>
                  ))}
                </div>

                <span className='text-gray-900 text-base ml-auto'>
                  {formatTime(currentFrame)} / {formatTime(totalFrames)}
                </span>
              </div>

              <input
                type='range'
                min={0}
                max={totalFrames - 1}
                value={currentFrame}
                onChange={handleScrub}
                className='w-full accent-gray-400'
              />

              {/* Driver legend */}
              <div className='flex flex-wrap gap-x-4 gap-y-2 mt-2'>
                {replayData.drivers.map((d) => (
                  <div key={d.number} className='flex items-center gap-2'>
                    <div
                      className='w-3.5 h-3.5 rounded-full border border-black/20 flex-shrink-0'
                      style={{ backgroundColor: getTeamColor(d.constructor) }}
                    />
                    <span className='text-gray-900 text-sm font-bold font-secondary uppercase'>
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
