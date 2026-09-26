import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * Magic UI BentoGrid, trimmed to the grid container.
 * The upstream BentoCard is not used: it assumes an icon, a description and a
 * call to action, and pulls in Radix icons and a shadcn Button. The tiles here
 * carry real content instead, so they are written locally.
 */

interface BentoGridProps extends ComponentPropsWithoutRef<'div'> {
  children: ReactNode;
  className?: string;
}

const BentoGrid = ({ children, className, ...props }: BentoGridProps) => (
  <div className={cn('grid w-full grid-cols-1 gap-4 md:grid-cols-6', className)} {...props}>
    {children}
  </div>
);

export { BentoGrid };
