# BIONEER Freestyle Capture Mode — Implementation Summary

## Overview
Extended BIONEER with a Freestyle Capture Mode that allows users to record any movement live without form scoring or evaluation. Sessions are saved to IndexedDB and can be replayed with skeleton overlay and angle readouts.

## New Modules Added

### 1. Session Recording & Storage
- **`components/bioneer/session/sessionTypes.js`**
  - Session and frame structure definitions
  - `createFreestyleSession()`, `createPoseFrame()`, `createAngleFrame()`

- **`components/bioneer/session/useSessionRecorder.js`**
  - React hook managing MediaRecorder + pose frame capture
  - `startRecording()`, `stopRecording()`, `capturePoseFrame()`
  - Adaptive FPS reduction on CPU stress
  - Returns: videoBlob, poseFrames[], angleFrames[]

- **`components/bioneer/history/sessionStorage.js`**
  - IndexedDB persistence layer
  - `saveFreestyleSession()`, `loadFreestyleSession()`, `getAllFreestyleSessions()`
  - Thumbnail generation from first frame
  - `deleteFreestyleSession()` for cleanup

### 2. Camera & Analysis
- **`components/bioneer/FreestyleCameraView.jsx`**
  - Extends pose tracking pipeline (reuses `usePoseRuntime`, `usePoseInferenceLoop`)
  - Disables: rep detection, fault detection, form scoring
  - Shows: camera feed, skeleton overlay, joint angle readouts, recording indicator
  - Session timer, confidence/joints display
  - START RECORDING / STOP & SAVE controls

### 3. Replay & History
- **`components/bioneer/history/FreestyleReplay.jsx`**
  - Full-screen video playback with skeleton overlay
  - Timeline scrubber + play/pause controls
  - Real-time angle display from pose frames
  - Syncs video playback with captured pose data

- **`pages/FreestyleSession`** (page wrapper)
  - Category selection (Strength / Sports)
  - Camera lifecycle management
  - Replay interface
  - Session save/discard workflow

### 4. Library & History Integration
- **`components/bioneer/exerciseLibrary.js`** (updated)
  - Added `FREESTYLE_MODE` pseudo-exercise tile

- **`components/bioneer/MovementLibrary.jsx`** (updated)
  - Freestyle tile appears at top of Strength tab
  - "Track any movement live and review it later"

- **`components/bioneer/ExerciseCard.jsx`** (updated)
  - Freestyle tile navigates to `/FreestyleSession`
  - Shows different description text

- **`pages/SessionHistory.jsx`** (updated)
  - Loads freestyle sessions from IndexedDB alongside exercise sessions
  - Displays thumbnail + duration
  - Play button → opens FreestyleReplay modal
  - Delete button → removes from IndexedDB
  - Both exercise and freestyle sessions in unified list

## Data Flow

```
MovementLibrary
  ↓
Select "Freestyle Capture"
  ↓
FreestyleSession (category picker)
  ↓
FreestyleCameraView (pose tracking active)
  ↓
User: START RECORDING
  → useSessionRecorder captures video + pose frames
  ↓
User: STOP & SAVE
  → FreestyleReplay (review with skeleton)
  ↓
User: SAVE & CLOSE
  → sessionStorage saves to IndexedDB
  ↓
SessionHistory
  → Show thumbnail, duration, delete, replay options
  → Replay: FreestyleReplay opens modal
  → Delete: Removes from IndexedDB
```

## Key Features

✅ **Live Pose Tracking**
- Camera stream + skeleton overlay
- No form evaluation (disabled rep/fault detection)
- Joint angle readouts (knee, hip, elbow, shoulder)
- Confidence % + joint visibility count

✅ **Session Recording**
- MediaRecorder captures video stream
- Pose frames captured at 30fps (adaptive to CPU)
- Angle data aggregated per frame
- Video + pose metadata saved together

✅ **Local Storage**
- IndexedDB persistence (no backend required)
- Thumbnail generation from first frame
- All data stays on device

✅ **Replay & Analysis**
- Full-screen playback with timeline scrubber
- Skeleton overlay redrawn from stored pose frames
- Real-time angle display synchronized with video
- Play/pause controls

✅ **History Integration**
- Freestyle sessions appear in SessionHistory alongside exercise sessions
- Thumbnail preview
- Duration display
- Delete functionality
- Unified session list

## Routing
- **Library** → Select "Freestyle" tile
- **Camera** → `/FreestyleSession` (no layout)
- **Replay** → Modal overlay on FreestyleSession page
- **History** → Freestyle sessions integrated into SessionHistory

## Constraints Respected
✅ No modifications to:
- `usePoseRuntime` (pose model loading)
- `usePoseInferenceLoop` (inference loop)
- `poseEngine` (angle calculations)
- `useLiveAnalysis` (exercise-specific orchestration)
- `CameraView` (exercise mode)

Freestyle mode is an **extension layer**, not a rewrite of existing systems.

## Performance
- Adaptive FPS: 30fps → 15fps on CPU stress
- Frame buffering: max 1800 frames (60s @ 30fps)
- IndexedDB indexed by sessionId for fast lookup
- Blob URLs for efficient video/thumbnail playback
- Cleanup on unmount/navigation

## Testing Workflow
1. Open app → navigate to Home → select movement
2. Click "Freestyle Capture" tile
3. Select category (Strength or Sports)
4. Camera loads → pose engine initializes
5. Body visible + confidence OK → readiness passes
6. Click "START RECORDING"
7. Move freely, watch skeleton + angles update
8. Click "STOP & SAVE"
9. Replay shows video + overlay
10. Click "SAVE & CLOSE" → session saved
11. Navigate to History → see freestyle session with thumbnail
12. Click play icon → opens replay modal
13. Click delete → removes from IndexedDB

## Future Extensions
- Technique handoff (copy session to TechniqueCompare workspace)
- Multi-angle capture (side + front)
- Drawing tools in replay (annotations)
- Comparison mode (side-by-side replays)
- Export to video file