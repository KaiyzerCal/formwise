import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { COLORS, FONT, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <>
      <link href={FONT_LINK} rel="stylesheet" />
      <div className="h-full flex flex-col" style={{ fontFamily: FONT.mono, background: COLORS.bg, color: COLORS.textPrimary }}>
        {/* Sticky header */}
        <div className="flex-shrink-0 border-b px-4 py-3 flex items-center gap-2" style={{ borderColor: COLORS.border, background: COLORS.surface }}>
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded hover:opacity-70 transition-opacity"
            style={{ color: COLORS.textSecondary }}
            title="Go back"
            aria-label="Go back">
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-xs tracking-[0.15em] uppercase font-bold flex-1" style={{ color: COLORS.gold }}>Privacy Policy</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 max-w-2xl mx-auto">
          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Who We Are</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              FormWise Go is a product of FormWise, Inc. We are committed to protecting your privacy and ensuring transparency in how we collect and use your data.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>What Data We Collect</h2>
            <div className="text-[10px] leading-relaxed space-y-2" style={{ color: COLORS.textSecondary }}>
              <p><span style={{ color: COLORS.correct }}>Camera Feed:</span> Processed on-device only using MediaPipe. Never stored or transmitted to our servers.</p>
              <p><span style={{ color: COLORS.correct }}>Pose Keypoints:</span> Processed locally, discarded immediately after session ends.</p>
              <p><span style={{ color: COLORS.correct }}>Account Data:</span> Email address and user profile information.</p>
              <p><span style={{ color: COLORS.correct }}>Session Metadata:</span> Exercise name, reps completed, form scores, detected faults, timestamps.</p>
              <p><span style={{ color: COLORS.correct }}>Device Info:</span> Browser type, operating system, device type.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>How We Use Your Data</h2>
            <div className="text-[10px] leading-relaxed space-y-2" style={{ color: COLORS.textSecondary }}>
              <p>• To provide personalized form analysis and coaching cues</p>
              <p>• To track your progress over time</p>
              <p>• To improve and refine the product based on anonymized usage patterns</p>
              <p>• To send you occasional notifications about your training</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Camera & Biometric Data</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              All video analysis is performed entirely on your device using the MediaPipe framework. No video frames, images, or raw camera data are ever uploaded to our servers. Pose keypoints (mathematical representations of body position) are processed in real-time and not persisted after your session ends.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Third-Party Services</h2>
            <div className="text-[10px] leading-relaxed space-y-2" style={{ color: COLORS.textSecondary }}>
              <p><span style={{ color: COLORS.correct }}>Base44:</span> Backend infrastructure, authentication, and data storage.</p>
              <p><span style={{ color: COLORS.correct }}>Google Gemini API:</span> Powers AI coaching cues. Only anonymized movement metrics (reps, form score, fault types) are sent—never video, images, or personal identifiers.</p>
              <p><span style={{ color: COLORS.correct }}>Stripe:</span> Processes payments securely. We do not store your payment information.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Data Retention</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              Session data is retained in your account until you request deletion or close your account. You may request permanent deletion of all data at any time by contacting privacy@formwisego.com.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Your Rights</h2>
            <div className="text-[10px] leading-relaxed space-y-2" style={{ color: COLORS.textSecondary }}>
              <p>• <span style={{ color: COLORS.correct }}>Access:</span> You can view all data associated with your account at any time.</p>
              <p>• <span style={{ color: COLORS.correct }}>Correction:</span> You can update your profile information.</p>
              <p>• <span style={{ color: COLORS.correct }}>Deletion:</span> You can request deletion of your account and all associated data.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Contact Us</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              For privacy inquiries or data requests, contact us at <span style={{ color: COLORS.gold }}>privacy@formwisego.com</span>.
            </p>
          </section>

          <section className="pt-4">
            <p className="text-[8px] tracking-[0.1em] uppercase" style={{ color: COLORS.textMuted }}>
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </section>
        </div>
      </div>
    </>
  );
}