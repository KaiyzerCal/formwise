# Technique Studio — Integration Test Guide

**Purpose**: Verify the hardened Technique section works end-to-end  
**Duration**: ~5 minutes  
**Environment**: Development or staging

---

## Setup

1. App is running (`npm run dev`)
2. User is authenticated
3. At least one freestyle session exists in History

---

## Test Sequence

### Part 1: Navigation to Technique Studio

**Steps**:
1. Go to **History** page
2. Find any **freestyle session** (marked with "FREESTYLE" label)
3. Click the **"TECHNIQUE"** button

**Expected Result**:
- Navigation to `/TechniqueStudio?draft={id}`
- Page loads with spinning indicator (1-2 seconds)
- Technique Studio appears with:
  - Real video in the center
  - Skeleton overlay on top
  - Frame controls at bottom
  - Toolbar on left
  - Notes panel on right

**Failure Indicators**:
- Page shows error "Session not found"
- Blank screen with no content
- Video doesn't load
- Browser console shows errors

---

### Part 2: Video Playback

**Steps**:
1. Click the **[▶ Play]** button

**Expected Result**:
- Video plays smoothly
- Skeleton overlay stays synchronized
- Frame counter updates (e.g., "45/1350")
- Button changes to **[⏸ Pause]**

**Manual Speed Test**:
1. Click the speed selector: **[0.5×]**
2. Video plays at half speed
3. Skeleton still synchronized
4. Click **[1×]** to return to normal

**Failure Indicators**:
- Video doesn't play or has audio/no video
- Skeleton visibly lags behind video
- Frame counter doesn't increment
- Speed change doesn't affect playback

---

### Part 3: Frame-by-Frame Control

**Steps**:
1. Click **[⏸ Pause]** to stop video
2. Click **[▶]** (step forward) button 5 times

**Expected Result**:
- Video advances 1 frame per click
- Skeleton updates to match frame
- Frame counter increments: 1/1350 → 2/1350 → 3/1350 → ...

**Keyboard Test**:
1. Press the **right arrow key** 3 times
2. Frame should advance 3 frames

**Expected Result**:
- Same as button clicks
- No keyboard errors in console

**Failure Indicators**:
- Frame doesn't change
- Video time doesn't update
- Skeleton stays on same pose
- Keyboard shortcuts don't work

---

### Part 4: Timeline Scrubbing

**Steps**:
1. Pause the video if playing
2. Click/drag the **timeline scrubber** to middle

**Expected Result**:
- Video jumps to middle
- Frame counter shows middle frame (e.g., "675/1350")
- Skeleton updates immediately

**Failure Indicators**:
- Timeline doesn't respond
- Video time doesn't match scrubber position
- Skeleton doesn't update

---

### Part 5: Annotation Tools

**Steps**:
1. In the **left toolbar**, click the **[➖ Line]** tool (should highlight gold)
2. On the video, click two points to draw a line

**Expected Result**:
- Line appears on current frame
- Line is gold colored
- Tool remains selected

**Undo Test**:
1. Click **[↶ Undo]** button

**Expected Result**:
- Line disappears
- Button returns to previous state

**Angle Measurement Test**:
1. Click the **[⦝ Angle]** tool
2. Click three points on the skeleton:
   - First point (e.g., shoulder)
   - Second point (e.g., elbow) — this is the vertex
   - Third point (e.g., wrist)

**Expected Result**:
- Angle marker appears with degree reading (e.g., "145°")
- Measurement is reasonable

**Failure Indicators**:
- Tools don't highlight
- Nothing appears on video
- Undo doesn't work
- Angle math seems wrong

---

### Part 6: Overlay Visibility Toggles

**Steps**:
1. Click the **[👁 Skeleton]** toggle in toolbar

**Expected Result**:
- Skeleton disappears
- Video is visible without pose overlay

**Steps**:
2. Click again to re-enable skeleton

**Expected Result**:
- Skeleton reappears
- Still synchronized with video

**Annotation Toggle Test**:
1. With a line annotation visible, click **[👁 Annotations]**

