'use client';

import { isAxiosError } from 'axios';
import { useState } from 'react';

import { sendTestSms, TestSmsResult } from '@/services/notifications.services';

export default function SettingsPage() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<TestSmsResult | null>(null);
  const [error, setError] = useState('');

  const handleSendTestSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Enter a phone number');
      return;
    }

    try {
      setIsSending(true);
      setError('');
      setResult(null);
      setResult(await sendTestSms(phone.trim(), message.trim()));
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined;
      const serverMessage = isAxiosError(err) ? err.response?.data?.message : undefined;
      setError(
        status === 403
          ? 'Only admins can send a test SMS.'
          : serverMessage || 'Could not reach the server to send the test SMS.',
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-3 text-sm text-gray-600">
          Settings and configuration will be managed here.
        </p>
      </div>

      <div className="rounded-lg bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Test SMS</h2>
        <p className="mt-1 text-sm text-gray-600">
          Sends one SMS through iBulky using the live settings, and shows exactly what
          iBulky replied. Each test uses SMS credit.
        </p>

        <form onSubmit={handleSendTestSms} className="mt-5 grid max-w-xl gap-3">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number, e.g. 09081616518"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (optional)"
            maxLength={300}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={isSending}
            className="w-fit rounded-md bg-[#1C4A1C] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSending ? 'Sending...' : 'Send test SMS'}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {result && (
          <div
            className={`mt-4 rounded-md border p-4 text-sm ${
              result.success
                ? 'border-green-200 bg-green-50 text-green-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            <p className="font-semibold">
              {result.success
                ? `Sent to ${result.recipient}. It should arrive shortly.`
                : `Not sent to ${result.recipient}.`}
            </p>
            {!result.apiKeyConfigured && (
              <p className="mt-1">
                IBULKY_API_KEY isn&apos;t set on the API server, so nothing was sent to iBulky.
              </p>
            )}
            {result.error && <p className="mt-1">Reason: {result.error}</p>}
            <p className="mt-2 text-xs opacity-80">
              Sender ID: {result.sender}
              {result.providerResponse ? ` · iBulky replied: ${result.providerResponse}` : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
