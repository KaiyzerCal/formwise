// ─── Landmark IDs + Segment pairs ────────────────────────────────────────────

export const LANDMARKS = [
  'head','neck',
  'l_shoulder','r_shoulder',
  'l_elbow','r_elbow',
  'l_wrist','r_wrist',
  'chest','pelvis',
  'l_hip','r_hip',
  'l_knee','r_knee',
  'l_ankle','r_ankle',
  'l_toe','r_toe',
];

export const SEGMENTS = [
  ['head','neck'],
  ['neck','chest'],
  ['chest','l_shoulder'],['chest','r_shoulder'],
  ['l_shoulder','l_elbow'],['r_shoulder','r_elbow'],
  ['l_elbow','l_wrist'],['r_elbow','r_wrist'],
  ['chest','pelvis'],
  ['pelvis','l_hip'],['pelvis','r_hip'],
  ['l_hip','l_knee'],['r_hip','r_knee'],
  ['l_knee','l_ankle'],['r_knee','r_ankle'],
  ['l_ankle','l_toe'],['r_ankle','r_toe'],
];

export const MOTION_MODEL_STYLE = {
  segmentColor:     '#C9A84C',
  segmentWidth:     3,
  segmentOpacity:   0.92,
  jointColor:       '#FFFFFF',
  jointRadius:      6,
  jointBorderColor: '#C9A84C',
  jointBorderWidth: 2,
  highlightColor:   '#FFFFFF',
  highlightRadius:  9,
  faultSegmentColor:'#EF4444',
  faultJointColor:  '#EF4444',
  pathColor:        'rgba(201,168,76,0.5)',
  pathWidth:        2,
  pathDash:         [6,4],
  glowBlur:         6,
  glowColor:        '#C9A84C',
};

// ─── Interpolation ────────────────────────────────────────────────────────────

export function interpolateFrame(frameA, frameB, t) {
  const result = { phase: frameA.phase };
  for (const id of LANDMARKS) {
    if (!frameA[id] || !frameB[id]) continue;
    result[id] = {
      x: frameA[id].x + (frameB[id].x - frameA[id].x) * t,
      y: frameA[id].y + (frameB[id].y - frameA[id].y) * t,
    };
  }
  return result;
}

export function getInterpolatedFrame(frames, currentTimeMs, frameIntervalMs) {
  if (!frames || frames.length === 0) return null;
  const rawIndex = currentTimeMs / frameIntervalMs;
  const indexA   = Math.min(Math.floor(rawIndex), frames.length - 1);
  const indexB   = Math.min(Math.ceil(rawIndex), frames.length - 1);
  const t        = rawIndex - Math.floor(rawIndex);
  if (indexA === indexB) return frames[indexA];
  return interpolateFrame(frames[indexA], frames[indexB], t);
}

// ─── Fault application ────────────────────────────────────────────────────────

export function applyFaultOffsets(baseFrame, offsets) {
  const frame = JSON.parse(JSON.stringify(baseFrame));
  for (const [joint, delta] of Object.entries(offsets)) {
    if (frame[joint]) {
      frame[joint].x = (frame[joint].x ?? 0) + (delta.x ?? 0);
      frame[joint].y = (frame[joint].y ?? 0) + (delta.y ?? 0);
    }
  }
  return frame;
}

// ─── Renderer ─────────────────────────────────────────────────────────────────

export function renderMotionModelFrame(ctx, frame, style, highlightJoints = [], faultJoints = [], pulseT = 0) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const W = ctx.canvas.width, H = ctx.canvas.height;
  const px = (lm) => ({ x: lm.x * W, y: lm.y * H });

  // 1. Segments — torso segments drawn thicker
  ctx.save();
  for (const [a, b] of SEGMENTS) {
    if (!frame[a] || !frame[b]) continue;
    const A = px(frame[a]), B = px(frame[b]);
    const isFault  = faultJoints.includes(a) || faultJoints.includes(b);
    const isTorso  = TORSO_SEGMENT_KEYS.has(`${a}-${b}`) || TORSO_SEGMENT_KEYS.has(`${b}-${a}`);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.strokeStyle = isFault ? style.faultSegmentColor : style.segmentColor;
    ctx.lineWidth   = isTorso ? 4.5 : 2.5;
    ctx.globalAlpha = style.segmentOpacity;
    ctx.shadowBlur  = isFault ? 10 : style.glowBlur;
    ctx.shadowColor = isFault ? style.faultSegmentColor : style.glowColor;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }
  ctx.restore();

  // 2. Ball joints
  ctx.save();
  for (const id of LANDMARKS) {
    if (!frame[id]) continue;
    const pt          = px(frame[id]);
    const isHighlight = highlightJoints.includes(id);
    const isFault     = faultJoints.includes(id);

    // Pulse scale for highlighted joints — 1.0 → 1.20, 1200ms loop
    const pulse = isHighlight ? 1 + 0.20 * Math.sin(pulseT * Math.PI * 2) : 1;
    const r     = (isHighlight ? style.highlightRadius : style.jointRadius) * pulse;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle   = isFault ? style.faultJointColor : style.jointColor;
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur  = isHighlight ? 14 : style.glowBlur;
    ctx.shadowColor = isFault ? style.faultJointColor : style.glowColor;
    ctx.fill();

    // Ring
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = isFault ? style.faultJointColor : style.jointBorderColor;
    ctx.lineWidth   = style.jointBorderWidth;
    ctx.globalAlpha = 0.9;
    ctx.stroke();
  }
  ctx.restore();
}

export function renderPathOverlay(ctx, pathPoints, style) {
  if (!pathPoints || pathPoints.length < 2) return;
  const W = ctx.canvas.width, H = ctx.canvas.height;
  ctx.save();
  ctx.beginPath();
  ctx.setLineDash([8, 5]);
  ctx.strokeStyle = style.pathColor;
  ctx.lineWidth   = style.pathWidth;
  ctx.globalAlpha = 0.45;
  ctx.moveTo(pathPoints[0].x * W, pathPoints[0].y * H);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x * W, pathPoints[i].y * H);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Motion Frame Data ────────────────────────────────────────────────────────

// Seeded keyframes — interpolated into full frame arrays below

