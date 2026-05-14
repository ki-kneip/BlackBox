export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0f0f11]">
      {/* Left panel — branding */}
      <div className="relative hidden w-[420px] shrink-0 flex-col justify-between overflow-hidden border-r border-white/[0.06] p-10 lg:flex">
        {/* Grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div className="pointer-events-none absolute bottom-0 left-0 h-80 w-80 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/[0.04] blur-3xl" />

        {/* Logo */}
        <div className="relative flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.08] ring-1 ring-white/[0.12]">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.35"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.35"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.12"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">BlackBox</span>
        </div>

        {/* Tagline */}
        <div className="relative space-y-3">
          <p className="text-2xl font-semibold leading-snug tracking-tight text-white">
            Immutable logs.<br />
            <span className="text-[#52525b]">Always traceable.</span>
          </p>
          <p className="text-sm leading-relaxed text-[#3f3f46]">
            Hash-chained, tamper-proof log storage with real-time streaming and fine-grained access control.
          </p>
        </div>

        {/* Features */}
        <div className="relative space-y-2">
          {["SHA-256 hash chain integrity", "Role-based access control", "Real-time WebSocket streaming"].map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-xs text-[#52525b]">
              <div className="h-1 w-1 rounded-full bg-[#3f3f46]" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.08] ring-1 ring-white/[0.1]">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.9"/>
              <rect x="11" y="3" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.35"/>
              <rect x="3" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.35"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" fillOpacity="0.12"/>
            </svg>
          </div>
          <span className="text-sm font-semibold text-white">BlackBox</span>
        </div>

        <div className="w-full max-w-[360px]">
          {children}
        </div>
      </div>
    </div>
  );
}
