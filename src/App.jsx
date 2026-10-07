import { useEffect, useRef, useState } from 'react'

const TRACKS = [
  { title: 'The KFE Song (rap version)', file: '1-The KFE Song (rap version).mp3' },
  { title: 'You Are A Food Explorer', file: '2-You Are A Food Explorer.mp3' },
  { title: 'You Are A Food Explorer (folk version)', file: '2-You Are A Food Explorer (folk version).mp3' },
  { title: 'Raising Adventurous Eaters', file: '3-Raising adventurous eaters.mp3' },
  { title: 'A Better Food Story', file: '4-A Better Food Story.mp3' },
  { title: "You Don't Have To Like It", file: '5-You Don_t have to like it.mp3' },
  { title: 'Use Your Senses', file: '6-Use Your Senses.mp3' },
  { title: 'Curiosity Is My Superpower', file: '7-Curiosity is my Superpower.mp3' },
  { title: 'I Listen To My Body', file: '8-I Listen To My Body.mp3' },
  { title: "There's Nothing To Fix", file: '9-There_s Nothing to Fix.mp3' },
  { title: 'A Place at the Table', file: '10-A Place at the Table.mp3' },
  { title: 'Eat the Rainbow', file: '11-Eat the Rainbow.mp3' },
  { title: 'The KFE Song (pop version)', file: 'The KFE Song (pop version).mp3' },
  { title: 'The KFE Song (pop version 2)', file: 'The KFE Song (pop version 2).mp3' },
]

const trackSrc = (track) => encodeURI(`/music/${track.file}`)

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function App() {
  const audioRef = useRef(null)
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [error, setError] = useState(false)

  const track = TRACKS[index]
  const src = trackSrc(track)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = src
    audio.load()
    setProgress(0)
    setDuration(0)
    setError(false)
    if (playing) {
      audio.play().catch(() => setPlaying(false))
    }
  }, [src])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
    }
  }

  const goTo = (nextIndex, autoplay = playing) => {
    const wrapped = (nextIndex + TRACKS.length) % TRACKS.length
    if (wrapped === index) {
      const audio = audioRef.current
      if (autoplay && audio) {
        audio.currentTime = 0
        audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      } else {
        togglePlay()
      }
      return
    }
    setPlaying(autoplay)
    setIndex(wrapped)
  }

  const handleEnded = () => {
    setPlaying(true)
    setIndex((i) => (i + 1) % TRACKS.length)
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    const value = Number(e.target.value)
    if (audio) audio.currentTime = value
    setProgress(value)
  }

  const handleVolume = (e) => {
    const value = Number(e.target.value)
    setVolume(value)
    if (audioRef.current) audioRef.current.volume = value
  }

  const selectTrack = (i) => {
    if (i === index) togglePlay()
    else goTo(i, true)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault()
        togglePlay()
      }
      if (e.code === 'ArrowRight' && e.altKey) goTo(index + 1, playing)
      if (e.code === 'ArrowLeft' && e.altKey) goTo(index - 1, playing)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const pct = duration > 0 ? (progress / duration) * 100 : 0

  return (
    <div className="app">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={handleEnded}
        onError={() => setError(true)}
        preload="metadata"
      />

      <main className="player-card">
        <section className="now-playing">
          <div className="cover-wrap">
            <img src="/cover.png" alt="Portada del álbum" className={`cover ${playing ? 'spinning' : ''}`} />
            <div className="cover-glow" />
          </div>

          <p className="label">Reproduciendo</p>
          <h1 className="track-title">{track.title}</h1>
          <p className="track-meta">
            Pista {index + 1} de {TRACKS.length}
          </p>

          {error && <p className="error">No se pudo cargar el audio.</p>}

          <div className="progress-row">
            <span className="time">{formatTime(progress)}</span>
            <input
              type="range"
              className="progress"
              min="0"
              max={duration || 0}
              step="0.1"
              value={progress}
              onChange={handleSeek}
              style={{ '--pct': `${pct}%` }}
              aria-label="Progreso"
            />
            <span className="time">{formatTime(duration)}</span>
          </div>

          <div className="controls">
            <button className="ctrl secondary" onClick={() => goTo(index - 1)} aria-label="Anterior">
              ⏮
            </button>
            <button className="ctrl play" onClick={togglePlay} aria-label={playing ? 'Pausar' : 'Reproducir'}>
              {playing ? '⏸' : '▶'}
            </button>
            <button className="ctrl secondary" onClick={() => goTo(index + 1)} aria-label="Siguiente">
              ⏭
            </button>
          </div>

          <div className="volume-row">
            <span>🔊</span>
            <input
              type="range"
              className="volume"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolume}
              style={{ '--pct': `${volume * 100}%` }}
              aria-label="Volumen"
            />
          </div>
        </section>

        <section className="playlist">
          <h2>Lista de canciones</h2>
          <ol>
            {TRACKS.map((t, i) => (
              <li key={t.file}>
                <button
                  className={`track ${i === index ? 'active' : ''}`}
                  onClick={() => selectTrack(i)}
                >
                  <span className="track-num">
                    {i === index && playing ? '♪' : String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="track-name">{t.title}</span>
                  {i === index && playing && <span className="bars"><i /><i /><i /></span>}
                </button>
              </li>
            ))}
          </ol>
          <p className="hint">Espacio: reproducir/pausar · Alt+←/→: cambiar pista</p>
        </section>
      </main>
    </div>
  )
}
