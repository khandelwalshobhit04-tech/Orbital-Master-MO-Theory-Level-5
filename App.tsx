
import React, { useState, useEffect, useCallback } from 'react';
import { MOLECULES, generateOrbitals } from './constants';
import { MoleculeDef, OrbitalData, SimulationState } from './types';
import { MODiagram } from './components/MODiagram';
import { getConfigurationHint } from './services/geminiService';
import { audioService } from './services/audioService';
import { 
    BeakerIcon, 
    BoltIcon, 
    ArrowPathIcon,
    ArrowUturnLeftIcon,
    CheckCircleIcon,
    LightBulbIcon,
    XCircleIcon,
    InformationCircleIcon,
    XMarkIcon,
    HomeIcon
} from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [currentMolecule, setCurrentMolecule] = useState<MoleculeDef>(MOLECULES[0]);
  const [orbitals, setOrbitals] = useState<OrbitalData[]>(generateOrbitals(MOLECULES[0].ordering));
  const [history, setHistory] = useState<OrbitalData[][]>([]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isLoadingHint, setIsLoadingHint] = useState(false);

  // Derived Stats
  const electronsPlaced = orbitals.reduce((acc, o) => acc + o.electrons, 0);
  const bondingElectrons = orbitals.filter(o => o.type === 'bonding').reduce((acc, o) => acc + o.electrons, 0);
  const antibondingElectrons = orbitals.filter(o => o.type === 'antibonding').reduce((acc, o) => acc + o.electrons, 0);
  const bondOrder = Math.max(0, (bondingElectrons - antibondingElectrons) / 2);
  
  const unpairedElectrons = orbitals.reduce((acc, o) => {
      if (o.electrons === 1) return acc + 1;
      return acc;
  }, 0);

  const isParamagnetic = unpairedElectrons > 0;

  // Stability Visualization Logic
  const getStabilityInfo = (bo: number) => {
      if (bo <= 0) return { 
          label: 'Unstable / Does Not Exist', 
          color: 'text-neon-red', 
          gradient: 'from-red-900 to-neon-red',
          borderColor: 'border-neon-red/50',
          bgGlow: 'bg-neon-red/5',
          shadow: 'shadow-neon-red/20'
      };
      if (bo <= 0.5) return { 
          label: 'Highly Unstable', 
          color: 'text-orange-500', 
          gradient: 'from-orange-900 to-orange-600',
          borderColor: 'border-orange-500/50',
          bgGlow: 'bg-orange-500/5',
          shadow: 'shadow-orange-500/20'
      };
      if (bo <= 1.5) return { 
          label: 'Weak Stability', 
          color: 'text-yellow-400', 
          gradient: 'from-yellow-900 to-yellow-500',
          borderColor: 'border-yellow-400/50',
          bgGlow: 'bg-yellow-400/5',
          shadow: 'shadow-yellow-400/20'
      };
      if (bo < 2.5) return { 
          label: 'Stable', 
          color: 'text-neon-green', 
          gradient: 'from-green-900 to-neon-green',
          borderColor: 'border-neon-green/50',
          bgGlow: 'bg-neon-green/5',
          shadow: 'shadow-neon-green/20'
      };
      return { 
          label: 'Highly Stable', 
          color: 'text-neon-blue', 
          gradient: 'from-blue-900 via-cyan-500 to-neon-blue',
          borderColor: 'border-neon-blue/50',
          bgGlow: 'bg-neon-blue/5',
          shadow: 'shadow-neon-blue/20'
      };
  };
  const stability = getStabilityInfo(bondOrder);

  // Reset orbitals when molecule changes
  useEffect(() => {
    setOrbitals(generateOrbitals(currentMolecule.ordering));
    setHistory([]);
    setFeedback(null);
    audioService.playSwitch();
  }, [currentMolecule]);

  const handleUndo = () => {
    setHistory(prev => {
      if (prev.length === 0) return prev;
      const newHistory = [...prev];
      const previousState = newHistory.pop();
      if (previousState) {
          setOrbitals(previousState);
          setFeedback(null);
          audioService.playUndo();
      }
      return newHistory;
    });
  };

  const handleOrbitalClick = (id: string) => {
      const orbIndex = orbitals.findIndex(o => o.id === id);
      if (orbIndex === -1) return;

      const orb = orbitals[orbIndex];
      let newOrbitals = [...orbitals];
      
      const canAdd = electronsPlaced < currentMolecule.totalElectrons;
      
      // Cycle Logic: 0 -> 1 -> 2 -> 1 -> 0
      if (orb.electrons < orb.capacity) {
         // Current state allows adding (0 or 1)
         if (canAdd) {
             // We have budget, so Add
             newOrbitals[orbIndex] = { ...orb, electrons: orb.electrons + 1 };
             setHistory(prev => [...prev, orbitals]);
             setOrbitals(newOrbitals);
             setFeedback(null);
             audioService.playOrbitalAdd();
         } else {
             // No budget! 
             if (orb.electrons > 0) {
                 newOrbitals[orbIndex] = { ...orb, electrons: orb.electrons - 1 };
                 setHistory(prev => [...prev, orbitals]);
                 setOrbitals(newOrbitals);
                 setFeedback({ 
                    type: 'error', 
                    message: `Limit reached (${currentMolecule.totalElectrons}e⁻)! Removing electron instead.` 
                 });
                 audioService.playLimitReached();
             } else {
                 setFeedback({ 
                    type: 'error', 
                    message: `All ${currentMolecule.totalElectrons} electrons are already placed. Remove some first.` 
                 });
                 audioService.playError();
             }
         }
      } else {
         // At capacity (2), so Remove (-> 1)
         newOrbitals[orbIndex] = { ...orb, electrons: orb.electrons - 1 };
         setHistory(prev => [...prev, orbitals]);
         setOrbitals(newOrbitals);
         setFeedback(null);
         audioService.playOrbitalRemove();
      }
  };

  // Helper to get the correct configuration for the current molecule
  const getCorrectConfiguration = useCallback(() => {
      let remaining = currentMolecule.totalElectrons;
      const newOrbitals = generateOrbitals(currentMolecule.ordering);
      
      const sortedOrbitals = [...newOrbitals].sort((a, b) => a.energyLevel - b.energyLevel);
      
      const energyGroups = new Map<number, OrbitalData[]>();
      sortedOrbitals.forEach(o => {
          if (!energyGroups.has(o.energyLevel)) energyGroups.set(o.energyLevel, []);
          energyGroups.get(o.energyLevel)?.push(o);
      });

      const energies = Array.from(energyGroups.keys()).sort((a, b) => a - b);

      for (const energy of energies) {
          const group = energyGroups.get(energy)!;
          // Fill 1 electron in each first (Hund's Rule)
          for (const orb of group) {
              if (remaining > 0) {
                  const realOrb = newOrbitals.find(o => o.id === orb.id)!;
                  realOrb.electrons = 1;
                  remaining--;
              }
          }
          // Pair up
          for (const orb of group) {
              if (remaining > 0) {
                   const realOrb = newOrbitals.find(o => o.id === orb.id)!;
                   if (realOrb.electrons === 1) {
                       realOrb.electrons = 2;
                       remaining--;
                   }
              }
          }
      }
      return newOrbitals;
  }, [currentMolecule]);

  const handleAutoFill = () => {
      setHistory(prev => [...prev, orbitals]);
      setOrbitals(getCorrectConfiguration());
      setFeedback(null);
      audioService.playSuccess(); // Satisfying fill sound
  };

  const handleCheck = () => {
      const correctConfig = getCorrectConfiguration();
      const currentMap = new Map(orbitals.map(o => [o.id, o.electrons]));
      
      let isCorrect = true;
      for (const target of correctConfig) {
          if (currentMap.get(target.id) !== target.electrons) {
              isCorrect = false;
              break;
          }
      }

      if (isCorrect) {
          setFeedback({ 
              type: 'success', 
              message: `Perfect! The ground state configuration for ${currentMolecule.formula} is correct. Bond Order: ${bondOrder}.` 
          });
          audioService.playSuccess();
      } else {
          audioService.playError();
          if (electronsPlaced !== currentMolecule.totalElectrons) {
               setFeedback({ 
                   type: 'error', 
                   message: `Incorrect total electrons. You have placed ${electronsPlaced}, but ${currentMolecule.formula} has ${currentMolecule.totalElectrons}.` 
               });
          } else {
               setFeedback({ 
                   type: 'error', 
                   message: "Electron configuration is incorrect. Check energy levels (Aufbau) and electron pairing (Hund's Rule)." 
               });
          }
      }
  };

  const handleHint = async () => {
      audioService.playOrbitalAdd(); // Subtle click for hint request
      setIsLoadingHint(true);
      const state: SimulationState = {
          molecule: currentMolecule,
          orbitals,
          isStable: bondOrder > 0,
          bondOrder,
          unpairedElectrons
      };
      
      const hintText = await getConfigurationHint(state);
      setFeedback({ type: 'info', message: hintText });
      setIsLoadingHint(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#050510] text-white font-sans relative">
      
      {/* Background Texture - Scientific Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ 
               backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)', 
               backgroundSize: '40px 40px' 
           }}>
      </div>

      {/* Header */}
      <header className="bg-dark-900/60 border-b border-white/10 p-4 backdrop-blur-md flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neon-blue/20 rounded-lg flex items-center justify-center border border-neon-blue/50 shadow-[0_0_15px_rgba(0,243,255,0.3)]">
                <BeakerIcon className="w-6 h-6 text-neon-blue" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-blue to-purple-400 filter drop-shadow-[0_0_2px_rgba(0,243,255,0.5)]">
                    Orbital Master
                </h1>
                <p className="text-xs text-gray-400">Level 5: Molecular Orbital Theory</p>
            </div>
        </div>

        <div className="flex gap-2">
            <a 
                href="https://ai.studio/apps/drive/1hh2BRHWm0KB4Wej4z3tSpDYygw3-LI5k?fullscreenApplet=true"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => audioService.playSwitch()}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white/5 hover:bg-white/10 text-white flex items-center gap-2 transition-all border border-white/5 hover:border-white/20 hover:text-neon-blue hover:shadow-[0_0_10px_rgba(0,243,255,0.2)]"
            >
                <HomeIcon className="w-4 h-4" />
                Back to Home
            </a>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Sidebar Controls */}
          <div className="w-80 bg-dark-900/50 border-r border-white/10 p-6 flex flex-col gap-6 overflow-y-auto z-10 custom-scrollbar backdrop-blur-sm">
              
              {/* Molecule Selector */}
              <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 block">Select Species</label>
                  <div className="grid grid-cols-3 gap-2">
                      {MOLECULES.map(mol => (
                          <button
                              key={mol.id}
                              onClick={() => setCurrentMolecule(mol)}
                              className={`
                                p-2 rounded-lg border text-sm font-bold transition-all relative overflow-hidden group
                                ${currentMolecule.id === mol.id 
                                    ? 'border-neon-blue bg-neon-blue/10 text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.2)]' 
                                    : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white hover:bg-white/5'
                                }
                              `}
                          >
                              <span className="relative z-10">{mol.formula}</span>
                              {currentMolecule.id === mol.id && <div className="absolute inset-0 bg-neon-blue/5 animate-pulse-fast"></div>}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Stats Panel */}
              <div className="bg-black/30 rounded-xl p-4 space-y-4 border border-white/10 shadow-inner">
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Total e⁻</span>
                      <span className="text-xl font-mono text-white/80">{currentMolecule.totalElectrons}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Placed</span>
                      <span className={`text-xl font-mono transition-colors duration-300 ${electronsPlaced === currentMolecule.totalElectrons ? 'text-neon-green drop-shadow-[0_0_5px_rgba(10,255,0,0.5)]' : 'text-neon-yellow'}`}>
                          {electronsPlaced}
                      </span>
                  </div>
                  <div className="h-px bg-white/10" />
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Bond Order</span>
                      <span className="text-2xl font-bold text-white tabular-nums">{bondOrder}</span>
                  </div>
                  <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Property</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded transition-colors ${isParamagnetic ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/20' : 'bg-gray-800 text-gray-400 border border-gray-700'}`}>
                          {isParamagnetic ? 'Paramagnetic' : 'Diamagnetic'}
                      </span>
                  </div>
              </div>
              
               {/* Enhanced Stability Meter V3 */}
              <div className={`rounded-2xl p-5 border backdrop-blur-xl relative overflow-hidden transition-all duration-500 ${stability.borderColor} ${stability.bgGlow} ${stability.shadow}`}>
                  {/* Decorative background glow */}
                  <div className={`absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br ${stability.gradient} opacity-20 blur-3xl rounded-full pointer-events-none transition-opacity duration-700`}></div>

                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                          <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Stability Analysis</h3>
                          <div className={`text-sm font-bold flex items-center gap-2 ${stability.color} transition-colors duration-300`}>
                              {stability.label}
                          </div>
                      </div>
                      <div className="text-right">
                           <div className="text-4xl font-black text-white leading-none tracking-tighter tabular-nums">{bondOrder}</div>
                           <div className="text-[10px] text-gray-500 font-mono mt-1">BOND ORDER</div>
                      </div>
                  </div>

                  {/* Equation Visualization */}
                  <div className="flex items-center justify-center gap-2 text-sm font-mono text-gray-400 mb-8 bg-black/40 py-3 rounded-xl border border-white/5 relative z-10 shadow-inner">
                      <span className="opacity-40 select-none">½</span>
                      <span className="opacity-40 select-none">(</span>
                      
                      <div className="flex flex-col items-center group cursor-help">
                        <span className="text-neon-green font-bold text-lg leading-none filter drop-shadow-[0_0_3px_rgba(10,255,0,0.5)]">{bondingElectrons}</span>
                        <span className="text-[8px] uppercase tracking-wide opacity-50 group-hover:opacity-100 transition-opacity text-neon-green">Bonding</span>
                      </div>
                      
                      <span className="font-bold text-white opacity-60 mx-1">-</span>
                      
                      <div className="flex flex-col items-center group cursor-help">
                        <span className="text-neon-red font-bold text-lg leading-none filter drop-shadow-[0_0_3px_rgba(255,0,60,0.5)]">{antibondingElectrons}</span>
                        <span className="text-[8px] uppercase tracking-wide opacity-50 group-hover:opacity-100 transition-opacity text-neon-red">Anti-B</span>
                      </div>
                      
                      <span className="opacity-40 select-none">)</span>
                  </div>
                  
                  {/* Meter Track - Clean Design */}
                  <div className="relative z-10 mx-1 mb-2">
                       {/* Track Background */}
                       <div className="h-2 bg-dark-900 rounded-full border border-white/10 overflow-hidden relative shadow-inner">
                           {/* Gradient Fill */}
                           <div 
                                className={`h-full transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] bg-gradient-to-r ${stability.gradient}`}
                                style={{ width: `${Math.min((bondOrder / 3) * 100, 100)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/20 animate-shimmer"></div>
                            </div>
                       </div>

                       {/* Ticks */}
                       <div className="absolute top-0 left-0 w-full h-full pointer-events-none -mt-1">
                          {[0, 1, 2, 3].map(tick => (
                              <div key={tick} className="absolute top-1/2 -translate-y-1/2 h-3 w-px bg-white/20" style={{ left: `${(tick/3)*100}%` }}>
                                  <span className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 font-mono">{tick}</span>
                              </div>
                          ))}
                          {[0.5, 1.5, 2.5].map(tick => (
                              <div key={tick} className="absolute top-1/2 -translate-y-1/2 h-1.5 w-px bg-white/10" style={{ left: `${(tick/3)*100}%` }}></div>
                          ))}
                       </div>

                       {/* Needle */}
                       <div 
                           className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_white] border-[3px] border-dark-800 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-20"
                           style={{ left: `${Math.min((bondOrder / 3) * 100, 100)}%`, transform: 'translate(-50%, -50%)' }}
                       ></div>
                  </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                  <div className="flex gap-2">
                    <button 
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className="p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:hover:bg-white/5 transition-all border border-white/5 hover:border-white/20"
                        title="Undo last change"
                    >
                        <ArrowUturnLeftIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleAutoFill}
                        className="flex-1 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white font-medium flex items-center justify-center gap-2 transition-all border border-white/5 hover:border-white/20"
                    >
                        <BoltIcon className="w-5 h-5" />
                        Auto-Fill
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={handleHint}
                        disabled={isLoadingHint}
                        className="py-3 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-200 border border-purple-500/20 hover:border-purple-500/40 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                      >
                          {isLoadingHint ? (
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                          ) : (
                              <LightBulbIcon className="w-5 h-5" />
                          )}
                          Hint
                      </button>
                      <button 
                        onClick={handleCheck}
                        className="py-3 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-200 border border-green-500/20 hover:border-green-500/40 font-bold flex items-center justify-center gap-2 transition-all"
                      >
                          <CheckCircleIcon className="w-5 h-5" />
                          Check
                      </button>
                  </div>
              </div>
          </div>

          {/* Diagram Area */}
          <div className="flex-1 p-8 relative">
              {/* Radial Light Effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,243,255,0.05)_0%,rgba(0,0,0,0.8)_70%)] pointer-events-none"></div>
              
              <MODiagram 
                  orbitals={orbitals} 
                  molecule={currentMolecule} 
                  onOrbitalClick={handleOrbitalClick} 
              />
              
              {/* Visible Rules Card */}
              <div className="absolute top-6 left-6 max-w-sm z-20 pointer-events-none">
                  <div className="bg-dark-900/80 backdrop-blur-xl border border-white/10 rounded-xl p-5 shadow-2xl">
                      <h3 className="text-neon-blue font-bold mb-3 flex items-center gap-2 uppercase text-xs tracking-widest">
                          <InformationCircleIcon className="w-4 h-4" />
                          Lab Rules
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-300">
                          <li className="flex gap-2 items-start">
                              <span className="text-neon-blue mt-1 text-[10px]">●</span>
                              <span><strong className="text-white">Aufbau Principle:</strong> Fill orbitals from lowest energy (bottom) to highest (top).</span>
                          </li>
                          <li className="flex gap-2 items-start">
                              <span className="text-neon-green mt-1 text-[10px]">●</span>
                              <span><strong className="text-white">Hund's Rule:</strong> Add single electrons to degenerate orbitals before pairing.</span>
                          </li>
                          <li className="flex gap-2 items-start">
                              <span className="text-neon-red mt-1 text-[10px]">●</span>
                              <span><strong className="text-white">Pauli Exclusion:</strong> Max 2 electrons per orbital with opposite spins.</span>
                          </li>
                      </ul>
                  </div>
              </div>

               {/* Floating Feedback Toast */}
               {feedback && (
                  <div className={`
                    absolute bottom-8 left-1/2 -translate-x-1/2 max-w-lg w-full z-50
                    border rounded-xl p-4 shadow-2xl backdrop-blur-xl
                    flex items-start gap-3 animate-pulse-fast
                    ${feedback.type === 'success' ? 'bg-green-950/80 border-green-500/50 text-green-100 shadow-green-900/40' : ''}
                    ${feedback.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-100 shadow-red-900/40' : ''}
                    ${feedback.type === 'info' ? 'bg-blue-950/80 border-blue-500/50 text-blue-100 shadow-blue-900/40' : ''}
                  `}>
                      {feedback.type === 'success' && <CheckCircleIcon className="w-6 h-6 shrink-0 text-green-400" />}
                      {feedback.type === 'error' && <XCircleIcon className="w-6 h-6 shrink-0 text-red-400" />}
                      {feedback.type === 'info' && <LightBulbIcon className="w-6 h-6 shrink-0 text-blue-400" />}
                      
                      <div className="flex-1">
                          <h4 className="font-bold text-sm uppercase tracking-wide mb-1">
                              {feedback.type === 'success' ? 'Correct Configuration' : feedback.type === 'error' ? 'Attention' : 'Hint'}
                          </h4>
                          <p className="text-sm opacity-90 leading-relaxed">{feedback.message}</p>
                      </div>

                      <button 
                        onClick={() => setFeedback(null)}
                        className="p-1 hover:bg-white/10 rounded-full transition-colors"
                      >
                          <XMarkIcon className="w-5 h-5 opacity-70 hover:opacity-100" />
                      </button>
                  </div>
              )}
              
          </div>
      </div>
    </div>
  );
};

export default App;
