import React from 'react';
import { OrbitalData } from '../types';

interface OrbitalRendererProps {
  orbital: OrbitalData;
  onClick: (id: string) => void;
  isActive: boolean;
  xOffset?: number; // pixels from center
}

export const OrbitalRenderer: React.FC<OrbitalRendererProps> = ({ orbital, onClick, isActive, xOffset = 0 }) => {
  const isAntibonding = orbital.type === 'antibonding';
  const isUnpaired = orbital.electrons === 1;
  
  // Determine position style based on energy level
  const bottomPercent = orbital.energyLevel;
  
  // Label positioning: 
  // Left-shifted orbitals (xOffset < 0) get label on the LEFT. 
  // Center (0) and Right-shifted (xOffset > 0) orbitals get label on the RIGHT.
  const isLeftLabel = xOffset < 0;

  return (
    <div 
      className={`absolute transform -translate-x-1/2 cursor-pointer transition-all duration-300 group z-10`}
      style={{ 
        bottom: `${bottomPercent}%`, 
        left: `calc(50% + ${xOffset}px)` 
      }}
      onClick={() => onClick(orbital.id)}
    >
      <div className="flex flex-col items-center relative">
        {/* Orbital Shape */}
        <div 
          className={`
            w-12 h-12 rounded-full border-2 flex items-center justify-center relative overflow-hidden
            ${isAntibonding ? 'border-neon-red bg-neon-red/10' : 'border-neon-green bg-neon-green/10'}
            ${isActive ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}
            ${isUnpaired ? 'shadow-[0_0_15px_rgba(0,243,255,0.6)] border-neon-blue animate-pulse' : ''}
            transition-all z-20
          `}
        >
          {/* Electrons with Spin */}
          <div className="flex items-center justify-center gap-0.5 h-full">
            {orbital.electrons >= 1 && (
              // Spin Up Arrow
              <div className={`transform transition-transform ${isUnpaired ? 'drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]' : ''}`} title="Spin Up">
                <svg width="10" height="20" viewBox="0 0 10 20" className="stroke-white overflow-visible">
                   <path d="M5 18 L5 2 M1 6 L5 2 L9 6" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
            {orbital.electrons >= 2 && (
              // Spin Down Arrow
              <div className="transform transition-transform" title="Spin Down">
                <svg width="10" height="20" viewBox="0 0 10 20" className="stroke-white overflow-visible">
                   <path d="M5 2 L5 18 M1 14 L5 18 L9 14" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Label */}
        <div 
            className={`
                absolute top-1/2 -translate-y-1/2 
                ${isLeftLabel ? 'right-full mr-4 text-right' : 'left-full ml-4 text-left'}
                pointer-events-none z-30 whitespace-nowrap
            `}
        >
            <div className={`
                px-2 py-1 rounded-md border backdrop-blur-md shadow-xl transition-all
                ${isAntibonding 
                    ? 'bg-neon-red/10 border-neon-red/30 text-red-200' 
                    : 'bg-neon-green/10 border-neon-green/30 text-green-200'}
                group-hover:bg-dark-900 group-hover:border-white/40
            `}>
                <div className="text-xs font-bold tracking-wider">{orbital.name}</div>
                <div className="text-[10px] opacity-70 font-mono mt-0.5">
                    {orbital.electrons}/{orbital.capacity} e⁻
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};