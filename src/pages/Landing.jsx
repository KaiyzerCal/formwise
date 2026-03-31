import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { COLORS, FONT, FONT_LINK } from "@/components/bioneer/ui/DesignTokens";

export default function Landing() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode]         = useState('login');   // 'login' | 'signup' | 'magic'
  const [loading, setLoading]   = useState(false);
  const [message, setMessage]   = useState(null);
  const [error, setError]       = useState(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage('Check your email for a login link!');
      } else if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created! Check your email to confirm.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // AuthContext will detect the session change and redirect automatically
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } });
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 4,
    color: COLORS.textPrimary,
    fontFamily: FONT.mono,
    fontSize: 11,
    outline: 'none',
    letterSpacing: '0.05em',
  };

  const btnStyle = {
    width: '100%',
    padding: '12px',
    background: COLORS.goldDim,
    border: `1px solid ${COLORS.gold}`,
    borderRadius: 4,
    color: COLORS.gold,
    fontFamily: FONT.mono,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.25em',
    textTransform: 'uppercase',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

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
        <div className="w-full max-w-sm space-y-3" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 24, background: COLORS.surface }}>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            {[['login','Sign In'],['signup','Sign Up'],['magic','Magic Link']].map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(null); setMessage(null); }}
                className="flex-1 py-1.5 text-[9px] font-bold tracking-[0.12em] uppercase rounded"
                style={{ background: mode === m ? COLORS.goldDim : 'transparent', border: `1px solid ${mode === m ? COLORS.gold : COLORS.border}`, color: mode === m ? COLORS.gold : COLORS.textTertiary, cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          <input type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} style={inputStyle} />

          {mode !== 'magic' && (
            <input type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} style={inputStyle} />
          )}

          {error   && <p className="text-[10px]" style={{ color: '#ef4444' }}>{error}</p>}
          {message && <p className="text-[10px]" style={{ color: COLORS.gold }}>{message}</p>}

          <button onClick={handleSubmit} disabled={loading} style={btnStyle}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Magic Link'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 h-px" style={{ background: COLORS.border }} />
            <span className="text-[9px] uppercase tracking-[0.1em]" style={{ color: COLORS.textTertiary }}>or</span>
            <div className="flex-1 h-px" style={{ background: COLORS.border }} />
          </div>

          <button onClick={handleGoogle}
            className="w-full py-3 text-[10px] font-bold tracking-[0.2em] uppercase rounded"
            style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.textSecondary, cursor: 'pointer', fontFamily: FONT.mono }}>
            Continue with Google
          </button>
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
