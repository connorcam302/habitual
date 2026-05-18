export default function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider mb-2">
      {children}
    </p>
  )
}
