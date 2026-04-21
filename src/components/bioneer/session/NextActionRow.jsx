import React, { useState } from "react";
import { COLORS, FONT } from "../ui/DesignTokens";
import { base44 } from "@/api/base44Client";

export default function NextActionRow({ sessionData, navigate }) {
  const [saveLabel, setSaveLabel] = useState("SAVE MOVE");

  const handleTrainAgain = () => {
    navigate("/FormCheck");
  };

  const handleReviewForm = () => {
    navigate("/TechniqueInsights", { state: { sessionData } });
  };

  const handleSaveMove = async () => {
    const movId = sessionData.movement_id || sessionData.exercise_id;
    if (!movId) return;
    try {
      const profiles = await base44.entities.UserProfile.list();
      const profile = profiles?.[0];
      if (!profile) return;
      const saved = Array.isArray(profile.saved_movements) ? [...profile.saved_movements] : [];
      if (saved.includes(movId)) {
        setSaveLabel("SAVED ✓");
        setTimeout(() => setSaveLabel("SAVE MOVE"), 1500);
        return;
      }
      saved.push(movId);
      await base44.entities.UserProfile.update(profile.id, { saved_movements: saved });
      setSaveLabel("SAVED ✓");
      setTimeout(() => setSaveLabel("SAVE MOVE"), 1500);
    } catch {
      setSaveLabel("ERROR");
      setTimeout(() => setSaveLabel("SAVE MOVE"), 1500);
    }
  };

  const cardStyle = {
    flex: 1,
    background: COLORS.surface,
    border: `1px solid ${COLORS.borderLight}`,
    borderRadius: 8,
    padding: "12px 8px",
    textAlign: "center",
    cursor: "pointer",
  };

  const labelStyle = {
    fontSize: 8,
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    fontWeight: 700,
    color: COLORS.gold,
    fontFamily: FONT.mono,
  };

  return (
    <div style={{ display: "flex", gap: 8, width: "100%" }}>
      <button style={cardStyle} onClick={handleTrainAgain}>
        <span style={labelStyle}>TRAIN AGAIN</span>
      </button>
      <button style={cardStyle} onClick={handleReviewForm}>
        <span style={labelStyle}>REVIEW FORM</span>
      </button>
      <button style={cardStyle} onClick={handleSaveMove}>
        <span style={labelStyle}>{saveLabel}</span>
      </button>
    </div>
  );
}