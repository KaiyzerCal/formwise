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

  // 1. Segments
  ctx.save();
  for (const [a, b] of SEGMENTS) {
    if (!frame[a] || !frame[b]) continue;
    const A = px(frame[a]), B = px(frame[b]);
    const isFault = faultJoints.includes(a) || faultJoints.includes(b);
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.strokeStyle = isFault ? style.faultSegmentColor : style.segmentColor;
    ctx.lineWidth   = style.segmentWidth;
    ctx.globalAlpha = style.segmentOpacity;
    ctx.shadowBlur  = style.glowBlur;
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

    // Pulse scale for highlighted joints
    const pulse = isHighlight ? 1 + 0.25 * Math.sin(pulseT * Math.PI * 2) : 1;
    const r     = (isHighlight ? style.highlightRadius : style.jointRadius) * pulse;

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
    ctx.fillStyle   = isFault ? style.faultJointColor : style.jointColor;
    ctx.globalAlpha = 1.0;
    ctx.shadowBlur  = isHighlight ? 12 : style.glowBlur;
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
  ctx.setLineDash(style.pathDash);
  ctx.strokeStyle = style.pathColor;
  ctx.lineWidth   = style.pathWidth;
  ctx.moveTo(pathPoints[0].x * W, pathPoints[0].y * H);
  for (let i = 1; i < pathPoints.length; i++) {
    ctx.lineTo(pathPoints[i].x * W, pathPoints[i].y * H);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ─── Motion Frame Data ────────────────────────────────────────────────────────
// Squat — 9 frames across 5 phases

const SQUAT_STAND = {
  head:{x:.50,y:.08}, neck:{x:.50,y:.14}, chest:{x:.50,y:.26},
  l_shoulder:{x:.42,y:.24}, r_shoulder:{x:.58,y:.24},
  l_elbow:{x:.38,y:.36}, r_elbow:{x:.62,y:.36},
  l_wrist:{x:.36,y:.46}, r_wrist:{x:.64,y:.46},
  pelvis:{x:.50,y:.46},
  l_hip:{x:.44,y:.48}, r_hip:{x:.56,y:.48},
  l_knee:{x:.43,y:.68}, r_knee:{x:.57,y:.68},
  l_ankle:{x:.43,y:.88}, r_ankle:{x:.57,y:.88},
  l_toe:{x:.40,y:.93}, r_toe:{x:.60,y:.93},
};

const SQUAT_BOTTOM = {
  head:{x:.50,y:.22}, neck:{x:.50,y:.28}, chest:{x:.50,y:.38},
  l_shoulder:{x:.42,y:.36}, r_shoulder:{x:.58,y:.36},
  l_elbow:{x:.36,y:.46}, r_elbow:{x:.64,y:.46},
  l_wrist:{x:.34,y:.54}, r_wrist:{x:.66,y:.54},
  pelvis:{x:.50,y:.56},
  l_hip:{x:.43,y:.58}, r_hip:{x:.57,y:.58},
  l_knee:{x:.38,y:.70}, r_knee:{x:.62,y:.70},
  l_ankle:{x:.43,y:.88}, r_ankle:{x:.57,y:.88},
  l_toe:{x:.40,y:.93}, r_toe:{x:.60,y:.93},
};

export const MOTION_FRAMES = {
  squat: {
    frameIntervalMs: 500,
    frames: [
      { phase:'setup',   ...SQUAT_STAND },
      { phase:'descent', ...interp(SQUAT_STAND, SQUAT_BOTTOM, 0.35) },
      { phase:'descent', ...interp(SQUAT_STAND, SQUAT_BOTTOM, 0.70) },
      { phase:'bottom',  ...SQUAT_BOTTOM },
      { phase:'bottom',  ...SQUAT_BOTTOM },
      { phase:'ascent',  ...interp(SQUAT_BOTTOM, SQUAT_STAND, 0.40) },
      { phase:'ascent',  ...interp(SQUAT_BOTTOM, SQUAT_STAND, 0.75) },
      { phase:'lockout', ...SQUAT_STAND },
      { phase:'lockout', ...SQUAT_STAND },
    ],
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest'],             cue:'Feet shoulder-width, toes out 15–30°. Bar over mid-foot.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_knee','r_knee','chest'],            cue:'Push knees out. Chest tall. Controlled descent.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_knee','r_knee','l_hip','r_hip'],    cue:'Hip crease below knee. Heels planted. Spine neutral.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['l_hip','r_hip','chest'],              cue:'Drive floor away. Hips and chest rise together.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_knee','r_knee','pelvis'],           cue:'Full extension. Hips through. Squeeze at top.' },
    ],
    faults: [
      { id:'knee_valgus', label:'KNEE VALGUS', description:'Knees collapsing inward — ACL/MCL stress.', explanation:'Drive knees outward to maintain alignment over toes.', affectedJoints:['l_knee','r_knee'], keypointOffsets:{'l_knee':{x:+.06,y:0},'r_knee':{x:-.06,y:0}} },
      { id:'spine_collapse', label:'SPINE COLLAPSE', description:'Excessive forward lean — loads lumbar spine.', explanation:'Brace core and keep chest lifted through descent.', affectedJoints:['chest','neck','head'], keypointOffsets:{'chest':{x:0,y:+.04},'neck':{x:0,y:+.05},'head':{x:0,y:+.06}} },
      { id:'heel_lift', label:'HEEL LIFT', description:'Heels rise at depth — limited ankle dorsiflexion.', explanation:'Keep heels planted. Consider heel elevation or mobility work.', affectedJoints:['l_ankle','r_ankle','l_toe','r_toe'], keypointOffsets:{'l_ankle':{x:0,y:-.03},'r_ankle':{x:0,y:-.03},'l_toe':{x:0,y:-.04},'r_toe':{x:0,y:-.04}} },
    ],
    pathOverlays: [
      { id:'knee_track', label:'Knee Path', points:[{x:.43,y:.68},{x:.41,y:.73},{x:.40,y:.79},{x:.40,y:.84}] },
    ],
  },

  deadlift: {
    frameIntervalMs: 500,
    frames: buildDeadliftFrames(),
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest'],              cue:'Bar over mid-foot. Hinge at hips. Neutral spine. Lats tight.' },
      { id:'hinge',   label:'HINGE',   keyJoints:['l_hip','r_hip','chest','pelvis'],     cue:'Push hips back. Shoulders slightly ahead of bar.' },
      { id:'pull',    label:'PULL',    keyJoints:['chest','l_knee','r_knee'],             cue:'Push the floor away. Bar stays close. Hips and shoulders rise together.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['pelvis','l_hip','r_hip'],             cue:'Full extension. Hips through. Shoulders back.' },
      { id:'lower',   label:'LOWER',   keyJoints:['l_hip','r_hip','chest'],              cue:'Control the descent. Same path down as up.' },
    ],
    faults: [
      { id:'rounded_back', label:'ROUNDED BACK', description:'Spine rounds under load — disc injury risk.', explanation:'Brace hard and stay long through the spine before pulling.', affectedJoints:['chest','neck'], keypointOffsets:{'chest':{x:0,y:+.05},'neck':{x:0,y:+.04}} },
      { id:'bar_drift', label:'BAR DRIFT', description:'Bar drifts away from body — increases moment arm.', explanation:'Keep bar dragging close — shins to thighs.', affectedJoints:['l_wrist','r_wrist'], keypointOffsets:{'l_wrist':{x:-.05,y:0},'r_wrist':{x:+.05,y:0}} },
      { id:'hips_shoot', label:'HIPS SHOOT UP', description:'Hips rise faster than shoulders — stiff-leg pattern.', explanation:'Push the floor away — hips and bar rise at the same rate.', affectedJoints:['l_hip','r_hip','pelvis'], keypointOffsets:{'pelvis':{x:0,y:-.04},'l_hip':{x:0,y:-.04},'r_hip':{x:0,y:-.04}} },
    ],
    pathOverlays: [
      { id:'bar_path', label:'Bar Path', points:[{x:.50,y:.82},{x:.50,y:.64},{x:.50,y:.46},{x:.50,y:.32}] },
    ],
  },

  pushup: {
    frameIntervalMs: 500,
    frames: buildPushupFrames(),
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['chest','pelvis','l_ankle','r_ankle'], cue:'Hands shoulder-width. Body in one line. Core braced.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_elbow','r_elbow','chest'],          cue:'Elbows 45° from torso. Controlled lowering.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_elbow','r_elbow','chest'],          cue:'Chest near floor. Full range of motion.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['chest','l_elbow','r_elbow'],          cue:'Push floor away. Stay rigid. No hip sag.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_elbow','r_elbow','pelvis'],         cue:'Full extension. Body line maintained.' },
    ],
    faults: [
      { id:'hip_sag',  label:'HIP SAG',  description:"Hips drop below body line — lower back strain.", explanation:"Squeeze glutes and abs hard. Imagine your body is a steel plank.", affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:0,y:+.06},'l_hip':{x:0,y:+.06},'r_hip':{x:0,y:+.06}} },
      { id:'elbow_flare', label:'ELBOW FLARE', description:"Elbows flare wide — shoulder impingement risk.", explanation:"Tuck elbows 45° to body. Think 'arrows, not Ts'.", affectedJoints:['l_elbow','r_elbow'], keypointOffsets:{'l_elbow':{x:-.06,y:0},'r_elbow':{x:+.06,y:0}} },
    ],
    pathOverlays: [],
  },

  lunge: {
    frameIntervalMs: 500,
    frames: buildLungeFrames(),
    phases: [
      { id:'setup',   label:'SETUP',   keyJoints:['l_hip','r_hip','chest'],              cue:'Stand tall. Core engaged. Weight centered.' },
      { id:'step',    label:'STEP',    keyJoints:['l_knee','l_ankle'],                   cue:'Step forward. Land heel first. Keep torso upright.' },
      { id:'bottom',  label:'BOTTOM',  keyJoints:['l_knee','l_hip','r_knee'],            cue:'Front shin vertical. Back knee near floor. Chest tall.' },
      { id:'ascent',  label:'ASCENT',  keyJoints:['l_hip','l_knee'],                    cue:'Drive front heel. Push hips tall.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_hip','r_hip','chest'],              cue:'Stand fully. Hips extended. Reset.' },
    ],
    faults: [
      { id:'knee_past_toe', label:'KNEE PAST TOE', description:'Front knee shoots far past toes — patellar stress.', explanation:'Step longer or lean back slightly. Keep shin vertical.', affectedJoints:['l_knee'], keypointOffsets:{'l_knee':{x:-.04,y:-.03}} },
      { id:'trunk_lean',    label:'TRUNK LEAN',    description:'Excessive forward lean — reduces glute engagement.', explanation:'Keep torso tall. Drive front heel into floor.', affectedJoints:['chest','neck','head'], keypointOffsets:{'chest':{x:0,y:+.04},'neck':{x:0,y:+.04},'head':{x:0,y:+.04}} },
    ],
    pathOverlays: [],
  },

  overhead_press: {
    frameIntervalMs: 500,
    frames: buildOHPFrames(),
    phases: [
      { id:'start',   label:'START',   keyJoints:['l_elbow','r_elbow','chest'],          cue:'Bar at collarbones. Core braced. Ribs down.' },
      { id:'press',   label:'PRESS',   keyJoints:['l_elbow','r_elbow','l_wrist','r_wrist'], cue:'Press vertically. Move head back, then under.' },
      { id:'lockout', label:'LOCKOUT', keyJoints:['l_wrist','r_wrist','chest'],          cue:'Arms fully extended. Shrug at top. Balance over midfoot.' },
      { id:'descent', label:'DESCENT', keyJoints:['l_elbow','r_elbow'],                 cue:'Control the descent. Return to front rack.' },
    ],
    faults: [
      { id:'back_arch',  label:'BACK ARCH',    description:'Excessive lumbar arch — disc compression.', explanation:'Squeeze glutes, brace abs, tuck ribs before pressing.', affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:0,y:-.03},'l_hip':{x:0,y:-.02},'r_hip':{x:0,y:-.02}} },
      { id:'bar_forward',label:'BAR FORWARD',  description:'Bar drifts forward — inefficient path, shoulder stress.', explanation:'Press the bar in a vertical line directly overhead.', affectedJoints:['l_wrist','r_wrist'], keypointOffsets:{'l_wrist':{x:-.04,y:0},'r_wrist':{x:+.04,y:0}} },
    ],
    pathOverlays: [
      { id:'bar_path', label:'Bar Path', points:[{x:.50,y:.54},{x:.50,y:.38},{x:.50,y:.20},{x:.50,y:.08}] },
    ],
  },

  golf_swing: {
    frameIntervalMs: 67,
    frames: buildGolfFrames(),
    phases: [
      { id:'address',      label:'ADDRESS',      keyJoints:['chest','l_hip','r_hip','l_knee','r_knee'], cue:'Athletic posture. Hip hinge. Spine neutral. Weight centered.' },
      { id:'backswing',    label:'BACKSWING',    keyJoints:['l_shoulder','r_shoulder','l_hip','r_hip'], cue:'Coil shoulders 90°. Hips rotate 45°. Lead arm straight.' },
      { id:'transition',   label:'TRANSITION',   keyJoints:['l_hip','r_hip','l_knee'],                 cue:'Hips lead. Shift weight to lead foot. Keep the lag.' },
      { id:'impact',       label:'IMPACT',       keyJoints:['l_wrist','r_wrist','l_hip','chest'],       cue:'Hips open 45°. Hands ahead of ball. Spine tilted back.' },
      { id:'follow_through',label:'FOLLOW THROUGH',keyJoints:['chest','l_shoulder','r_shoulder'],      cue:'Finish tall. Full shoulder rotation. Balance on lead foot.' },
    ],
    faults: [
      { id:'early_extension', label:'EARLY EXTENSION', description:'Hips thrust toward ball through impact.', explanation:'Maintain spine angle through impact. Rotate, don't thrust.', affectedJoints:['pelvis','l_hip','r_hip'], keypointOffsets:{'pelvis':{x:+.04,y:0},'l_hip':{x:+.04,y:0},'r_hip':{x:+.04,y:0}} },
      { id:'over_the_top',   label:'OVER THE TOP',    description:'Club path from outside-in — causes slicing.', explanation:'Drop right elbow into slot on downswing. Feel the path going right.', affectedJoints:['r_elbow','r_shoulder'], keypointOffsets:{'r_elbow':{x:-.05,y:-.03}} },
    ],
    pathOverlays: [
      { id:'swing_plane', label:'Swing Plane', points:[{x:.50,y:.90},{x:.45,y:.65},{x:.35,y:.35},{x:.25,y:.15}] },
      { id:'ball_flight', label:'Ball Arc',    points:[{x:.50,y:.88},{x:.55,y:.60},{x:.65,y:.35},{x:.80,y:.20},{x:.95,y:.28}] },
    ],
  },

  basketball_shot: {
    frameIntervalMs: 67,
    frames: buildBasketballFrames(),
    phases: [
      { id:'load',    label:'LOAD',    keyJoints:['l_knee','r_knee','l_hip','r_hip'],    cue:'Athletic stance. Ball at hip. Load knees evenly.' },
      { id:'jump',    label:'JUMP',    keyJoints:['l_ankle','r_ankle','pelvis'],         cue:'Explode through ankles. Drive hips up. Align the shot.' },
      { id:'set',     label:'SET',     keyJoints:['r_elbow','r_wrist','chest'],          cue:'Ball at release point. Elbow under ball. Eyes on rim.' },
      { id:'release', label:'RELEASE', keyJoints:['r_wrist','r_elbow'],                 cue:'Extend fully. Flick wrist. Backspin on release.' },
      { id:'follow',  label:'FOLLOW',  keyJoints:['r_wrist','r_elbow','r_shoulder'],    cue:'Hold finish. Reach into the basket. Land balanced.' },
    ],
    faults: [
      { id:'elbow_out', label:'ELBOW OUT', description:'Shooting elbow flares wide — pushes ball off-line.', explanation:'Keep elbow directly under the ball at set position.', affectedJoints:['r_elbow'], keypointOffsets:{'r_elbow':{x:+.06,y:0}} },
      { id:'low_arc',   label:'LOW ARC',   description:'Flat trajectory — reduces target window.', explanation:'Increase release angle. Aim for 45–55° arc.', affectedJoints:['r_wrist'], keypointOffsets:{'r_wrist':{x:0,y:+.04}} },
    ],
    pathOverlays: [
      { id:'ball_arc', label:'Ball Arc', points:[{x:.50,y:.55},{x:.55,y:.35},{x:.65,y:.20},{x:.80,y:.15},{x:.92,y:.25}] },
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