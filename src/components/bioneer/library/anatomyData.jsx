/**
 * anatomyData.js
 * Anatomical intelligence layer for the Movement Library.
 * Keyed by movementFamily (base) + specific movement ID overrides.
 * Muscle IDs correspond to BodyMapViewer region keys.
 */

// ── Muscle region IDs used in BodyMapViewer ──────────────────────────────────
// Front: quadriceps, hip_flexors, core, pectorals, deltoids, biceps, calves_front, tibialis, adductors
// Back:  hamstrings, glutes, lats, trapezius, rhomboids, erector_spinae, triceps, rear_deltoids, calves

const BASE = {

  bilateral_knee_dominant: {
    primary_muscles:   ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'adductors'],
    stabilizers:       ['core', 'erector_spinae', 'calves_front'],
    joints:            ['knee', 'hip', 'ankle', 'lumbar_spine'],
    movement_pattern:  'Bilateral knee-dominant squat',
    difficulty:        'intermediate',
    description:       'A bilateral knee-dominant movement that loads the quadriceps, glutes, and posterior chain while demanding ankle mobility, knee tracking, and spinal stability.',
    key_cues:          ['Drive knees outward over toes', 'Maintain upright torso', 'Keep heels grounded', 'Brace core before descent'],
    common_faults: [
      {
        name:           'Knee Valgus',
        description:    'Knees cave inward during descent or ascent, creating medial knee stress.',
        visual:         'Knees track inside the feet rather than over toes',
        risk_structures:['ACL', 'Medial collateral ligament', 'Patellar tracking'],
        danger_zones:   ['knee'],
        cues:           ['Drive knees out over pinky toes', 'Activate glute medius', 'Cue: "spread the floor"'],
      },
      {
        name:           'Heel Rise',
        description:    'Heels lift off the ground, indicating limited ankle dorsiflexion or forward weight bias.',
        visual:         'Heels elevate, weight shifts to forefoot',
        risk_structures:['Achilles tendon', 'Plantar fascia', 'Knee joint'],
        danger_zones:   ['ankle', 'knee'],
        cues:           ['Heels flat throughout', 'Work ankle mobility', 'Elevate heels temporarily if needed'],
      },
      {
        name:           'Forward Trunk Collapse',
        description:    'Excessive forward lean of the torso, overloading the lumbar spine.',
        visual:         'Torso tilts excessively forward; bar path drifts forward',
        risk_structures:['Lumbar discs', 'Spinal ligaments', 'Erector spinae'],
        danger_zones:   ['lumbar_spine'],
        cues:           ['Chest stays tall', 'Eyes slightly forward', 'Engage upper back'],
      },
      {
        name:           'Lumbar Flexion (Butt Wink)',
        description:    'Pelvis tucks under at the bottom of the squat, rounding the lumbar spine under load.',
        visual:         'Tailbone tucks, lower back rounds at depth',
        risk_structures:['L4-L5 intervertebral discs', 'Sacroiliac joint'],
        danger_zones:   ['lumbar_spine'],
        cues:           ['Limit depth to neutral spine range', 'Improve hip flexor mobility', 'Brace before descent'],
      },
    ],
    danger_zones:   ['knee', 'lumbar_spine', 'ankle'],
    risk_level:     'moderate',
    regressions:    ['Air Squat', 'Goblet Squat', 'Box Squat', 'Assisted Squat'],
    progressions:   ['Paused Squat', 'Front Squat', 'Barbell Back Squat', 'High-Bar Olympic Squat'],
    sport_transfer: ['Basketball (jump mechanics)', 'Cycling (power output)', 'Sprint acceleration'],
    contraindications: ['Acute knee injury', 'Severe lumbar disc pathology', 'Recent ankle surgery'],
  },

  bilateral_hip_dominant: {
    primary_muscles:   ['hamstrings', 'glutes'],
    secondary_muscles: ['erector_spinae', 'trapezius'],
    stabilizers:       ['core', 'lats', 'adductors'],
    joints:            ['hip', 'lumbar_spine', 'knee', 'thoracic_spine'],
    movement_pattern:  'Bilateral hip hinge',
    difficulty:        'intermediate',
    description:       'A hip-hinge pattern that primarily loads the posterior chain. Requires spinal neutrality under load and strong hip drive through the concentric phase.',
    key_cues:          ['Hinge from hips not the waist', 'Neutral spine throughout', 'Drive hips to full extension', 'Lat engagement prevents bar drift'],
    common_faults: [
      {
        name:           'Lumbar Rounding',
        description:    'Loss of lumbar lordosis under load, creating dangerous shear forces on the spine.',
        visual:         'Lower back rounds during hinge, particularly under heavy load',
        risk_structures:['Lumbar intervertebral discs', 'Posterior spinal ligaments'],
        danger_zones:   ['lumbar_spine'],
        cues:           ['Chest proud before lifting', 'Brace intra-abdominal pressure', 'Reduce load until form is solid'],
      },
      {
        name:           'Hip Shift / Asymmetric Pull',
        description:    'One hip rises faster or higher than the other, creating rotational stress.',
        visual:         'Bar or hips drift to one side on the lift',
        risk_structures:['Sacroiliac joint', 'Hip labrum', 'QL muscles'],
        danger_zones:   ['hip', 'lumbar_spine'],
        cues:           ['Drive both legs evenly', 'Cue: "push the floor away equally"'],
      },
      {
        name:           'Early Hip Rise (Squat-Morning)',
        description:    'Hips rise faster than shoulders, converting the lift into a good morning.',
        visual:         'Bar drifts forward, hips shoot up, upper back bears load',
        risk_structures:['Lumbar spine', 'Hamstring origin'],
        danger_zones:   ['lumbar_spine', 'hip'],
        cues:           ['Push legs and pull bar simultaneously', 'Keep chest up off floor'],
      },
    ],
    danger_zones:   ['lumbar_spine', 'hip'],
    risk_level:     'moderate',
    regressions:    ['Bodyweight Hip Hinge', 'Kettlebell Deadlift', 'Romanian Deadlift'],
    progressions:   ['Conventional Deadlift', 'Trap Bar Deadlift', 'Sumo Deadlift'],
    sport_transfer: ['Sprint mechanics', 'Jumping power', 'Rowing/throwing power'],
    contraindications: ['Acute lumbar disc herniation', 'SI joint dysfunction (modify)'],
  },

  unilateral_knee: {
    primary_muscles:   ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'hip_flexors'],
    stabilizers:       ['core', 'hip_abductors', 'calves_front'],
    joints:            ['knee', 'hip', 'ankle'],
    movement_pattern:  'Unilateral knee-dominant lunge/split',
    difficulty:        'intermediate',
    description:       'Single-leg knee-dominant movements that expose and correct bilateral imbalances. High demand on hip abductor stability and single-leg control.',
    key_cues:          ['Front knee tracks over second toe', 'Torso stays upright', 'Drive through front heel', 'Control the descent'],
    common_faults: [
      {
        name:           'Knee Valgus (Unilateral)',
        description:    'Front knee collapses inward during descent, common when glute medius is weak.',
        visual:         'Knee dives toward midline, foot stays planted',
        risk_structures:['ACL', 'Medial knee structures', 'IT band'],
        danger_zones:   ['knee'],
        cues:           ['Knee tracks over toes', 'Think "knee out" on the way down'],
      },
      {
        name:           'Hip Hike / Pelvic Drop',
        description:    'The non-working hip drops, revealing hip abductor weakness.',
        visual:         'Hip of the rear leg or non-stance side drops low',
        risk_structures:['Iliotibial band', 'Hip labrum', 'Sacroiliac joint'],
        danger_zones:   ['hip'],
        cues:           ['Keep both hips level', 'Brace core to stabilize pelvis'],
      },
    ],
    danger_zones:   ['knee', 'hip', 'ankle'],
    risk_level:     'low',
    regressions:    ['Assisted Split Squat', 'Reverse Lunge', 'Step Up'],
    progressions:   ['Bulgarian Split Squat', 'Walking Lunge', 'Overhead Lunge'],
    sport_transfer: ['Single-leg landing mechanics', 'Change of direction', 'Running stride'],
    contraindications: ['Acute patellar tendinopathy', 'Knee flexion restrictions'],
  },

  horizontal_push: {
    primary_muscles:   ['pectorals', 'deltoids'],
    secondary_muscles: ['triceps'],
    stabilizers:       ['rotator_cuff', 'core', 'serratus', 'rear_deltoids'],
    joints:            ['shoulder', 'elbow', 'wrist'],
    movement_pattern:  'Horizontal push',
    difficulty:        'beginner',
    description:       'Horizontal pressing movement driving force away from the body. Loads the pectorals and anterior chain with high rotator cuff stabilizer demand.',
    key_cues:          ['Retract and depress scapulae', 'Elbows at 45–75° to torso', 'Maintain neutral wrist', 'Rigid torso throughout'],
    common_faults: [
      {
        name:           'Elbow Flare',
        description:    'Elbows flare perpendicular to the torso, placing the shoulder in an impingement-prone position.',
        visual:         'Arms create a T-shape; elbows wing out wide',
        risk_structures:['Anterior shoulder capsule', 'Rotator cuff (supraspinatus)', 'AC joint'],
        danger_zones:   ['shoulder'],
        cues:           ['Tuck elbows 45° to body', 'Think: "protect your armpits"'],
      },
      {
        name:           'Lumbar Hyperextension (Arch)',
        description:    'Excessive spinal arch reduces chest-to-bar range and loads the lumbar spine.',
        visual:         'Large gap between lower back and bench; butt raises',
        risk_structures:['Lumbar facet joints', 'Spinal extensors'],
        danger_zones:   ['lumbar_spine'],
        cues:           ['Tuck tailbone slightly', 'Core braced throughout press'],
      },
    ],
    danger_zones:   ['shoulder', 'elbow'],
    risk_level:     'low',
    regressions:    ['Wall Push-Up', 'Knee Push-Up', 'Incline Push-Up'],
    progressions:   ['Weighted Push-Up', 'Bench Press', 'Deficit Push-Up'],
    sport_transfer: ['Tackling/blocking', 'Throwing', 'Combat sports striking'],
    contraindications: ['Rotator cuff tear (modify)', 'Shoulder impingement (check arc)'],
  },

  vertical_push: {
    primary_muscles:   ['deltoids', 'triceps'],
    secondary_muscles: ['trapezius', 'pectorals'],
    stabilizers:       ['rotator_cuff', 'core', 'serratus'],
    joints:            ['shoulder', 'elbow', 'lumbar_spine'],
    movement_pattern:  'Vertical push',
    difficulty:        'intermediate',
    description:       'Overhead pressing movement with high shoulder complex and rotator cuff demand. Requires thoracic mobility and core bracing to prevent lumbar overextension.',
    key_cues:          ['Brace core before pressing', 'Keep ribs down', 'Press in scapular plane', 'Lock out without hyperextending'],
    common_faults: [
      {
        name:           'Lumbar Hyperextension',
        description:    'Leaning back excessively to get the bar overhead, compressing lumbar facets.',
        visual:         'Lower back arches dramatically as the bar goes overhead',
        risk_structures:['Lumbar facet joints', 'L4-L5 discs'],
        danger_zones:   ['lumbar_spine'],
        cues:           ["Rib cage stays down", 'Press vertical, not back', 'Core tight throughout'],
      },
      {
        name:           'Shoulder Impingement Arc',
        description:    'Bar path or arm angle narrows the subacromial space, pinching structures.',
        visual:         'Pain or catch in mid-range; arm crosses behind ear',
        risk_structures:['Supraspinatus tendon', 'Subacromial bursa'],
        danger_zones:   ['shoulder'],
        cues:           ['Press in slight scapular plane', 'External rotation cue on way up'],
      },
    ],
    danger_zones:   ['shoulder', 'lumbar_spine'],
    risk_level:     'moderate',
    regressions:    ['Landmine Press', 'Arnold Press', 'DB Overhead Press (seated)'],
    progressions:   ['Barbell Overhead Press', 'Push Press', 'Jerk'],
    sport_transfer: ['Volleyball spike', 'Basketball shot', 'Swimming catch'],
    contraindications: ['Shoulder impingement', 'AC joint dysfunction', 'Lumbar stenosis (modify)'],
  },

  horizontal_pull: {
    primary_muscles:   ['lats', 'rhomboids', 'rear_deltoids'],
    secondary_muscles: ['biceps', 'trapezius'],
    stabilizers:       ['core', 'erector_spinae', 'rotator_cuff'],
    joints:            ['shoulder', 'elbow', 'thoracic_spine'],
    movement_pattern:  'Horizontal pull',
    difficulty:        'beginner',
    description:       'Horizontal pulling pattern developing the posterior shoulder complex, lats, and upper back. Counterbalances common pushing-dominant posture.',
    key_cues:          ['Initiate with scapular retraction', 'Drive elbows behind body', 'Maintain hinge position', 'Neutral wrist throughout'],
    common_faults: [
      {
        name:           'Lumbar Rounding in Hinge',
        description:    'Loss of spinal neutrality in the hip-hinged pulling position.',
        visual:         'Lower back rounds as weight increases; torso curls',
        risk_structures:['Lumbar discs', 'QL muscles'],
        danger_zones:   ['lumbar_spine'],
        cues:           ['Flat back maintained throughout', 'Chest faces floor not feet'],
      },
      {
        name:           'Arm Pull (No Scapular Engagement)',
        description:    'Using only the arm to pull, without engaging scapular retractors first.',
        visual:         'Shoulder blade does not retract; bicep dominant pull',
        risk_structures:['Bicep tendon', 'Shoulder capsule'],
        danger_zones:   ['shoulder'],
        cues:           ['Initiate with "elbow to pocket"', 'Squeeze shoulder blade first'],
      },
    ],
    danger_zones:   ['lumbar_spine', 'shoulder'],
    risk_level:     'low',
    regressions:    ['Resistance Band Row', 'TRX Row', 'Seated Cable Row'],
    progressions:   ['Barbell Bent Over Row', 'Weighted Pendlay Row', 'T-Bar Row'],
    sport_transfer: ['Rowing', 'Climbing', 'Combat grappling'],
    contraindications: ['Acute bicep tear', 'Shoulder posterior capsule tightness (modify)'],
  },

  vertical_pull: {
    primary_muscles:   ['lats', 'biceps'],
    secondary_muscles: ['rear_deltoids', 'rhomboids', 'trapezius'],
    stabilizers:       ['core', 'rotator_cuff'],
    joints:            ['shoulder', 'elbow', 'thoracic_spine'],
    movement_pattern:  'Vertical pull',
    difficulty:        'intermediate',
    description:       'Pulling the body or weight vertically against gravity. High lat activation with rotator cuff stabilization. One of the best back-development movements.',
    key_cues:          ['Depress scapulae before pulling', 'Drive elbows down and back', 'Control the descent', 'Avoid shrugging at top'],
    common_faults: [
      {
        name:           'Shrug at Bottom',
        description:    'Shoulder elevates at the bottom of the hang, disengaging scapular stabilizers.',
        visual:         'Shoulders rise toward ears at the dead hang',
        risk_structures:['Brachial plexus', 'Shoulder superior capsule', 'AC joint'],
        danger_zones:   ['shoulder'],
        cues:           ['Pack shoulder blades down', 'Engage lats in the hang'],
      },
      {
        name:           'Kipping / Momentum',
        description:    'Using hip swing or kip to generate momentum rather than controlled pull strength.',
        visual:         'Body swings before pull; ballistic rather than controlled',
        risk_structures:['Shoulder labrum', 'Elbow tendons'],
        danger_zones:   ['shoulder', 'elbow'],
        cues:           ['Dead hang to start', 'Slow and controlled throughout'],
      },
    ],
    danger_zones:   ['shoulder', 'elbow'],
    risk_level:     'low',
    regressions:    ['Lat Pulldown', 'Band-Assisted Pull-Up', 'Negative Pull-Up'],
    progressions:   ['Weighted Pull-Up', 'L-Sit Pull-Up', 'Archer Pull-Up'],
    sport_transfer: ['Climbing', 'Gymnastics', 'Swimming (lats)'],
    contraindications: ['Rotator cuff partial tear (start with lat pulldown)', 'Bicep tendon rupture'],
  },

  locomotion: {
    primary_muscles:   ['glutes', 'hamstrings', 'hip_flexors'],
    secondary_muscles: ['quadriceps', 'calves_front'],
    stabilizers:       ['core', 'hip_abductors', 'erector_spinae'],
    joints:            ['hip', 'knee', 'ankle', 'lumbar_spine'],
    movement_pattern:  'Locomotion gait pattern',
    difficulty:        'beginner',
    description:       'Cyclical locomotion pattern requiring full-body coordination, hip extension power, and contralateral arm-leg synchronisation.',
    key_cues:          ['Land under the hips', 'Drive hip to full extension', 'Maintain forward lean', 'Symmetrical arm swing'],
    common_faults: [
      {
        name:           'Overstride',
        description:    'Foot contacts ground ahead of center of mass, creating a braking force and increasing knee stress.',
        visual:         'Heel-first contact with a straight leg far ahead of the body',
        risk_structures:['Patellar tendon', 'IT band', 'Shin (tibial stress)'],
        danger_zones:   ['knee', 'ankle'],
        cues:           ['Land under the hips, not out front', 'Think quick cadence, not long strides'],
      },
      {
        name:           'Lateral Trunk Sway',
        description:    'Excessive side-to-side movement of the torso, indicating hip abductor weakness.',
        visual:         'Torso weaves side to side with each step',
        risk_structures:['IT band', 'Hip abductors', 'Sacroiliac joint'],
        danger_zones:   ['hip'],
        cues:           ['Walk/run tall', 'Minimize sway', 'Strengthen glute medius'],
      },
    ],
    danger_zones:   ['knee', 'ankle', 'hip'],
    risk_level:     'low',
    regressions:    ['Marching', 'Slow Walk', 'Stationary Hip Drive Drill'],
    progressions:   ['Sprint Acceleration', 'Resisted Sprint', 'Reactive Agility Drills'],
    sport_transfer: ['All team sports', 'Track and field', 'Distance running'],
    contraindications: ['Stress fracture (rest)', 'Achilles tendinopathy (modify)'],
  },

  jump_landing: {
    primary_muscles:   ['quadriceps', 'glutes'],
    secondary_muscles: ['hamstrings', 'calves_front'],
    stabilizers:       ['core', 'hip_abductors', 'adductors'],
    joints:            ['knee', 'ankle', 'hip'],
    movement_pattern:  'Plyometric jump-landing',
    difficulty:        'intermediate',
    description:       'Explosive power production followed by deceleration and landing mechanics. ACL and patellofemoral joint health depend heavily on landing quality.',
    key_cues:          ['Land soft — bend knees on contact', 'Knees over toes on landing', 'Hips sink to absorb', 'Equal force through both legs'],
    common_faults: [
      {
        name:           'Valgus Landing',
        description:    'Knees collapse inward on landing, creating dangerous ACL stress. #1 injury risk in landing sports.',
        visual:         'Knees dive toward midline on ground contact',
        risk_structures:['ACL', 'Medial collateral ligament', 'Patellar tendon'],
        danger_zones:   ['knee'],
        cues:           ['Knees track over toes', 'Think "spread the floor" on landing', 'Cue hip abductors actively'],
      },
      {
        name:           'Stiff Landing',
        description:    'Landing with minimal knee and hip flexion, sending impact forces up the kinetic chain.',
        visual:         'Loud "thud" on contact; legs nearly straight on landing',
        risk_structures:['Knee cartilage', 'Lumbar spine', 'Achilles tendon'],
        danger_zones:   ['knee', 'ankle', 'lumbar_spine'],
        cues:           ['Quiet landing is the goal', 'Think "catch the floor slowly"', 'Sink hips on contact'],
      },
    ],
    danger_zones:   ['knee', 'ankle'],
    risk_level:     'moderate',
    regressions:    ['Box Step-Down', 'Squat Jump (low)', 'Broad Jump (stick landing)'],
    progressions:   ['Depth Jump', 'Reactive Drop Landing', 'Continuous Bounding'],
    sport_transfer: ['All court/field sports', 'Track and field (jumps)', 'Gymnastics'],
    contraindications: ['Patellar tendinopathy (reduce load)', 'Acute knee ligament injury (avoid)'],
  },

  rotation_strike: {
    primary_muscles:   ['glutes', 'obliques', 'hip_flexors'],
    secondary_muscles: ['pectorals', 'deltoids', 'lats'],
    stabilizers:       ['core', 'erector_spinae', 'rotator_cuff'],
    joints:            ['thoracic_spine', 'hip', 'shoulder', 'lumbar_spine'],
    movement_pattern:  'Rotational power / strike',
    difficulty:        'intermediate',
    description:       'Hip-to-shoulder rotational power transfer. Requires sequential activation from ground to hip to torso to arm, with hip drive initiating before shoulder rotation.',
    key_cues:          ['Hips lead — shoulder follows', 'Load before rotating', 'Stay in posture through contact', 'Full follow-through'],
    common_faults: [
      {
        name:           'Early Shoulder Opening',
        description:    'Shoulders rotate before hips, losing the hip-to-shoulder lag and reducing power transfer.',
        visual:         'Chest faces target too early; arm leads the rotation',
        risk_structures:['Elbow UCL (from arm-dominant mechanics)', 'Rotator cuff'],
        danger_zones:   ['shoulder', 'elbow'],
        cues:           ['Hips rotate first', 'Hold shoulder back until hips clear'],
      },
      {
        name:           'Early Extension',
        description:    'Hips thrust toward the target mid-rotation, causing the pelvis to tilt and posture to collapse.',
        visual:         'Hips push forward, back extends, head lifts',
        risk_structures:['Lumbar facet joints', 'Hamstring proximal'],
        danger_zones:   ['lumbar_spine', 'hip'],
        cues:           ['Stay in your posture', 'Hip turn without hip thrust'],
      },
    ],
    danger_zones:   ['shoulder', 'elbow', 'lumbar_spine'],
    risk_level:     'moderate',
    regressions:    ['Half-Kneeling Rotation', 'Hip-Turn Drill', 'Band Rotation'],
    progressions:   ['Weighted Rotation', 'Med Ball Throw', 'Reactive Strike Drill'],
    sport_transfer: ['Baseball/softball', 'Golf', 'Tennis', 'Hockey', 'Boxing'],
    contraindications: ['Shoulder labral tear (modify)', 'Lumbar rotation sensitivity (modify)'],
  },
};