const KF = {
  // ── Squat ──
  squat_setup:   { head:{x:.50,y:.07}, neck:{x:.50,y:.13}, chest:{x:.50,y:.25}, l_shoulder:{x:.42,y:.23}, r_shoulder:{x:.58,y:.23}, l_elbow:{x:.37,y:.34}, r_elbow:{x:.63,y:.34}, l_wrist:{x:.35,y:.44}, r_wrist:{x:.65,y:.44}, pelvis:{x:.50,y:.45}, l_hip:{x:.44,y:.47}, r_hip:{x:.56,y:.47}, l_knee:{x:.43,y:.67}, r_knee:{x:.57,y:.67}, l_ankle:{x:.43,y:.87}, r_ankle:{x:.57,y:.87}, l_toe:{x:.40,y:.92}, r_toe:{x:.60,y:.92} },
  squat_earlyD:  { head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.49,y:.28}, l_shoulder:{x:.41,y:.26}, r_shoulder:{x:.57,y:.26}, l_elbow:{x:.36,y:.37}, r_elbow:{x:.62,y:.37}, l_wrist:{x:.34,y:.47}, r_wrist:{x:.64,y:.47}, pelvis:{x:.49,y:.50}, l_hip:{x:.43,y:.52}, r_hip:{x:.55,y:.52}, l_knee:{x:.41,y:.70}, r_knee:{x:.55,y:.70}, l_ankle:{x:.42,y:.88}, r_ankle:{x:.56,y:.88}, l_toe:{x:.38,y:.93}, r_toe:{x:.59,y:.93} },
  squat_midD:    { head:{x:.50,y:.14}, neck:{x:.50,y:.20}, chest:{x:.48,y:.33}, l_shoulder:{x:.40,y:.31}, r_shoulder:{x:.56,y:.31}, l_elbow:{x:.35,y:.42}, r_elbow:{x:.61,y:.42}, l_wrist:{x:.33,y:.52}, r_wrist:{x:.63,y:.52}, pelvis:{x:.48,y:.56}, l_hip:{x:.42,y:.58}, r_hip:{x:.54,y:.58}, l_knee:{x:.39,y:.73}, r_knee:{x:.53,y:.73}, l_ankle:{x:.41,y:.89}, r_ankle:{x:.55,y:.89}, l_toe:{x:.37,y:.94}, r_toe:{x:.58,y:.94} },
  squat_bottom:  { head:{x:.50,y:.18}, neck:{x:.50,y:.24}, chest:{x:.47,y:.38}, l_shoulder:{x:.39,y:.36}, r_shoulder:{x:.55,y:.36}, l_elbow:{x:.34,y:.47}, r_elbow:{x:.60,y:.47}, l_wrist:{x:.32,y:.57}, r_wrist:{x:.62,y:.57}, pelvis:{x:.47,y:.63}, l_hip:{x:.41,y:.65}, r_hip:{x:.53,y:.65}, l_knee:{x:.37,y:.76}, r_knee:{x:.51,y:.76}, l_ankle:{x:.41,y:.89}, r_ankle:{x:.55,y:.89}, l_toe:{x:.37,y:.94}, r_toe:{x:.58,y:.94} },
  squat_ascentM: { head:{x:.50,y:.12}, neck:{x:.50,y:.18}, chest:{x:.49,y:.31}, l_shoulder:{x:.41,y:.29}, r_shoulder:{x:.57,y:.29}, l_elbow:{x:.36,y:.40}, r_elbow:{x:.62,y:.40}, l_wrist:{x:.34,y:.50}, r_wrist:{x:.64,y:.50}, pelvis:{x:.49,y:.52}, l_hip:{x:.43,y:.54}, r_hip:{x:.55,y:.54}, l_knee:{x:.41,y:.71}, r_knee:{x:.55,y:.71}, l_ankle:{x:.42,y:.88}, r_ankle:{x:.56,y:.88}, l_toe:{x:.38,y:.93}, r_toe:{x:.59,y:.93} },

  // ── Deadlift ──
  dl_setup:   { head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.47,y:.30}, l_shoulder:{x:.38,y:.28}, r_shoulder:{x:.54,y:.28}, l_elbow:{x:.34,y:.42}, r_elbow:{x:.50,y:.42}, l_wrist:{x:.32,y:.55}, r_wrist:{x:.48,y:.55}, pelvis:{x:.48,y:.55}, l_hip:{x:.42,y:.57}, r_hip:{x:.54,y:.57}, l_knee:{x:.42,y:.72}, r_knee:{x:.54,y:.72}, l_ankle:{x:.43,y:.87}, r_ankle:{x:.55,y:.87}, l_toe:{x:.40,y:.92}, r_toe:{x:.57,y:.92} },
  dl_offFloor:{ head:{x:.50,y:.12}, neck:{x:.50,y:.18}, chest:{x:.47,y:.32}, l_shoulder:{x:.38,y:.30}, r_shoulder:{x:.54,y:.30}, l_elbow:{x:.33,y:.44}, r_elbow:{x:.49,y:.44}, l_wrist:{x:.31,y:.57}, r_wrist:{x:.47,y:.57}, pelvis:{x:.48,y:.52}, l_hip:{x:.42,y:.54}, r_hip:{x:.54,y:.54}, l_knee:{x:.43,y:.68}, r_knee:{x:.55,y:.68}, l_ankle:{x:.43,y:.87}, r_ankle:{x:.55,y:.87}, l_toe:{x:.40,y:.92}, r_toe:{x:.57,y:.92} },
  dl_midPull: { head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.48,y:.28}, l_shoulder:{x:.39,y:.26}, r_shoulder:{x:.55,y:.26}, l_elbow:{x:.34,y:.40}, r_elbow:{x:.50,y:.40}, l_wrist:{x:.32,y:.52}, r_wrist:{x:.48,y:.52}, pelvis:{x:.49,y:.47}, l_hip:{x:.43,y:.49}, r_hip:{x:.55,y:.49}, l_knee:{x:.44,y:.65}, r_knee:{x:.56,y:.65}, l_ankle:{x:.43,y:.87}, r_ankle:{x:.55,y:.87}, l_toe:{x:.40,y:.92}, r_toe:{x:.57,y:.92} },
  dl_lockout: { head:{x:.50,y:.07}, neck:{x:.50,y:.13}, chest:{x:.50,y:.24}, l_shoulder:{x:.41,y:.22}, r_shoulder:{x:.57,y:.22}, l_elbow:{x:.36,y:.35}, r_elbow:{x:.52,y:.35}, l_wrist:{x:.34,y:.48}, r_wrist:{x:.50,y:.48}, pelvis:{x:.50,y:.44}, l_hip:{x:.44,y:.46}, r_hip:{x:.56,y:.46}, l_knee:{x:.44,y:.65}, r_knee:{x:.56,y:.65}, l_ankle:{x:.43,y:.87}, r_ankle:{x:.55,y:.87}, l_toe:{x:.40,y:.92}, r_toe:{x:.57,y:.92} },

  // ── Push-up ──
  pu_top: { head:{x:.20,y:.28}, neck:{x:.25,y:.30}, chest:{x:.40,y:.35}, l_shoulder:{x:.38,y:.33}, r_shoulder:{x:.42,y:.33}, l_elbow:{x:.52,y:.35}, r_elbow:{x:.56,y:.35}, l_wrist:{x:.62,y:.40}, r_wrist:{x:.66,y:.40}, pelvis:{x:.58,y:.40}, l_hip:{x:.56,y:.40}, r_hip:{x:.60,y:.40}, l_knee:{x:.72,y:.44}, r_knee:{x:.74,y:.44}, l_ankle:{x:.85,y:.50}, r_ankle:{x:.87,y:.50}, l_toe:{x:.90,y:.53}, r_toe:{x:.92,y:.53} },
  pu_midD:{ head:{x:.20,y:.35}, neck:{x:.25,y:.37}, chest:{x:.40,y:.42}, l_shoulder:{x:.38,y:.40}, r_shoulder:{x:.42,y:.40}, l_elbow:{x:.48,y:.36}, r_elbow:{x:.52,y:.36}, l_wrist:{x:.62,y:.40}, r_wrist:{x:.66,y:.40}, pelvis:{x:.58,y:.43}, l_hip:{x:.56,y:.43}, r_hip:{x:.60,y:.43}, l_knee:{x:.72,y:.46}, r_knee:{x:.74,y:.46}, l_ankle:{x:.85,y:.51}, r_ankle:{x:.87,y:.51}, l_toe:{x:.90,y:.54}, r_toe:{x:.92,y:.54} },
  pu_bot: { head:{x:.20,y:.42}, neck:{x:.25,y:.44}, chest:{x:.40,y:.50}, l_shoulder:{x:.38,y:.48}, r_shoulder:{x:.42,y:.48}, l_elbow:{x:.44,y:.38}, r_elbow:{x:.48,y:.38}, l_wrist:{x:.62,y:.40}, r_wrist:{x:.66,y:.40}, pelvis:{x:.58,y:.46}, l_hip:{x:.56,y:.46}, r_hip:{x:.60,y:.46}, l_knee:{x:.72,y:.48}, r_knee:{x:.74,y:.48}, l_ankle:{x:.85,y:.52}, r_ankle:{x:.87,y:.52}, l_toe:{x:.90,y:.55}, r_toe:{x:.92,y:.55} },

  // ── Pull-up ──
  pl_hang:   { head:{x:.50,y:.30}, neck:{x:.50,y:.36}, chest:{x:.50,y:.48}, l_shoulder:{x:.42,y:.46}, r_shoulder:{x:.58,y:.46}, l_elbow:{x:.35,y:.28}, r_elbow:{x:.65,y:.28}, l_wrist:{x:.32,y:.12}, r_wrist:{x:.68,y:.12}, pelvis:{x:.50,y:.65}, l_hip:{x:.46,y:.67}, r_hip:{x:.54,y:.67}, l_knee:{x:.46,y:.80}, r_knee:{x:.54,y:.80}, l_ankle:{x:.46,y:.93}, r_ankle:{x:.54,y:.93}, l_toe:{x:.45,y:.97}, r_toe:{x:.55,y:.97} },
  pl_init:   { head:{x:.50,y:.28}, neck:{x:.50,y:.34}, chest:{x:.50,y:.46}, l_shoulder:{x:.41,y:.42}, r_shoulder:{x:.59,y:.42}, l_elbow:{x:.35,y:.27}, r_elbow:{x:.65,y:.27}, l_wrist:{x:.32,y:.12}, r_wrist:{x:.68,y:.12}, pelvis:{x:.50,y:.63}, l_hip:{x:.46,y:.65}, r_hip:{x:.54,y:.65}, l_knee:{x:.46,y:.78}, r_knee:{x:.54,y:.78}, l_ankle:{x:.46,y:.91}, r_ankle:{x:.54,y:.91}, l_toe:{x:.45,y:.95}, r_toe:{x:.55,y:.95} },
  pl_mid:    { head:{x:.50,y:.22}, neck:{x:.50,y:.28}, chest:{x:.50,y:.38}, l_shoulder:{x:.40,y:.34}, r_shoulder:{x:.60,y:.34}, l_elbow:{x:.36,y:.30}, r_elbow:{x:.64,y:.30}, l_wrist:{x:.32,y:.12}, r_wrist:{x:.68,y:.12}, pelvis:{x:.50,y:.56}, l_hip:{x:.46,y:.58}, r_hip:{x:.54,y:.58}, l_knee:{x:.46,y:.72}, r_knee:{x:.54,y:.72}, l_ankle:{x:.46,y:.85}, r_ankle:{x:.54,y:.85}, l_toe:{x:.45,y:.89}, r_toe:{x:.55,y:.89} },
  pl_top:    { head:{x:.50,y:.09}, neck:{x:.50,y:.15}, chest:{x:.50,y:.26}, l_shoulder:{x:.41,y:.22}, r_shoulder:{x:.59,y:.22}, l_elbow:{x:.38,y:.16}, r_elbow:{x:.62,y:.16}, l_wrist:{x:.32,y:.12}, r_wrist:{x:.68,y:.12}, pelvis:{x:.50,y:.44}, l_hip:{x:.46,y:.46}, r_hip:{x:.54,y:.46}, l_knee:{x:.46,y:.60}, r_knee:{x:.54,y:.60}, l_ankle:{x:.46,y:.74}, r_ankle:{x:.54,y:.74}, l_toe:{x:.45,y:.78}, r_toe:{x:.55,y:.78} },

  // ── Bench Press ──
  bp_lock:{ head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.50,y:.30}, l_shoulder:{x:.40,y:.28}, r_shoulder:{x:.60,y:.28}, l_elbow:{x:.35,y:.18}, r_elbow:{x:.65,y:.18}, l_wrist:{x:.33,y:.10}, r_wrist:{x:.67,y:.10}, pelvis:{x:.50,y:.60}, l_hip:{x:.44,y:.62}, r_hip:{x:.56,y:.62}, l_knee:{x:.40,y:.78}, r_knee:{x:.60,y:.78}, l_ankle:{x:.38,y:.90}, r_ankle:{x:.62,y:.90}, l_toe:{x:.35,y:.95}, r_toe:{x:.65,y:.95} },
  bp_midD:{ head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.50,y:.30}, l_shoulder:{x:.40,y:.28}, r_shoulder:{x:.60,y:.28}, l_elbow:{x:.36,y:.28}, r_elbow:{x:.64,y:.28}, l_wrist:{x:.36,y:.20}, r_wrist:{x:.64,y:.20}, pelvis:{x:.50,y:.60}, l_hip:{x:.44,y:.62}, r_hip:{x:.56,y:.62}, l_knee:{x:.40,y:.78}, r_knee:{x:.60,y:.78}, l_ankle:{x:.38,y:.90}, r_ankle:{x:.62,y:.90}, l_toe:{x:.35,y:.95}, r_toe:{x:.65,y:.95} },
  bp_touch:{ head:{x:.50,y:.10}, neck:{x:.50,y:.16}, chest:{x:.50,y:.30}, l_shoulder:{x:.40,y:.28}, r_shoulder:{x:.60,y:.28}, l_elbow:{x:.37,y:.34}, r_elbow:{x:.63,y:.34}, l_wrist:{x:.40,y:.29}, r_wrist:{x:.60,y:.29}, pelvis:{x:.50,y:.60}, l_hip:{x:.44,y:.62}, r_hip:{x:.56,y:.62}, l_knee:{x:.40,y:.78}, r_knee:{x:.60,y:.78}, l_ankle:{x:.38,y:.90}, r_ankle:{x:.62,y:.90}, l_toe:{x:.35,y:.95}, r_toe:{x:.65,y:.95} },

  // ── Lunge ──
  lu_stand: { head:{x:.50,y:.07}, neck:{x:.50,y:.13}, chest:{x:.50,y:.26}, l_shoulder:{x:.43,y:.24}, r_shoulder:{x:.57,y:.24}, l_elbow:{x:.40,y:.36}, r_elbow:{x:.60,y:.36}, l_wrist:{x:.41,y:.47}, r_wrist:{x:.59,y:.47}, pelvis:{x:.50,y:.46}, l_hip:{x:.46,y:.48}, r_hip:{x:.54,y:.48}, l_knee:{x:.46,y:.68}, r_knee:{x:.54,y:.68}, l_ankle:{x:.46,y:.87}, r_ankle:{x:.54,y:.87}, l_toe:{x:.43,y:.92}, r_toe:{x:.57,y:.92} },
  lu_bot:   { head:{x:.52,y:.10}, neck:{x:.52,y:.16}, chest:{x:.52,y:.30}, l_shoulder:{x:.45,y:.28}, r_shoulder:{x:.59,y:.28}, l_elbow:{x:.42,y:.40}, r_elbow:{x:.62,y:.40}, l_wrist:{x:.43,y:.51}, r_wrist:{x:.63,y:.51}, pelvis:{x:.52,y:.50}, l_hip:{x:.46,y:.52}, r_hip:{x:.58,y:.52}, l_knee:{x:.38,y:.70}, r_knee:{x:.62,y:.72}, l_ankle:{x:.32,y:.88}, r_ankle:{x:.65,y:.88}, l_toe:{x:.28,y:.92}, r_toe:{x:.70,y:.88} },

  // ── Baseball ──
  bb_stance: { head:{x:.50,y:.08}, neck:{x:.50,y:.14}, chest:{x:.50,y:.27}, l_shoulder:{x:.42,y:.25}, r_shoulder:{x:.58,y:.25}, l_elbow:{x:.38,y:.36}, r_elbow:{x:.62,y:.32}, l_wrist:{x:.36,y:.28}, r_wrist:{x:.64,y:.22}, pelvis:{x:.50,y:.47}, l_hip:{x:.44,y:.49}, r_hip:{x:.56,y:.49}, l_knee:{x:.42,y:.67}, r_knee:{x:.58,y:.67}, l_ankle:{x:.41,y:.87}, r_ankle:{x:.59,y:.87}, l_toe:{x:.38,y:.92}, r_toe:{x:.62,y:.92} },
  bb_load:   { head:{x:.50,y:.09}, neck:{x:.50,y:.15}, chest:{x:.51,y:.28}, l_shoulder:{x:.43,y:.26}, r_shoulder:{x:.59,y:.26}, l_elbow:{x:.39,y:.37}, r_elbow:{x:.64,y:.31}, l_wrist:{x:.38,y:.27}, r_wrist:{x:.68,y:.21}, pelvis:{x:.51,y:.48}, l_hip:{x:.45,y:.50}, r_hip:{x:.57,y:.50}, l_knee:{x:.43,y:.68}, r_knee:{x:.60,y:.66}, l_ankle:{x:.41,y:.87}, r_ankle:{x:.60,y:.88}, l_toe:{x:.38,y:.92}, r_toe:{x:.63,y:.93} },
  bb_stride: { head:{x:.49,y:.09}, neck:{x:.49,y:.15}, chest:{x:.49,y:.28}, l_shoulder:{x:.41,y:.26}, r_shoulder:{x:.57,y:.26}, l_elbow:{x:.37,y:.37}, r_elbow:{x:.63,y:.31}, l_wrist:{x:.36,y:.27}, r_wrist:{x:.67,y:.21}, pelvis:{x:.49,y:.48}, l_hip:{x:.43,y:.50}, r_hip:{x:.55,y:.50}, l_knee:{x:.38,y:.67}, r_knee:{x:.59,y:.66}, l_ankle:{x:.34,y:.86}, r_ankle:{x:.59,y:.88}, l_toe:{x:.31,y:.91}, r_toe:{x:.62,y:.93} },
  bb_rotate: { head:{x:.48,y:.09}, neck:{x:.48,y:.15}, chest:{x:.47,y:.28}, l_shoulder:{x:.38,y:.27}, r_shoulder:{x:.54,y:.26}, l_elbow:{x:.33,y:.37}, r_elbow:{x:.60,y:.30}, l_wrist:{x:.32,y:.27}, r_wrist:{x:.65,y:.20}, pelvis:{x:.46,y:.48}, l_hip:{x:.40,y:.50}, r_hip:{x:.52,y:.50}, l_knee:{x:.36,y:.67}, r_knee:{x:.57,y:.66}, l_ankle:{x:.33,y:.86}, r_ankle:{x:.59,y:.88}, l_toe:{x:.30,y:.91}, r_toe:{x:.62,y:.93} },
  bb_contact:{ head:{x:.47,y:.09}, neck:{x:.47,y:.15}, chest:{x:.44,y:.29}, l_shoulder:{x:.33,y:.28}, r_shoulder:{x:.50,y:.26}, l_elbow:{x:.28,y:.38}, r_elbow:{x:.52,y:.32}, l_wrist:{x:.26,y:.40}, r_wrist:{x:.52,y:.38}, pelvis:{x:.42,y:.48}, l_hip:{x:.36,y:.50}, r_hip:{x:.48,y:.50}, l_knee:{x:.34,y:.67}, r_knee:{x:.56,y:.66}, l_ankle:{x:.32,y:.86}, r_ankle:{x:.59,y:.88}, l_toe:{x:.29,y:.91}, r_toe:{x:.62,y:.93} },
  bb_finish: { head:{x:.46,y:.08}, neck:{x:.46,y:.14}, chest:{x:.42,y:.27}, l_shoulder:{x:.30,y:.25}, r_shoulder:{x:.48,y:.22}, l_elbow:{x:.26,y:.18}, r_elbow:{x:.48,y:.15}, l_wrist:{x:.30,y:.12}, r_wrist:{x:.52,y:.10}, pelvis:{x:.40,y:.48}, l_hip:{x:.34,y:.50}, r_hip:{x:.46,y:.50}, l_knee:{x:.33,y:.67}, r_knee:{x:.55,y:.68}, l_ankle:{x:.32,y:.87}, r_ankle:{x:.59,y:.88}, l_toe:{x:.29,y:.91}, r_toe:{x:.62,y:.93} },
};

