
import React, { useState, useRef } from 'react';
import { GeminiService } from '../geminiService';
import { GeneratedImage, AspectRatio } from '../types';

interface EditorViewProps {
  onImageGenerated: (img: GeneratedImage) => void;
}

type Step = 'IDLE' | 'PROCESSING' | 'COMPLETED';
type TextureType = '水晶绒点塑底' | '天鹅绒点塑底' | '硅藻泥';

const EditorView: React.FC<EditorViewProps> = ({ onImageGenerated }) => {
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>('IDLE');
  const [pipelineProgress, setPipelineProgress] = useState(0);
  
  const [reloadingImages, setReloadingImages] = useState<Set<string>>(new Set());
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [texture, setTexture] = useState<TextureType>('水晶绒点塑底');
  const [scene, setScene] = useState('');
  const [style, setStyle] = useState('');
  const [width, setWidth] = useState('750');
  const [height, setHeight] = useState('1000');
  
  const [results, setResults] = useState<{ [key: string]: string | null }>({
    '原图': null,
    '主图_01': null,
    '主图_02': null,
    '主图_03': null,
    '主图_04': null,
    '主图_05': null,
    '主图_06': null,
  });

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Safe check for result to prevent unknown type issues
        const result = event.target?.result;
        if (typeof result === 'string') {
          setSourceImage(result);
        }
        setResults({ 
          '原图': null, '主图_01': null, '主图_02': null, 
          '主图_03': null, '主图_04': null, '主图_05': null, '主图_06': null 
        });
        setCurrentStep('IDLE');
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const getClosestAspectRatio = (w: number, h: number): AspectRatio => {
    const ratio = w / h;
    const options: { val: number; label: AspectRatio }[] = [
      { val: 1, label: '1:1' }, { val: 3 / 4, label: '3:4' }, { val: 4 / 3, label: '4:3' },
      { val: 9 / 16, label: '9:16' }, { val: 16 / 9, label: '16:9' },
    ];
    // Fix: Providing options[0] as the initial value to help TypeScript infer the correct type from reduce
    const closest = options.reduce((prev, curr) => 
      Math.abs(curr.val - ratio) < Math.abs(prev.val - ratio) ? curr : prev
    , options[0]);
    return closest.label;
  };

  const getPromptForType = (type: string, targetW: number, targetH: number): string => {
    const textureNote = `地毯材质为${texture}。`;
    const sceneNote = scene ? `环境场景：${scene}。` : "环境场景：简约现代室内空间。";
    const styleNote = style ? `视觉风格：${style}。` : "视觉风格：清新、高质感电商风格。";
    
    // 恢复更灵活的提示词描述，注重美感和商业效果
    const baseRequirement = `要求：严格保持地毯图案与上传图一致。${textureNote} ${sceneNote} ${styleNote}`;

    switch (type) {
      case '原图':
        return `【平铺展示】完美还原地毯图案，去除多余环境。地毯平铺在纯白色背景正中央，垂直俯视。`;
      case '主图_06':
        return `【单品展示图】${baseRequirement} 地毯展示出真实的质感细节，光影自然，背景整洁，无多余装饰。`;
      case '主图_05':
        if (texture === '水晶绒点塑底') {
          return `【材质细节图】展示地毯局部特写，一角微微翘起，露出背面的白色波点点塑防滑底，质感细腻。`;
        } else if (texture === '天鹅绒点塑底') {
          return `【材质细节图】展示地毯局部特写，地毯卷起一部分，展示黑底白波点的背面，手感厚实。`;
        } else {
          return `【材质细节图】展示硅藻泥材质地毯的边缘和防滑底特写，无锁边切割感，背面有黑色防滑纹理。`;
        }
      case '主图_01':
        return `【电商主图海报】${baseRequirement} 画面呈高角度俯视。背景空白处添加俄语设计文字：顶部“КОВЕР”及“БЕЗВОРСОВЫЙ”；下方标签含“РАЗЛИЧНЫЕ РАЗМЕРЫ”。文字布局优雅，不遮挡地毯主体。`;
      case '主图_02':
        return `【斜侧方透视图】${baseRequirement} 地毯以斜侧方视角铺设。背景可搭配适量的极简家具作为装饰，突出居家氛围。`;
      case '主图_03':
        return `【生活化氛围图】${baseRequirement} 采用低角度视角。展示地毯在${scene || '温馨室内'}环境中的全景，营造舒适的居家感。`;
      case '主图_04':
        return `【局部特写展示】${baseRequirement} 焦点在地毯局部，展示地毯图案的精细度和场景感。背景可模糊。`;
      default:
        return "";
    }
  };

  const handleRedo = async (name: string) => {
    if (!sourceImage || !results['原图'] || !results['主图_06']) return;
    
    setReloadingImages(prev => new Set(prev).add(name));
    setError(null);

    const targetW = parseInt(width) || 750;
    const targetH = parseInt(height) || 1000;
    const apiRatio = getClosestAspectRatio(targetW, targetH);
    const prompt = getPromptForType(name, targetW, targetH);
    
    const baseImg = (name === '原图' || name === '主图_06' || name === '主图_05') ? (name === '原图' ? sourceImage : results['原图']) : results['主图_06'];

    try {
      const newUrl = await GeminiService.processImage(baseImg, prompt, name === '原图' || name === '主图_05' ? '1:1' : apiRatio);
      setResults(prev => ({ ...prev, [name]: newUrl }));
    } catch (err: any) {
      console.error(err);
      setError(`重做 ${name} 失败。`);
    } finally {
      setReloadingImages(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const runFullPipeline = async () => {
    if (!sourceImage) return;
    setError(null);
    setCurrentStep('PROCESSING');
    setPipelineProgress(0);

    const targetW = parseInt(width) || 750;
    const targetH = parseInt(height) || 1000;
    // Line 178 fix: using typed helper to derive apiRatio to avoid inference errors
    const apiRatio = getClosestAspectRatio(targetW, targetH);
    
    try {
      setPipelineProgress(1);
      const originalUrl = await GeminiService.processImage(sourceImage, getPromptForType('原图', targetW, targetH), '1:1');
      setResults(prev => ({ ...prev, '原图': originalUrl }));

      setPipelineProgress(2);
      const main06Url = await GeminiService.processImage(originalUrl, getPromptForType('主图_06', targetW, targetH), apiRatio);
      setResults(prev => ({ ...prev, '主图_06': main06Url }));

      setPipelineProgress(3);
      const main05Url = await GeminiService.processImage(originalUrl, getPromptForType('主图_05', targetW, targetH), '1:1');
      setResults(prev => ({ ...prev, '主图_05': main05Url }));

      setPipelineProgress(4);
      const [s1, s2, s3, s4] = await Promise.all([
        GeminiService.processImage(main06Url, getPromptForType('主图_01', targetW, targetH), apiRatio),
        GeminiService.processImage(main06Url, getPromptForType('主图_02', targetW, targetH), apiRatio),
        GeminiService.processImage(main06Url, getPromptForType('主图_03', targetW, targetH), apiRatio),
        GeminiService.processImage(main06Url, getPromptForType('主图_04', targetW, targetH), apiRatio)
      ]);

      setResults(prev => ({
        ...prev,
        '主图_01': s1, '主图_02': s2, '主图_03': s3, '主图_04': s4,
      }));

      setCurrentStep('COMPLETED');
    } catch (err: any) {
      console.error(err);
      setError('处理失败，请检查 API 或网络。');
      setCurrentStep('IDLE');
    }
  };

  const downloadAll = () => {
    Object.entries(results).forEach(([name, url]) => {
      if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `${name}.jpg`;
        link.click();
      }
    });
  };

  return (
    <div className="space-y-8 pb-40 relative">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full inline-block" />
            STUDIO <span className="text-indigo-500 font-light">EDITOR</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">一键生成原图 + 全套电商展示素材。</p>
        </div>
        {currentStep === 'COMPLETED' && (
          <button onClick={downloadAll} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold shadow-xl transition-all">
            下载全套素材
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-1 space-y-6">
          <section 
            onClick={() => currentStep !== 'PROCESSING' && fileInputRef.current?.click()}
            className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer ${
              sourceImage ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-900/20 border-zinc-800 hover:border-zinc-700'
            }`}
          >
            {sourceImage ? <img src={sourceImage} className="w-full h-full object-contain" /> : (
              <div className="text-center opacity-40">
                <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth={2} /></svg>
                <p className="text-xs uppercase font-bold tracking-widest">上传图案</p>
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          </section>

          <div className="bg-zinc-900/40 p-5 rounded-2xl border border-zinc-800/50 space-y-4 backdrop-blur-md">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">地毯材质</label>
              <div className="grid grid-cols-1 gap-1.5">
                {(['水晶绒点塑底', '天鹅绒点塑底', '硅藻泥'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTexture(t)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-medium text-left border transition-all ${
                      texture === t ? 'bg-white text-zinc-950 border-white' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-zinc-800/50">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">场景设定</label>
                <input 
                  type="text" 
                  value={scene} 
                  onChange={(e) => setScene(e.target.value)} 
                  placeholder="例如：现代客厅、儿童房" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">风格设定</label>
                <input 
                  type="text" 
                  value={style} 
                  onChange={(e) => setStyle(e.target.value)} 
                  placeholder="例如：极简风、复古风" 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">输出尺寸</label>
                <div className="flex items-center gap-2">
                  <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white" />
                  <span className="text-zinc-700">×</span>
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white" />
                </div>
              </div>
            </div>

            <button
              onClick={runFullPipeline}
              disabled={currentStep === 'PROCESSING' || !sourceImage}
              className={`w-full py-4 rounded-xl font-black transition-all ${
                currentStep === 'PROCESSING' || !sourceImage ? 'bg-zinc-800 text-zinc-600' : 'bg-indigo-600 text-white hover:bg-indigo-500 active:scale-95'
              }`}
            >
              {currentStep === 'PROCESSING' ? '处理中...' : '开始批量生成'}
            </button>
            {error && <p className="text-[10px] text-red-500 text-center">{error}</p>}
          </div>
        </div>

        <div className="xl:col-span-3">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(results).map(([name, url]) => (
              <div key={name} className="space-y-2 group">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{name}</span>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {url && !reloadingImages.has(name) && (
                      <>
                        <button onClick={() => setPreviewUrl(url)} className="text-[9px] font-bold text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded transition-colors">预览</button>
                        <button onClick={() => handleRedo(name)} className="text-[9px] font-bold text-zinc-400 hover:text-indigo-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded transition-colors">重做</button>
                      </>
                    )}
                  </div>
                </div>
                <div className="aspect-[4/3] bg-zinc-950 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden relative shadow-lg">
                  {url && !reloadingImages.has(name) ? (
                    <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="text-zinc-800 flex flex-col items-center gap-2">
                      {(currentStep === 'PROCESSING' || reloadingImages.has(name)) ? (
                        <>
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] font-bold text-zinc-700">渲染中</span>
                        </>
                      ) : (
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-8" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
            <img src={previewUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" />
            <button className="absolute top-0 right-0 p-4 text-white/50 hover:text-white" onClick={() => setPreviewUrl(null)}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorView;