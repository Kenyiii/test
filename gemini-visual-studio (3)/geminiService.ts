
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "./types";

export class GeminiService {
  private static getClient() {
    // Create a new instance right before making an API call to ensure it uses the latest API key.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  /**
   * Generates a new image from a prompt.
   * Uses gemini-3-pro-image-preview for Pro mode and gemini-2.5-flash-image for standard.
   */
  static async generateImage(prompt: string, aspectRatio: AspectRatio = '1:1', isPro: boolean = false): Promise<string> {
    const ai = this.getClient();
    // Guideline: Default task model is gemini-2.5-flash-image.
    // Upgrade to gemini-3-pro-image-preview if user requests high-quality (Pro mode).
    const model = isPro ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    
    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            // imageSize is only supported for gemini-3-pro-image-preview.
            ...(isPro ? { imageSize: '1K' as ImageSize } : {})
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          // Find the image part as per guideline.
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image data found in response");
    } catch (error: any) {
      // Guideline: If request fails with "Requested entity was not found", reset key selection.
      // We throw a specific error code that the view handles to trigger openSelectKey.
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("PRO_KEY_REQUIRED");
      }
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * Main processing method using nano banana (gemini-2.5-flash-image).
   * Supports both generation from scratch and editing existing images.
   */
  static async processImage(
    base64Image: string | null,
    prompt: string,
    aspectRatio: AspectRatio = '1:1'
  ): Promise<string> {
    const ai = this.getClient();
    // Guideline: Default task model for image editing is gemini-2.5-flash-image.
    const model = 'gemini-2.5-flash-image';
    
    const parts: any[] = [{ text: prompt }];
    
    if (base64Image) {
      const mimeType = base64Image.match(/data:(.*?);base64/)?.[1] || 'image/png';
      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");
      parts.unshift({ inlineData: { data: cleanBase64, mimeType } });
    }

    try {
      const response = await ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio
          }
        }
      });

      if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      throw new Error("No image data found in response");
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }

  /**
   * Analyze the carpet image type using a lightweight reasoning model.
   */
  static async analyzeImageType(base64Image: string): Promise<'PHOTO' | 'PATTERN' | 'SCENE'> {
    const ai = this.getClient();
    const mimeType = base64Image.match(/data:(.*?);base64/)?.[1] || 'image/png';
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType } },
          { text: "Analyze this image. Is it: 1) A physical carpet photo? 2) A digital pattern? 3) A scene with a carpet? Reply only 'PHOTO', 'PATTERN', or 'SCENE'." }
        ]
      }
    });

    const result = response.text?.trim().toUpperCase();
    if (result?.includes('SCENE')) return 'SCENE';
    if (result?.includes('PATTERN')) return 'PATTERN';
    return 'PHOTO';
  }
}