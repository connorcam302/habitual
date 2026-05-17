export default function LoadingScreen() {
  return (
    <div
      role="status"
      aria-label="Loading Habitual"
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg"
    >
      <div className="flex gap-1.5">
        <div className="loader-dot w-1.5 h-1.5 rounded-full bg-football" />
        <div className="loader-dot loader-dot-2 w-1.5 h-1.5 rounded-full bg-strength" />
        <div className="loader-dot loader-dot-3 w-1.5 h-1.5 rounded-full bg-chinese" />
      </div>
      <div className="font-mono text-[13px] tracking-[0.25em] text-text-muted mt-4">
        HABITUAL
      </div>
    </div>
  )
}
