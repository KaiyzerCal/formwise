/**
 * CameraToggleButton — Switch between front/back camera
 * Shows loading state during switch, disabled when unavailable
 */

import { Smartphone, Loader2 } from 'lucide-react';

export default function CameraToggleButton({ cameraFacing, isSwitching, onSwitch, disabled = false }) {
  const facingLabel = cameraFacing === 'user' ? 'SELFIE' : 'BACK';

  return (
    <button
      onClick={onSwitch}
      disabled={disabled || isSwitching}
      className="p-2.5 rounded-full border transition-all"
      style={{
        background: 'rgba(0,0,0,0.5)',
        borderColor: 'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      title={disabled ? 'Camera switching not available' : `Switch to ${cameraFacing === 'user' ? 'back' : 'front'} camera`}
    >
      {isSwitching ? (
        <Loader2 className="w-4 h-4 text-white animate-spin" />
      ) : (
        <Smartphone className="w-4 h-4 text-white" />
      )}
    </button>
  );
}