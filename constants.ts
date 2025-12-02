import { MoleculeDef, OrbitalData } from './types';

export const MOLECULES: MoleculeDef[] = [
  { id: 'O2', formula: 'O₂', name: 'Dioxygen', totalElectrons: 16, ordering: 'standard' },
  { id: 'O2+', formula: 'O₂⁺', name: 'Dioxygenyl', totalElectrons: 15, ordering: 'standard' },
  { id: 'O2-', formula: 'O₂⁻', name: 'Superoxide', totalElectrons: 17, ordering: 'standard' },
  { id: 'N2', formula: 'N₂', name: 'Dinitrogen', totalElectrons: 14, ordering: 'mixing' },
  { id: 'N2+', formula: 'N₂⁺', name: 'Dinitrogen Cation', totalElectrons: 13, ordering: 'mixing' },
  { id: 'N2-', formula: 'N₂⁻', name: 'Dinitrogen Anion', totalElectrons: 15, ordering: 'mixing' },
  { id: 'C2', formula: 'C₂', name: 'Dicarbon', totalElectrons: 12, ordering: 'mixing' },
  { id: 'B2', formula: 'B₂', name: 'Diboron', totalElectrons: 10, ordering: 'mixing' },
  { id: 'He2', formula: 'He₂', name: 'Dihelium (Hypothetical)', totalElectrons: 4, ordering: 'standard' },
];

// Helper to generate empty orbital templates based on ordering
export const generateOrbitals = (ordering: 'standard' | 'mixing'): OrbitalData[] => {
  const commonLower = [
    { id: 's1', name: 'σ1s', energyLevel: 5, capacity: 2, electrons: 0, type: 'bonding', set: '1s' },
    { id: 's1*', name: 'σ*1s', energyLevel: 15, capacity: 2, electrons: 0, type: 'antibonding', set: '1s' },
    { id: 's2', name: 'σ2s', energyLevel: 25, capacity: 2, electrons: 0, type: 'bonding', set: '2s' },
    { id: 's2*', name: 'σ*2s', energyLevel: 35, capacity: 2, electrons: 0, type: 'antibonding', set: '2s' },
  ] as OrbitalData[];

  // N2 mixing: Pi 2p is LOWER in energy than Sigma 2p
  const mixingUpper = [
    { id: 'pi2p_a', name: 'π2p', energyLevel: 48, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 'pi2p_b', name: 'π2p', energyLevel: 48, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 's2p', name: 'σ2p', energyLevel: 60, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 'pi2p*_a', name: 'π*2p', energyLevel: 75, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
    { id: 'pi2p*_b', name: 'π*2p', energyLevel: 75, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
    { id: 's2p*', name: 'σ*2p', energyLevel: 88, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
  ] as OrbitalData[];

  // O2 standard: Sigma 2p is LOWER than Pi 2p
  const standardUpper = [
    { id: 's2p', name: 'σ2p', energyLevel: 48, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 'pi2p_a', name: 'π2p', energyLevel: 60, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 'pi2p_b', name: 'π2p', energyLevel: 60, capacity: 2, electrons: 0, type: 'bonding', set: '2p' },
    { id: 'pi2p*_a', name: 'π*2p', energyLevel: 75, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
    { id: 'pi2p*_b', name: 'π*2p', energyLevel: 75, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
    { id: 's2p*', name: 'σ*2p', energyLevel: 88, capacity: 2, electrons: 0, type: 'antibonding', set: '2p' },
  ] as OrbitalData[];

  return [...commonLower, ...(ordering === 'mixing' ? mixingUpper : standardUpper)];
};