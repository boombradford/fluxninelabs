import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { TerpeneUniverse } from './components/TerpeneUniverse';
import { TerpeneDetail } from './components/TerpeneDetail';
import StrainExplorer from './components/StrainExplorer';
import type { Terpene } from './types';

function App() {
  const [selectedTerpene, setSelectedTerpene] = useState<Terpene | null>(null);
  const [view, setView] = useState<'universe' | 'detail' | 'strains'>('universe');
  const [filterTerpeneId, setFilterTerpeneId] = useState<string | undefined>(undefined);

  // Handle terpene selection from Universe
  const handleTerpeneSelect = (terpene: Terpene) => {
    setSelectedTerpene(terpene);
    setView('detail');
  };

  // Handle back navigation
  const handleBack = () => {
    setView('universe');
    setSelectedTerpene(null);
    setFilterTerpeneId(undefined);
  };

  // Navigate to Strain Explorer (optionally filtered)
  const handleExploreStrains = (terpeneId?: string) => {
    setFilterTerpeneId(terpeneId);
    setView('strains');
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-[var(--herbal-primary)] selection:text-white">
      <AnimatePresence mode="wait">
        {view === 'universe' && (
          <TerpeneUniverse
            key="universe"
            onTerpeneSelect={handleTerpeneSelect}
            onExploreStrains={() => handleExploreStrains()}
          />
        )}

        {view === 'detail' && selectedTerpene && (
          <TerpeneDetail
            key="detail"
            terpene={selectedTerpene}
            onBack={handleBack}
            onFindStrains={() => handleExploreStrains(selectedTerpene.id)}
          />
        )}

        {view === 'strains' && (
          <StrainExplorer
            key="strains"
            onBack={handleBack}
            initialFilterTerpeneId={filterTerpeneId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

