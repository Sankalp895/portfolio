import { useEffect, useState } from 'react';
import { NumberTicker } from '@/components/magicui/number-ticker';

/**
 * Counts a real figure up on scroll.
 *
 * Two rules this has to obey, both of which rule out using Magic UI's NumberTicker
 * on its own:
 *
 *  1. The correct number must be in the HTML. NumberTicker renders its startValue,
 *     so without JavaScript the page would show 0 where a real measurement belongs.
 *     Here the true value is always rendered, and the ticker only takes over after
 *     mount, which also removes the hydration mismatch.
 *  2. It must not move the page. A counter going from 0 to 197.57 changes width as
 *     digits arrive, which is layout shift. The final value is rendered underneath
 *     as a hidden twin, so the box is the right size before counting starts.
 */

type Props = {
  value: number;
  decimals?: number;
  className?: string;
};

export default function StatTicker({ value, decimals = 0, className }: Props) {
  const [animate, setAnimate] = useState(false);

  const shown = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  useEffect(() => {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAnimate(true);
  }, []);

  return (
    <span className={className} style={{ position: 'relative', display: 'inline-grid' }}>
      {/* Reserves the final width so the count cannot shift anything. */}
      <span aria-hidden="true" style={{ visibility: 'hidden', gridArea: '1 / 1' }}>
        {shown}
      </span>
      <span style={{ gridArea: '1 / 1' }}>
        {animate ? <NumberTicker value={value} decimalPlaces={decimals} /> : shown}
      </span>
    </span>
  );
}
