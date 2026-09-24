import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseServiceKey &&
  !supabaseUrl.includes('your-project') &&
  supabaseServiceKey !== 'placeholder-service-role-key'
);

if (!isSupabaseConfigured) {
  console.warn(
    '⚠️ [Supabase Config] Real Supabase credentials not found or using placeholders. Initializing in-memory mock repository for local verification.'
  );
}

// In-Memory Storage for sandbox / development when Supabase Cloud is not yet connected
class MockSupabaseDatabase {
  private profiles: any[] = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      full_name: 'Dr. Sarah Vance',
      role: 'farmer',
      phone_number: '+1 (555) 349-2810',
      preferred_language: 'en',
      measurement_system: 'metric',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private farms: any[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      user_id: '00000000-0000-0000-0000-000000000001',
      farm_name: 'Verdant Valley Bio-Farm',
      location_latitude: 36.778259,
      location_longitude: -119.417931,
      state_province: 'California',
      country: 'United States',
      total_acreage: 120.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private plots: any[] = [
    {
      id: '22222222-2222-2222-2222-222222222222',
      farm_id: '11111111-1111-1111-1111-111111111111',
      plot_name: 'North Ridge Plot A',
      soil_type: 'Loamy',
      acreage: 45.0,
      current_crop: 'Wheat',
      sowing_date: '2026-02-18',
      irrigation_type: 'Sprinkler System',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      farm_id: '11111111-1111-1111-1111-111111111111',
      plot_name: 'Creek Basin Plot B',
      soil_type: 'Black Soil (Vertisol)',
      acreage: 30.5,
      current_crop: 'Tomato',
      sowing_date: '2026-03-01',
      irrigation_type: 'Drip Irrigation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      farm_id: '11111111-1111-1111-1111-111111111111',
      plot_name: 'Sun Prairie Plot C',
      soil_type: 'Sandy',
      acreage: 45.0,
      current_crop: 'Corn (Maize)',
      sowing_date: '2026-03-10',
      irrigation_type: 'Drip Irrigation',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  private advisories: any[] = [
    {
      id: '55555555-5555-5555-5555-555555555555',
      plot_id: '22222222-2222-2222-2222-222222222222',
      user_id: '00000000-0000-0000-0000-000000000001',
      domain: 'SOIL_AND_NUTRIENT',
      input_parameters: {
        cropType: 'Wheat',
        growthStage: 'Vegetative Growth',
        sowingDate: '2026-02-18',
        acreage: 45,
        soilType: 'Loamy',
        irrigationType: 'Sprinkler System',
        domain: 'SOIL_AND_NUTRIENT',
        soilMetrics: {
          ph: 6.2,
          nitrogenPpm: 18.5,
          phosphorusPpm: 24.0,
          potassiumPpm: 140.0,
          organicCarbonPercent: 1.2
        },
        weather: {
          temperatureC: 22.5,
          humidityPercent: 65,
          recentRainfallMm: 18
        },
        symptomsDescription: 'Slight chlorosis on lower leaves; slow canopy development noted in quadrant 3.'
      },
      ai_raw_response: {
        executiveSummary: 'Wheat crop at early vegetative stage exhibits acute sub-surface Nitrogen deficiency (18.5 ppm vs optimal 45+ ppm), manifesting as basal chlorosis. Recommended split-dose urea top-dressing with zinc chelate foliar spray.',
        overallRiskLevel: 'MODERATE',
        confidenceScore: 94.5,
        soilAndNutrientAnalysis: {
          currentStatus: 'Nitrogen depleted, Phosphorus adequate, Potassium optimal. Mild acidity at pH 6.2 within tolerable bounds.',
          deficienciesIdentified: ['Nitrogen (Sub-acute)', 'Zinc (Trace deficit)'],
          npkAdjustmentRegimen: {
            nitrogenKgPerHa: 48.0,
            phosphorusKgPerHa: 0.0,
            potassiumKgPerHa: 15.0,
            applicationTiming: 'Immediate morning application prior to next scheduled sprinkler cycle',
            applicationMethod: 'Top-dressing with granular urea coated with neem extract followed by fertigation'
          },
          phRemediation: 'Soil pH 6.2 is currently stable for Triticum aestivum; no lime amendment required.'
        },
        pestAndPathogenDiagnosis: {
          diagnosedIssues: [
            {
              name: 'Physiological Nitrogen Chlorosis',
              scientificName: 'Abiotic Nitrogen Deprivation',
              severity: 'MODERATE',
              symptomsObserved: ['Pale green/yellow lower leaves', 'Stunted tillering'],
              causalAgent: 'Leaching following 18mm rainfall and high vegetative uptake'
            }
          ],
          integratedPestManagement: {
            culturalControls: [
              'Implement shallow aeration between furrows to stimulate microbial mineralisation',
              'Monitor field quadrant 3 for secondary rhizoctonia incidence'
            ],
            biologicalControls: [
              'Inoculate root zone with Azotobacter chroococcum bio-fertilizer slurry at 5 kg/ha'
            ],
            chemicalInterventions: [
              {
                activeIngredient: 'Zinc EDTA Chelate 12%',
                commercialFormulation: 'Chelamin Soluble Powder',
                dosagePerAcre: '500 g per 200 L water',
                preHarvestIntervalDays: 14,
                safetyPrecautions: 'Wear nitrile gloves, particulate respirator (N95), and avoid drift near water runoff channels.'
              }
            ]
          }
        },
        irrigationSchedule: {
          weeklyEvapotranspirationEstimateMm: 28.5,
          wateringFrequencyDays: 4,
          litersPerPlotArea: 125000,
          criticalDroughtMitigationWarning: null
        },
        actionableTasks: [
          {
            category: 'Nutrient Management',
            action: 'Broadcast 48 kg/ha Urea split-dose across Plot A before next irrigation',
            urgencyDays: 2
          },
          {
            category: 'Foliar Nutrition',
            action: 'Apply Zinc EDTA foliar spray (500g/acre) during low-sun hours',
            urgencyDays: 4
          },
          {
            category: 'Irrigation',
            action: 'Run 2.5-hour sprinkler cycle delivering 28.5mm effective water',
            urgencyDays: 3
          },
          {
            category: 'Monitoring',
            action: 'Photograph tiller development in quadrant 3 and record SPAD chlorophyll index',
            urgencyDays: 7
          }
        ]
      },
      executive_summary: 'Wheat crop at early vegetative stage exhibits acute sub-surface Nitrogen deficiency (18.5 ppm vs optimal 45+ ppm), manifesting as basal chlorosis. Recommended split-dose urea top-dressing with zinc chelate foliar spray.',
      overall_risk_level: 'MODERATE',
      confidence_score: 94.5,
      created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString()
    }
  ];

  private actionItems: any[] = [
    {
      id: '66666666-6666-6666-6666-666666666661',
      advisory_id: '55555555-5555-5555-5555-555555555555',
      category: 'Nutrient Management',
      action_text: 'Broadcast 48 kg/ha Urea split-dose across Plot A before next irrigation',
      urgency_days: 2,
      status: 'PENDING',
      created_at: new Date().toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666662',
      advisory_id: '55555555-5555-5555-5555-555555555555',
      category: 'Foliar Nutrition',
      action_text: 'Apply Zinc EDTA foliar spray (500g/acre) during low-sun hours',
      urgency_days: 4,
      status: 'PENDING',
      created_at: new Date().toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666663',
      advisory_id: '55555555-5555-5555-5555-555555555555',
      category: 'Irrigation',
      action_text: 'Run 2.5-hour sprinkler cycle delivering 28.5mm effective water',
      urgency_days: 3,
      status: 'DONE',
      created_at: new Date().toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666664',
      advisory_id: '55555555-5555-5555-5555-555555555555',
      category: 'Monitoring',
      action_text: 'Photograph tiller development in quadrant 3 and record SPAD chlorophyll index',
      urgency_days: 7,
      status: 'PENDING',
      created_at: new Date().toISOString()
    }
  ];

  from(tableName: string) {
    let collection: any[];
    switch (tableName) {
      case 'profiles': collection = this.profiles; break;
      case 'farms': collection = this.farms; break;
      case 'plots': collection = this.plots; break;
      case 'advisories': collection = this.advisories; break;
      case 'advisory_action_items': collection = this.actionItems; break;
      default: collection = [];
    }

    let filterFn = (item: any) => true;
    let orderFn: ((a: any, b: any) => number) | null = null;
    let limitVal: number | null = null;

    const builder = {
      select: (fields = '*') => {
        return builder;
      },
      eq: (field: string, value: any) => {
        const prevFilter = filterFn;
        filterFn = (item: any) => prevFilter(item) && item[field] === value;
        return builder;
      },
      order: (field: string, options?: { ascending?: boolean }) => {
        const asc = options?.ascending !== false;
        orderFn = (a, b) => {
          if (a[field] < b[field]) return asc ? -1 : 1;
          if (a[field] > b[field]) return asc ? 1 : -1;
          return 0;
        };
        return builder;
      },
      limit: (count: number) => {
        limitVal = count;
        return builder;
      },
      insert: (data: any | any[]) => {
        const items = Array.isArray(data) ? data : [data];
        const insertedItems = items.map((item) => {
          const newItem = {
            id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            created_at: item.created_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
            ...item
          };
          collection.push(newItem);
          return newItem;
        });

        const insertBuilder = {
          select: () => ({
            single: async () => ({ data: insertedItems[0], error: null }),
            then: (resolve: any, reject: any) =>
              Promise.resolve({ data: Array.isArray(data) ? insertedItems : insertedItems[0], error: null }).then(resolve, reject),
          }),
          single: async () => ({ data: insertedItems[0], error: null }),
          then: (resolve: any, reject: any) =>
            Promise.resolve({ data: Array.isArray(data) ? insertedItems : insertedItems[0], error: null }).then(resolve, reject),
        };

        return insertBuilder;
      },
      update: (updates: any) => {
        return {
          eq: async (field: string, value: any) => {
            let updatedCount = 0;
            collection.forEach((item) => {
              if (item[field] === value) {
                Object.assign(item, updates, { updated_at: new Date().toISOString() });
                updatedCount++;
              }
            });
            return { data: collection.filter(i => i[field] === value), error: null };
          }
        };
      },
      delete: () => {
        return {
          eq: async (field: string, value: any) => {
            const initialLen = collection.length;
            const remaining = collection.filter(item => item[field] !== value);
            collection.length = 0;
            collection.push(...remaining);
            return { data: null, error: null };
          }
        };
      },
      single: async () => {
        const results = collection.filter(filterFn);
        return { data: results[0] || null, error: results[0] ? null : { message: 'Row not found' } };
      },
      then: (resolve: any, reject: any) => {
        let results = collection.filter(filterFn);
        if (orderFn) results = [...results].sort(orderFn);
        if (limitVal !== null) results = results.slice(0, limitVal);
        return Promise.resolve({ data: results, error: null }).then(resolve, reject);
      }
    };

    return builder;
  }

  // Auth simulation
  auth = {
    getUser: async (token: string) => {
      if (!token || token === 'invalid') {
        return { data: { user: null }, error: new Error('Invalid token') };
      }
      return {
        data: {
          user: {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'demo.farmer@agrigenome.io',
            role: 'authenticated'
          }
        },
        error: null
      };
    }
  };
}

export const mockDbInstance = new MockSupabaseDatabase();

export const supabaseServer: any = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : mockDbInstance;
