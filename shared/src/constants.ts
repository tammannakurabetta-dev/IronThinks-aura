/**
 * ResearchFlow AI & Advisory Domain Constants
 */

export const RESEARCH_CATEGORIES = [
  'MARKET_INTEL',
  'TECH_FEASIBILITY',
  'REGULATORY',
  'EXECUTIVE_SCAN'
] as const;

export const DEPTH_LEVELS = [
  'BRIEF',
  'STANDARD',
  'COMPREHENSIVE'
] as const;

export const PIPELINE_STAGES = [
  'PLAN_EXPANSION',
  'WEB_SCRAPE',
  'SYNTHESIS',
  'CRITIQUE_REVISE',
  'HTML_RENDER',
  'EMAIL_DISPATCH'
] as const;

export const STYLING_TEMPLATES = [
  'Executive Brief',
  'Technical Deep Dive',
  'Market Horizon',
  'Regulatory Memo'
] as const;

export const ADVISORY_DOMAINS = [
  'SOIL_AND_NUTRIENT',
  'PEST_AND_PATHOGEN',
  'IRRIGATION_AND_WATER',
  'CULTIVAR_AND_HARVEST'
] as const;

export const CROP_TYPES = [
  'Wheat',
  'Rice (Paddy)',
  'Corn (Maize)',
  'Soybean',
  'Cotton',
  'Sugarcane',
  'Tomato',
  'Potato',
  'Groundnut',
  'Coffee',
  'Tea'
] as const;

export const SOIL_TYPES = [
  'Clay',
  'Sandy',
  'Loamy',
  'Silt',
  'Peaty',
  'Chalky',
  'Black Soil (Vertisol)',
  'Red Soil'
] as const;

export const GROWTH_STAGES = [
  'Germination / Sowing',
  'Vegetative Growth',
  'Flowering / Budding',
  'Fruit / Pod Development',
  'Maturity / Pre-Harvest'
] as const;

export const IRRIGATION_TYPES = [
  'Drip Irrigation',
  'Sprinkler System',
  'Flood / Furrow',
  'Rainfed (No Supplemental Irrigation)'
] as const;

export const RISK_LEVELS = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as const;
export const USER_ROLES = ['farmer', 'agronomist', 'admin'] as const;
