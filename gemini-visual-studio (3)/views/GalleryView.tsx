
import React from 'react';
import { GeneratedImage } from '../types';

interface GalleryViewProps {
  history: GeneratedImage[];
}

const GalleryView: React.FC<GalleryViewProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-zinc-700">
           <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-zinc-300">Your gallery is empty</h3>
          <p className="text-zinc-600 text-sm">Start generating amazing images to see them here.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Visual Library</h1>
          <p className="text-zinc-500 text-sm">Review and manage your past generations.</p>
        </div>
        <p className="text-xs font-medium text-zinc-600">{history.length} ITEMS SAVED</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {history.map((item) => (
          <div 
            key={item.id} 
            className="group relative bg-zinc-950 rounded-xl overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-all shadow-lg hover:shadow-indigo-500/10"
          >
            <div className="aspect-square w-full relative overflow-hidden">
              <img 
                src={item.url} 
                alt={item.prompt} 
                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-xs text-zinc-300 line-clamp-2 mb-2 italic">"{item.prompt}"</p>
                <div className="flex gap-2">
                   <button 
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = item.url;
                      link.download = `gemini-${item.id}.png`;
                      link.click();
                    }}
                    className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded text-[10px] font-bold uppercase transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between border-t border-zinc-800/50">
              <span className="text-[9px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded uppercase tracking-widest">
                {item.model.split('-').pop()}
              </span>
              <span className="text-[9px] text-zinc-600">
                {new Date(item.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryView;
