import { useEffect, useRef, useState } from 'react';

/**
 * A demo recording. The poster is the only thing that loads until the card is
 * near the viewport, the clip plays muted on hover or tap, and clicking opens a
 * full player with sound and controls.
 *
 * Under reduced motion nothing but the poster is ever fetched.
 *
 * The poster is rendered at the video's own aspect ratio and the <video> sits on
 * top of it, so nothing on the page moves when the clip loads.
 */

type Props = {
  slug: string;
  title: string;
  caption?: string;
  durationLabel?: string;
  /** Fill the parent instead of sitting at 16 by 9, for bento tiles. */
  fill?: boolean;
};

export default function DemoVideo({ slug, title, caption, durationLabel, fill = false }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dialogVideoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(true);
  const [near, setNear] = useState(false);
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  const base = `/media/demos/${slug}`;

  useEffect(() => {
    setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  // Only mount the <source> elements once the card is close to the viewport.
  useEffect(() => {
    if (reduced) return undefined;
    const el = wrapRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => dialogVideoRef.current?.play().catch(() => {}), 60);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      window.clearTimeout(t);
    };
  }, [open]);

  const start = () => {
    const v = videoRef.current;
    if (!v || reduced) return;
    v.play().then(() => setPlaying(true)).catch(() => {});
  };

  const stop = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  };

  return (
    <>
      <div
        ref={wrapRef}
        className={fill ? 'dv dv-fill' : 'dv'}
        onMouseEnter={start}
        onMouseLeave={stop}
        onTouchStart={start}
      >
        <button
          type="button"
          className="dv-hit"
          onClick={() => setOpen(true)}
          aria-label={`Play ${title} with sound`}
        >
          <img src={`${base}.jpg`} alt="" className="dv-poster" width="1280" height="720" loading="lazy" decoding="async" />

          {!reduced && near && (
            <video
              ref={videoRef}
              className={playing ? 'dv-video on' : 'dv-video'}
              muted
              loop
              playsInline
              preload="none"
              poster={`${base}.jpg`}
              aria-hidden="true"
            >
              <source src={`${base}.webm`} type="video/webm" />
              <source src={`${base}.mp4`} type="video/mp4" />
            </video>
          )}

          <span className="dv-chrome" aria-hidden="true">
            <span className="dv-play">
              <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </span>
            {durationLabel && <span className="dv-dur">{durationLabel}</span>}
          </span>
        </button>
      </div>

      {caption && <p className="dv-cap">{caption}</p>}

      {open && (
        <div className="dv-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={() => setOpen(false)}>
          <div className="dv-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="dv-head">
              <span>{title}</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <video ref={dialogVideoRef} controls playsInline poster={`${base}.jpg`} className="dv-full">
              <source src={`${base}.webm`} type="video/webm" />
              <source src={`${base}.mp4`} type="video/mp4" />
            </video>
          </div>
        </div>
      )}

      <style>{`
        .dv {
          position: relative;
          border-radius: 1.25rem;
          overflow: hidden;
          background: #1a1210;
          border: 1px solid var(--hairline);
        }
        .dv-fill { height: 100%; border-radius: 0; border: 0; }
        .dv-hit {
          display: block; width: 100%; height: 100%; padding: 0; border: 0;
          background: none; cursor: pointer; position: relative; line-height: 0;
        }
        /* The poster defines the box, so loading the clip shifts nothing. */
        .dv-poster { width: 100%; height: 100%; object-fit: cover; aspect-ratio: 16 / 9; display: block; }
        .dv-fill .dv-poster { aspect-ratio: auto; }
        .dv-video {
          position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
          opacity: 0; transition: opacity 0.4s ease;
        }
        .dv-video.on { opacity: 1; }
        .dv-chrome {
          position: absolute; left: 0.85rem; bottom: 0.85rem;
          display: inline-flex; align-items: center; gap: 0.5rem;
          pointer-events: none;
        }
        .dv-play {
          display: grid; place-items: center; width: 34px; height: 34px; border-radius: 999px;
          background: rgba(255,255,255,0.92); color: #1a1210;
          transition: transform 0.25s ease;
        }
        .dv:hover .dv-play { transform: scale(1.08); }
        .dv-dur {
          font-size: 0.6875rem; color: rgba(255,255,255,0.9);
          background: rgba(20,12,10,0.6); backdrop-filter: blur(8px);
          padding: 0.2rem 0.55rem; border-radius: 999px;
        }
        .dv-cap { margin: 0.9rem 0 0; font-size: 0.8125rem; color: var(--ink-faint); line-height: 1.55; }

        .dv-modal {
          position: fixed; inset: 0; z-index: 120;
          background: rgba(10, 8, 7, 0.82); backdrop-filter: blur(10px);
          display: flex; align-items: center; justify-content: center; padding: 1.5rem;
        }
        .dv-panel {
          width: 100%; max-width: 62rem;
          background: #100c0b; border-radius: 1.25rem; overflow: hidden;
          box-shadow: 0 40px 90px -30px rgba(0,0,0,0.9);
        }
        .dv-head {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          padding: 0.9rem 1.1rem; color: rgba(255,255,255,0.9); font-size: 0.875rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .dv-head button {
          background: none; border: 0; color: rgba(255,255,255,0.7); cursor: pointer;
          display: grid; place-items: center; padding: 0.25rem;
        }
        .dv-head button:hover { color: #fff; }
        .dv-full { width: 100%; display: block; background: #000; aspect-ratio: 16 / 9; }
      `}</style>
    </>
  );
}
