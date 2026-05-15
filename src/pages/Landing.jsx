import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { COLORS, FONT, FONT_LINK } from "@/components/bioneer/ui/DesignTokens";

const INPUT_STYLE = {
  width: '100%',
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.04)',
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  color: '#fff',
  fontFamily: FONT.mono,
  fontSize: 11,
  letterSpacing: '0.06em',
  outline: 'none',
  boxSizing: 'border-box',
};

const BTN_PRIMARY = {
  width: '100%',
  padding: '14px',
  background: COLORS.goldDim,
  border: `1px solid ${COLORS.gold}`,
  borderRadius: 4,
  color: COLORS.gold,
  fontFamily: FONT.mono,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

export default function Landing() {
  const [mode, setMode]         = useState('signin'); // 'signin' | 'signup' | 'magic'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const clearStatus = () => { setError(null); setSuccess(null); };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true); clearStatus();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true); clearStatus();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Check your email to confirm your account, then sign in.');
      setMode('signin');
    }
    setLoading(false);
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setLoading(true); clearStatus();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Magic link sent — check your email.');
    }
    setLoading(false);
  };

  const onSubmit = mode === 'signup' ? handleSignUp
                 : mode === 'magic'  ? handleMagicLink
                 :                     handleSignIn;

  const TABS = [
    { id: 'signin', label: 'Sign In' },
    { id: 'signup', label: 'Sign Up' },
    { id: 'magic',  label: 'Magic Link' },
  ];

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="fixed inset-0 flex flex-col items-center justify-center px-6"
        style={{ background: COLORS.bg, fontFamily: FONT.mono }}>

        {/* Logo */}
        <div className="mb-2 flex items-center gap-2">
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
          <span className="text-2xl font-bold tracking-[0.4em] uppercase"
            style={{ color: COLORS.gold, fontFamily: FONT.heading }}>BIONEER</span>
          <div className="w-px h-8" style={{ background: COLORS.gold }} />
        </div>
        <p className="text-[9px] tracking-[0.35em] uppercase mb-10"
          style={{ color: 'rgba(201,168,76,0.45)' }}>FORMWISE</p>

        {/* Auth card */}
        <div className="w-full max-w-sm"
          style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 24, background: COLORS.surface }}>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => { setMode(id); clearStatus(); }}
                style={{
                  flex: 1, padding: '6px 0',
                  background: mode === id ? COLORS.goldDim : 'transparent',
                  border: `1px solid ${mode === id ? COLORS.gold : COLORS.border}`,
                  borderRadius: 4,
                  color: mode === id ? COLORS.gold : COLORS.textSecondary,
                  fontFamily: FONT.mono, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                }}>
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <input
              type="email" placeholder="EMAIL ADDRESS" value={email}
              onChange={e => setEmail(e.target.value)}
              required autoComplete="email"
              style={INPUT_STYLE}
            />

            {mode !== 'magic' && (
              <input
                type="password" placeholder="PASSWORD" value={password}
                onChange={e => setPassword(e.target.value)}
                required minLength={6}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                style={INPUT_STYLE}
              />
            )}

            {error && (
              <p style={{ color: '#ef4444', fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.05em' }}>
                {error}
              </p>
            )}
            {success && (
              <p style={{ color: COLORS.gold, fontFamily: FONT.mono, fontSize: 10, letterSpacing: '0.05em' }}>
                {success}
              </p>
            )}

            <button type="submit" disabled={loading}
              style={{ ...BTN_PRIMARY, opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}>
              {loading
                ? 'LOADING...'
                : mode === 'signup' ? 'CREATE ACCOUNT'
                : mode === 'magic'  ? 'SEND MAGIC LINK'
                : 'SIGN IN'}
            </button>
          </form>
        </div>

        {/* Bottom ornament */}
        <div className="absolute bottom-8 flex items-center gap-4">
          <div className="h-px w-12" style={{ background: COLORS.border }} />
          <span className="text-[8px] tracking-[0.2em] uppercase" style={{ color: COLORS.textTertiary }}>
            BIOMECHANICAL INTELLIGENCE
          </span>
          <div className="h-px w-12" style={{ background: COLORS.border }} />
        </div>
      </div>
    </>
  );
}
