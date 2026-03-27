# Video Analysis Feature — Technical Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        TechniqueCompare.jsx                 │
│                                                              │
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   Video Controls     │         │  CustomVideoAnalyzer │  │
│  │  - Play/Pause        │         │  (when AI enabled)   │  │
│  │  - Speed             │         │  - Upload input      │  │
│  │  - Seek              │         │  - Analyze button    │  │
│  │  - Mode toggle       │         │  - Results display   │  │
│  └──────────────────────┘         └──────────────────────┘  │
│                                            ↓                 │
│         ┌────────────────────────────────────────────┐      │
│         │   VideoPanel x2 (Left/Right)              │      │
│         │   - Canvas overlay (pose skeleton)        │      │
│         │   - Video playback                        │      │
│         │   - Landmark rendering                    │      │
│         └────────────────────────────────────────────┘      │
│                      ↓                                       │
│         ┌────────────────────────────────────────────┐      │
│         │   useVideoPose Hooks                       │      │
│         │   - MediaPipe pose detection               │      │
│         │   - Landmark extraction                    │      │
│         │   - Throttled analysis (~8fps)            │      │
│         └────────────────────────────────────────────┘      │
│                                                              │
│         ┌──────────────────────────┬───────────────────┐   │
│         │ AnalysisInsightsPanel    │  MetricRail       │   │
│         │ (when analysis complete) │  (default display)│   │
│         └──────────────────────────┴───────────────────┘   │
└─────────────────────────────────────────────────────────────┘
          ↓                          ↓
    ┌──────────────────┐      ┌──────────────────┐
    │  Base44 Upload   │      │  Base44 InvokeLLM│
    │  Integration     │      │  Integration     │
    └────────┬─────────┘      └────────┬─────────┘
             ↓                         ↓
    ┌──────────────────────────────────────────┐
    │  analyzeUploadedForm Backend Function    │
    │  (Deno Deploy)                           │
    └────────┬─────────────────────────────────┘
             ↓
    ┌──────────────────────────────────────────┐
    │  LLM Vision Model (Claude/GPT)           │
    │  - Form quality assessment               │
    │  - Error detection                       │
    │  - Feedback generation                   │
    └──────────────────────────────────────────┘
```

## Data Flow Sequence

```
1. USER UPLOADS VIDEO
   ┌─────────────┐
   │   Browser   │
   │  - Video    │
   │   file      │
   └──────┬──────┘
          │ input type="file"
          ↓
   ┌──────────────────────────────┐
   │ CustomVideoAnalyzer           │
   │ - handleFileSelect()          │
   │ - Creates blob URL            │
   │ - Sets videoSrc state         │
   └──────┬───────────────────────┘

2. USER CLICKS ANALYZE
   ┌──────────────────────────────┐
   │ handleAnalyze()              │
   │ - fetch(videoSrc).blob()     │
   │ - UploadFile integration     │
   └──────┬───────────────────────┘
          │
          ↓
   ┌──────────────────────────────┐
   │ Base44 UploadFile API        │
   │ - Stores file temporarily    │
   │ - Returns file_url           │
   └──────┬───────────────────────┘

3. INVOKE BACKEND FUNCTION
   ┌──────────────────────────────┐
   │ analyzeUploadedForm()        │
   │ - Receives file_url          │
   │ - Auth check                 │
   └──────┬───────────────────────┘
          │
          ↓
   ┌──────────────────────────────┐
   │ Base44 InvokeLLM API         │
   │ - Sends video URL + prompt   │
   │ - Vision model processes     │
   │ - Returns JSON response      │
   └──────┬───────────────────────┘

4. DISPLAY RESULTS
   ┌──────────────────────────────┐
   │ setAnalysisResult(data)      │
   │ - Store in component state   │
   │ - Trigger re-render          │
   └──────┬───────────────────────┘
          │
          ↓
   ┌──────────────────────────────┐
   │ AnalysisInsightsPanel        │
   │ - Render form score          │
   │ - Display strengths          │
   │ - Show critical errors       │
   │ - List improvements          │
   │ - Show recommendations       │
   └──────────────────────────────┘
```

## Component Hierarchy

```
TechniqueCompare
├── Header (with toggles)
├── SourceControls
│   ├── Your Clip section
│   │   ├── Upload button
│   │   └── Input file ref
│   └── Reference section
│       ├── Mode tabs (Library/Custom)
│       └── Reference controls
│           ├── Library selector (when Library mode)
│           ├── Custom upload button (when Custom mode)
│           ├── AI toggle button (NEW)
│           └── CustomVideoAnalyzer (NEW, when AI enabled)
│               ├── Upload input
│               ├── Video preview
│               ├── Analyze button
│               └── Results display
├── Main Content
│   ├── Video Stage
│   │   ├── Video displays (1 or 2 panels)
│   │   │   ├── VideoPanel (left)
│   │   │   │   ├── Video element
│   │   │   │   └── Canvas overlay
│   │   │   │       └── drawSkeleton() from useVideoPose
│   │   │   └── VideoPanel (right)
│   │   │       ├── ReferenceSkeletonPlayer OR VideoPanel
│   │   │       └── Canvas overlay
│   │   └── Playback controls
│   │       ├── Play/Pause
│   │       ├── Seek slider
│   │       ├── Speed buttons
│   │       └── Time display
│   └── Metric Rail / Analysis Sidebar
│       └── Conditional render:
│           ├── AnalysisInsightsPanel (NEW, when analysis exists)
│           └── MetricRail (existing, default)
└── Report Overlay (when showing report)
```

## State Management

### TechniqueCompare State Tree

```javascript
// Existing state (preserved)
refMode: 'library' | 'custom'
selectedRefId: string
userSrc: string | null
userFilename: string
customRefSrc: string | null
mode: 'sidebyside' | 'overlay'
showOverlay: boolean
showGuides: boolean
showAlignment: boolean
playing: boolean
speed: number
currentTime: number
duration: number
sourceMode: string
importLabel: string
draftError: string | null
refSkelLandmarks: Array | null
showReport: boolean
reportData: Object | null

