export enum OrbitalType {
  Sigma1s = 'σ1s',
  SigmaStar1s = 'σ*1s',
  Sigma2s = 'σ2s',
  SigmaStar2s = 'σ*2s',
  Pi2p = 'π2p',
  Sigma2p = 'σ2p',
  PiStar2p = 'π*2p',
  SigmaStar2p = 'σ*2p'
}

export interface OrbitalData {
  id: string;
  name: string;
  energyLevel: number; // 0-100 scale for Y positioning
  capacity: number;
  electrons: number;
  type: 'bonding' | 'antibonding' | 'nonbonding';
  set: '1s' | '2s' | '2p';
}

export interface MoleculeDef {
  id: string;
  formula: string;
  name: string;
  totalElectrons: number;
  ordering: 'standard' | 'mixing'; // 'mixing' for N2/B2/C2 (Pi below Sigma), 'standard' for O2/F2
  baseBondOrder?: number;
}

export interface SimulationState {
  molecule: MoleculeDef;
  orbitals: OrbitalData[];
  isStable: boolean | null;
  bondOrder: number;
  unpairedElectrons: number;
}

export interface ChallengeItem {
  id: string;
  formula: string;
  bondOrder: number;
  stabilityScore: number; // For comparison logic
}
