/**
 * Technique Studio Module — Complete coaching environment
 * Exports all studio components and utilities
 */

export { default as TechniqueStudio } from './TechniqueStudio';
export { default as TechniqueVideoPlayer } from './TechniqueVideoPlayer';
export { default as TechniqueFrameControls } from './TechniqueFrameControls';
export { default as TechniqueToolbar } from './TechniqueToolbar';
export { default as TechniqueNotesPanel } from './TechniqueNotesPanel';
export { default as TechniqueExportPanel } from './TechniqueExportPanel';

// Hooks
export { useFrameSync } from './useFrameSync';
export { useAnnotationEditor, TOOLS, ANNOTATION_TYPES, renderAnnotation } from './useAnnotationEditor';

// Normalizers and renderers
export { normalizeToTechniqueSession, createEmptyTechniqueSession, updateTechniqueSession, TECHNIQUE_SESSION_VERSION } from './techniqueSessionNormalizer';
export { TechniqueExportRenderer, exportSessionAsJSON, exportSessionAsPackage, prepareMP4RenderJob } from './techniqueExportRenderer';