// NEW state
showAnalyzer: boolean           // Toggles CustomVideoAnalyzer visibility
analysisResult: {              // Stores AI analysis results
  formScore: number,
  strengths: string[],
  criticalErrors: string[],
  improvements: string[],
  bodyPositionAnalysis: string,
  progressionRecommendation: string
} | null
```

### CustomVideoAnalyzer State Tree

```javascript
// Internal state
videoSrc: string | null        // Blob URL of uploaded video
filename: string               // Display name of uploaded file
analyzing: boolean             // Loading state during analysis
analysis: Object | null        // Results from LLM
error: string | null          // Error message if analysis fails
```

## API Integration Points

### 1. Base44 UploadFile Integration

```javascript
const uploadedFile = await base44.integrations.Core.UploadFile({ 
  file: videoBlob 
});

// Response
{
  file_url: "https://..."  // Temporary URL for LLM analysis
}
```

### 2. Backend Function Invocation

```javascript
const result = await base44.functions.invoke('analyzeUploadedForm', {
  videoUrl: string,
  referenceExercise: string,
  referenceDescription: string
});

// Response (from backend)
{
  data: {
    success: true,
    analysis: {
      formScore: number,
      strengths: string[],
      criticalErrors: string[],
      improvements: string[],
      bodyPositionAnalysis: string,
      progressionRecommendation: string
    }
  }
}
```

### 3. InvokeLLM Integration (in backend)

```javascript
const result = await base44.integrations.Core.InvokeLLM({
  prompt: string,
  file_urls: [videoUrl],
  response_json_schema: {
    type: 'object',
    properties: { /* schema */ }
  }
});

// Direct response (JSON parsed automatically)
{
  formScore: number,
  strengths: string[],
  criticalErrors: string[],
  improvements: string[],
  bodyPositionAnalysis: string,
  progressionRecommendation: string
}
```

## Pose Detection Pipeline

```
VideoPanel (video element)
    ↓
useVideoPose hook triggers (when isPlaying && enabled)
    ↓
MediaPipe Pose Model initialization
    ├─ Load model from CDN
    ├─ Set options (modelComplexity, smoothing, etc.)
    └─ Initialize (async)
    ↓
Analysis loop (RAF, throttled to ~8fps)
    ├─ Check if video is playing
    ├─ Send video frame to MediaPipe
    └─ Get landmarks (33 points)
    ↓
drawSkeleton() in VideoPanel
    ├─ Draw connections (lines between joints)
    ├─ Draw joints (circles at landmarks)
    └─ Color-code by visibility/confidence
    ↓
Canvas overlay on video element
```

## Error Handling Strategy

```
CustomVideoAnalyzer
├── File Upload
│   ├── Check if file exists
│   └── Handle fetch/blob errors
├── UploadFile Integration
│   └── Catch and display upload errors
├── Backend Function Call
│   ├── Check response success flag
│   ├── Extract error message
│   └── Display user-friendly error
└── LLM Vision Analysis
    ├── Timeout handling
    ├── Invalid response format
    └── Empty/null results

AnalysisInsightsPanel
├── Null checks for all data fields
├── Fallback formatting for missing data
└── Never crash on partial results
```

## Performance Optimization

### 1. Lazy Loading
- MediaPipe pose model only loaded when needed
- Singleton promise prevents duplicate loads
- Model cached after first load

### 2. Throttling
- Pose analysis: ~8fps (120ms throttle)
- Prevents CPU overload
- Smooth visual updates

### 3. Canvas Rendering
- RAF loop for 60fps overlay updates
- Only redraws when landmarks change
- Minimal DOM manipulation

### 4. Memory Management
- Blob URLs revoked after use
- Video blobs freed after upload
- Analysis results stored efficiently
- Unused landmarks cleared on pause

## Security Considerations

1. **Authentication**: Backend function requires auth check
2. **File Upload**: Base44 handles secure file storage
3. **LLM Input**: User video only, no metadata
4. **XSS Prevention**: React escapes all output
5. **CORS**: Base44 handles CORS for integrations

## Accessibility

- Keyboard shortcuts preserved
- Video controls fully keyboard accessible
- Semantic HTML in all components
- ARIA labels where appropriate
- Color-not-only error indication
- Text fallbacks for all icons

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| HTML5 Video | ✅ | ✅ | ✅ | ✅ |
| Canvas API | ✅ | ✅ | ✅ | ✅ |
| MediaPipe | ✅ | ✅ | ✅ | ✅ |
| Fetch API | ✅ | ✅ | ✅ | ✅ |
| Canvas RenderingContext2D | ✅ | ✅ | ✅ | ✅ |

Minimum versions: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+