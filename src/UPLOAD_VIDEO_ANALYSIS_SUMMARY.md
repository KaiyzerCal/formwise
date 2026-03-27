# Uploaded Video Analysis Feature — Complete Integration

## What's New

Users can now upload their own workout videos to the **Technique Compare** page and receive instant AI-powered form feedback with visual pose detection overlays.

## Key Components

### 1. **Backend Function** (`functions/analyzeUploadedForm.js`)
- Accepts video URL and exercise reference
- Uses LLM with vision to analyze form quality
- Returns structured JSON with scores and actionable feedback
- Integrates with Base44 InvokeLLM API

**Response Format:**
```json
{
  "formScore": 75,
  "strengths": ["Good depth", "Balanced stance", "Controlled descent"],
  "criticalErrors": ["Knees caving inward", "Torso leaning too far forward"],
  "improvements": ["1. Cue knees to track over toes...", "2. Engage core..."],
  "bodyPositionAnalysis": "Your stance is...description...",
  "progressionRecommendation": "You're ready to increase weight..."
}
```

### 2. **Upload Component** (`components/bioneer/compare/CustomVideoAnalyzer.jsx`)
- File upload with drag-and-drop support
- Video preview in player
- "Analyze Form" button triggers LLM analysis
- Displays comprehensive feedback
- Error handling and loading states
- "Analyze Another" quick reset

**Features:**
- Uploads video file using Base44 UploadFile integration
- Shows loading spinner during analysis
- Color-coded score display (green/yellow/red)
- Grouped feedback sections (strengths, errors, improvements)
- Progression recommendations

### 3. **Analysis Display** (`components/bioneer/compare/AnalysisInsightsPanel.jsx`)
- Compact sidebar panel showing AI results
- Color-coded form score with progress bar
- Key insights summary
- Strengths with checkmarks
- Errors with alert icons
- Body position analysis preview
- Next step recommendations
- Replaces or complements the standard MetricRail

### 4. **TechniqueCompare Integration** (`pages/TechniqueCompare.jsx`)
- New AI toggle button in Custom Video reference section
- Shows/hides CustomVideoAnalyzer component
- Analysis results feed into AnalysisInsightsPanel
- Sidebar automatically switches to show analysis results

## User Workflow

### Step 1: Navigate to Technique Compare
```
Main Menu → TechniqueCompare (Technique page)
```

### Step 2: Select Reference Mode
```
Reference Tab → Custom Video (select reference mode)
```

### Step 3: Upload Personal Video
```
Click "Upload your video" button
Select file from device
Video appears in preview player
```

### Step 4: Toggle AI Analysis
```
Click "AI" button (lightning icon)
CustomVideoAnalyzer panel opens
```

### Step 5: Analyze Form
```
Click "Analyze Form" button
Wait for LLM analysis (15-30 seconds)
Results display in analyzer panel
Metrics appear in right sidebar
```

### Step 6: Review Feedback
```
Read form score (0-100)
Review strengths
Study critical errors
Follow action items
Check progression recommendation
```

## Visual Features

### Pose Detection Overlay
- **Enabled by:** Toggle "Overlay" button
- **Shows:** Skeleton body outline detected via MediaPipe
- **Color:** Accent color (gold for reference, green for user)
- **Updates:** Real-time while video plays
- **Accuracy:** Works best with full body in frame, good lighting

### Comparison Modes
- **Side-by-Side:** Left = user video, Right = reference
- **Overlay:** User video full-screen, reference in corner
- Both show pose detection skeletons when "Overlay" enabled

### Alignment Guides
- **Grid Lines:** Click "Guides" toggle
- **Alignment Reference:** Click "Alignment" toggle
- **Speed Control:** 0.25x, 0.5x, 1x, 2x playback

## Technical Architecture

```
TechniqueCompare (page)
├── CustomVideoAnalyzer (component)
│   ├── File upload input
│   ├── Video player
│   └── Analysis trigger
│
├── VideoPanel (video display)
│   ├── Video element
│   ├── Canvas for pose overlay
│   └── Skeleton drawing (MediaPipe)
│
├── useVideoPose (hook)
│   ├── MediaPipe Pose model
│   ├── Landmark detection
│   └── Throttled analysis (~8fps)
│
└── AnalysisInsightsPanel (sidebar display)
    └── Analysis results from AI

Backend Flow:
1. User selects video file
2. CustomVideoAnalyzer uploads via UploadFile integration
3. analyzeUploadedForm function called with video URL
4. InvokeLLM analyzes video with vision model
5. Structured JSON response returned
6. AnalysisInsightsPanel displays results
```

## Data Flow

```
User Video Upload
    ↓
CustomVideoAnalyzer.jsx
    ↓
base44.integrations.Core.UploadFile()
    ↓ (returns file_url)
analyzeUploadedForm function
    ↓
base44.integrations.Core.InvokeLLM({
  file_urls: [video_url],
  response_json_schema: {...}
})
    ↓ (returns analysis object)
setAnalysisResult()
    ↓
AnalysisInsightsPanel renders results
```

## Response Time
- Video upload: ~2-5 seconds (depends on file size)
- LLM analysis: ~15-30 seconds
- Total time: ~20-35 seconds per analysis

## Supported Video Formats
- MP4, MOV, WebM, Ogg, and other HTML5 video formats
- Maximum file size: Limited by browser upload capabilities (typically 500MB+)
- Recommended: HD or higher quality for best form detection

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| "Analysis failed" | Network error or unsupported format | Retry or use different file |
| "Unauthorized" | Not logged in | Sign in to app |
| "Video format error" | Browser doesn't support format | Use MP4 or MOV |
| Empty analysis | Video too dark/low quality | Improve lighting and try again |

## Integration Points

### 1. Pages/TechniqueCompare.jsx
- Imports CustomVideoAnalyzer and AnalysisInsightsPanel
- Manages showAnalyzer and analysisResult state
- Routes analysis to sidebar display

### 2. Components/bioneer/compare/CustomVideoAnalyzer.jsx
- Standalone upload and analysis component
- Calls analyzeUploadedForm backend function
- Manages upload state and UI

### 3. Components/bioneer/compare/AnalysisInsightsPanel.jsx
- Displays analysis results in sidebar
- Shows form score, strengths, errors, recommendations
- Color-coded visual indicators

### 4. Functions/analyzeUploadedForm.js
- Backend handler for LLM analysis
- Uses InvokeLLM integration with vision capability
- Returns structured analysis data

### 5. Components/bioneer/compare/VideoPanel.jsx
- Already has MediaPipe skeleton rendering
- Shows pose detection overlay on any video
- Works for both user and reference videos

## Performance Considerations

- **Pose Detection:** Throttled to ~8fps to avoid performance issues
- **Canvas Rendering:** Uses RAF for smooth 60fps overlay
- **LLM Analysis:** Uses vision model (slower than text but necessary for video)
- **Memory:** Video blobs freed after upload

## Future Enhancements

Possible additions:
- [ ] Comparison of before/after videos
- [ ] Exercise-specific form templates
- [ ] Pose alignment quantification (joint angles)
- [ ] Video frame-by-frame marking of errors
- [ ] Save analysis history per exercise
- [ ] Progress tracking over time
- [ ] Detailed angle measurements
- [ ] Segment-specific form breakdown