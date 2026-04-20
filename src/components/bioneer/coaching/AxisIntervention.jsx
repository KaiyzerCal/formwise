/**
 * AxisIntervention — streak-at-risk re-engagement toast
 */
import { base44 } from '@/api/base44Client';
import { isStreakAtRisk } from '@/lib/retentionEngine';
import toast from 'react-hot-toast';

export async function checkAxisIntervention(lastSessionDate, streak) {
  if (!isStreakAtRisk(lastSessionDate)) return;

  const today = new Date().toISOString().split('T')[0];
  const key = `axis_intervention_${today}`;
  if (localStorage.getItem(key)) return;

  const prompt = `This athlete has a ${streak || 0}-day streak. They haven't trained yet today and the day is running out. Write one message — under 25 words — that sounds like it came from a coach who genuinely noticed they were gone. Reference the streak specifically. No pressure tactics. No exclamation points. Sound like someone who believes in them.`;

  try {
    const result = await base44.integrations.Core.InvokeLLM({ prompt });
    const text = typeof result === 'string' ? result : result?.text || '';
    const cleaned = text.replace(/^["']|["']$/g, '').trim();
    if (cleaned) {
      localStorage.setItem(key, 'true');
      toast(cleaned, {
        duration: 6000,
        style: {
          background: '#0c0c0c',
          border: '1px solid rgba(201,162,39,0.4)',
          color: '#C9A84C',
          fontFamily: "'DM Mono', monospace",
          fontSize: 11,
          maxWidth: 340,
        },
      });
    }
  } catch { /* silent */ }
}