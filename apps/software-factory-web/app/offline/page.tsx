'use client';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a1628]">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">📡</div>
        <h1 className="mb-2 text-2xl font-bold text-white">You are offline</h1>
        <p className="mb-6 text-sm text-slate-400">
          BAC Software Factory requires an internet connection. Your work is saved locally and will sync when you reconnect.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-cyan-500 px-6 py-2 text-sm font-medium text-white hover:bg-cyan-400"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
