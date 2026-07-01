'use client';

import { useEffect, useState } from 'react';

type HealthResponse = {
  status: string;
  service: string;
  timestamp: string;
};

export default function Home() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/health';

    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Request failed with ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Unknown error');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-black dark:text-zinc-100">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-zinc-500">
          ReraOS admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Connected to the Nest API</h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-400">
          This page calls the backend health endpoint and displays its response.
        </p>

        <div className="mt-8 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {loading && <p className="text-sm text-zinc-500">Loading API status...</p>}
          {!loading && health && (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Status:</span> {health.status}
              </p>
              <p>
                <span className="font-medium">Service:</span> {health.service}
              </p>
              <p>
                <span className="font-medium">Timestamp:</span> {health.timestamp}
              </p>
            </div>
          )}
          {!loading && error && (
            <p className="text-sm text-red-500">Unable to reach the API: {error}</p>
          )}
        </div>
      </div>
    </main>
  );
}
