# Technique Studio — Quick Start Guide

## What It Is

A professional video review and annotation tool for coaches. Load a saved freestyle workout, analyze frame-by-frame, draw coaching annotations (angles, form cues), and export for client feedback.

## How to Access

1. **From History page**, click **TECHNIQUE** on any freestyle session
2. Or navigate directly: `/TechniqueStudio?draft={draftId}`

## Main Interface

```
╔═══════════════════════════════════════════════════════════════╗
║ Technique Studio | Export | Close                            ║
╠═══╦═════════════════════════════════════════════════════════╦═════╣
║   ║                                                         ║     ║
║ T ║           VIDEO + SKELETON OVERLAY                     ║ N   ║
║ O ║           (Real video playing in background)           ║ O   ║
║ O ║           (Pose skeleton synchronized on top)          ║ T   ║
║ L ║           (Annotations drawn when tool active)         ║ E   ║
║ S ║                                                         ║ S   ║
║   ║  [Play|Step←|Step→|Jump+5] [0.5x] [1x] [2x]           ║     ║
║   ║  ════════[Timeline Scrubber]════════  Frame: 45/1350  ║     ║
║   ║                                                         ║     ║
╠═══╩═════════════════════════════════════════════════════════╩═════╣
```

## Toolbar (Left Side)

**Drawing Tools**:
- 🔘 **Select** — select/edit existing annotations
- ➖ **Line** — straight line
- ➜ **Arrow** — directional arrow
- ◻ **Rectangle** — box
- ⭕ **Circle** — circle
- ✏ **Draw** — freehand
- ⦝ **Angle** — 3-point angle measurement (shows degrees)
- T **Text** — add text labels
- 💡 **Spotlight** — highlight area

**View Controls**:
- 👁 **Skeleton** — show/hide pose skeleton
- 👁 **Annotations** — show/hide your drawings
- J **Joint Labels** — show joint names
- ° **Angles** — show joint angles

**Edit**:
- ↶ **Undo** / ↷ **Redo**
- 🗑 **Clear Frame** — delete annotations on current frame
- 🗑 **ALL** — delete all annotations

## Playback Controls (Bottom)

- **[▶] Play/Pause** — start/stop video
- **[◀] Step Backward** — previous frame
- **[▶] Step Forward** — next frame
- **[+5]** — jump 5 frames forward
- **Speed**: 0.25× | 0.5× | 0.75× | 1× | 1.5× | 2×
- **Timeline** — drag to scrub any time

## Notes Panel (Right Side)

- **Athlete Name** — Who is this for?
- **Focus Areas** — Select coaching tags (Balance, Form, Depth, etc.)
- **Coach Notes** — Free-form observations and feedback
- **Metadata** — Session duration, frame count, confidence %
- **[SAVE]** — Persists your notes

## Common Tasks

### Review Slow Motion
```
1. Click speed button: [0.5x]
2. Click [Play]
3. Watch at half speed
4. Click speed button: [1x] to return to normal
```

### Measure Joint Angle
```
1. Click [⦝ Angle] tool (left toolbar)
2. Click first joint (e.g., hip)
3. Click second joint (apex, e.g., knee)
4. Click third joint (e.g., ankle)
5. Angle marker appears with degree reading
```

### Draw Form Cue
```
1. Click [➖ Line] tool
2. Click point A (e.g., shoulder)
3. Click point B (e.g., hip)
4. Line drawn on current frame
5. Optional: Add [T Text] label nearby
```

### Add Coach Notes
```
1. Fill in athlete name (right panel)
2. Select focus areas (e.g., [Depth], [Form])
3. Type observations in "Coach Notes" textarea
4. Click [SAVE]
```

### Export for Client
```
1. Click [Export] button (top right)
2. Choose format:
   - JSON: metadata for archival
   - Package: complete reconstruction data
   - Snapshot: PNG image of current frame
3. Click [EXPORT]
4. File downloads automatically
5. Email to client or archive
```

## Annotation Lifecycle

- **Anchored to frame**: Each annotation sticks to the frame it was created on
- **Frame-by-frame editing**: Pause, step to a frame, add annotation, step forward
- **Undo/Redo**: Use buttons to undo/redo any changes
- **Clear**: Clear all on current frame or delete all globally
- **Visibility**: Toggle annotations on/off anytime (👁 button)

## Tips

✅ **Slow down** (0.5× or 0.25×) to analyze form details  
✅ **Step frame-by-frame** to find exact moment of form breakdown  
✅ **Use angle measurements** to quantify form issues (e.g., "knee flexion only 95°, should be 120°")  
✅ **Add text labels** to explain why you marked something  
✅ **Save notes** frequently — contains context for later review  
✅ **Export both JSON and PNG** — share PNG with client, keep JSON for records  

## What You'll See

| Item | Meaning |
|------|---------|
| Gold skeleton lines | Pose tracking (joints and connections) |
| Colored annotations | Your drawing (turns gold = selected) |
| "Frame: 45/1350" | Currently viewing frame 45 out of 1,350 total |
| "0:15 / 2:30" | Video at 15 seconds out of 2:30 total |
| Green checkmark | Annotation saved |
| Red X | Error (see message for details) |

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No video, just skeleton | Session doesn't have video file. Pose replay still works. |
| Skeleton jumps around | Pose confidence low. Toggle skeleton OFF for cleaner view. |
| Can't draw annotation | Make sure correct tool is selected (should be highlighted gold). |
| Annotation not visible | Toggle [👁 Annotations] ON (right toolbar). |
| Export fails | Check browser console. Try Package format instead of PNG. |

## Keyboard (Future)

Currently all controls are buttons. Keyboard shortcuts planned for next version:
- Space = Play/Pause
- → / ← = Step frames
- Z = Undo
- Delete = Clear annotation

## What's Coming

🚧 **MP4 Video Export** — Render annotated video for clients (backend in progress)  
🚧 **Side-by-Side Compare** — Compare two sessions simultaneously  
🚧 **Voice Notes** — Record audio commentary on specific frames  

## Contact & Support

- See `/components/bioneer/technique/studio/README.md` for full architecture
- See `USER_WORKFLOW.md` for detailed coaching scenarios
- Check browser console for debug logs

---

**Status**: Production Ready ✅  
**Version**: 1.0  
**Last Updated**: 2026-03-12