// Layer 5 UI: Feedback banner — slides up, pointer-events none, auto-dismisses
import React, { useState, useEffect, useRef } from "react";

const SEVERITY_COLOR = {
  HIGH:     "#EF4444",
  MODERATE: "#F97316",
  LOW:      "#C9A84C",
};

export default function LiveFeedbackBanner({ cue }) {
  const [visible,  setVisible]  = useState(false);
  const [text,     setText]     = useState('');
  const [color,    setColor]    = useState('#C9A84C');
  const [slideIn,  setSlideIn]  = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!cue) return;

    // Clear any existing dismiss timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setText(cue.text);
    setColor(SEVERITY_COLOR[cue.severity] ?? '#C9A84C');
    setVisible(true);

    // Trigger slide-in on next tick
    requestAnimationFrame(() => setSlideIn(true));

    // Dismiss after 14.5s (15s lock - 0.5s fade)
    timerRef.current = setTimeout(() => {
      setSlideIn(false);
      setTimeout(() => setVisible(false), 300);
    }, 14_500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [cue?.tMs]); // key on tMs — new cue always re-triggers

  if (!visible) return null;

  return (
    <div
      style={{
        position:         'absolute',
        bottom:           80,
        left:             16,
        right:            16,
        height:           52,
        backgroundColor:  'rgba(0,0,0,0.90)',
        borderRadius:     10,
        borderLeft:       `3px solid ${color}`,
        display:          'flex',
        alignItems:       'center',
        paddingLeft:      16,
        paddingRight:     16,
        zIndex:           10,
        pointerEvents:    'none',
        transform:        slideIn ? 'translateY(0)' : 'translateY(72px)',
        opacity:          slideIn ? 1 : 0,
        transition:       'transform 200ms cubic-bezier(0.22,1,0.36,1), opacity 200ms ease',
      }}
    >
      <span
        style={{
          color,
          fontFamily:    "'DM Mono', monospace",
          fontSize:       13,
          fontWeight:     600,
          letterSpacing:  '0.04em',
          textTransform:  'uppercase',
        }}
      >
        {text}
      </span>
    </div>
  );
}