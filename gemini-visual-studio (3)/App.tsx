
import React, { useState, useEffect } from 'react';
import { AppView, GeneratedImage } from './types';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import GeneratorView from './views/GeneratorView';
import EditorView from './views/EditorView';
import GalleryView from './views/GalleryView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.GENERATE);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isProMode, setIsProMode] = useState(false);

  useEffect(() => {
    const checkProStatus = async () => {
      if (window.aistudio?.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsProMode(hasKey);
      }
    };
    checkProStatus();
  }, []);

  const addImageToHistory = (img: GeneratedImage) => {
    setHistory(prev => [img, ...prev]);
  };

  const handleOpenProKey = async () => {
    if (window.aistudio?.openSelectKey) {
      await window.aistudio.openSelectKey();
      setIsProMode(true);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Navbar onOpenProKey={handleOpenProKey} isProMode={isProMode} />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          currentView={currentView} 
          setView={setCurrentView} 
        />
        
        <main className="flex-1 relative overflow-y-auto bg-zinc-900/50">
          <div className="max-w-6xl mx-auto p-8">
            {currentView === AppView.GENERATE && (
              <GeneratorView onImageGenerated={addImageToHistory} isProMode={isProMode} />
            )}
            {currentView === AppView.EDIT && (
              <EditorView onImageGenerated={addImageToHistory} />
            )}
            {currentView === AppView.GALLERY && (
              <GalleryView history={history} />
            )}
          </div>
        </main>
      </div>
      
      <footer className="h-6 bg-zinc-950 border-t border-zinc-800 flex items-center px-4 justify-between text-[10px] text-zinc-500">
        <div className="flex gap-4">
          <span>GEMINI VISUAL STUDIO v1.0.0</span>
          <span>SYSTEM READY</span>
        </div>
        <div>
          {isProMode ? (
            <span className="text-emerald-500 font-medium">PRO ACCELERATION ACTIVE</span>
          ) : (
            <span>STANDARD MODE</span>
          )}
        </div>
      </footer>
    </div>
  );
};

export default App;
