type Props = Readonly<{
  isConnecting: boolean
  errorMessage: string | null
  onRetry: () => void
}>

export function ConnectionStatusScreen({ isConnecting, errorMessage, onRetry }: Props) {
  return (
    <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center px-4 pb-10 pt-8 sm:px-6 sm:pt-12">
      <div className="w-full rounded-3xl border border-arena-border bg-arena-panel p-6 text-center shadow-[0_25px_80px_-20px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:p-8">
        <p className="mb-2 font-medium tracking-[0.35em] text-xs uppercase text-slate-500">
          Connection
        </p>
        <h1 className="bg-linear-to-r from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text font-bold text-3xl tracking-tight text-transparent sm:text-4xl">
          {isConnecting ? 'Connecting to server...' : 'You are not connected to server'}
        </h1>
        <p className="mt-3 text-sm text-slate-400">
          {isConnecting
            ? 'Setting up session and realtime socket.'
            : errorMessage ?? 'Please reconnect to continue matchmaking.'}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            disabled={isConnecting}
            className="rounded-xl border border-cyan-500/35 bg-cyan-500/15 px-5 py-2.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-500/25 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isConnecting ? 'Connecting...' : 'Retry connection'}
          </button>
        </div>
      </div>
    </div>
  )
}
