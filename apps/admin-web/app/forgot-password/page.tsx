'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Logo } from '../../components/brand/Logo';
import { forgotPassword } from '../../services/auth.services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const response = await forgotPassword(email.trim());

      setMessage(response.message);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || 'Failed to generate reset password link',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <Logo style={{ height: 64, margin: '0 auto 16px', display: 'block' }} />
        <h1 style={titleStyle}>Forgot Password</h1>
        <p style={subtitleStyle}>
          Enter your email address and we’ll generate a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={inputStyle}
            />
          </div>

          {error ? <p style={errorStyle}>{error}</p> : null}
          {message ? <p style={successStyle}>{message}</p> : null}

          <button type="submit" disabled={isSubmitting} style={buttonStyle}>
            {isSubmitting ? 'Generating...' : 'Send Reset Link'}
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