// ── Per-movement overrides ─────────────────────────────────────────────────────
// Only needs to specify fields that differ from the movement family base.
const OVERRIDES = {
  hip_thrust: {
    primary_muscles:   ['glutes'],
    secondary_muscles: ['hamstrings', 'quadriceps'],
    stabilizers:       ['core', 'adductors'],
    description:       'Open-chain hip extension with bench support. Isolates the glutes more directly than any other movement with minimal lumbar load.',
    regressions:       ['Glute Bridge', 'Bodyweight Hip Thrust', 'Single-Leg Glute Bridge'],
    progressions:      ['Barbell Hip Thrust', 'Banded Hip Thrust', 'Weighted Single-Leg Hip Thrust'],
  },
  pull_up: {
    difficulty:  'advanced',
    regressions: ['Lat Pulldown', 'Negative Pull-Up', 'Band-Assisted Pull-Up'],
    progressions:['Weighted Pull-Up', 'L-Sit Pull-Up', 'Muscle-Up'],
  },
  push_up: {
    difficulty:  'beginner',
    regressions: ['Incline Push-Up', 'Knee Push-Up', 'Wall Push-Up'],
    progressions:['Weighted Push-Up', 'Archer Push-Up', 'Pike Push-Up'],
  },
  sprint_acceleration: {
    primary_muscles:   ['glutes', 'hamstrings', 'hip_flexors'],
    secondary_muscles: ['quadriceps', 'calves_front'],
    description:       'Acceleration phase of sprinting (0–20m). Requires forward lean, high knee drive, and powerful hip extension to build velocity rapidly.',
    difficulty:        'intermediate',
  },
  vertical_jump: {
    difficulty:  'intermediate',
    regressions: ['Squat Jump', 'Box Jump (low)', 'Tuck Jump'],
    progressions:['Depth Jump', 'Reactive Vertical Jump', 'Weighted Vest Jump'],
  },
  golf_swing: {
    description:     'Full swing requiring sequential rotational power from ground reaction through hip turn to shoulder rotation. Demands thoracic mobility and hip dissociation.',
    sport_transfer:  ['Tennis serve', 'Baseball swing', 'Hockey shot'],
    contraindications: ['Lumbar disc herniation with rotation sensitivity', 'Thoracic scoliosis (modify arc)'],
  },
  deadlift: {
    difficulty:   'intermediate',
    description:  'The foundational hip hinge under maximal load. Highest CNS demand of any posterior chain lift. Requires perfect spinal neutrality, lat tension, and hip drive.',
    regressions:  ['Bodyweight Hip Hinge', 'Kettlebell Deadlift', 'Trap Bar Deadlift'],
    progressions: ['Competition Deadlift', 'Deficit Deadlift', 'Romanian Deadlift'],
  },
};

