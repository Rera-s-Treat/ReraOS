'use client';

import { FormEvent, Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Logo } from '../../components/brand/Logo';
import { resetPassword } from '../../services/auth.services';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get('token') ?? '', [searchParams]);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    if (!password.trim()) {
      setError('New password is required');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const response = await resetPassword(token, password);

      setMessage(response.message);

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to reset password',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo style={{ height: 64, margin: '0 auto 16px', display: 'block' }} />
        <h1 style={titleStyle}>Reset Password</h1>
        <p style={subtitleStyle}>
          Enter your new password below.
        </p>

        {!token ? (
          <p style={errorStyle}>
            Reset token is missing. Please restart the forgot password flow.
          </p>
        ) : null}

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              style={inputStyle}
            />
          </div>

          {error ? <p style={errorStyle}>{error}</p> : null}
          {message ? <p style={successStyle}>{message}</p> : null}

          <button
            type="submit"
            disabled={isSubmitting || !token}
            style={buttonStyle}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={footerStyle}>
          <Link href="/">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f7f8fa',
  padding: 24,
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 460,
  background: '#ffffff',
  borderRadius: 12,
  padding: 32,
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  marginBottom: 8,
  fontSize: 28,
};

const subtitleStyle: React.CSSProperties = {
  marginTop: 0,
  marginBottom: 24,
  color: '#555',
  lineHeight: 1.5,
};

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 16,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  fontSize: 14,
};

const buttonStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#E8621A',
  color: '#ffffff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};

const errorStyle: React.CSSProperties = {
  color: '#b42318',
  marginBottom: 16,
};

const successStyle: React.CSSProperties = {
  color: '#027a48',
  marginBottom: 16,
};

const footerStyle: React.CSSProperties = {
  marginTop: 20,
  textAlign: 'center',
};