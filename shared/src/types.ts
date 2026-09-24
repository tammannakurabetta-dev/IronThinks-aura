import { 
  CROP_TYPES, 
  SOIL_TYPES, 
  GROWTH_STAGES, 
  IRRIGATION_TYPES, 
  ADVISORY_DOMAINS, 
  RISK_LEVELS, 
  USER_ROLES 
} from './constants';
import { AdvisoryInputData } from './validators';

export type CropType = typeof CROP_TYPES[number];
export type SoilType = typeof SOIL_TYPES[number];
export type GrowthStage = typeof GROWTH_STAGES[number];
export type IrrigationType = typeof IRRIGATION_TYPES[number];
export type AdvisoryDomain = typeof ADVISORY_DOMAINS[number];
export type RiskLevel = typeof RISK_LEVELS[number];
export type UserRole = typeof USER_ROLES[number];

// Gemini Structured Output TypeScript Representation
export interface NpkAdjustmentRegimen {
  nitrogenKgPerHa: number;
  phosphorusKgPerHa: number;
  potassiumKgPerHa: number;
  applicationTiming: string;
  applicationMethod: string;
}

export interface SoilAndNutrientAnalysis {
  currentStatus: string;
  deficienciesIdentified: string[];
  npkAdjustmentRegimen: NpkAdjustmentRegimen;
  phRemediation?: string | null;
}

export interface DiagnosedIssue {
  name: string;
  scientificName?: string;
  severity: RiskLevel;
  symptomsObserved: string[];
  causalAgent?: string;
}

export interface ChemicalIntervention {
  activeIngredient: string;
  commercialFormulation?: string;
  dosagePerAcre: string;
  preHarvestIntervalDays: number;
  safetyPrecautions: string;
}

export interface IntegratedPestManagement {
  culturalControls: string[];
  biologicalControls: string[];
  chemicalInterventions: ChemicalIntervention[];
}

export interface PestAndPathogenDiagnosis {
  diagnosedIssues: DiagnosedIssue[];
  integratedPestManagement: IntegratedPestManagement;
}

export interface IrrigationSchedule {
  weeklyEvapotranspirationEstimateMm: number;
  wateringFrequencyDays: number;
  litersPerPlotArea: number;
  criticalDroughtMitigationWarning?: string | null;
}

export interface ActionableTask {
  category: string;
  action: string;
  urgencyDays: number;
}

export interface CropAdvisoryStructuredResponse {
  executiveSummary: string;
  overallRiskLevel: RiskLevel;
  confidenceScore: number;
  soilAndNutrientAnalysis: SoilAndNutrientAnalysis;
  pestAndPathogenDiagnosis: PestAndPathogenDiagnosis;
  irrigationSchedule: IrrigationSchedule;
  actionableTasks: ActionableTask[];
}

// Database Entity Types
export interface ProfileRecord {
  id: string;
  full_name: string;
  role: UserRole;
  phone_number?: string | null;
  preferred_language: string;
  measurement_system: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

export interface FarmRecord {
  id: string;
  user_id: string;
  farm_name: string;
  location_latitude?: number | null;
  location_longitude?: number | null;
  state_province: string;
  country: string;
  total_acreage: number;
  created_at: string;
  updated_at: string;
}

export interface PlotRecord {
  id: string;
  farm_id: string;
  plot_name: string;
  soil_type: string;
  acreage: number;
  current_crop?: string | null;
  sowing_date?: string | null;
  irrigation_type: string;
  created_at: string;
  updated_at: string;
}

export interface AdvisoryRecord {
  id: string;
  plot_id: string;
  user_id: string;
  domain: AdvisoryDomain;
  input_parameters: AdvisoryInputData;
  ai_raw_response: CropAdvisoryStructuredResponse;
  executive_summary: string;
  overall_risk_level: RiskLevel;
  confidence_score: number;
  created_at: string;
  plots?: PlotRecord;
  advisory_action_items?: AdvisoryActionItemRecord[];
}

export interface AdvisoryActionItemRecord {
  id: string;
  advisory_id: string;
  category: string;
  action_text: string;
  urgency_days: number;
  status: 'PENDING' | 'DONE';
  created_at: string;
}
