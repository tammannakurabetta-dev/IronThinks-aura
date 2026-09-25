import { z } from 'zod';
import { ADVISORY_DOMAINS } from './constants';

export * from './schemas/workflow';

export const SoilMetricsSchema = z.object({
  ph: z.number().min(3.0).max(11.0).optional().nullable(),
  nitrogenPpm: z.number().min(0).max(2000).optional().nullable(),
  phosphorusPpm: z.number().min(0).max(1000).optional().nullable(),
  potassiumPpm: z.number().min(0).max(3000).optional().nullable(),
  organicCarbonPercent: z.number().min(0).max(15).optional().nullable(),
});

export const WeatherMetricsSchema = z.object({
  temperatureC: z.number().min(-20).max(60).optional().nullable(),
  humidityPercent: z.number().min(0).max(100).optional().nullable(),
  recentRainfallMm: z.number().min(0).max(1000).optional().nullable(),
});

export const AdvisoryInputDataSchema = z.object({
  cropType: z.string().min(2, 'Crop type must be at least 2 characters'),
  growthStage: z.string().min(2, 'Growth stage must be selected'),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid YYYY-MM-DD format'),
  acreage: z.number().positive('Acreage must be a positive number'),
  soilType: z.string().min(2, 'Soil type must be selected'),
  irrigationType: z.string().min(2, 'Irrigation type must be selected'),
  domain: z.enum(ADVISORY_DOMAINS),
  soilMetrics: SoilMetricsSchema.optional(),
  weather: WeatherMetricsSchema.optional(),
  symptomsDescription: z.string().max(2000, 'Symptoms description cannot exceed 2000 characters').optional().nullable(),
  symptomImageUrls: z.array(z.string().url()).optional(),
});

export const GenerateAdvisoryInputSchema = z.object({
  plotId: z.string().uuid('Plot ID must be a valid UUID'),
  inputData: AdvisoryInputDataSchema
});

export const CreateFarmSchema = z.object({
  farmName: z.string().min(2, 'Farm name is required'),
  locationLatitude: z.number().min(-90).max(90).optional().nullable(),
  locationLongitude: z.number().min(-180).max(180).optional().nullable(),
  stateProvince: z.string().min(2, 'State or Province is required'),
  country: z.string().min(2, 'Country is required'),
  totalAcreage: z.number().positive('Total acreage must be greater than 0'),
});

export const CreatePlotSchema = z.object({
  farmId: z.string().uuid('Farm ID must be a valid UUID'),
  plotName: z.string().min(2, 'Plot name is required'),
  soilType: z.string().min(2, 'Soil type is required'),
  acreage: z.number().positive('Acreage must be greater than 0'),
  currentCrop: z.string().optional().nullable(),
  sowingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid YYYY-MM-DD format').optional().nullable(),
  irrigationType: z.string().min(2, 'Irrigation type is required'),
});

export const UpdateActionItemSchema = z.object({
  status: z.enum(['PENDING', 'DONE'])
});

export type SoilMetrics = z.infer<typeof SoilMetricsSchema>;
export type WeatherMetrics = z.infer<typeof WeatherMetricsSchema>;
export type AdvisoryInputData = z.infer<typeof AdvisoryInputDataSchema>;
export type GenerateAdvisoryInput = z.infer<typeof GenerateAdvisoryInputSchema>;
export type CreateFarmInput = z.infer<typeof CreateFarmSchema>;
export type CreatePlotInput = z.infer<typeof CreatePlotSchema>;
export type UpdateActionItemInput = z.infer<typeof UpdateActionItemSchema>;