// ── Public API ─────────────────────────────────────────────────────────────────

export function getAnatomyData(movement) {
  const family  = movement?.movementFamily;
  const base    = BASE[family] ?? null;
  const override = OVERRIDES[movement?.id] ?? {};
  if (!base) return null;
  return { ...base, ...override };
}

export function getMuscleColor(role) {
  // Returns the highlight color for each muscle role
  return role === 'primary'   ? '#C9A84C'   // gold
       : role === 'secondary' ? '#3B82F6'   // blue
       : role === 'stabilizer'? '#6B7280'   // gray
       : null;
}

export const DIFFICULTY_LABEL = {
  beginner:     { label: 'Beginner',     color: '#22C55E' },
  intermediate: { label: 'Intermediate', color: '#EAB308' },
  advanced:     { label: 'Advanced',     color: '#EF4444' },
};

export const RISK_LABEL = {
  low:      { label: 'Low Risk',      color: '#22C55E' },
  moderate: { label: 'Moderate Risk', color: '#EAB308' },
  high:     { label: 'High Risk',     color: '#EF4444' },
};

// Danger zone → display label
export const DANGER_ZONE_LABELS = {
  knee:          'Knee Joint',
  ankle:         'Ankle Complex',
  lumbar_spine:  'Lumbar Spine',
  hip:           'Hip Joint',
  shoulder:      'Shoulder Complex',
  elbow:         'Elbow Joint',
  thoracic_spine:'Thoracic Spine',
  wrist:         'Wrist / Forearm',
  cervical_spine:'Cervical Spine',
};