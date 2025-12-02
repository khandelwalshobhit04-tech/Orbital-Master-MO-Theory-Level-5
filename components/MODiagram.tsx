import React, { useMemo } from 'react';
import { OrbitalData, MoleculeDef } from '../types';
import { OrbitalRenderer } from './OrbitalRenderer';

interface MODiagramProps {
  orbitals: OrbitalData[];
  molecule: MoleculeDef;
  onOrbitalClick: (id: string) => void;
}

export const MODiagram: React.FC<MODiagramProps> = ({ orbitals, molecule, onOrbitalClick }) => {
  
  // Separate logic to draw connecting lines would go here using SVG
  // We will create a simple SVG background for the lines based on fixed assumptions about layout
  
  const lines = useMemo(() => {
      // Hardcoded visual connections for standard MO diagrams
      // This is purely aesthetic to link AO (left/right - not rendered interactively to save space) to MO (center)
      // For this app, we focus on the center MO column but imply the AO connections
      return (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              {/* Energy Arrow */}
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#444" />
                </marker>
              </defs>
              <line x1="10%" y1="95%" x2="10%" y2="5%" stroke="#444" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <text x="12%" y="10%" fill="#444" className="text-xs font-mono" style={{transform: "rotate(-90deg)", transformOrigin: "12% 10%"}}>Energy</text>
          </svg>
      )
  }, []);

  const getOffset = (id: string) => {
    if (id.endsWith('_a')) return -35;
    if (id.endsWith('_b')) return 35;
    return 0;
  };

  return (
    <div className="relative w-full h-full bg-dark-800 rounded-lg border border-dark-700 overflow-hidden shadow-inner">
        {lines}
        
        {/* Render Orbitals */}
        <div className="absolute inset-0 w-full h-full">
             {orbitals.map(orb => (
                 <OrbitalRenderer 
                    key={orb.id} 
                    orbital={orb} 
                    onClick={onOrbitalClick}
                    isActive={false}
                    xOffset={getOffset(orb.id)}
                 />
             ))}
        </div>
        
        {/* Molecule Label */}
        <div className="absolute bottom-4 right-4 text-right pointer-events-none">
            <h2 className="text-4xl font-bold text-white opacity-10">{molecule.formula}</h2>
            <p className="text-sm text-gray-500">{molecule.ordering === 'mixing' ? 's-p Mixing Active' : 'Standard Ordering'}</p>
        </div>
    </div>
  );
};