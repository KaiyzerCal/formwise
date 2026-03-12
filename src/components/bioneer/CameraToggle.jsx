/**
 * CameraToggle — Reusable camera facing mode toggle button
 * Switches between front ("user") and back ("environment") cameras
 * Displays current selection and handles loading state
 */
import React from 'react';
import { Smartphone, Smartphone as PhoneFront } from 'lucide-react';

export default function CameraToggle({
  cameraFacing,
  onToggle,
  isLoading = false,
  className = '',
  showLabel = false,
}) {
  const isFront = cameraFacing === 'user';

  return (
    <button
      onClick={onToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${className}`}
      style={{
        opacity: isLoading ? 0.5 : 1,
        cursor: isLoading ? 'not-allowed' : 'pointer',
      }}
      title={isFront ? 'Switch to back camera' : 'Switch to front camera'}
    >
      {isFront ? (
        <PhoneFront size={18} />
      ) : (
        <Smartphone size={18} />
      )}
      {showLabel && (
        <span className="text-xs font-medium">
          {isFront ? 'Front' : 'Back'}
        </span>
      )}
    </button>
  );
}