// ─── Torso segment set for thicker rendering ──────────────────────────────────
export const TORSO_SEGMENT_KEYS = new Set([
  'neck-chest','chest-pelvis','pelvis-l_hip','pelvis-r_hip',
]);

// ─── Resolve frame with optional fault (precomputed > offset fallback) ─────────
export function resolveFrame(motionData, currentTimeMs, activeFault) {
  if (!activeFault) {
    return getInterpolatedFrame(motionData.frames, currentTimeMs, motionData.frameIntervalMs);
  }
  const faultDef = (motionData.faults ?? []).find(f => f.id === activeFault.id);
  if (!faultDef) return getInterpolatedFrame(motionData.frames, currentTimeMs, motionData.frameIntervalMs);
  // Precomputed fault frames take priority
  if (faultDef.faultFrames && faultDef.faultFrames.length > 0) {
    return getInterpolatedFrame(faultDef.faultFrames, currentTimeMs, motionData.frameIntervalMs);
  }
  // Offset fallback
  const base = getInterpolatedFrame(motionData.frames, currentTimeMs, motionData.frameIntervalMs);
  return applyFaultOffsets(base, faultDef.keypointOffsets ?? {});
}

export const MOTION_FRAMES = {
  // ── SQUAT — 16 seeded frames, 133ms interval ─────────────────────────────────
  squat: {
    frameIntervalMs: 133,
    frames: [
      { phase:'setup',   head:{x:0.50,y:0.07},neck:{x:0.50,y:0.13},chest:{x:0.50,y:0.25},l_shoulder:{x:0.42,y:0.23},r_shoulder:{x:0.58,y:0.23},l_elbow:{x:0.37,y:0.34},r_elbow:{x:0.63,y:0.34},l_wrist:{x:0.35,y:0.44},r_wrist:{x:0.65,y:0.44},pelvis:{x:0.50,y:0.45},l_hip:{x:0.44,y:0.47},r_hip:{x:0.56,y:0.47},l_knee:{x:0.43,y:0.67},r_knee:{x:0.57,y:0.67},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.57,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.60,y:0.92} },
      { phase:'descent', head:{x:0.50,y:0.08},neck:{x:0.50,y:0.14},chest:{x:0.50,y:0.26},l_shoulder:{x:0.42,y:0.24},r_shoulder:{x:0.58,y:0.24},l_elbow:{x:0.37,y:0.35},r_elbow:{x:0.63,y:0.35},l_wrist:{x:0.35,y:0.45},r_wrist:{x:0.65,y:0.45},pelvis:{x:0.50,y:0.46},l_hip:{x:0.44,y:0.48},r_hip:{x:0.56,y:0.48},l_knee:{x:0.43,y:0.68},r_knee:{x:0.57,y:0.68},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.57,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.60,y:0.92} },
      { phase:'descent', head:{x:0.50,y:0.10},neck:{x:0.50,y:0.16},chest:{x:0.49,y:0.28},l_shoulder:{x:0.41,y:0.26},r_shoulder:{x:0.57,y:0.26},l_elbow:{x:0.36,y:0.37},r_elbow:{x:0.62,y:0.37},l_wrist:{x:0.34,y:0.47},r_wrist:{x:0.64,y:0.47},pelvis:{x:0.49,y:0.49},l_hip:{x:0.43,y:0.51},r_hip:{x:0.55,y:0.51},l_knee:{x:0.42,y:0.69},r_knee:{x:0.56,y:0.69},l_ankle:{x:0.42,y:0.88},r_ankle:{x:0.56,y:0.88},l_toe:{x:0.39,y:0.93},r_toe:{x:0.59,y:0.93} },
      { phase:'descent', head:{x:0.50,y:0.12},neck:{x:0.50,y:0.18},chest:{x:0.49,y:0.30},l_shoulder:{x:0.41,y:0.28},r_shoulder:{x:0.57,y:0.28},l_elbow:{x:0.36,y:0.39},r_elbow:{x:0.62,y:0.39},l_wrist:{x:0.34,y:0.49},r_wrist:{x:0.64,y:0.49},pelvis:{x:0.49,y:0.51},l_hip:{x:0.43,y:0.53},r_hip:{x:0.55,y:0.53},l_knee:{x:0.41,y:0.70},r_knee:{x:0.55,y:0.70},l_ankle:{x:0.42,y:0.88},r_ankle:{x:0.56,y:0.88},l_toe:{x:0.38,y:0.93},r_toe:{x:0.58,y:0.93} },
      { phase:'descent', head:{x:0.50,y:0.13},neck:{x:0.50,y:0.19},chest:{x:0.48,y:0.32},l_shoulder:{x:0.40,y:0.30},r_shoulder:{x:0.56,y:0.30},l_elbow:{x:0.35,y:0.41},r_elbow:{x:0.61,y:0.41},l_wrist:{x:0.33,y:0.51},r_wrist:{x:0.63,y:0.51},pelvis:{x:0.48,y:0.54},l_hip:{x:0.42,y:0.56},r_hip:{x:0.54,y:0.56},l_knee:{x:0.40,y:0.72},r_knee:{x:0.54,y:0.72},l_ankle:{x:0.41,y:0.88},r_ankle:{x:0.55,y:0.88},l_toe:{x:0.38,y:0.93},r_toe:{x:0.58,y:0.93} },
      { phase:'descent', head:{x:0.50,y:0.15},neck:{x:0.50,y:0.21},chest:{x:0.48,y:0.34},l_shoulder:{x:0.40,y:0.32},r_shoulder:{x:0.56,y:0.32},l_elbow:{x:0.35,y:0.43},r_elbow:{x:0.61,y:0.43},l_wrist:{x:0.33,y:0.53},r_wrist:{x:0.63,y:0.53},pelvis:{x:0.47,y:0.57},l_hip:{x:0.41,y:0.59},r_hip:{x:0.53,y:0.59},l_knee:{x:0.39,y:0.74},r_knee:{x:0.53,y:0.74},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
      { phase:'descent', head:{x:0.50,y:0.16},neck:{x:0.50,y:0.22},chest:{x:0.48,y:0.36},l_shoulder:{x:0.40,y:0.34},r_shoulder:{x:0.56,y:0.34},l_elbow:{x:0.35,y:0.45},r_elbow:{x:0.61,y:0.45},l_wrist:{x:0.33,y:0.55},r_wrist:{x:0.63,y:0.55},pelvis:{x:0.47,y:0.60},l_hip:{x:0.41,y:0.62},r_hip:{x:0.53,y:0.62},l_knee:{x:0.38,y:0.75},r_knee:{x:0.52,y:0.75},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
      { phase:'descent', head:{x:0.50,y:0.17},neck:{x:0.50,y:0.23},chest:{x:0.47,y:0.37},l_shoulder:{x:0.39,y:0.35},r_shoulder:{x:0.55,y:0.35},l_elbow:{x:0.34,y:0.46},r_elbow:{x:0.60,y:0.46},l_wrist:{x:0.32,y:0.56},r_wrist:{x:0.62,y:0.56},pelvis:{x:0.47,y:0.62},l_hip:{x:0.41,y:0.64},r_hip:{x:0.53,y:0.64},l_knee:{x:0.38,y:0.76},r_knee:{x:0.52,y:0.76},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
      { phase:'bottom',  head:{x:0.50,y:0.18},neck:{x:0.50,y:0.24},chest:{x:0.47,y:0.38},l_shoulder:{x:0.39,y:0.36},r_shoulder:{x:0.55,y:0.36},l_elbow:{x:0.34,y:0.47},r_elbow:{x:0.60,y:0.47},l_wrist:{x:0.32,y:0.57},r_wrist:{x:0.62,y:0.57},pelvis:{x:0.47,y:0.63},l_hip:{x:0.41,y:0.65},r_hip:{x:0.53,y:0.65},l_knee:{x:0.37,y:0.76},r_knee:{x:0.51,y:0.76},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
      { phase:'ascent',  head:{x:0.50,y:0.17},neck:{x:0.50,y:0.23},chest:{x:0.47,y:0.37},l_shoulder:{x:0.39,y:0.35},r_shoulder:{x:0.55,y:0.35},l_elbow:{x:0.34,y:0.46},r_elbow:{x:0.60,y:0.46},l_wrist:{x:0.32,y:0.56},r_wrist:{x:0.62,y:0.56},pelvis:{x:0.47,y:0.61},l_hip:{x:0.41,y:0.63},r_hip:{x:0.53,y:0.63},l_knee:{x:0.38,y:0.75},r_knee:{x:0.52,y:0.75},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
      { phase:'ascent',  head:{x:0.50,y:0.14},neck:{x:0.50,y:0.20},chest:{x:0.48,y:0.33},l_shoulder:{x:0.40,y:0.31},r_shoulder:{x:0.56,y:0.31},l_elbow:{x:0.35,y:0.42},r_elbow:{x:0.61,y:0.42},l_wrist:{x:0.33,y:0.52},r_wrist:{x:0.63,y:0.52},pelvis:{x:0.49,y:0.53},l_hip:{x:0.43,y:0.55},r_hip:{x:0.55,y:0.55},l_knee:{x:0.41,y:0.71},r_knee:{x:0.55,y:0.71},l_ankle:{x:0.42,y:0.88},r_ankle:{x:0.56,y:0.88},l_toe:{x:0.38,y:0.93},r_toe:{x:0.58,y:0.93} },
      { phase:'ascent',  head:{x:0.50,y:0.11},neck:{x:0.50,y:0.17},chest:{x:0.49,y:0.29},l_shoulder:{x:0.41,y:0.27},r_shoulder:{x:0.57,y:0.27},l_elbow:{x:0.36,y:0.38},r_elbow:{x:0.62,y:0.38},l_wrist:{x:0.34,y:0.48},r_wrist:{x:0.64,y:0.48},pelvis:{x:0.50,y:0.48},l_hip:{x:0.44,y:0.50},r_hip:{x:0.56,y:0.50},l_knee:{x:0.43,y:0.69},r_knee:{x:0.57,y:0.69},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.57,y:0.87},l_toe:{x:0.39,y:0.92},r_toe:{x:0.59,y:0.92} },
      { phase:'lockout', head:{x:0.50,y:0.07},neck:{x:0.50,y:0.13},chest:{x:0.50,y:0.25},l_shoulder:{x:0.42,y:0.23},r_shoulder:{x:0.58,y:0.23},l_elbow:{x:0.37,y:0.34},r_elbow:{x:0.63,y:0.34},l_wrist:{x:0.35,y:0.44},r_wrist:{x:0.65,y:0.44},pelvis:{x:0.50,y:0.45},l_hip:{x:0.44,y:0.47},r_hip:{x:0.56,y:0.47},l_knee:{x:0.43,y:0.67},r_knee:{x:0.57,y:0.67},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.57,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.60,y:0.92} },
    ],
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest','l_ankle','r_ankle'],   cue:'Brace your core before the bar moves. Feet shoulder-width, toes out 20°.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_knee','r_knee','l_hip','r_hip'],             cue:'Push knees out. Chest stays tall. Controlled — own every inch.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_knee','r_knee','l_hip','r_hip','l_ankle','r_ankle'], cue:'Hip crease below knee. Heels planted. Spine neutral. Brief pause.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['l_hip','r_hip','chest'],                       cue:'Drive the floor away. Hips and chest rise together. Knees stay out.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_knee','r_knee','pelvis','l_hip','r_hip'],    cue:'Full extension. Squeeze glutes. Stand tall — complete the rep.' },
    ],
    faults: [
      {
        id:'knee_valgus', label:'KNEE VALGUS', description:'Knees collapsing inward — ACL, MCL, and patellofemoral stress.',
        explanation:"Drive knees outward actively. Cue: 'push the floor apart with your feet.'",
        affectedJoints:['l_knee','r_knee'],
        keypointOffsets:{'l_knee':{x:+.07,y:0},'r_knee':{x:-.07,y:0}},
        faultFrames: [
          { phase:'bottom', head:{x:0.50,y:0.18},neck:{x:0.50,y:0.24},chest:{x:0.47,y:0.38},l_shoulder:{x:0.39,y:0.36},r_shoulder:{x:0.55,y:0.36},l_elbow:{x:0.34,y:0.47},r_elbow:{x:0.60,y:0.47},l_wrist:{x:0.32,y:0.57},r_wrist:{x:0.62,y:0.57},pelvis:{x:0.47,y:0.63},l_hip:{x:0.41,y:0.65},r_hip:{x:0.53,y:0.65},l_knee:{x:0.46,y:0.76},r_knee:{x:0.48,y:0.76},l_ankle:{x:0.41,y:0.89},r_ankle:{x:0.55,y:0.89},l_toe:{x:0.37,y:0.94},r_toe:{x:0.57,y:0.94} },
        ],
      },
      { id:'spine_collapse', label:'TORSO COLLAPSE', description:'Excessive forward lean — shifts load from quads to lower back.', explanation:'Brace core before descent. Keep chest tall. Think: ribs down, not chest puffed.', affectedJoints:['chest','neck','head'], keypointOffsets:{'chest':{x:-.04,y:+.05},'neck':{x:-.05,y:+.06},'head':{x:-.06,y:+.07}} },
      { id:'heel_lift', label:'HEEL RISE', description:'Heels leave the floor at depth — limited ankle dorsiflexion.', explanation:'Improve ankle mobility or use heel elevation temporarily.', affectedJoints:['l_ankle','r_ankle','l_toe','r_toe'], keypointOffsets:{'l_ankle':{x:0,y:-.04},'r_ankle':{x:0,y:-.04},'l_toe':{x:0,y:-.05},'r_toe':{x:0,y:-.05}} },
    ],
    pathOverlays: [
      { id:'knee_track_left', label:'Knee Path', points:[{x:0.43,y:0.67},{x:0.41,y:0.70},{x:0.39,y:0.73},{x:0.38,y:0.76},{x:0.39,y:0.73},{x:0.41,y:0.70},{x:0.43,y:0.67}] },
      { id:'hip_path', label:'Hip Path', points:[{x:0.44,y:0.47},{x:0.43,y:0.52},{x:0.42,y:0.58},{x:0.41,y:0.65},{x:0.42,y:0.58},{x:0.43,y:0.52},{x:0.44,y:0.47}] },
    ],
  },

  // ── DEADLIFT — 8 seeded frames, 150ms interval ──────────────────────────────
  deadlift: {
    frameIntervalMs: 150,
    frames: [
      { phase:'setup',   head:{x:0.50,y:0.10},neck:{x:0.50,y:0.16},chest:{x:0.47,y:0.30},l_shoulder:{x:0.38,y:0.28},r_shoulder:{x:0.54,y:0.28},l_elbow:{x:0.34,y:0.42},r_elbow:{x:0.50,y:0.42},l_wrist:{x:0.40,y:0.56},r_wrist:{x:0.40,y:0.56},pelvis:{x:0.48,y:0.55},l_hip:{x:0.42,y:0.57},r_hip:{x:0.54,y:0.57},l_knee:{x:0.42,y:0.72},r_knee:{x:0.54,y:0.72},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'pull',    head:{x:0.50,y:0.11},neck:{x:0.50,y:0.17},chest:{x:0.47,y:0.31},l_shoulder:{x:0.38,y:0.29},r_shoulder:{x:0.54,y:0.29},l_elbow:{x:0.34,y:0.43},r_elbow:{x:0.50,y:0.43},l_wrist:{x:0.40,y:0.56},r_wrist:{x:0.40,y:0.56},pelvis:{x:0.48,y:0.53},l_hip:{x:0.42,y:0.55},r_hip:{x:0.54,y:0.55},l_knee:{x:0.43,y:0.70},r_knee:{x:0.55,y:0.70},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'pull',    head:{x:0.50,y:0.11},neck:{x:0.50,y:0.17},chest:{x:0.47,y:0.31},l_shoulder:{x:0.38,y:0.29},r_shoulder:{x:0.54,y:0.29},l_elbow:{x:0.34,y:0.43},r_elbow:{x:0.50,y:0.43},l_wrist:{x:0.40,y:0.50},r_wrist:{x:0.40,y:0.50},pelvis:{x:0.48,y:0.50},l_hip:{x:0.42,y:0.52},r_hip:{x:0.54,y:0.52},l_knee:{x:0.43,y:0.67},r_knee:{x:0.55,y:0.67},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'pull',    head:{x:0.50,y:0.10},neck:{x:0.50,y:0.16},chest:{x:0.48,y:0.29},l_shoulder:{x:0.39,y:0.27},r_shoulder:{x:0.55,y:0.27},l_elbow:{x:0.35,y:0.40},r_elbow:{x:0.51,y:0.40},l_wrist:{x:0.40,y:0.44},r_wrist:{x:0.40,y:0.44},pelvis:{x:0.49,y:0.46},l_hip:{x:0.43,y:0.48},r_hip:{x:0.55,y:0.48},l_knee:{x:0.44,y:0.64},r_knee:{x:0.56,y:0.64},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'pull',    head:{x:0.50,y:0.08},neck:{x:0.50,y:0.14},chest:{x:0.49,y:0.27},l_shoulder:{x:0.40,y:0.25},r_shoulder:{x:0.56,y:0.25},l_elbow:{x:0.36,y:0.37},r_elbow:{x:0.52,y:0.37},l_wrist:{x:0.40,y:0.40},r_wrist:{x:0.40,y:0.40},pelvis:{x:0.50,y:0.43},l_hip:{x:0.44,y:0.45},r_hip:{x:0.56,y:0.45},l_knee:{x:0.44,y:0.63},r_knee:{x:0.56,y:0.63},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'lockout', head:{x:0.50,y:0.07},neck:{x:0.50,y:0.13},chest:{x:0.50,y:0.24},l_shoulder:{x:0.41,y:0.22},r_shoulder:{x:0.57,y:0.22},l_elbow:{x:0.37,y:0.34},r_elbow:{x:0.53,y:0.34},l_wrist:{x:0.40,y:0.46},r_wrist:{x:0.40,y:0.46},pelvis:{x:0.50,y:0.44},l_hip:{x:0.44,y:0.46},r_hip:{x:0.56,y:0.46},l_knee:{x:0.44,y:0.65},r_knee:{x:0.56,y:0.65},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'lower',   head:{x:0.50,y:0.09},neck:{x:0.50,y:0.15},chest:{x:0.48,y:0.28},l_shoulder:{x:0.39,y:0.26},r_shoulder:{x:0.55,y:0.26},l_elbow:{x:0.35,y:0.39},r_elbow:{x:0.51,y:0.39},l_wrist:{x:0.40,y:0.50},r_wrist:{x:0.40,y:0.50},pelvis:{x:0.48,y:0.50},l_hip:{x:0.42,y:0.52},r_hip:{x:0.54,y:0.52},l_knee:{x:0.42,y:0.68},r_knee:{x:0.54,y:0.68},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
      { phase:'lower',   head:{x:0.50,y:0.10},neck:{x:0.50,y:0.16},chest:{x:0.47,y:0.30},l_shoulder:{x:0.38,y:0.28},r_shoulder:{x:0.54,y:0.28},l_elbow:{x:0.34,y:0.42},r_elbow:{x:0.50,y:0.42},l_wrist:{x:0.40,y:0.56},r_wrist:{x:0.40,y:0.56},pelvis:{x:0.48,y:0.55},l_hip:{x:0.42,y:0.57},r_hip:{x:0.54,y:0.57},l_knee:{x:0.42,y:0.72},r_knee:{x:0.54,y:0.72},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
    ],
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest','l_wrist','r_wrist'], cue:'Bar over mid-foot. Hinge back. Set lats. Build tension before any movement.' },
      { id:'pull',    label:'PULL',    keyJoints:['l_hip','r_hip','chest','l_knee','r_knee'],   cue:'Push the floor away. Bar stays close. Knees and hips extend together.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_hip','r_hip','pelvis','chest'],            cue:'Stand tall. Hips drive fully through. Squeeze glutes — no hyperextension.' },
      { id:'lower',   label:'LOWER',   keyJoints:['l_hip','r_hip','l_knee','r_knee'],          cue:'Hinge back first. Bar close. Controlled descent — earn the setup position.' },
    ],
    faults: [
      {
        id:'rounded_spine', label:'ROUNDED SPINE', description:'Thoracic or lumbar rounding — compresses discs, risks herniation.',
        explanation:"Brace before the pull. Stay long through the spine. 'Proud chest' cue.",
        affectedJoints:['chest','neck','head'],
        keypointOffsets:{},
        faultFrames: [
          { phase:'pull', head:{x:0.47,y:0.16},neck:{x:0.47,y:0.22},chest:{x:0.43,y:0.36},l_shoulder:{x:0.34,y:0.34},r_shoulder:{x:0.50,y:0.34},l_elbow:{x:0.30,y:0.47},r_elbow:{x:0.46,y:0.47},l_wrist:{x:0.40,y:0.50},r_wrist:{x:0.40,y:0.50},pelvis:{x:0.48,y:0.50},l_hip:{x:0.42,y:0.52},r_hip:{x:0.54,y:0.52},l_knee:{x:0.43,y:0.67},r_knee:{x:0.55,y:0.67},l_ankle:{x:0.43,y:0.87},r_ankle:{x:0.55,y:0.87},l_toe:{x:0.40,y:0.92},r_toe:{x:0.57,y:0.92} },
        ],
      },
      { id:'bar_drift',  label:'BAR DRIFT',  description:'Bar swings forward from the body — increases moment arm, reduces efficiency.', explanation:'Keep bar dragging against shins on the way up. Lats engaged.', affectedJoints:['l_wrist','r_wrist','l_elbow','r_elbow'], keypointOffsets:{'l_wrist':{x:-.06,y:0},'r_wrist':{x:+.06,y:0}} },
      { id:'hip_shoot',  label:'HIP SHOOT',  description:'Hips rise faster than shoulders off the floor — turns deadlift into a stiff-leg.', explanation:'Push floor away with feet. Knees and hips extend together off the floor.', affectedJoints:['l_hip','r_hip','chest'], keypointOffsets:{'pelvis':{x:0,y:-.05},'l_hip':{x:0,y:-.05},'r_hip':{x:0,y:-.05}} },
    ],
    pathOverlays: [
      { id:'bar_path', label:'Bar Path', points:[{x:0.40,y:0.88},{x:0.40,y:0.72},{x:0.40,y:0.56},{x:0.40,y:0.42},{x:0.40,y:0.30},{x:0.40,y:0.50},{x:0.40,y:0.88}] },
    ],
  },

  // ── PUSH-UP ─────────────────────────────────────────────────────────────────
  pushup: {
    frameIntervalMs: 300,
    frames: buildPushupFrames(),
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['chest','pelvis','l_ankle','r_ankle'], cue:'Hands shoulder-width. Body in one line. Core braced.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_elbow','r_elbow','chest'],          cue:'Elbows 45° from torso. Controlled lowering.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_elbow','r_elbow','chest'],          cue:'Chest near floor. Full range of motion.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['chest','l_elbow','r_elbow'],          cue:'Push floor away. Stay rigid. No hip sag.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_elbow','r_elbow','pelvis'],         cue:'Full extension. Body line maintained.' },
    ],
    faults: [
      { id:'hip_sag',     label:'HIP SAG',     description:'Hips drop below body line — lower back strain.', explanation:'Squeeze glutes and abs hard. Imagine your body is a steel plank.', affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:0,y:+.07},'l_hip':{x:0,y:+.07},'r_hip':{x:0,y:+.07}} },
      { id:'elbow_flare', label:'ELBOW FLARE', description:'Elbows flare wide — shoulder impingement risk.', explanation:"Tuck elbows 45° to body. Think 'arrows, not Ts'.", affectedJoints:['l_elbow','r_elbow'], keypointOffsets:{'l_elbow':{x:-.07,y:0},'r_elbow':{x:+.07,y:0}} },
    ],
    pathOverlays: [],
  },

  // ── LUNGE ───────────────────────────────────────────────────────────────────
  lunge: {
    frameIntervalMs: 300,
    frames: buildLungeFrames(),
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest'],    cue:'Stand tall. Core engaged. Weight centered.' },
      { id:'step',    label:'STEP',    keyJoints:['l_knee','l_ankle'],          cue:'Step forward. Land heel first. Keep torso upright.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_knee','l_hip','r_knee'],  cue:'Front shin vertical. Back knee near floor. Chest tall.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['l_hip','l_knee'],           cue:'Drive front heel. Push hips tall.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_hip','r_hip','chest'],    cue:'Stand fully. Hips extended. Reset.' },
    ],
    faults: [
      { id:'knee_past_toe', label:'KNEE PAST TOE', description:'Front knee shoots far past toes — patellar stress.', explanation:'Step longer or lean back slightly. Keep shin vertical.', affectedJoints:['l_knee'], keypointOffsets:{'l_knee':{x:-.05,y:-.04}} },
      { id:'trunk_lean',    label:'TRUNK LEAN',    description:'Excessive forward lean — reduces glute engagement.', explanation:'Keep torso tall. Drive front heel into floor.', affectedJoints:['chest','neck','head'], keypointOffsets:{'chest':{x:0,y:+.05},'neck':{x:0,y:+.05},'head':{x:0,y:+.05}} },
    ],
    pathOverlays: [],
  },

  // ── OVERHEAD PRESS ───────────────────────────────────────────────────────────
  overhead_press: {
    frameIntervalMs: 400,
    frames: buildOHPFrames(),
    phases: [
      { id:'start',   label:'START',   keyJoints:['l_elbow','r_elbow','chest'],              cue:'Bar at collarbones. Core braced. Ribs down.' },
      { id:'press',   label:'PRESS',   keyJoints:['l_elbow','r_elbow','l_wrist','r_wrist'], cue:'Press vertically. Move head back, then under bar.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_wrist','r_wrist','chest'],              cue:'Arms fully extended. Shrug at top. Balance over midfoot.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_elbow','r_elbow'],                     cue:'Control the descent. Return to front rack.' },
    ],
    faults: [
      { id:'back_arch',   label:'BACK ARCH',   description:'Excessive lumbar arch — disc compression.', explanation:'Squeeze glutes, brace abs, tuck ribs before pressing.', affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:0,y:-.04},'l_hip':{x:0,y:-.03},'r_hip':{x:0,y:-.03}} },
      { id:'bar_forward', label:'BAR FORWARD', description:'Bar drifts forward — inefficient path, shoulder stress.', explanation:'Press the bar in a vertical line directly overhead.', affectedJoints:['l_wrist','r_wrist'], keypointOffsets:{'l_wrist':{x:-.05,y:0},'r_wrist':{x:+.05,y:0}} },
    ],
    pathOverlays: [
      { id:'bar_path', label:'Bar Path', points:[{x:.50,y:.54},{x:.50,y:.38},{x:.50,y:.20},{x:.50,y:.08}] },
    ],
  },

  // ── GOLF SWING ───────────────────────────────────────────────────────────────
  golf_swing: {
    frameIntervalMs: 80,
    frames: buildGolfFrames(),
    phases: [
      { id:'address',       label:'ADDRESS',       keyJoints:['chest','l_hip','r_hip','l_knee','r_knee'], cue:'Athletic posture. Hip hinge. Spine neutral. Weight centered.' },
      { id:'backswing',     label:'BACKSWING',     keyJoints:['l_shoulder','r_shoulder','l_hip','r_hip'], cue:'Coil shoulders 90°. Hips rotate 45°. Lead arm straight.' },
      { id:'transition',    label:'TRANSITION',    keyJoints:['l_hip','r_hip','l_knee'],                  cue:'Hips lead. Shift weight to lead foot. Keep the lag.' },
      { id:'impact',        label:'IMPACT',        keyJoints:['l_wrist','r_wrist','l_hip','chest'],        cue:'Hips open 45°. Hands ahead of ball. Spine tilted back.' },
      { id:'follow_through',label:'FOLLOW THROUGH',keyJoints:['chest','l_shoulder','r_shoulder'],         cue:'Finish tall. Full shoulder rotation. Balance on lead foot.' },
    ],
    faults: [
      { id:'early_extension', label:'EARLY EXTENSION', description:'Hips thrust toward ball through impact.', explanation:"Maintain spine angle through impact. Rotate, don't thrust.", affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:+.05,y:0},'l_hip':{x:+.05,y:0},'r_hip':{x:+.05,y:0}} },
      { id:'over_the_top',    label:'OVER THE TOP',    description:'Club path from outside-in — causes slicing.', explanation:'Drop right elbow into slot on downswing. Feel the path going right.', affectedJoints:['r_elbow','r_shoulder'], keypointOffsets:{'r_elbow':{x:-.06,y:-.04}} },
    ],
    pathOverlays: [
      { id:'swing_plane', label:'Swing Plane', points:[{x:.50,y:.90},{x:.45,y:.65},{x:.35,y:.35},{x:.25,y:.15}] },
      { id:'ball_flight', label:'Ball Arc',    points:[{x:.50,y:.88},{x:.55,y:.60},{x:.65,y:.35},{x:.80,y:.20},{x:.95,y:.28}] },
    ],
  },

  // ── BASKETBALL JUMP SHOT — 8 seeded frames, 100ms interval ───────────────────
  basketball_shot: {
    frameIntervalMs: 100,
    frames: [
      { phase:'load',    head:{x:0.50,y:0.12},neck:{x:0.50,y:0.18},chest:{x:0.50,y:0.30},l_shoulder:{x:0.42,y:0.28},r_shoulder:{x:0.58,y:0.28},l_elbow:{x:0.38,y:0.38},r_elbow:{x:0.62,y:0.36},l_wrist:{x:0.44,y:0.48},r_wrist:{x:0.56,y:0.44},pelvis:{x:0.50,y:0.52},l_hip:{x:0.44,y:0.54},r_hip:{x:0.56,y:0.54},l_knee:{x:0.43,y:0.68},r_knee:{x:0.57,y:0.68},l_ankle:{x:0.43,y:0.85},r_ankle:{x:0.57,y:0.85},l_toe:{x:0.40,y:0.91},r_toe:{x:0.60,y:0.91} },
      { phase:'load',    head:{x:0.50,y:0.13},neck:{x:0.50,y:0.19},chest:{x:0.50,y:0.31},l_shoulder:{x:0.42,y:0.29},r_shoulder:{x:0.58,y:0.29},l_elbow:{x:0.38,y:0.39},r_elbow:{x:0.62,y:0.37},l_wrist:{x:0.44,y:0.50},r_wrist:{x:0.56,y:0.46},pelvis:{x:0.50,y:0.54},l_hip:{x:0.44,y:0.56},r_hip:{x:0.56,y:0.56},l_knee:{x:0.43,y:0.71},r_knee:{x:0.57,y:0.71},l_ankle:{x:0.43,y:0.86},r_ankle:{x:0.57,y:0.86},l_toe:{x:0.40,y:0.92},r_toe:{x:0.60,y:0.92} },
      { phase:'jump',    head:{x:0.50,y:0.10},neck:{x:0.50,y:0.16},chest:{x:0.50,y:0.28},l_shoulder:{x:0.42,y:0.26},r_shoulder:{x:0.58,y:0.26},l_elbow:{x:0.38,y:0.35},r_elbow:{x:0.62,y:0.33},l_wrist:{x:0.44,y:0.42},r_wrist:{x:0.56,y:0.38},pelvis:{x:0.50,y:0.48},l_hip:{x:0.44,y:0.50},r_hip:{x:0.56,y:0.50},l_knee:{x:0.43,y:0.62},r_knee:{x:0.57,y:0.62},l_ankle:{x:0.43,y:0.78},r_ankle:{x:0.57,y:0.78},l_toe:{x:0.40,y:0.84},r_toe:{x:0.60,y:0.84} },
      { phase:'jump',    head:{x:0.50,y:0.08},neck:{x:0.50,y:0.14},chest:{x:0.50,y:0.26},l_shoulder:{x:0.42,y:0.24},r_shoulder:{x:0.58,y:0.24},l_elbow:{x:0.38,y:0.32},r_elbow:{x:0.62,y:0.28},l_wrist:{x:0.44,y:0.36},r_wrist:{x:0.56,y:0.30},pelvis:{x:0.50,y:0.44},l_hip:{x:0.44,y:0.46},r_hip:{x:0.56,y:0.46},l_knee:{x:0.44,y:0.57},r_knee:{x:0.56,y:0.57},l_ankle:{x:0.44,y:0.70},r_ankle:{x:0.56,y:0.70},l_toe:{x:0.41,y:0.76},r_toe:{x:0.59,y:0.76} },
      { phase:'set',     head:{x:0.50,y:0.06},neck:{x:0.50,y:0.12},chest:{x:0.50,y:0.24},l_shoulder:{x:0.42,y:0.22},r_shoulder:{x:0.58,y:0.22},l_elbow:{x:0.39,y:0.28},r_elbow:{x:0.58,y:0.20},l_wrist:{x:0.44,y:0.32},r_wrist:{x:0.54,y:0.22},pelvis:{x:0.50,y:0.42},l_hip:{x:0.44,y:0.44},r_hip:{x:0.56,y:0.44},l_knee:{x:0.44,y:0.56},r_knee:{x:0.56,y:0.56},l_ankle:{x:0.44,y:0.70},r_ankle:{x:0.56,y:0.70},l_toe:{x:0.41,y:0.76},r_toe:{x:0.59,y:0.76} },
      { phase:'release', head:{x:0.50,y:0.05},neck:{x:0.50,y:0.11},chest:{x:0.50,y:0.23},l_shoulder:{x:0.43,y:0.21},r_shoulder:{x:0.57,y:0.21},l_elbow:{x:0.40,y:0.26},r_elbow:{x:0.57,y:0.14},l_wrist:{x:0.45,y:0.30},r_wrist:{x:0.54,y:0.08},pelvis:{x:0.50,y:0.41},l_hip:{x:0.44,y:0.43},r_hip:{x:0.56,y:0.43},l_knee:{x:0.44,y:0.56},r_knee:{x:0.56,y:0.56},l_ankle:{x:0.44,y:0.72},r_ankle:{x:0.56,y:0.72},l_toe:{x:0.41,y:0.78},r_toe:{x:0.59,y:0.78} },
      { phase:'land',    head:{x:0.50,y:0.09},neck:{x:0.50,y:0.15},chest:{x:0.50,y:0.27},l_shoulder:{x:0.42,y:0.25},r_shoulder:{x:0.58,y:0.25},l_elbow:{x:0.38,y:0.34},r_elbow:{x:0.60,y:0.22},l_wrist:{x:0.44,y:0.40},r_wrist:{x:0.55,y:0.16},pelvis:{x:0.50,y:0.46},l_hip:{x:0.44,y:0.48},r_hip:{x:0.56,y:0.48},l_knee:{x:0.43,y:0.62},r_knee:{x:0.57,y:0.62},l_ankle:{x:0.43,y:0.79},r_ankle:{x:0.57,y:0.79},l_toe:{x:0.40,y:0.85},r_toe:{x:0.60,y:0.85} },
      { phase:'land',    head:{x:0.50,y:0.12},neck:{x:0.50,y:0.18},chest:{x:0.50,y:0.30},l_shoulder:{x:0.42,y:0.28},r_shoulder:{x:0.58,y:0.28},l_elbow:{x:0.38,y:0.38},r_elbow:{x:0.61,y:0.28},l_wrist:{x:0.44,y:0.46},r_wrist:{x:0.55,y:0.22},pelvis:{x:0.50,y:0.51},l_hip:{x:0.44,y:0.53},r_hip:{x:0.56,y:0.53},l_knee:{x:0.43,y:0.67},r_knee:{x:0.57,y:0.67},l_ankle:{x:0.43,y:0.84},r_ankle:{x:0.57,y:0.84},l_toe:{x:0.40,y:0.90},r_toe:{x:0.60,y:0.90} },
    ],
    phases: [
      { id:'load',    label:'LOAD',    keyJoints:['l_knee','r_knee','l_hip','r_hip'],               cue:'Athletic base. Ball at hip. Load both knees evenly. Stay balanced.' },
      { id:'jump',    label:'JUMP',    keyJoints:['l_ankle','r_ankle','pelvis','l_knee','r_knee'],  cue:'Explode through ankles. Drive knees up. Rise straight — don\'t drift.' },
      { id:'set',     label:'SET',     keyJoints:['r_elbow','r_wrist','chest'],                     cue:'Ball rises to set point. Elbow directly under ball. Eyes locked on rim.' },
      { id:'release', label:'RELEASE', keyJoints:['r_wrist','r_elbow','r_shoulder'],               cue:'Full extension. Wrist flicks through. Reach into the basket. Goose neck finish.' },
      { id:'land',    label:'LAND',    keyJoints:['l_ankle','r_ankle','l_knee','r_knee'],           cue:'Soft landing. Absorb through ankles and knees. Balanced on both feet.' },
    ],
    faults: [
      {
        id:'elbow_out', label:'ELBOW OUT', description:'Shooting elbow flares laterally — pushes ball offline, creates inconsistency.',
        explanation:'Point shooting elbow at the rim. Keep it inside the ball.',
        affectedJoints:['r_elbow'],
        faultFrames: [
          { phase:'set', head:{x:0.50,y:0.06},neck:{x:0.50,y:0.12},chest:{x:0.50,y:0.24},l_shoulder:{x:0.42,y:0.22},r_shoulder:{x:0.58,y:0.22},l_elbow:{x:0.39,y:0.28},r_elbow:{x:0.67,y:0.22},l_wrist:{x:0.44,y:0.32},r_wrist:{x:0.58,y:0.24},pelvis:{x:0.50,y:0.42},l_hip:{x:0.44,y:0.44},r_hip:{x:0.56,y:0.44},l_knee:{x:0.44,y:0.56},r_knee:{x:0.56,y:0.56},l_ankle:{x:0.44,y:0.70},r_ankle:{x:0.56,y:0.70},l_toe:{x:0.41,y:0.76},r_toe:{x:0.59,y:0.76} },
        ],
        keypointOffsets: {},
      },
      { id:'low_arc', label:'LOW ARC', description:'Flat trajectory reduces target window and shooting percentage.', explanation:"Aim for 45–55° release angle. 'Shoot over a defender' mental cue.", affectedJoints:['r_wrist','r_elbow'], keypointOffsets:{'r_wrist':{x:0,y:+.05},'r_elbow':{x:0,y:+.03}} },
    ],
    pathOverlays: [
      { id:'ball_arc', label:'Ball Arc', points:[{x:0.52,y:0.52},{x:0.55,y:0.40},{x:0.60,y:0.28},{x:0.68,y:0.16},{x:0.78,y:0.10},{x:0.90,y:0.22}] },
    ],
  },

  // ── BASEBALL SWING — 14 seeded frames, 80ms interval ─────────────────────────
  baseball_swing: {
    frameIntervalMs: 80,
    frames: [
      { phase:'stance',    head:{x:0.50,y:0.08},neck:{x:0.50,y:0.14},chest:{x:0.50,y:0.27},l_shoulder:{x:0.42,y:0.25},r_shoulder:{x:0.58,y:0.25},l_elbow:{x:0.38,y:0.36},r_elbow:{x:0.62,y:0.32},l_wrist:{x:0.36,y:0.28},r_wrist:{x:0.64,y:0.22},pelvis:{x:0.50,y:0.47},l_hip:{x:0.44,y:0.49},r_hip:{x:0.56,y:0.49},l_knee:{x:0.42,y:0.67},r_knee:{x:0.58,y:0.67},l_ankle:{x:0.41,y:0.87},r_ankle:{x:0.59,y:0.87},l_toe:{x:0.38,y:0.92},r_toe:{x:0.62,y:0.92} },
      { phase:'stance',    head:{x:0.50,y:0.08},neck:{x:0.50,y:0.14},chest:{x:0.50,y:0.27},l_shoulder:{x:0.42,y:0.25},r_shoulder:{x:0.58,y:0.25},l_elbow:{x:0.38,y:0.36},r_elbow:{x:0.63,y:0.32},l_wrist:{x:0.36,y:0.28},r_wrist:{x:0.65,y:0.22},pelvis:{x:0.50,y:0.47},l_hip:{x:0.44,y:0.49},r_hip:{x:0.56,y:0.49},l_knee:{x:0.42,y:0.67},r_knee:{x:0.58,y:0.67},l_ankle:{x:0.41,y:0.87},r_ankle:{x:0.59,y:0.87},l_toe:{x:0.38,y:0.92},r_toe:{x:0.62,y:0.92} },
      { phase:'load',      head:{x:0.50,y:0.09},neck:{x:0.50,y:0.15},chest:{x:0.51,y:0.28},l_shoulder:{x:0.43,y:0.26},r_shoulder:{x:0.59,y:0.26},l_elbow:{x:0.39,y:0.37},r_elbow:{x:0.64,y:0.31},l_wrist:{x:0.38,y:0.27},r_wrist:{x:0.68,y:0.21},pelvis:{x:0.51,y:0.48},l_hip:{x:0.45,y:0.50},r_hip:{x:0.57,y:0.50},l_knee:{x:0.43,y:0.68},r_knee:{x:0.60,y:0.66},l_ankle:{x:0.41,y:0.87},r_ankle:{x:0.60,y:0.88},l_toe:{x:0.38,y:0.92},r_toe:{x:0.63,y:0.93} },
      { phase:'load',      head:{x:0.50,y:0.09},neck:{x:0.50,y:0.15},chest:{x:0.51,y:0.28},l_shoulder:{x:0.43,y:0.26},r_shoulder:{x:0.59,y:0.26},l_elbow:{x:0.39,y:0.37},r_elbow:{x:0.65,y:0.31},l_wrist:{x:0.38,y:0.27},r_wrist:{x:0.69,y:0.20},pelvis:{x:0.51,y:0.48},l_hip:{x:0.45,y:0.50},r_hip:{x:0.57,y:0.50},l_knee:{x:0.43,y:0.68},r_knee:{x:0.61,y:0.67},l_ankle:{x:0.41,y:0.87},r_ankle:{x:0.61,y:0.88},l_toe:{x:0.38,y:0.92},r_toe:{x:0.64,y:0.93} },
      { phase:'stride',    head:{x:0.49,y:0.09},neck:{x:0.49,y:0.15},chest:{x:0.49,y:0.28},l_shoulder:{x:0.41,y:0.26},r_shoulder:{x:0.57,y:0.26},l_elbow:{x:0.37,y:0.37},r_elbow:{x:0.63,y:0.31},l_wrist:{x:0.36,y:0.27},r_wrist:{x:0.67,y:0.21},pelvis:{x:0.49,y:0.48},l_hip:{x:0.43,y:0.50},r_hip:{x:0.55,y:0.50},l_knee:{x:0.38,y:0.67},r_knee:{x:0.59,y:0.66},l_ankle:{x:0.34,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.31,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'stride',    head:{x:0.49,y:0.09},neck:{x:0.49,y:0.15},chest:{x:0.49,y:0.28},l_shoulder:{x:0.41,y:0.26},r_shoulder:{x:0.57,y:0.26},l_elbow:{x:0.37,y:0.37},r_elbow:{x:0.63,y:0.31},l_wrist:{x:0.36,y:0.27},r_wrist:{x:0.67,y:0.21},pelvis:{x:0.49,y:0.48},l_hip:{x:0.43,y:0.50},r_hip:{x:0.55,y:0.50},l_knee:{x:0.37,y:0.67},r_knee:{x:0.58,y:0.66},l_ankle:{x:0.33,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.30,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'rotation',  head:{x:0.48,y:0.09},neck:{x:0.48,y:0.15},chest:{x:0.47,y:0.28},l_shoulder:{x:0.38,y:0.27},r_shoulder:{x:0.54,y:0.26},l_elbow:{x:0.33,y:0.37},r_elbow:{x:0.60,y:0.30},l_wrist:{x:0.32,y:0.27},r_wrist:{x:0.65,y:0.20},pelvis:{x:0.46,y:0.48},l_hip:{x:0.40,y:0.50},r_hip:{x:0.52,y:0.50},l_knee:{x:0.36,y:0.67},r_knee:{x:0.57,y:0.66},l_ankle:{x:0.33,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.30,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'rotation',  head:{x:0.47,y:0.09},neck:{x:0.47,y:0.15},chest:{x:0.45,y:0.28},l_shoulder:{x:0.35,y:0.27},r_shoulder:{x:0.52,y:0.26},l_elbow:{x:0.30,y:0.37},r_elbow:{x:0.56,y:0.31},l_wrist:{x:0.29,y:0.30},r_wrist:{x:0.60,y:0.22},pelvis:{x:0.44,y:0.48},l_hip:{x:0.38,y:0.50},r_hip:{x:0.50,y:0.50},l_knee:{x:0.35,y:0.67},r_knee:{x:0.56,y:0.66},l_ankle:{x:0.33,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.30,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'contact',   head:{x:0.47,y:0.09},neck:{x:0.47,y:0.15},chest:{x:0.44,y:0.29},l_shoulder:{x:0.33,y:0.28},r_shoulder:{x:0.50,y:0.26},l_elbow:{x:0.28,y:0.38},r_elbow:{x:0.52,y:0.32},l_wrist:{x:0.26,y:0.40},r_wrist:{x:0.52,y:0.38},pelvis:{x:0.42,y:0.48},l_hip:{x:0.36,y:0.50},r_hip:{x:0.48,y:0.50},l_knee:{x:0.34,y:0.67},r_knee:{x:0.56,y:0.66},l_ankle:{x:0.32,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'contact',   head:{x:0.47,y:0.09},neck:{x:0.47,y:0.15},chest:{x:0.43,y:0.29},l_shoulder:{x:0.32,y:0.28},r_shoulder:{x:0.49,y:0.26},l_elbow:{x:0.27,y:0.38},r_elbow:{x:0.51,y:0.33},l_wrist:{x:0.25,y:0.41},r_wrist:{x:0.51,y:0.39},pelvis:{x:0.41,y:0.48},l_hip:{x:0.35,y:0.50},r_hip:{x:0.47,y:0.50},l_knee:{x:0.33,y:0.67},r_knee:{x:0.55,y:0.66},l_ankle:{x:0.32,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'extension', head:{x:0.47,y:0.09},neck:{x:0.47,y:0.15},chest:{x:0.43,y:0.29},l_shoulder:{x:0.32,y:0.28},r_shoulder:{x:0.49,y:0.26},l_elbow:{x:0.24,y:0.36},r_elbow:{x:0.48,y:0.34},l_wrist:{x:0.20,y:0.38},r_wrist:{x:0.47,y:0.38},pelvis:{x:0.41,y:0.48},l_hip:{x:0.35,y:0.50},r_hip:{x:0.47,y:0.50},l_knee:{x:0.33,y:0.67},r_knee:{x:0.55,y:0.66},l_ankle:{x:0.32,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'extension', head:{x:0.47,y:0.08},neck:{x:0.47,y:0.14},chest:{x:0.43,y:0.28},l_shoulder:{x:0.32,y:0.27},r_shoulder:{x:0.49,y:0.25},l_elbow:{x:0.22,y:0.22},r_elbow:{x:0.47,y:0.22},l_wrist:{x:0.22,y:0.14},r_wrist:{x:0.47,y:0.14},pelvis:{x:0.41,y:0.48},l_hip:{x:0.35,y:0.50},r_hip:{x:0.47,y:0.50},l_knee:{x:0.33,y:0.67},r_knee:{x:0.55,y:0.66},l_ankle:{x:0.32,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'finish',    head:{x:0.46,y:0.08},neck:{x:0.46,y:0.14},chest:{x:0.42,y:0.27},l_shoulder:{x:0.30,y:0.25},r_shoulder:{x:0.48,y:0.22},l_elbow:{x:0.26,y:0.18},r_elbow:{x:0.48,y:0.15},l_wrist:{x:0.30,y:0.12},r_wrist:{x:0.52,y:0.10},pelvis:{x:0.40,y:0.48},l_hip:{x:0.34,y:0.50},r_hip:{x:0.46,y:0.50},l_knee:{x:0.33,y:0.67},r_knee:{x:0.55,y:0.68},l_ankle:{x:0.32,y:0.87},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
      { phase:'finish',    head:{x:0.46,y:0.08},neck:{x:0.46,y:0.14},chest:{x:0.42,y:0.27},l_shoulder:{x:0.30,y:0.25},r_shoulder:{x:0.48,y:0.22},l_elbow:{x:0.26,y:0.17},r_elbow:{x:0.48,y:0.14},l_wrist:{x:0.30,y:0.11},r_wrist:{x:0.52,y:0.09},pelvis:{x:0.40,y:0.48},l_hip:{x:0.34,y:0.50},r_hip:{x:0.46,y:0.50},l_knee:{x:0.33,y:0.67},r_knee:{x:0.55,y:0.68},l_ankle:{x:0.32,y:0.87},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.29,y:0.91},r_toe:{x:0.62,y:0.93} },
    ],
    phases: [
      { id:'stance',    label:'STANCE',    keyJoints:['l_knee','r_knee','l_hip','r_hip'],          cue:'Athletic base. Weight centered, slightly back. Relaxed grip. Eyes on pitcher.' },
      { id:'load',      label:'LOAD',      keyJoints:['r_hip','r_knee','pelvis'],                  cue:'Load back hip. Slight inward turn. Hands drift back. Stay soft — don\'t over-coil.' },
      { id:'stride',    label:'STRIDE',    keyJoints:['l_ankle','l_knee','pelvis'],                cue:'Soft stride forward. Plant front foot firmly. Hands stay back — don\'t drag early.' },
      { id:'rotation',  label:'HIP FIRE',  keyJoints:['l_hip','r_hip','pelvis','chest'],          cue:'Hips fire first. Clear aggressively. Feel the separation — shoulders stay back.' },
      { id:'contact',   label:'CONTACT',   keyJoints:['l_wrist','r_wrist','l_elbow','r_elbow'],   cue:'Contact out front. Extension through the ball. Head down. Hands inside the ball.' },
      { id:'extension', label:'EXTENSION', keyJoints:['l_elbow','r_elbow','l_wrist','r_wrist'],   cue:'Full arm extension. Drive through the zone — don\'t roll over early.' },
      { id:'finish',    label:'FINISH',    keyJoints:['l_shoulder','r_shoulder','chest','pelvis'], cue:'High balanced finish. Weight on front foot. Back toe down. Tall and complete.' },
    ],
    faults: [
      {
        id:'casting', label:'CASTING', description:'Hands push away from body on downswing — long looping path, poor contact.',
        explanation:'Keep hands inside. Knob of bat leads to contact.',
        affectedJoints:['l_elbow','r_elbow','l_wrist','r_wrist'],
        faultFrames: [
          { phase:'rotation', head:{x:0.47,y:0.09},neck:{x:0.47,y:0.15},chest:{x:0.45,y:0.28},l_shoulder:{x:0.35,y:0.27},r_shoulder:{x:0.52,y:0.26},l_elbow:{x:0.26,y:0.40},r_elbow:{x:0.48,y:0.40},l_wrist:{x:0.22,y:0.46},r_wrist:{x:0.48,y:0.44},pelvis:{x:0.44,y:0.48},l_hip:{x:0.38,y:0.50},r_hip:{x:0.50,y:0.50},l_knee:{x:0.35,y:0.67},r_knee:{x:0.56,y:0.66},l_ankle:{x:0.33,y:0.86},r_ankle:{x:0.59,y:0.88},l_toe:{x:0.30,y:0.91},r_toe:{x:0.62,y:0.93} },
        ],
        keypointOffsets: {},
      },
      { id:'upper_body_dominant', label:'UPPER DOMINANT', description:'Shoulders initiate before hips — kills separation and power.', explanation:'Fire hips first. Feel the stretch between hips and shoulders.', affectedJoints:['l_shoulder','r_shoulder','chest'], keypointOffsets:{'chest':{x:-.04,y:0},'l_shoulder':{x:-.04,y:0},'r_shoulder':{x:-.04,y:0}} },
      { id:'head_drift', label:'HEAD DRIFT', description:'Head moves during swing — loses ball tracking.', explanation:'Keep head still through contact. Eyes stay on the ball.', affectedJoints:['head','neck'], keypointOffsets:{'head':{x:-.05,y:0},'neck':{x:-.03,y:0}} },
    ],
    pathOverlays: [
      { id:'bat_path', label:'Bat Path', points:[{x:0.70,y:0.22},{x:0.62,y:0.32},{x:0.53,y:0.40},{x:0.44,y:0.43},{x:0.33,y:0.40},{x:0.22,y:0.36}] },
    ],
  },
};

// ─── Frame builders ───────────────────────────────────────────────────────────

function interp(a, b, t) {
  const result = {};
  for (const k of LANDMARKS) {
    if (!a[k] || !b[k]) continue;
    result[k] = { x: a[k].x + (b[k].x - a[k].x)*t, y: a[k].y + (b[k].y - a[k].y)*t };
  }
  return result;
}

function buildDeadliftFrames() {
  const setup = { head:{x:.50,y:.26}, neck:{x:.50,y:.32}, chest:{x:.48,y:.44}, l_shoulder:{x:.41,y:.42}, r_shoulder:{x:.57,y:.42}, l_elbow:{x:.40,y:.54}, r_elbow:{x:.58,y:.54}, l_wrist:{x:.42,y:.64}, r_wrist:{x:.56,y:.64}, pelvis:{x:.50,y:.52}, l_hip:{x:.44,y:.54}, r_hip:{x:.56,y:.54}, l_knee:{x:.43,y:.72}, r_knee:{x:.57,y:.72}, l_ankle:{x:.43,y:.88}, r_ankle:{x:.57,y:.88}, l_toe:{x:.40,y:.93}, r_toe:{x:.60,y:.93} };
  const stand = { head:{x:.50,y:.08}, neck:{x:.50,y:.14}, chest:{x:.50,y:.26}, l_shoulder:{x:.42,y:.24}, r_shoulder:{x:.58,y:.24}, l_elbow:{x:.40,y:.36}, r_elbow:{x:.60,y:.36}, l_wrist:{x:.42,y:.48}, r_wrist:{x:.58,y:.48}, pelvis:{x:.50,y:.46}, l_hip:{x:.44,y:.48}, r_hip:{x:.56,y:.48}, l_knee:{x:.43,y:.68}, r_knee:{x:.57,y:.68}, l_ankle:{x:.43,y:.88}, r_ankle:{x:.57,y:.88}, l_toe:{x:.40,y:.93}, r_toe:{x:.60,y:.93} };
  const mid   = interp(setup, stand, 0.5);
  return [
    {phase:'setup',...setup}, {phase:'setup',...setup},
    {phase:'hinge',...setup}, {phase:'hinge',...interp(setup,mid,.4)},
    {phase:'pull', ...interp(setup,mid,.7)}, {phase:'pull', ...mid},
    {phase:'lockout',...interp(mid,stand,.6)}, {phase:'lockout',...stand},
    {phase:'lower',...interp(stand,setup,.5)}, {phase:'lower',...setup},
  ];
}

function buildPushupFrames() {
  const top = { head:{x:.14,y:.34}, neck:{x:.20,y:.36}, chest:{x:.34,y:.40}, l_shoulder:{x:.30,y:.38}, r_shoulder:{x:.38,y:.38}, l_elbow:{x:.22,y:.44}, r_elbow:{x:.46,y:.44}, l_wrist:{x:.14,y:.46}, r_wrist:{x:.54,y:.46}, pelvis:{x:.56,y:.46}, l_hip:{x:.52,y:.46}, r_hip:{x:.60,y:.46}, l_knee:{x:.68,y:.50}, r_knee:{x:.68,y:.50}, l_ankle:{x:.82,y:.52}, r_ankle:{x:.82,y:.52}, l_toe:{x:.88,y:.54}, r_toe:{x:.88,y:.54} };
  const bot = { head:{x:.14,y:.40}, neck:{x:.20,y:.43}, chest:{x:.34,y:.50}, l_shoulder:{x:.30,y:.48}, r_shoulder:{x:.38,y:.48}, l_elbow:{x:.20,y:.52}, r_elbow:{x:.48,y:.52}, l_wrist:{x:.14,y:.46}, r_wrist:{x:.54,y:.46}, pelvis:{x:.56,y:.52}, l_hip:{x:.52,y:.52}, r_hip:{x:.60,y:.52}, l_knee:{x:.68,y:.54}, r_knee:{x:.68,y:.54}, l_ankle:{x:.82,y:.56}, r_ankle:{x:.82,y:.56}, l_toe:{x:.88,y:.58}, r_toe:{x:.88,y:.58} };
  return [
    {phase:'setup',...top}, {phase:'descent',...interp(top,bot,.5)},
    {phase:'bottom',...bot}, {phase:'bottom',...bot},
    {phase:'ascent',...interp(bot,top,.5)}, {phase:'lockout',...top},
  ];
}

function buildLungeFrames() {
  const stand = { head:{x:.50,y:.08}, neck:{x:.50,y:.14}, chest:{x:.50,y:.26}, l_shoulder:{x:.42,y:.24}, r_shoulder:{x:.58,y:.24}, l_elbow:{x:.40,y:.36}, r_elbow:{x:.60,y:.36}, l_wrist:{x:.38,y:.46}, r_wrist:{x:.62,y:.46}, pelvis:{x:.50,y:.46}, l_hip:{x:.44,y:.48}, r_hip:{x:.56,y:.48}, l_knee:{x:.44,y:.68}, r_knee:{x:.56,y:.68}, l_ankle:{x:.44,y:.88}, r_ankle:{x:.56,y:.88}, l_toe:{x:.41,y:.93}, r_toe:{x:.59,y:.93} };
  const bot   = { head:{x:.44,y:.14}, neck:{x:.44,y:.20}, chest:{x:.44,y:.32}, l_shoulder:{x:.36,y:.30}, r_shoulder:{x:.52,y:.30}, l_elbow:{x:.34,y:.42}, r_elbow:{x:.54,y:.42}, l_wrist:{x:.32,y:.52}, r_wrist:{x:.56,y:.52}, pelvis:{x:.44,y:.52}, l_hip:{x:.38,y:.54}, r_hip:{x:.50,y:.54}, l_knee:{x:.30,y:.68}, r_knee:{x:.58,y:.80}, l_ankle:{x:.28,y:.88}, r_ankle:{x:.58,y:.88}, l_toe:{x:.24,y:.93}, r_toe:{x:.62,y:.93} };
  return [
    {phase:'setup',...stand}, {phase:'step',...interp(stand,bot,.4)},
    {phase:'bottom',...bot}, {phase:'bottom',...bot},
    {phase:'ascent',...interp(bot,stand,.6)}, {phase:'lockout',...stand},
  ];
}

function buildOHPFrames() {
  const rack = { head:{x:.50,y:.08}, neck:{x:.50,y:.14}, chest:{x:.50,y:.26}, l_shoulder:{x:.42,y:.24}, r_shoulder:{x:.58,y:.24}, l_elbow:{x:.38,y:.34}, r_elbow:{x:.62,y:.34}, l_wrist:{x:.42,y:.28}, r_wrist:{x:.58,y:.28}, pelvis:{x:.50,y:.46}, l_hip:{x:.44,y:.48}, r_hip:{x:.56,y:.48}, l_knee:{x:.44,y:.68}, r_knee:{x:.56,y:.68}, l_ankle:{x:.44,y:.88}, r_ankle:{x:.56,y:.88}, l_toe:{x:.41,y:.93}, r_toe:{x:.59,y:.93} };
  const lock = { ...rack, l_elbow:{x:.42,y:.18}, r_elbow:{x:.58,y:.18}, l_wrist:{x:.44,y:.06}, r_wrist:{x:.56,y:.06} };
  return [
    {phase:'start',...rack}, {phase:'start',...rack},
    {phase:'press',...interp(rack,lock,.5)}, {phase:'lockout',...lock},
    {phase:'lockout',...lock}, {phase:'descent',...interp(lock,rack,.5)},
    {phase:'start',...rack},
  ];
}

function buildGolfFrames() {
  const address  = { head:{x:.50,y:.14}, neck:{x:.50,y:.20}, chest:{x:.50,y:.32}, l_shoulder:{x:.42,y:.30}, r_shoulder:{x:.58,y:.30}, l_elbow:{x:.40,y:.42}, r_elbow:{x:.60,y:.42}, l_wrist:{x:.42,y:.54}, r_wrist:{x:.58,y:.54}, pelvis:{x:.50,y:.48}, l_hip:{x:.44,y:.50}, r_hip:{x:.56,y:.50}, l_knee:{x:.43,y:.68}, r_knee:{x:.57,y:.68}, l_ankle:{x:.43,y:.86}, r_ankle:{x:.57,y:.86}, l_toe:{x:.40,y:.91}, r_toe:{x:.60,y:.91} };
  const backswing= { head:{x:.48,y:.14}, neck:{x:.48,y:.20}, chest:{x:.46,y:.32}, l_shoulder:{x:.38,y:.28}, r_shoulder:{x:.56,y:.34}, l_elbow:{x:.30,y:.24}, r_elbow:{x:.58,y:.44}, l_wrist:{x:.26,y:.18}, r_wrist:{x:.56,y:.54}, pelvis:{x:.50,y:.48}, l_hip:{x:.46,y:.50}, r_hip:{x:.54,y:.50}, l_knee:{x:.44,y:.68}, r_knee:{x:.56,y:.68}, l_ankle:{x:.43,y:.86}, r_ankle:{x:.57,y:.86}, l_toe:{x:.40,y:.91}, r_toe:{x:.60,y:.91} };
  const impact   = { head:{x:.50,y:.14}, neck:{x:.50,y:.20}, chest:{x:.52,y:.34}, l_shoulder:{x:.44,y:.30}, r_shoulder:{x:.60,y:.36}, l_elbow:{x:.44,y:.44}, r_elbow:{x:.62,y:.46}, l_wrist:{x:.46,y:.56}, r_wrist:{x:.60,y:.56}, pelvis:{x:.50,y:.48}, l_hip:{x:.44,y:.50}, r_hip:{x:.56,y:.50}, l_knee:{x:.42,y:.68}, r_knee:{x:.58,y:.68}, l_ankle:{x:.43,y:.86}, r_ankle:{x:.57,y:.86}, l_toe:{x:.40,y:.91}, r_toe:{x:.60,y:.91} };
  const finish   = { head:{x:.50,y:.12}, neck:{x:.50,y:.18}, chest:{x:.52,y:.28}, l_shoulder:{x:.58,y:.24}, r_shoulder:{x:.44,y:.30}, l_elbow:{x:.62,y:.16}, r_elbow:{x:.44,y:.40}, l_wrist:{x:.58,y:.10}, r_wrist:{x:.46,y:.50}, pelvis:{x:.50,y:.46}, l_hip:{x:.44,y:.48}, r_hip:{x:.56,y:.48}, l_knee:{x:.44,y:.66}, r_knee:{x:.56,y:.70}, l_ankle:{x:.44,y:.86}, r_ankle:{x:.56,y:.88}, l_toe:{x:.41,y:.91}, r_toe:{x:.60,y:.93} };
  return [
    {phase:'address',...address}, {phase:'address',...address},
    {phase:'backswing',...interp(address,backswing,.5)}, {phase:'backswing',...backswing},
    {phase:'transition',...interp(backswing,impact,.3)},
    {phase:'impact',...impact},
    {phase:'follow_through',...interp(impact,finish,.5)}, {phase:'follow_through',...finish},
  ];
}

function buildBasketballFrames() {
  const load    = { head:{x:.50,y:.16}, neck:{x:.50,y:.22}, chest:{x:.50,y:.34}, l_shoulder:{x:.42,y:.32}, r_shoulder:{x:.58,y:.32}, l_elbow:{x:.38,y:.44}, r_elbow:{x:.62,y:.40}, l_wrist:{x:.36,y:.54}, r_wrist:{x:.60,y:.50}, pelvis:{x:.50,y:.52}, l_hip:{x:.44,y:.54}, r_hip:{x:.56,y:.54}, l_knee:{x:.43,y:.72}, r_knee:{x:.57,y:.72}, l_ankle:{x:.43,y:.88}, r_ankle:{x:.57,y:.88}, l_toe:{x:.40,y:.93}, r_toe:{x:.60,y:.93} };
  const peak    = { head:{x:.50,y:.06}, neck:{x:.50,y:.12}, chest:{x:.50,y:.24}, l_shoulder:{x:.42,y:.22}, r_shoulder:{x:.58,y:.22}, l_elbow:{x:.40,y:.30}, r_elbow:{x:.60,y:.22}, l_wrist:{x:.38,y:.38}, r_wrist:{x:.56,y:.12}, pelvis:{x:.50,y:.40}, l_hip:{x:.44,y:.42}, r_hip:{x:.56,y:.42}, l_knee:{x:.44,y:.60}, r_knee:{x:.56,y:.60}, l_ankle:{x:.44,y:.78}, r_ankle:{x:.56,y:.78}, l_toe:{x:.41,y:.84}, r_toe:{x:.60,y:.84} };
  return [
    {phase:'load',...load}, {phase:'load',...load},
    {phase:'jump',...interp(load,peak,.5)},
    {phase:'set',...interp(load,peak,.8)},
    {phase:'release',...peak},
    {phase:'follow',...interp(peak,load,.4)},
    {phase:'follow',...load},
  ];
}