**Expected Result**:
- Line disappears (but is still in memory)
- Clicking again brings line back

**Failure Indicators**:
- Toggles don't respond
- Skeleton/annotations don't disappear
- Can't re-enable after disabling

---

### Part 7: Notes Panel

**Steps**:
1. In the **right panel**, fill in:
   - **Athlete Name**: "Test Athlete"
   - **Focus Areas**: Select "Balance" and "Form"
   - **Notes**: Type "Good form, work on depth"
2. Wait 2-3 seconds (autosave will trigger)

**Expected Result**:
- Form fills without errors
- No error messages
- Autosave completes silently (check browser console for success)

**Failure Indicators**:
- Form fields don't accept input
- Errors appear
- Autosave fails (console shows errors)

---

### Part 8: Export

**Steps**:
1. Click the **[Export]** button in header

**Expected Result**:
- Export modal appears
- Three format options visible: "JSON", "Package", "Snapshot"

**Steps**:
2. Select **"JSON"** format
3. Click **[EXPORT]**

**Expected Result**:
- File downloads: `technique-{sessionId}.json`
- Modal closes
- Success message shows briefly

**PNG Export Test**:
1. Click **[Export]** again
2. Select **"PNG Snapshot"**
3. Click **[EXPORT]**

**Expected Result**:
- File downloads: `snapshot-{sessionId}-frame{N}.png`
- Image contains video frame + skeleton + any annotations

**Failure Indicators**:
- Modal doesn't open
- Export buttons don't work
- Files don't download
- Export errors in console

---

### Part 9: Keyboard Shortcuts

**Steps**:
1. Click on the video area to focus
2. Press **Space** key

**Expected Result**:
- Video plays if paused, or pauses if playing

**Steps**:
3. Press **← Arrow** key

**Expected Result**:
- Video steps backward one frame

**Steps**:
4. Press **→ Arrow** key

**Expected Result**:
- Video steps forward one frame

**Steps**:
5. Draw an annotation, then press **Ctrl+Z** (Windows) or **Cmd+Z** (Mac)

**Expected Result**:
- Annotation is removed (undo works)

**Failure Indicators**:
- Keyboard events don't register
- Wrong action happens
- Console shows key errors

---

### Part 10: Restore Project on Reopen

**Steps**:
1. Go back to History (click X button or use back button)
2. Click **"TECHNIQUE"** on the same session again

**Expected Result**:
- Technique Studio loads the session again
- Annotations are restored (if you created any)
- Notes are restored
- Playback position is at frame 0

**Failure Indicators**:
- Annotations are gone (should persist)
- Notes are cleared
- Session doesn't load

---

## Performance Checks

**During Playback**:
- Video should play smoothly without stuttering
- Overlay canvas should not cause visible lag
- No jumpy frame updates
- Memory usage should stay constant (no memory leak)

**Frame Stepping**:
- Should respond instantly (< 50ms per click)
- No "computing..." delays

**UI Responsiveness**:
- Buttons click without delay
- Sliders respond smoothly
- No freezes when drawing annotations

**Check via DevTools**:
1. Open Chrome DevTools (F12)
2. Go to **Performance** tab
3. Record while playing video
4. Stop recording
5. Check for smooth 60fps (look for green FPS indicator)

---

## Cleanup & Next Steps

**After Testing**:
1. Close Technique Studio (click X)
2. Return to History
3. Verify History still works normally
4. No impact to Live Session

**Bug Reporting**:
If any test fails, note:
- Exact steps to reproduce
- Expected vs actual result
- Browser console errors
- Screenshot if possible

---

## Success Criteria

All tests pass if:
- ✅ Video loads and plays smoothly
- ✅ Frame stepping works with keyboard and buttons
- ✅ Annotations persist and undo works
- ✅ Overlay toggles work correctly
- ✅ Export generates files
- ✅ Keyboard shortcuts respond
- ✅ Projects restore on reopen
- ✅ No memory leaks
- ✅ No console errors
- ✅ 60fps playback maintained

---

**Test Version**: 1.0  
**Last Updated**: 2026-03-12  
**Estimated Time**: 5-10 minutes