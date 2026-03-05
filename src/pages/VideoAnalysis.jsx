import React, { useState } from "react";
import VideoUploadScreen from "../components/bioneer/VideoUploadScreen";
import VideoAnalyzingScreen from "../components/bioneer/VideoAnalyzingScreen";
import FormReportScreen from "../components/bioneer/FormReportScreen";
import { createPageUrl } from "@/utils";

export default function VideoAnalysis() {
  const [stage, setStage] = useState("upload"); // upload | analyzing | report
  const [videoPreview, setVideoPreview] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleBack = () => {
    window.location.href = createPageUrl("FormCheck");
  };

  if (stage === "upload") {
    return (
      <VideoUploadScreen
        onVideoReady={(preview) => {
          setVideoPreview(preview);
          setStage("analyzing");
        }}
        onBack={handleBack}
      />
    );
  }

  if (stage === "analyzing") {
    return (
      <VideoAnalyzingScreen
        videoFile={videoPreview.file}
        onComplete={(result) => {
          setAnalysisResult(result);
          setStage("report");
        }}
        onBack={() => setStage("upload")}
      />
    );
  }

  if (stage === "report" && analysisResult) {
    return (
      <FormReportScreen
        analysisResult={analysisResult}
        onDone={handleBack}
        onBack={() => setStage("upload")}
      />
    );
  }

  return null;
}