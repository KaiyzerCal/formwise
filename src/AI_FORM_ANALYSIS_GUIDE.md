# AI Form Analysis — User Video Upload & Comparison

## Overview
The Technique Compare page now includes AI-powered form analysis for uploaded videos. Users can:
1. Upload their own workout videos
2. Compare against library references or custom reference videos
3. Receive instant AI-powered form feedback with actionable improvements
4. See pose detection overlays with body outlines for visual comparison

## Features

### 1. Custom Video Upload with AI Analysis
**Location:** Technique Compare → Reference → Custom Video Tab

- **Upload Button**: Click to select a video file from your device
- **AI Button**: Toggles the AI Form Analyzer panel
- **Pose Detection**: Videos are analyzed with pose estimation to identify body position
- **Real-time Overlay**: Body skeletons overlay on your video for comparison

### 2. AI Analysis Metrics
When you upload a video and click "Analyze Form", you receive:

- **Form Score (0-100)**: Overall assessment of exercise quality
  - 80+: Excellent form
  - 60-79: Good form with minor corrections needed
  - Below 60: Needs significant improvement

- **Key Strengths**: 3-5 things you're doing well
- **Critical Errors**: Top form mistakes that could cause injury
- **Actionable Improvements**: Numbered, specific corrections with HOW-TO details
- **Body Position Analysis**: Detailed description of your posture and alignment
- **Progression Recommendation**: Whether to continue, regress, or progress difficulty

### 3. Comparison Modes

#### Side-by-Side View
- Left panel: Your uploaded video with pose overlay
- Right panel: Reference video or library skeleton animation
- Compare form differences in real-time

#### Overlay Mode
- Your video full-screen with pose skeleton overlay
- Reference video in picture-in-picture (bottom-right)
- Perfect for detailed form analysis

### 4. Visual Overlays
All videos show:
- **Skeleton Pose**: Detected body joints and connections
- **Joint Labels**: Optional joint point labels (wrist, knee, hip, etc.)
- **Angle Guides**: Optional angle measurements between joints
- **Alignment Guides**: Visual grid lines for positional reference

### 5. Metrics Panel
The right sidebar shows:
- **Form Score**: Large, color-coded score display
- **Strengths**: Checkmarks for positive observations
- **Errors**: Alert indicators for form faults
- **Body Position**: Summary of your alignment
- **Next Steps**: Specific progression recommendation

## How to Use

### Basic Workflow
1. Navigate to **Technique Compare** from main menu
2. Click the **Reference** tab → **Custom Video**
3. Click **Upload** to select your workout video
4. Click the **AI** button to enable form analysis
5. Click **Analyze Form** to get instant feedback
6. Review metrics in the right panel or upload another video

### Detailed Analysis
1. After uploading, enable **Overlay** toggle to see skeleton pose
2. Enable **Guides** to see alignment reference lines
3. Play the video to watch your form in real-time
4. Read the critical errors and improvements list
5. Adjust your form based on recommendations
6. Upload a follow-up video to track improvements

### Comparison to Reference
1. Upload your video (left panel)
2. Upload a reference video OR select a library exercise (right panel)
3. Click **Play** to sync both videos
4. Adjust speed with speed controls (0.25x, 0.5x, 1x, 2x)
5. Toggle **Overlay** to see pose skeletons on both videos
6. Use **Side by Side** vs **Overlay** mode as needed

## Technical Details

### AI Analysis Engine
- Uses Claude/GPT vision model to analyze video content
- Detects body position, movement quality, and form errors
- Provides evidence-based recommendations from fitness coaching expertise
- Response JSON includes structured data for metrics and insights

### Pose Detection
- Powered by MediaPipe pose estimation
- Detects 33 landmark points on human body
- Works with various camera angles and lighting conditions
- Confidence scores indicate detection accuracy

### Video Upload
- Supported formats: MP4, MOV, WebM, and other video formats
- Files are temporarily uploaded for AI analysis
- Original videos stored locally in browser (not permanently saved)
- Videos can be analyzed multiple times

## Tips for Best Results

1. **Lighting**: Use well-lit environment for better pose detection
2. **Angle**: Film from 45-90 degrees to the side (not directly front/back)
3. **Full Body**: Ensure entire body is in frame when possible
4. **Clear Movement**: Perform movement at normal speed for analysis
5. **Multiple Angles**: Upload videos from different angles for comprehensive feedback

## Error Messages

- **"Analysis failed"**: Video format not supported or upload failed. Try a different file.
- **"Unauthorized"**: Must be logged in to use AI analysis features
- **"Pose detection limited"**: Video angle or lighting prevents full pose analysis. Improve lighting and try again.

## Keyboard Shortcuts
- **Space**: Play/Pause
- **Arrow Left**: Step backward
- **Arrow Right**: Step forward
- **0.25x - 2x**: Speed controls visible in bottom bar

## Integration Points

- **TechniqueCompare.jsx**: Main comparison page
- **CustomVideoAnalyzer.jsx**: Upload and analysis component
- **AnalysisInsightsPanel.jsx**: Results display panel
- **analyzeUploadedForm** backend function: AI analysis engine
- **useVideoPose.js**: Pose detection hook for overlays