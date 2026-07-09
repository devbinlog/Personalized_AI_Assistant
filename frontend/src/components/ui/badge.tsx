import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-[#334155]/10 text-[#334155]',
        secondary:
          'bg-white/[0.04] text-[#8a8f98]',
        destructive:
          'bg-red-500/10 text-red-400',
        outline:
          'bg-white/[0.04] text-[#8a8f98] border border-white/[0.08]',
        success:
          'bg-[#10b981]/10 text-[#10b981]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
