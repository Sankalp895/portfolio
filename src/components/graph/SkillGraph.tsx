import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

export type GraphNode = SimulationNodeDatum & {
  id: string;
  label: string;
  kind: 'skill' | 'project';
  group?: string;
  href?: string;
};

export type GraphLink = SimulationLinkDatum<GraphNode> & { source: string | GraphNode; target: string | GraphNode };

type Props = {
  nodes: GraphNode[];
  links: GraphLink[];
  groups: { id: string; label: string }[];
};

const W = 900;
const H = 620;

export default function SkillGraph({ nodes, links, groups }: Props) {
  const [group, setGroup] = useState('all');
  const [selected, setSelected] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const simNodes = useRef<GraphNode[]>([]);
  const simLinks = useRef<GraphLink[]>([]);

  const view = useMemo(() => {
    const keep =
      group === 'all'
        ? nodes
        : nodes.filter((n) => n.kind === 'project' || n.group === group);
    const ids = new Set(keep.map((n) => n.id));
    const ls = links.filter((l) => ids.has(l.source as string) && ids.has(l.target as string));
    const linked = new Set<string>();
    ls.forEach((l) => {
      linked.add(l.source as string);
      linked.add(l.target as string);
    });
    return {
      nodes: keep.filter((n) => linked.has(n.id)).map((n) => ({ ...n })),
      links: ls.map((l) => ({ ...l })),
    };
  }, [group, nodes, links]);

  useEffect(() => {
    const ns = view.nodes;
    const ls = view.links;
    simNodes.current = ns;
    simLinks.current = ls;

    const sim = forceSimulation<GraphNode>(ns)
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(ls)
          .id((d) => d.id)
          .distance((l) => ((l.target as GraphNode).kind === 'project' ? 70 : 55))
          .strength(0.35)
      )
      .force('charge', forceManyBody().strength((d) => ((d as GraphNode).kind === 'project' ? -420 : -130)))
      .force('center', forceCenter(W / 2, H / 2))
      .force('collide', forceCollide<GraphNode>().radius((d) => (d.kind === 'project' ? 46 : 16)))
      .force('x', forceX(W / 2).strength(0.035))
      .force('y', forceY(H / 2).strength(0.06));

    // Keep every node, and the room its label needs, inside the viewBox.
    const clamp = () => {
      for (const n of ns) {
        const padL = n.kind === 'project' ? 70 : 12;
        const padR = n.kind === 'project' ? 70 : 150;
        n.x = Math.min(Math.max(n.x ?? W / 2, padL), W - padR);
        n.y = Math.min(Math.max(n.y ?? H / 2, 26), H - (n.kind === 'project' ? 34 : 18));
      }
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      sim.stop();
      for (let i = 0; i < 320; i++) sim.tick();
      clamp();
      setTick((t) => t + 1);
      return () => {
        sim.stop();
      };
    }

    sim.on('tick', () => {
      clamp();
      setTick((t) => t + 1);
    });
    return () => {
      sim.stop();
    };
  }, [view]);

  const neighbours = useMemo(() => {
    if (!selected) return null;
    const set = new Set<string>([selected]);
    simLinks.current.forEach((l) => {
      const s = (l.source as GraphNode).id ?? (l.source as string);
      const t = (l.target as GraphNode).id ?? (l.target as string);
      if (s === selected) set.add(t);
      if (t === selected) set.add(s);
    });
    return set;
  }, [selected, tick]);

  const dim = (id: string) => (neighbours ? !neighbours.has(id) : false);
  const selectedNode = simNodes.current.find((n) => n.id === selected);

  return (
    <div className="graph">
      <div className="ctrl">
        <div className="chips">
          <button type="button" className={group === 'all' ? 'on' : ''} onClick={() => setGroup('all')}>
            All
          </button>
          {groups.map((g) => (
            <button key={g.id} type="button" className={group === g.id ? 'on' : ''} onClick={() => setGroup(g.id)}>
              {g.label}
            </button>
          ))}
        </div>
        <p className="hint">
          {selectedNode
            ? `${selectedNode.label}: ${(neighbours?.size ?? 1) - 1} linked ${selectedNode.kind === 'skill' ? 'projects' : 'skills'}. Click again to clear.`
            : 'Click a node. Its evidence lights up, everything else dims.'}
        </p>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="svg" role="img" aria-label="A graph linking each skill to the projects that prove it. The same information is in the table below.">
        <g>
          {simLinks.current.map((l, i) => {
            const s = l.source as GraphNode;
            const t = l.target as GraphNode;
            if (typeof s === 'string' || typeof t === 'string') return null;
            const off = neighbours ? !(neighbours.has(s.id) && neighbours.has(t.id)) : false;
            return (
              <line
                key={i}
                x1={s.x}
                y1={s.y}
                x2={t.x}
                y2={t.y}
                stroke={off ? 'var(--grid)' : 'var(--accent)'}
                strokeOpacity={off ? 0.25 : 0.4}
                strokeWidth={off ? 0.6 : 1.1}
              />
            );
          })}
        </g>

        <g>
          {simNodes.current.map((n) => {
            const isProject = n.kind === 'project';
            const off = dim(n.id);
            const r = isProject ? 9 : 4.5;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x ?? 0} ${n.y ?? 0})`}
                opacity={off ? 0.22 : 1}
                className="node"
                onClick={() => setSelected(selected === n.id ? null : n.id)}
                tabIndex={0}
                role="button"
                aria-label={`${n.label}, ${n.kind}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(selected === n.id ? null : n.id);
                  }
                }}
              >
                <circle
                  r={r}
                  fill={isProject ? 'var(--accent)' : 'var(--panel)'}
                  stroke={isProject ? 'var(--accent)' : 'var(--muted)'}
                  strokeWidth={1.2}
                />
                <text
                  x={isProject ? 0 : r + 5}
                  y={isProject ? r + 14 : 3.5}
                  textAnchor={isProject ? 'middle' : 'start'}
                  fontSize={isProject ? 12 : 9.5}
                  fill={isProject ? 'var(--ink)' : 'var(--muted)'}
                  fontFamily={isProject ? 'var(--font-ui)' : 'var(--font-mono)'}
                >
                  {n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="legend">
        <span><i className="dot proj" /> project</span>
        <span><i className="dot skill" /> skill</span>
        {selectedNode?.href && (
          <a href={selectedNode.href} className="link-arrow">
            Open {selectedNode.label}
          </a>
        )}
      </div>

      <style>{`
        .graph { border: 1px solid var(--grid); border-radius: var(--radius); background: var(--panel); padding: 0.9rem; }
        .ctrl { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 0.5rem; }
        .chips { display: flex; flex-wrap: wrap; gap: 0.35rem; }
        .chips button {
          font-family: var(--font-mono); font-size: 0.6875rem;
          padding: 0.3rem 0.6rem; border: 1px solid var(--grid); border-radius: 2px;
          background: none; color: var(--muted); cursor: pointer;
        }
        .chips button:hover { color: var(--ink); }
        .chips button.on { color: var(--accent); border-color: var(--accent); background: var(--accent-soft); }
        .hint { margin: 0; font-size: 0.75rem; color: var(--muted); }
        .svg { width: 100%; height: auto; aspect-ratio: 900 / 620; display: block; touch-action: pan-y; }
        .node { cursor: pointer; }
        .node:focus-visible circle { outline: 2px solid var(--accent); outline-offset: 2px; }
        .legend {
          display: flex; align-items: center; gap: 1.25rem; flex-wrap: wrap;
          padding-top: 0.6rem; border-top: 1px solid var(--grid);
          font-family: var(--font-mono); font-size: 0.6875rem; color: var(--muted);
        }
        .legend span { display: inline-flex; align-items: center; gap: 0.4rem; }
        .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block; }
        .dot.proj { background: var(--accent); }
        .dot.skill { background: var(--panel); border: 1px solid var(--muted); }
      `}</style>
    </div>
  );
}
