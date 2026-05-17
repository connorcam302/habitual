import * as React from 'react'
import { cn } from '@/lib/utils'

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'w-full min-h-16 resize-none rounded-[10px] px-3 py-[10px]',
          'bg-[var(--surface-3)] border border-[1.5px] border-[var(--border)]',
          'text-[var(--text)] text-[13px] font-display',
          'placeholder:text-[var(--text-dim)] placeholder:opacity-40',
          'outline-none focus:border-[color-mix(in_oklch,var(--football)_30%,transparent)]',
          'transition-colors',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
