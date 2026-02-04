
export enum AppView {
  GENERATE = 'GENERATE',
  EDIT = 'EDIT',
  GALLERY = 'GALLERY'
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
  model: string;
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
export type ImageSize = '1K' | '2K' | '4K';

declare global {
  /**
   * Define AIStudio interface globally to match platform-level declarations
   * and resolve type mismatch errors in window augmentation.
   */
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  /**
   * Augmenting the Window interface to include aistudio.
   */
  interface Window {
    // Removed 'readonly' modifier to ensure consistency with platform-level global declarations and fix modifier mismatch error.
    aistudio: AIStudio;
  }
}