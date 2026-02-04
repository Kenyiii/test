
import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize } from "./types";

const BASE64_IMAGE_REGEX = /data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/;

export class GeminiService {
  private static getClient() {
    // Create a new instance right before making an API call to ensure it uses the latest API key.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('MISSING_GEMINI_API_KEY');
    }
    const baseUrl = process.env.GEMINI_BASE_URL;
    const clientOptions: ConstructorParameters<typeof GoogleGenAI>[0] = { apiKey };
    if (baseUrl) {
      clientOptions.httpOptions = { baseUrl };
    }
    return new GoogleGenAI(clientOptions);
  }

  private static extractImageFromParts(parts?: any[]): string | null {
    if (!parts) return null;
    for (const part of parts) {
      if (part.inlineData?.data) {
        const mimeType = part.inlineData.mimeType || 'image/png';
        return `data:${mimeType};base64,${part.inlineData.data}`;
      }
      if (typeof part.text === 'string') {
        const match = part.text.match(BASE64_IMAGE_REGEX);
        if (match) {
          return match[0];
        }
      }
    }
    return null;
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
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio,
            // imageSize is only supported for gemini-3-pro-image-preview.
            ...(isPro ? { imageSize: '1K' as ImageSize } : {})
          }
        }
      });

      const imageData = GeminiService.extractImageFromParts(response.candidates?.[0]?.content?.parts);
      if (imageData) {
        return imageData;
      }
      throw new Error("No image data found in response");
    } catch (error: any) {
      // Guideline: If request fails with "Requested entity was not found", reset key selection.
      // We throw a specific error code that the view handles to trigger openSelectKey.
      if (error.message?.includes("Requested entity was not found")) {
        throw new Error("PRO_KEY_REQUIRED");
      }
      if (error.message === 'MISSING_GEMINI_API_KEY') {
        throw error;
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
          responseModalities: ['TEXT', 'IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio
          }
        }
      });

      const imageData = GeminiService.extractImageFromParts(response.candidates?.[0]?.content?.parts);
      if (imageData) {
        return imageData;
      }
      throw new Error("No image data found in response");
    } catch (error: any) {
      if (error.message !== 'MISSING_GEMINI_API_KEY') {
        console.error("Gemini API Error:", error);
      }
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
