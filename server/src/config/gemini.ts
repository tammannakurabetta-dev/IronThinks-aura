import { GoogleGenAI, Type, Schema } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
export const isGeminiConfigured = Boolean(apiKey && apiKey !== 'placeholder-gemini-key' && !apiKey.startsWith('your_'));

if (!isGeminiConfigured) {
  console.warn(
    '⚠️ [Gemini Config] GEMINI_API_KEY is not configured or using placeholder. Running with agronomic fallback engine until an active key is added to server/.env'
  );
}

export const ai = isGeminiConfigured ? new GoogleGenAI({ apiKey }) : null;

// Exact deterministic Agronomic Schema for Gemini 2.5 Pro as specified in master prompt
export const cropAdvisoryGeminiSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: { type: Type.STRING },
    overallRiskLevel: { 
      type: Type.STRING, 
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] 
    },
    confidenceScore: { type: Type.NUMBER, description: 'Percentage score from 0.0 to 100.0' },
    soilAndNutrientAnalysis: {
      type: Type.OBJECT,
      properties: {
        currentStatus: { type: Type.STRING },
        deficienciesIdentified: { 
          type: Type.ARRAY, 
          items: { type: Type.STRING } 
        },
        npkAdjustmentRegimen: {
          type: Type.OBJECT,
          properties: {
            nitrogenKgPerHa: { type: Type.NUMBER },
            phosphorusKgPerHa: { type: Type.NUMBER },
            potassiumKgPerHa: { type: Type.NUMBER },
            applicationTiming: { type: Type.STRING },
            applicationMethod: { type: Type.STRING }
          },
          required: ['nitrogenKgPerHa', 'phosphorusKgPerHa', 'potassiumKgPerHa', 'applicationTiming', 'applicationMethod']
        },
        phRemediation: { type: Type.STRING, nullable: true }
      },
      required: ['currentStatus', 'deficienciesIdentified', 'npkAdjustmentRegimen']
    },
    pestAndPathogenDiagnosis: {
      type: Type.OBJECT,
      properties: {
        diagnosedIssues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              scientificName: { type: Type.STRING },
              severity: { type: Type.STRING, enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] },
              symptomsObserved: { type: Type.ARRAY, items: { type: Type.STRING } },
              causalAgent: { type: Type.STRING }
            },
            required: ['name', 'severity', 'symptomsObserved']
          }
        },
        integratedPestManagement: {
          type: Type.OBJECT,
          properties: {
            culturalControls: { type: Type.ARRAY, items: { type: Type.STRING } },
            biologicalControls: { type: Type.ARRAY, items: { type: Type.STRING } },
            chemicalInterventions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  activeIngredient: { type: Type.STRING },
                  commercialFormulation: { type: Type.STRING },
                  dosagePerAcre: { type: Type.STRING },
                  preHarvestIntervalDays: { type: Type.INTEGER },
                  safetyPrecautions: { type: Type.STRING }
                },
                required: ['activeIngredient', 'dosagePerAcre', 'preHarvestIntervalDays', 'safetyPrecautions']
              }
            }
          },
          required: ['culturalControls', 'biologicalControls', 'chemicalInterventions']
        }
      },
      required: ['diagnosedIssues', 'integratedPestManagement']
    },
    irrigationSchedule: {
      type: Type.OBJECT,
      properties: {
        weeklyEvapotranspirationEstimateMm: { type: Type.NUMBER },
        wateringFrequencyDays: { type: Type.INTEGER },
        litersPerPlotArea: { type: Type.NUMBER },
        criticalDroughtMitigationWarning: { type: Type.STRING, nullable: true }
      },
      required: ['weeklyEvapotranspirationEstimateMm', 'wateringFrequencyDays', 'litersPerPlotArea']
    },
    actionableTasks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          action: { type: Type.STRING },
          urgencyDays: { type: Type.INTEGER }
        },
        required: ['category', 'action', 'urgencyDays']
      }
    }
  },
  required: [
    'executiveSummary', 
    'overallRiskLevel', 
    'confidenceScore', 
    'soilAndNutrientAnalysis', 
    'pestAndPathogenDiagnosis', 
    'irrigationSchedule', 
    'actionableTasks'
  ]
};
