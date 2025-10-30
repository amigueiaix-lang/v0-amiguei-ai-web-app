export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <h1 className="font-serif text-2xl font-bold tracking-tight">
        Amiguei<span className="text-primary">.</span>AI
      </h1>
    </div>
  )
}
