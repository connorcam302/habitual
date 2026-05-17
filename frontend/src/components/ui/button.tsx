import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap font-display font-semibold transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-football focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        cta: 'rounded-[14px] text-white bg-gradient-cta hover:opacity-92 active:opacity-85',
        outline: 'rounded-[14px] border border-[var(--border)] bg-[var(--surface-3)] text-[var(--text-muted)] hover:border-[var(--text-muted)] hover:text-[var(--text)]',
        ghost: 'bg-transparent text-[var(--text-dim)] hover:text-[var(--text-muted)]',
        nav: 'rounded-[10px] border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:bg-[var(--surface-3)]',
      },
      size: {
        default: 'px-4 py-4 text-base',
        sm: 'px-5 py-4 text-[15px]',
        icon: 'w-[30px] h-[30px] rounded-full border-2 border-[var(--border)]',
      },
    },
    defaultVariants: {
      variant: 'cta',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
