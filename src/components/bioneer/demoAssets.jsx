// Demo assets for Proper Form mode
// Each asset contains pose frames, fault simulations, and technique text

export const SQUAT_DEMO_ASSET = {
  exerciseId: "squat",
  displayName: "Squat",
  idealBlueprint: "ideal_squat_v1",
  frameIntervalMs: 200,

  // Simulated keyframe timeline (setup → descent → bottom → ascent → lockout)
  idealPoseFrames: [
    // Frame 0 – Setup
    {
      index: 0, tMs: 0, phase: "setup",
      keypoints: {
        left_shoulder: { x: 0.40, y: 0.30 }, right_shoulder: { x: 0.60, y: 0.30 },
        left_hip:      { x: 0.42, y: 0.52 }, right_hip:     { x: 0.58, y: 0.52 },
        left_knee:     { x: 0.42, y: 0.72 }, right_knee:    { x: 0.58, y: 0.72 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.30 }, hip_mid:       { x: 0.50, y: 0.52 },
      },
      angles: { knee: 172, hip: 168, spine: 6 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 1 – Early descent
    {
      index: 1, tMs: 200, phase: "descent",
      keypoints: {
        left_shoulder: { x: 0.40, y: 0.32 }, right_shoulder: { x: 0.60, y: 0.32 },
        left_hip:      { x: 0.42, y: 0.54 }, right_hip:     { x: 0.58, y: 0.54 },
        left_knee:     { x: 0.41, y: 0.70 }, right_knee:    { x: 0.59, y: 0.70 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.32 }, hip_mid:       { x: 0.50, y: 0.54 },
      },
      angles: { knee: 148, hip: 145, spine: 10 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 2 – Mid descent
    {
      index: 2, tMs: 400, phase: "descent",
      keypoints: {
        left_shoulder: { x: 0.39, y: 0.35 }, right_shoulder: { x: 0.61, y: 0.35 },
        left_hip:      { x: 0.41, y: 0.56 }, right_hip:     { x: 0.59, y: 0.56 },
        left_knee:     { x: 0.40, y: 0.69 }, right_knee:    { x: 0.60, y: 0.69 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.35 }, hip_mid:       { x: 0.50, y: 0.56 },
      },
      angles: { knee: 120, hip: 118, spine: 14 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 3 – Deep descent / bottom
    {
      index: 3, tMs: 600, phase: "bottom",
      keypoints: {
        left_shoulder: { x: 0.38, y: 0.40 }, right_shoulder: { x: 0.62, y: 0.40 },
        left_hip:      { x: 0.41, y: 0.59 }, right_hip:     { x: 0.59, y: 0.59 },
        left_knee:     { x: 0.38, y: 0.67 }, right_knee:    { x: 0.62, y: 0.67 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.40 }, hip_mid:       { x: 0.50, y: 0.59 },
      },
      angles: { knee: 88, hip: 92, spine: 12 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 4 – Bottom (parallel)
    {
      index: 4, tMs: 800, phase: "bottom",
      keypoints: {
        left_shoulder: { x: 0.38, y: 0.42 }, right_shoulder: { x: 0.62, y: 0.42 },
        left_hip:      { x: 0.41, y: 0.61 }, right_hip:     { x: 0.59, y: 0.61 },
        left_knee:     { x: 0.38, y: 0.67 }, right_knee:    { x: 0.62, y: 0.67 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.42 }, hip_mid:       { x: 0.50, y: 0.61 },
      },
      angles: { knee: 82, hip: 88, spine: 13 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 5 – Ascent start
    {
      index: 5, tMs: 1000, phase: "ascent",
      keypoints: {
        left_shoulder: { x: 0.39, y: 0.37 }, right_shoulder: { x: 0.61, y: 0.37 },
        left_hip:      { x: 0.41, y: 0.57 }, right_hip:     { x: 0.59, y: 0.57 },
        left_knee:     { x: 0.40, y: 0.69 }, right_knee:    { x: 0.60, y: 0.69 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.37 }, hip_mid:       { x: 0.50, y: 0.57 },
      },
      angles: { knee: 115, hip: 112, spine: 11 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 6 – Mid ascent
    {
      index: 6, tMs: 1200, phase: "ascent",
      keypoints: {
        left_shoulder: { x: 0.40, y: 0.32 }, right_shoulder: { x: 0.60, y: 0.32 },
        left_hip:      { x: 0.42, y: 0.54 }, right_hip:     { x: 0.58, y: 0.54 },
        left_knee:     { x: 0.41, y: 0.71 }, right_knee:    { x: 0.59, y: 0.71 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.32 }, hip_mid:       { x: 0.50, y: 0.54 },
      },
      angles: { knee: 145, hip: 140, spine: 9 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
    // Frame 7 – Lockout
    {
      index: 7, tMs: 1400, phase: "lockout",
      keypoints: {
        left_shoulder: { x: 0.40, y: 0.30 }, right_shoulder: { x: 0.60, y: 0.30 },
        left_hip:      { x: 0.42, y: 0.52 }, right_hip:     { x: 0.58, y: 0.52 },
        left_knee:     { x: 0.42, y: 0.72 }, right_knee:    { x: 0.58, y: 0.72 },
        left_ankle:    { x: 0.42, y: 0.90 }, right_ankle:   { x: 0.58, y: 0.90 },
        shoulder_mid:  { x: 0.50, y: 0.30 }, hip_mid:       { x: 0.50, y: 0.52 },
      },
      angles: { knee: 174, hip: 170, spine: 5 },
      jointStates: { knee: "OPTIMAL", hip: "OPTIMAL", spine: "OPTIMAL" },
    },
  ],

  faultSimulations: [
    {
      id: "knee_valgus",
      label: "KNEE VALGUS",
      description: "Knees collapse inward during descent — common cause of ACL stress.",
      angleOffsets: { knee: +18 },
      keypointOffsets: { left_knee: { x: +0.06 }, right_knee: { x: -0.06 } },
      resultingStates: { knee: "DANGER", hip: "ACCEPTABLE", spine: "OPTIMAL" },
      explanation: "Knee angle exceeded safe range. Drive knees out over toes.",
    },
    {
      id: "heel_lift",
      label: "HEEL LIFT",
      description: "Heels rise off floor — indicates poor ankle mobility or forward lean.",
      keypointOffsets: { left_ankle: { y: -0.04 }, right_ankle: { y: -0.04 } },
      resultingStates: { knee: "ACCEPTABLE", spine: "WARNING" },
      explanation: "Heel off floor shifts load forward. Use plates or improve dorsiflexion.",
    },
    {
      id: "spine_collapse",
      label: "SPINE COLLAPSE",
      description: "Excessive torso forward lean under load — high lumbar injury risk.",
      angleOffsets: { spine: +28 },
      keypointOffsets: { shoulder_mid: { x: +0.06, y: +0.05 } },
      resultingStates: { spine: "DANGER" },
      explanation: "Spine angle exceeded 40°. Brace core and keep chest lifted.",
    },
  ],

  techniqueText: {
    formStandards: [
      "Feet shoulder-width apart, toes 15–30° out.",
      "Bar over mid-foot throughout movement.",
      "Knee tracks over second toe — no valgus.",
      "Hip crease below parallel at depth.",
      "Neutral spine — no excessive forward lean.",
      "Full lockout at top: hips and knees fully extended.",
    ],
    topCues: [
      "Knees out — push them over your toes.",
      "Chest up — brace hard before descent.",
      "Drive the floor away — hard extension at lockout.",
    ],
    singleCue: "Knees out — push them over your toes.",
    commonMistakes: [
      { mistake: "Knee valgus (knees caving in)", fix: "Drive knees outward throughout descent and ascent.", risk: "HIGH" },
      { mistake: "Heel rising off floor", fix: "Improve ankle dorsiflexion or use heel elevation temporarily.", risk: "MODERATE" },
      { mistake: "Excessive forward torso lean", fix: "Brace core before descent, keep chest tall.", risk: "HIGH" },
      { mistake: "Insufficient depth (above parallel)", fix: "Control descent speed and aim for hip crease below knee.", risk: "LOW" },
      { mistake: "Soft lockout at top", fix: "Fully extend hips and knees at the top of every rep.", risk: "LOW" },
    ],
    redFlagWarnings: [
      "Knee valgus under load → ACL / MCL stress. Stop and correct immediately.",
      "Spine angle >40° at bottom → lumbar disc risk. Reduce load and brace harder.",
      "Heels lifting with heavy load → ankle or patellar tendon strain.",
    ],
  },
};

export const DEADLIFT_DEMO_ASSET = {
  exerciseId: "deadlift",
  displayName: "Deadlift",
  idealBlueprint: "ideal_deadlift_v1",
  frameIntervalMs: 200,

  idealPoseFrames: [
    { index: 0, tMs: 0, phase: "setup",
      keypoints: { left_shoulder:{x:0.40,y:0.36}, right_shoulder:{x:0.60,y:0.36}, left_hip:{x:0.42,y:0.56}, right_hip:{x:0.58,y:0.56}, left_knee:{x:0.42,y:0.72}, right_knee:{x:0.58,y:0.72}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.36}, hip_mid:{x:0.50,y:0.56} },
      angles:{hip:90,knee:145,spine:18}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
    { index: 1, tMs: 200, phase: "pull",
      keypoints: { left_shoulder:{x:0.40,y:0.40}, right_shoulder:{x:0.60,y:0.40}, left_hip:{x:0.42,y:0.58}, right_hip:{x:0.58,y:0.58}, left_knee:{x:0.42,y:0.73}, right_knee:{x:0.58,y:0.73}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.40}, hip_mid:{x:0.50,y:0.58} },
      angles:{hip:110,knee:155,spine:15}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
    { index: 2, tMs: 400, phase: "pull",
      keypoints: { left_shoulder:{x:0.40,y:0.34}, right_shoulder:{x:0.60,y:0.34}, left_hip:{x:0.42,y:0.54}, right_hip:{x:0.58,y:0.54}, left_knee:{x:0.42,y:0.72}, right_knee:{x:0.58,y:0.72}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.34}, hip_mid:{x:0.50,y:0.54} },
      angles:{hip:140,knee:165,spine:10}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
    { index: 3, tMs: 600, phase: "lockout",
      keypoints: { left_shoulder:{x:0.40,y:0.30}, right_shoulder:{x:0.60,y:0.30}, left_hip:{x:0.42,y:0.52}, right_hip:{x:0.58,y:0.52}, left_knee:{x:0.42,y:0.72}, right_knee:{x:0.58,y:0.72}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.30}, hip_mid:{x:0.50,y:0.52} },
      angles:{hip:175,knee:174,spine:4}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
    { index: 4, tMs: 800, phase: "descent",
      keypoints: { left_shoulder:{x:0.40,y:0.36}, right_shoulder:{x:0.60,y:0.36}, left_hip:{x:0.42,y:0.56}, right_hip:{x:0.58,y:0.56}, left_knee:{x:0.42,y:0.72}, right_knee:{x:0.58,y:0.72}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.36}, hip_mid:{x:0.50,y:0.56} },
      angles:{hip:100,knee:148,spine:16}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
    { index: 5, tMs: 1000, phase: "descent",
      keypoints: { left_shoulder:{x:0.39,y:0.40}, right_shoulder:{x:0.61,y:0.40}, left_hip:{x:0.42,y:0.58}, right_hip:{x:0.58,y:0.58}, left_knee:{x:0.42,y:0.73}, right_knee:{x:0.58,y:0.73}, left_ankle:{x:0.42,y:0.90}, right_ankle:{x:0.58,y:0.90}, shoulder_mid:{x:0.50,y:0.40}, hip_mid:{x:0.50,y:0.58} },
      angles:{hip:88,knee:143,spine:19}, jointStates:{hip:"OPTIMAL",knee:"OPTIMAL",spine:"OPTIMAL"} },
  ],

  faultSimulations: [
    { id:"rounded_back", label:"ROUNDED BACK", description:"Spine rounds under load — high lumbar disc injury risk.", angleOffsets:{spine:+25}, keypointOffsets:{shoulder_mid:{y:+0.06}}, resultingStates:{spine:"DANGER"}, explanation:"Keep chest tall and brace hard. Initiate pull by pushing floor away, not jerking bar up." },
    { id:"bar_drift", label:"BAR DRIFT", description:"Bar drifts away from body — increases moment arm and back strain.", keypointOffsets:{left_shoulder:{x:-0.06},right_shoulder:{x:+0.06}}, resultingStates:{spine:"WARNING",hip:"ACCEPTABLE"}, explanation:"Keep bar dragging up your shins. Set lats tight before pulling." },
    { id:"hips_shoot", label:"HIPS SHOOT UP", description:"Hips rise faster than bar — turns deadlift into a stiff-leg.", angleOffsets:{hip:-20}, resultingStates:{hip:"WARNING",spine:"WARNING"}, explanation:"Push the floor away — hips and shoulders should rise at the same rate." },
  ],

  techniqueText: {
    formStandards: [
      "Bar over mid-foot, 1 inch from shins.",
      "Hip-width stance, toes slightly out.",
      "Hinge at hips — neutral spine before pull.",
      "Lats tight — 'protect your armpits'.",
      "Bar stays in contact with legs throughout.",
      "Full lockout: hips and knees extended, shoulders back.",
    ],
    topCues: [
      "Push the floor away — don't pull the bar up.",
      "Chest tall — brace like you're about to take a punch.",
      "Bar drags up your shins all the way.",
    ],
    singleCue: "Push the floor away — don't pull the bar up.",
    commonMistakes: [
      { mistake:"Rounded lower back", fix:"Brace core hard, keep chest up before initiating pull.", risk:"HIGH" },
      { mistake:"Bar drifting forward", fix:"Set lats, keep bar close to body — shins to thighs.", risk:"HIGH" },
      { mistake:"Hips shooting up first", fix:"Think 'legs press floor' — hips and bar rise together.", risk:"MODERATE" },
      { mistake:"Jerking the bar", fix:"Take slack out of bar first, then apply smooth force.", risk:"MODERATE" },
    ],
    redFlagWarnings: [
      "Rounded lumbar under load → disc herniation risk. Stop immediately.",
      "Hyperextending at lockout → lumbar compression. Neutral at top.",
      "Bar banging knees → bar path too far forward, risk of bruising and form breakdown.",
    ],
  },
};

export const PUSHUP_DEMO_ASSET = {
  exerciseId: "pushup",
  displayName: "Push-up",
  idealBlueprint: "ideal_pushup_v1",
  frameIntervalMs: 200,

  idealPoseFrames: [
    { index:0, tMs:0, phase:"top",
      keypoints:{left_shoulder:{x:0.35,y:0.38},right_shoulder:{x:0.65,y:0.38},left_hip:{x:0.38,y:0.58},right_hip:{x:0.62,y:0.58},left_knee:{x:0.40,y:0.75},right_knee:{x:0.60,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.38},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:168,body_line:176}, jointStates:{elbow:"OPTIMAL",body_line:"OPTIMAL"} },
    { index:1, tMs:200, phase:"descent",
      keypoints:{left_shoulder:{x:0.35,y:0.42},right_shoulder:{x:0.65,y:0.42},left_hip:{x:0.38,y:0.60},right_hip:{x:0.62,y:0.60},left_knee:{x:0.40,y:0.76},right_knee:{x:0.60,y:0.76},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.42},hip_mid:{x:0.50,y:0.60}},
      angles:{elbow:120,body_line:174}, jointStates:{elbow:"OPTIMAL",body_line:"OPTIMAL"} },
    { index:2, tMs:400, phase:"bottom",
      keypoints:{left_shoulder:{x:0.35,y:0.48},right_shoulder:{x:0.65,y:0.48},left_hip:{x:0.38,y:0.62},right_hip:{x:0.62,y:0.62},left_knee:{x:0.40,y:0.77},right_knee:{x:0.60,y:0.77},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.48},hip_mid:{x:0.50,y:0.62}},
      angles:{elbow:78,body_line:172}, jointStates:{elbow:"OPTIMAL",body_line:"OPTIMAL"} },
    { index:3, tMs:600, phase:"ascent",
      keypoints:{left_shoulder:{x:0.35,y:0.43},right_shoulder:{x:0.65,y:0.43},left_hip:{x:0.38,y:0.60},right_hip:{x:0.62,y:0.60},left_knee:{x:0.40,y:0.76},right_knee:{x:0.60,y:0.76},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.43},hip_mid:{x:0.50,y:0.60}},
      angles:{elbow:110,body_line:173}, jointStates:{elbow:"OPTIMAL",body_line:"OPTIMAL"} },
    { index:4, tMs:800, phase:"top",
      keypoints:{left_shoulder:{x:0.35,y:0.38},right_shoulder:{x:0.65,y:0.38},left_hip:{x:0.38,y:0.58},right_hip:{x:0.62,y:0.58},left_knee:{x:0.40,y:0.75},right_knee:{x:0.60,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.38},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:170,body_line:177}, jointStates:{elbow:"OPTIMAL",body_line:"OPTIMAL"} },
  ],

  faultSimulations: [
    { id:"sagging_hips", label:"SAGGING HIPS", description:"Hips drop below body line — core not engaged, lumbar strain.", angleOffsets:{body_line:-15}, keypointOffsets:{hip_mid:{y:+0.06}}, resultingStates:{body_line:"DANGER"}, explanation:"Squeeze glutes and abs hard. Imagine your body is a steel plank." },
    { id:"flared_elbows", label:"FLARED ELBOWS", description:"Elbows flare out wide — increases shoulder impingement risk.", keypointOffsets:{left_shoulder:{x:-0.05},right_shoulder:{x:+0.05}}, resultingStates:{elbow:"WARNING"}, explanation:"Tuck elbows 45° to body. Think 'arrows, not Ts' with your arms." },
    { id:"piked_hips", label:"PIKED HIPS", description:"Hips rise above body line — reduces chest engagement.", angleOffsets:{body_line:+12}, keypointOffsets:{hip_mid:{y:-0.06}}, resultingStates:{body_line:"WARNING"}, explanation:"Lower hips to create a straight line from head to heels." },
  ],

  techniqueText: {
    formStandards: [
      "Hands slightly wider than shoulder-width.",
      "Body forms straight line: head to heels.",
      "Elbows track at 45° from torso — not flared.",
      "Chest touches (or near) floor at bottom.",
      "Full lockout at top — elbows extended.",
      "Core and glutes braced throughout.",
    ],
    topCues: [
      "Body is a steel plank — don't sag or pike.",
      "Elbows at 45° — arrows, not Ts.",
      "Push the floor away explosively on ascent.",
    ],
    singleCue: "Body is a steel plank — don't sag or pike.",
    commonMistakes: [
      { mistake:"Sagging hips / lower back", fix:"Brace core and squeeze glutes throughout.", risk:"HIGH" },
      { mistake:"Elbows flaring out wide", fix:"Tuck elbows 30–45° toward your body.", risk:"MODERATE" },
      { mistake:"Partial range of motion", fix:"Chest should touch or approach the floor each rep.", risk:"LOW" },
      { mistake:"Head dropping forward", fix:"Keep neutral neck — gaze slightly ahead of hands.", risk:"LOW" },
    ],
    redFlagWarnings: [
      "Wrist pain with flat hands → use push-up handles or fists.",
      "Sharp shoulder pain → stop immediately, check elbow angle.",
      "Lower back pain → core not braced, switch to incline until stronger.",
    ],
  },
};

export const LUNGE_DEMO_ASSET = {
  exerciseId: "lunge",
  displayName: "Lunge",
  idealBlueprint: "ideal_lunge_v1",
  frameIntervalMs: 200,

  idealPoseFrames: [
    { index:0, tMs:0, phase:"setup",
      keypoints:{left_shoulder:{x:0.42,y:0.30},right_shoulder:{x:0.58,y:0.30},left_hip:{x:0.42,y:0.52},right_hip:{x:0.58,y:0.52},left_knee:{x:0.42,y:0.72},right_knee:{x:0.58,y:0.72},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.30},hip_mid:{x:0.50,y:0.52}},
      angles:{front_knee:172,trunk:6}, jointStates:{front_knee:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:1, tMs:200, phase:"step",
      keypoints:{left_shoulder:{x:0.42,y:0.30},right_shoulder:{x:0.58,y:0.30},left_hip:{x:0.44,y:0.52},right_hip:{x:0.58,y:0.52},left_knee:{x:0.38,y:0.68},right_knee:{x:0.60,y:0.76},left_ankle:{x:0.30,y:0.90},right_ankle:{x:0.60,y:0.90},shoulder_mid:{x:0.50,y:0.30},hip_mid:{x:0.51,y:0.52}},
      angles:{front_knee:140,trunk:7}, jointStates:{front_knee:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:2, tMs:400, phase:"bottom",
      keypoints:{left_shoulder:{x:0.43,y:0.32},right_shoulder:{x:0.57,y:0.32},left_hip:{x:0.44,y:0.55},right_hip:{x:0.58,y:0.55},left_knee:{x:0.36,y:0.68},right_knee:{x:0.60,y:0.78},left_ankle:{x:0.28,y:0.90},right_ankle:{x:0.60,y:0.90},shoulder_mid:{x:0.50,y:0.32},hip_mid:{x:0.51,y:0.55}},
      angles:{front_knee:90,trunk:8}, jointStates:{front_knee:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:3, tMs:600, phase:"ascent",
      keypoints:{left_shoulder:{x:0.42,y:0.30},right_shoulder:{x:0.58,y:0.30},left_hip:{x:0.44,y:0.53},right_hip:{x:0.58,y:0.53},left_knee:{x:0.38,y:0.70},right_knee:{x:0.60,y:0.76},left_ankle:{x:0.30,y:0.90},right_ankle:{x:0.60,y:0.90},shoulder_mid:{x:0.50,y:0.30},hip_mid:{x:0.51,y:0.53}},
      angles:{front_knee:128,trunk:7}, jointStates:{front_knee:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:4, tMs:800, phase:"lockout",
      keypoints:{left_shoulder:{x:0.42,y:0.30},right_shoulder:{x:0.58,y:0.30},left_hip:{x:0.42,y:0.52},right_hip:{x:0.58,y:0.52},left_knee:{x:0.42,y:0.72},right_knee:{x:0.58,y:0.72},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.30},hip_mid:{x:0.50,y:0.52}},
      angles:{front_knee:170,trunk:5}, jointStates:{front_knee:"OPTIMAL",trunk:"OPTIMAL"} },
  ],

  faultSimulations: [
    { id:"knee_over_toe", label:"KNEE PAST TOE", description:"Front knee shoots far past the toes — increases patellar stress.", angleOffsets:{front_knee:-15}, keypointOffsets:{left_knee:{x:-0.05,y:-0.03}}, resultingStates:{front_knee:"DANGER"}, explanation:"Step longer or lean back slightly. Keep shin roughly vertical at the bottom." },
    { id:"trunk_lean", label:"TRUNK LEAN", description:"Excessive forward lean — reduces glute engagement, strains lower back.", angleOffsets:{trunk:+20}, keypointOffsets:{shoulder_mid:{x:+0.05,y:+0.04}}, resultingStates:{trunk:"DANGER"}, explanation:"Keep torso tall. Drive front heel into floor to activate posterior chain." },
  ],

  techniqueText: {
    formStandards: [
      "Take a long enough step — shin stays near vertical.",
      "Torso upright throughout descent.",
      "Front knee tracks over second toe.",
      "Back knee drops toward floor without hitting it.",
      "Drive through front heel on the way up.",
      "Full hip extension at the top.",
    ],
    topCues: [
      "Chest tall — don't bow forward.",
      "Drive front heel into the floor on ascent.",
      "Back knee down, not forward — control the drop.",
    ],
    singleCue: "Chest tall — don't bow forward.",
    commonMistakes: [
      { mistake:"Knee caving inward", fix:"Push knee outward to track over second toe.", risk:"HIGH" },
      { mistake:"Trunk lurching forward", fix:"Keep chest lifted; engage core before stepping.", risk:"MODERATE" },
      { mistake:"Short step (knee far over toe)", fix:"Take a larger step forward to allow shin verticality.", risk:"MODERATE" },
      { mistake:"Back foot on toes only (twisting)", fix:"Lace-up shoes, keep back foot stable on the ball.", risk:"LOW" },
    ],
    redFlagWarnings: [
      "Knee pain on descent → step length or knee tracking issue. Reduce depth.",
      "Hip flexor pain at bottom → stretch and strengthen hip flexors before adding load.",
    ],
  },
};

export const OVERHEAD_PRESS_DEMO_ASSET = {
  exerciseId: "overhead_press",
  displayName: "Overhead Press",
  idealBlueprint: "ideal_ohp_v1",
  frameIntervalMs: 200,

  idealPoseFrames: [
    { index:0, tMs:0, phase:"start",
      keypoints:{left_shoulder:{x:0.38,y:0.38},right_shoulder:{x:0.62,y:0.38},left_hip:{x:0.42,y:0.58},right_hip:{x:0.58,y:0.58},left_knee:{x:0.42,y:0.75},right_knee:{x:0.58,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.38},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:90,trunk:4}, jointStates:{elbow:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:1, tMs:200, phase:"press",
      keypoints:{left_shoulder:{x:0.39,y:0.34},right_shoulder:{x:0.61,y:0.34},left_hip:{x:0.42,y:0.58},right_hip:{x:0.58,y:0.58},left_knee:{x:0.42,y:0.75},right_knee:{x:0.58,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.34},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:130,trunk:5}, jointStates:{elbow:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:2, tMs:400, phase:"lockout",
      keypoints:{left_shoulder:{x:0.40,y:0.28},right_shoulder:{x:0.60,y:0.28},left_hip:{x:0.42,y:0.58},right_hip:{x:0.58,y:0.58},left_knee:{x:0.42,y:0.75},right_knee:{x:0.58,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.28},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:174,trunk:5}, jointStates:{elbow:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:3, tMs:600, phase:"descent",
      keypoints:{left_shoulder:{x:0.39,y:0.33},right_shoulder:{x:0.61,y:0.33},left_hip:{x:0.42,y:0.58},right_hip:{x:0.58,y:0.58},left_knee:{x:0.42,y:0.75},right_knee:{x:0.58,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.33},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:128,trunk:4}, jointStates:{elbow:"OPTIMAL",trunk:"OPTIMAL"} },
    { index:4, tMs:800, phase:"start",
      keypoints:{left_shoulder:{x:0.38,y:0.38},right_shoulder:{x:0.62,y:0.38},left_hip:{x:0.42,y:0.58},right_hip:{x:0.58,y:0.58},left_knee:{x:0.42,y:0.75},right_knee:{x:0.58,y:0.75},left_ankle:{x:0.42,y:0.90},right_ankle:{x:0.58,y:0.90},shoulder_mid:{x:0.50,y:0.38},hip_mid:{x:0.50,y:0.58}},
      angles:{elbow:88,trunk:4}, jointStates:{elbow:"OPTIMAL",trunk:"OPTIMAL"} },
  ],

  faultSimulations: [
    { id:"back_arch", label:"LOWER BACK ARCH", description:"Excessive lumbar arch under load — compresses discs and reduces stability.", angleOffsets:{trunk:+18}, keypointOffsets:{hip_mid:{y:-0.03}}, resultingStates:{trunk:"DANGER"}, explanation:"Squeeze glutes and abs tight before pressing. Tuck ribs down." },
    { id:"forward_lean", label:"FORWARD LEAN", description:"Bar path drifts forward instead of vertical — inefficient and shoulder-stressing.", keypointOffsets:{shoulder_mid:{x:+0.05}}, resultingStates:{elbow:"WARNING",trunk:"ACCEPTABLE"}, explanation:"Press bar in a vertical path. Move head out of the way on the way up, return under bar at lockout." },
  ],

  techniqueText: {
    formStandards: [
      "Feet hip-width, core and glutes braced.",
      "Bar starts just above collarbones in front rack.",
      "Press in vertical bar path — head ducks slightly.",
      "Full lockout: arms extended, shrug at top.",
      "Controlled descent back to rack position.",
      "No excessive lumbar arch throughout.",
    ],
    topCues: [
      "Ribs down — brace like a belt is squeezing you.",
      "Press the bar to the ceiling — vertical path.",
      "Shrug at lockout — full shoulder elevation.",
    ],
    singleCue: "Ribs down — brace like a belt is squeezing you.",
    commonMistakes: [
      { mistake:"Excessive lower back arch", fix:"Squeeze glutes, tuck ribs — create whole-body tension.", risk:"HIGH" },
      { mistake:"Bar drifting forward", fix:"Move head back, press vertically — not forward arc.", risk:"MODERATE" },
      { mistake:"Partial lockout", fix:"Fully extend elbows and shrug at the top every rep.", risk:"LOW" },
      { mistake:"Wrist break (wrists bent back)", fix:"Stack wrists over elbows — neutral wrist position.", risk:"MODERATE" },
    ],
    redFlagWarnings: [
      "Sharp shoulder impingement → check elbow flare and wrist position.",
      "Lower back pain → reduce arch; strengthen core before adding load.",
      "Neck pain → don't press with a forward head. Neck neutral always.",
    ],
  },
};

export const DEMO_ASSETS = {
  squat: SQUAT_DEMO_ASSET,
  deadlift: DEADLIFT_DEMO_ASSET,
  pushup: PUSHUP_DEMO_ASSET,
  lunge: LUNGE_DEMO_ASSET,
  overhead_press: OVERHEAD_PRESS_DEMO_ASSET,
};