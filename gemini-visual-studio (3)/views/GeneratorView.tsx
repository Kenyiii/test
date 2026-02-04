
import React, { useState } from 'react';
import { GeminiService } from '../geminiService';
import { AspectRatio, GeneratedImage } from '../types';

interface GeneratorViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
  isProMode: boolean;
}

const GeneratorView: React.FC<GeneratorViewProps> = ({ onImageGenerated, isProMode }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [usePro, setUsePro] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const imageUrl = await GeminiService.generateImage(prompt, aspectRatio, usePro && isProMode);
      setResult(imageUrl);
      onImageGenerated({
        id: Date.now().toString(),
        url: imageUrl,
        prompt: prompt,
        timestamp: Date.now(),
        model: usePro && isProMode ? 'gemini-3-pro' : 'gemini-2.5-flash'
      });
    } catch (err: any) {
      console.error(err);
      if (err.message === 'PRO_KEY_REQUIRED') {
        setError('Pro Mode requires a configured paid API key. Opening key selection dialog...');
        // SDK Guideline: Reset key selection state and prompt the user to select a key again via openSelectKey().
        if (window.aistudio?.openSelectKey) {
          await window.aistudio.openSelectKey();
        }
      } else {
        setError('Failed to generate image. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const ratios: AspectRatio[] = ['1:1', '16:9', '9:16', '4:3', '3:4'];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <h1 className="text-3xl font-bold mb-2">Create Masterpiece</h1>
        <p className="text-zinc-500 text-sm">Describe your vision and let Gemini bring it to life.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="space-y-4">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Your Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A futuristic cybernetic garden at sunset, neon flora, cinematic lighting, 8k..."
              className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest">Aspect Ratio</label>
            <div className="grid grid-cols-5 gap-2">
              {ratios.map((r) => (
                <button
                  key={r}
                  onClick={() => setAspectRatio(r)}
                  className={`py-2 rounded-lg text-xs font-medium border transition-all ${
                    aspectRatio === r
                      ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Ultra Quality (Pro)</label>
              <button 
                onClick={() => setUsePro(!usePro)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${usePro ? 'bg-indigo-600' : 'bg-zinc-800'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${usePro ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {!isProMode && usePro && (
              <p className="text-[10px] text-amber-500 leading-tight">
                Warning: Pro mode requires a configured paid API key.
              </p>
            )}
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              loading || !prompt.trim()
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-[0.98]'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate Vision
              </>
            )}
          </button>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="aspect-square w-full rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-2xl group">
            {result ? (
              <>
                <img src={result} alt="Generated result" className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button onClick={() => {
                    const link = document.createElement('a');
                    link.href = result;
                    link.download = 'gemini-creation.png';
                    link.click();
                  }} className="p-3 bg-white text-zinc-950 rounded-full hover:scale-110 transition-transform">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-zinc-600 text-sm italic">Waiting for your instructions...</p>
              </div>
            )}
            
            {loading && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-white">Gemini is thinking</p>
                    <p className="text-xs text-zinc-500">Synthesizing pixels from latent space...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratorView;
