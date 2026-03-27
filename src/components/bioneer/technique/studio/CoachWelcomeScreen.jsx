/**
 * CoachWelcomeScreen.jsx
 * 
 * First experience when coach opens Technique Studio
 * Sets tone: Simple. Focused. Powerful.
 */

import React from 'react';
import { Play, Edit2, Share2, BarChart3 } from 'lucide-react';
import { COLORS, FONT } from '../../ui/DesignTokens';

export default function CoachWelcomeScreen({ onClose }) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-8"
      style={{ background: COLORS.bg }}
    >
      <div className="max-w-2xl">
        {/* Hero */}
        <div className="mb-12 text-center">
          <h1
            className="text-5xl font-bold mb-4 tracking-tight"
            style={{
              color: COLORS.textPrimary,
              fontFamily: FONT.heading,
            }}
          >
            Technique Studio
          </h1>
          <p
            className="text-lg"
            style={{
              color: COLORS.textSecondary,
              fontFamily: FONT.mono,
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: '1.6',
            }}
          >
            Design better coaching. Connect with your clients. See improvement happen.
          </p>
        </div>

        {/* Four Core Features */}
        <div className="grid grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: Play,
              title: 'Watch & Analyze',
              desc: 'Frame-by-frame video review with live pose tracking',
            },
            {
              icon: Edit2,
              title: 'Annotate Freely',
              desc: 'Draw, highlight, label. Mark exactly what matters.',
            },
            {
              icon: Share2,
              title: 'Share Insights',
              desc: 'Send your notes directly to your client',
            },
            {
              icon: BarChart3,
              title: 'Track Progress',
              desc: 'Build a library of coaching moments',
            },
          ].map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl border-2 transition-all hover:border-current"
                style={{
                  background: COLORS.surface,
                  borderColor: COLORS.border,
                }}
              >
                <Icon
                  size={28}
                  className="mb-3"
                  style={{ color: COLORS.gold }}
                />
                <h3
                  className="font-semibold text-sm mb-1"
                  style={{
                    color: COLORS.textPrimary,
                    fontFamily: FONT.heading,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-xs"
                  style={{
                    color: COLORS.textSecondary,
                    fontFamily: FONT.mono,
                  }}
                >
                  {feature.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}
        <div
          className="p-6 rounded-2xl border-2 mb-8"
          style={{
            background: COLORS.goldDim,
            borderColor: COLORS.goldBorder,
          }}
        >
          <h3
            className="font-semibold text-sm mb-3"
            style={{
              color: COLORS.gold,
              fontFamily: FONT.heading,
            }}
          >
            Quick Tips
          </h3>
          <ul
            className="space-y-2 text-xs"
            style={{
              color: COLORS.textPrimary,
              fontFamily: FONT.mono,
            }}
          >
            <li>• Press <kbd className="px-1 py-0.5 border rounded text-[10px]">Space</kbd> to play/pause</li>
            <li>• Use arrow keys to step frame-by-frame</li>
            <li>• Press <kbd className="px-1 py-0.5 border rounded text-[10px]">V</kbd> for select, <kbd className="px-1 py-0.5 border rounded text-[10px]">T</kbd> for text</li>
            <li>• Your notes auto-save as you type</li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:scale-105"
          style={{
            background: COLORS.gold,
            color: COLORS.bg,
            fontFamily: FONT.heading,
          }}
        >
          Start Coaching
        </button>
      </div>
    </div>
  );
}