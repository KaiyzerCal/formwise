import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { COLORS, FONT, FONT_LINK } from '@/components/bioneer/ui/DesignTokens';

export default function TermsOfService() {
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
          <h1 className="text-xs tracking-[0.15em] uppercase font-bold flex-1" style={{ color: COLORS.gold }}>Terms of Service</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 max-w-2xl mx-auto">
          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Acceptance of Terms</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              By accessing and using FormWise Go, you agree to be bound by these Terms of Service. If you do not agree to any part of these terms, you may not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Description of Service</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              FormWise Go is an AI-assisted fitness form analysis tool that uses your device's camera to analyze movement patterns and provide real-time coaching feedback. This service is <span style={{ color: COLORS.warning }}>NOT a medical device</span> and is <span style={{ color: COLORS.warning }}>NOT a substitute for professional medical or physiotherapy advice</span>.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.fault }}>Medical Disclaimer</h2>
            <div className="text-[10px] leading-relaxed space-y-2 p-3 rounded border" style={{ color: COLORS.textSecondary, borderColor: COLORS.fault, background: 'rgba(255,68,68,0.05)' }}>
              <p className="font-bold" style={{ color: COLORS.fault }}>READ CAREFULLY:</p>
              <p>FormWise Go provides general fitness guidance only. <span style={{ color: COLORS.fault }}>Consult a qualified healthcare professional before beginning any exercise program.</span></p>
              <p><span style={{ color: COLORS.fault }}>Do not use this app if you have an injury or medical condition without clearance from a doctor.</span></p>
              <p><span style={{ color: COLORS.fault }}>Stop exercising immediately if you feel pain or discomfort.</span> Pain is a warning signal that should never be ignored.</p>
              <p>FormWise Go is designed to enhance proper technique, not to diagnose, treat, or prevent any medical condition.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>User Responsibilities</h2>
            <div className="text-[10px] leading-relaxed space-y-2" style={{ color: COLORS.textSecondary }}>
              <p>• You are responsible for maintaining the confidentiality of your account credentials.</p>
              <p>• You must provide accurate and complete profile information.</p>
              <p>• You agree to use this service only for lawful purposes and in a way that does not infringe upon the rights of others.</p>
              <p>• You assume all responsibility for the safety and appropriateness of your exercise routine.</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Intellectual Property</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              All content, features, and functionality of FormWise Go (including but not limited to software, algorithms, and coaching frameworks) are owned by FormWise, Inc. or its licensors. You may not reproduce, distribute, or transmit any content without explicit written permission.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Limitation of Liability</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              FormWise Go is provided "as is" without warranties of any kind, express or implied. We are not liable for any injury, loss, or damage (direct or indirect) arising from your use of this app, including but not limited to physical injury sustained during exercise. Use this service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Termination</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              We reserve the right to terminate or suspend your account at any time for violations of these Terms of Service or for any reason at our sole discretion. Upon termination, your access to the service will be immediately revoked.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Governing Law</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              These Terms of Service are governed by and construed in accordance with the laws of the United States, without regard to its conflict of law principles.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-bold tracking-[0.12em] uppercase mb-2" style={{ color: COLORS.gold }}>Contact Us</h2>
            <p className="text-[10px] leading-relaxed" style={{ color: COLORS.textSecondary }}>
              For questions about these Terms of Service, contact us at <span style={{ color: COLORS.gold }}>legal@formwisego.com</span>.
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