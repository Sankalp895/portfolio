import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type ConsoleItem = {
  label: string;
  href: string;
  group: string;
  hint?: string;
};

type Line = { kind: 'in' | 'out' | 'link'; text: string; href?: string };

const HELP: string[] = [
  'help          this list',
  'whoami        the short version',
  'missions      list every project',
  'papers        list the papers',
  'rigor         open the Rigor Log',
  'theme         switch Mission and Paper mode',
  'contact       email, GitHub, LinkedIn',
  'clear         clear the console',
  'exit          close this',
];

const COMMANDS = HELP.map((h) => h.split(' ')[0]);

export default function Console({ items = [] as ConsoleItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const termRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 9);
    return items
      .filter((i) => (i.label + ' ' + i.group + ' ' + (i.hint ?? '')).toLowerCase().includes(q))
      .slice(0, 9);
  }, [items, query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    const openers = Array.from(document.querySelectorAll('#open-palette, [data-open-console]'));
    openers.forEach((el) => el.addEventListener('click', onOpen));
    return () => {
      window.removeEventListener('keydown', onKey);
      openers.forEach((el) => el.removeEventListener('click', onOpen));
    };
  }, [close]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = '';
      return undefined;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    document.body.style.overflow = 'hidden';
    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines]);

  const say = (out: Line[]) => setLines((prev) => [...prev, ...out]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    say([{ kind: 'in', text: cmd }]);

    if (cmd === 'help') {
      say(HELP.map((text) => ({ kind: 'out' as const, text })));
      return;
    }

    if (cmd === 'whoami') {
      say([
        { kind: 'out', text: 'Sankalp Singh. B.Tech in AI and Data Science, GGSIPU Delhi, awarded May 2026.' },
        { kind: 'out', text: 'I build simulations at the edge of ML and mathematical modelling, then try hard to prove them wrong.' },
        { kind: 'out', text: 'Next: an M.Sc. abroad for 2027. Germany, Netherlands, Norway, USA.' },
      ]);
      return;
    }

    if (cmd === 'missions' || cmd === 'ls') {
      say(items.filter((i) => i.group === 'Mission').map((i) => ({ kind: 'link' as const, text: i.label, href: i.href })));
      return;
    }

    if (cmd === 'papers' || cmd === 'research') {
      say(items.filter((i) => i.group === 'Paper').map((i) => ({ kind: 'link' as const, text: i.label, href: i.href })));
      return;
    }

    if (cmd === 'rigor' || cmd === 'log') {
      window.location.href = '/rigor-log/';
      return;
    }

    if (cmd === 'theme') {
      const next = document.documentElement.dataset.theme === 'paper' ? 'mission' : 'paper';
      document.documentElement.dataset.theme = next;
      try {
        localStorage.setItem('theme', next);
      } catch {
        /* storage can be blocked; the theme still applies to this page */
      }
      document.querySelectorAll('[data-theme-label]').forEach((el) => {
        el.textContent = next === 'paper' ? 'Paper' : 'Mission';
      });
      say([{ kind: 'out', text: 'switched to ' + next + ' mode' }]);
      return;
    }

    if (cmd === 'contact') {
      say([
        { kind: 'link', text: 'sankalp895@gmail.com', href: 'mailto:sankalp895@gmail.com' },
        { kind: 'link', text: 'github.com/Sankalp895', href: 'https://github.com/Sankalp895' },
        { kind: 'link', text: 'linkedin.com/in/sankalp-singh-420b3a246', href: 'https://linkedin.com/in/sankalp-singh-420b3a246' },
      ]);
      return;
    }

    if (cmd === 'clear') {
      setLines([]);
      return;
    }

    if (cmd === 'exit' || cmd === 'q') {
      close();
      return;
    }

    say([{ kind: 'out', text: cmd + ': not a command. Type help.' }]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
      return;
    }
    if (e.key !== 'Enter') return;

    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    if (COMMANDS.includes(q.toLowerCase()) || results.length === 0) {
      run(q);
      setQuery('');
      return;
    }

    const target = results[active];
    if (target) window.location.href = target.href;
  };

  if (!open) return null;

  return (
    <div className="ov" role="dialog" aria-modal="true" aria-label="Command palette and console" onMouseDown={close}>
      <div className="pal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="row">
          <span className="prompt" aria-hidden="true">&gt;</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to a page, or type help"
            aria-label="Search pages or type a command"
            spellCheck={false}
            autoComplete="off"
          />
          <kbd>esc</kbd>
        </div>

        {lines.length > 0 && (
          <div className="term" ref={termRef}>
            {lines.map((l, i) =>
              l.kind === 'link' ? (
                <a key={i} className="tl link" href={l.href}>
                  {l.text}
                </a>
              ) : (
                <div key={i} className={'tl ' + l.kind}>
                  {l.kind === 'in' ? '> ' + l.text : l.text}
                </div>
              )
            )}
          </div>
        )}

        <div className="list">
          {results.length === 0 && <div className="empty">No page matches. Type help for commands.</div>}
          {results.map((r, i) => (
            <a
              key={r.href + i}
              href={r.href}
              className={'item' + (i === active ? ' on' : '')}
              onMouseEnter={() => setActive(i)}
            >
              <span className="grp">{r.group}</span>
              <span className="lab">{r.label}</span>
              {r.hint && <span className="hint">{r.hint}</span>}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .ov {
          position: fixed; inset: 0; z-index: 90;
          background: color-mix(in srgb, var(--bg) 72%, transparent);
          backdrop-filter: blur(4px);
          display: flex; align-items: flex-start; justify-content: center;
          padding: min(14vh, 120px) 1rem 1rem;
        }
        .pal {
          width: 100%; max-width: 560px;
          background: var(--panel); border: 1px solid var(--grid);
          border-radius: var(--radius); box-shadow: var(--shadow);
          overflow: hidden;
        }
        .row { display: flex; align-items: center; gap: 0.6rem; padding: 0.85rem 0.95rem; border-bottom: 1px solid var(--grid); }
        .prompt { font-family: var(--font-mono); color: var(--accent); }
        .row input {
          flex: 1; background: none; border: 0; outline: none; min-width: 0;
          color: var(--ink); font-family: var(--font-mono); font-size: 0.875rem;
        }
        .row input::placeholder { color: var(--muted); }
        kbd {
          font-family: var(--font-mono); font-size: 0.625rem; color: var(--muted);
          border: 1px solid var(--grid); border-radius: 2px; padding: 0.1em 0.4em;
        }
        .term {
          max-height: 200px; overflow-y: auto; padding: 0.7rem 0.95rem;
          border-bottom: 1px solid var(--grid); font-family: var(--font-mono); font-size: 0.75rem;
          white-space: pre-wrap;
        }
        .tl { color: var(--muted); line-height: 1.7; }
        .tl.in { color: var(--accent); }
        .tl.link { color: var(--ink); display: block; text-decoration: none; }
        .tl.link:hover { color: var(--accent); }
        .list { max-height: 46vh; overflow-y: auto; padding: 0.35rem; }
        .item {
          display: flex; align-items: baseline; gap: 0.7rem;
          padding: 0.5rem 0.6rem; border-radius: 2px; text-decoration: none; color: var(--ink);
        }
        .item.on { background: var(--accent-soft); }
        .grp {
          font-family: var(--font-mono); font-size: 0.625rem; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--muted); width: 62px; flex-shrink: 0;
        }
        .lab { font-size: 0.875rem; }
        .hint { font-size: 0.75rem; color: var(--muted); margin-left: auto; text-align: right; }
        .empty { padding: 0.9rem 0.6rem; font-size: 0.8125rem; color: var(--muted); }
        @media (max-width: 520px) { .hint { display: none; } }
      `}</style>
    </div>
  );
}
