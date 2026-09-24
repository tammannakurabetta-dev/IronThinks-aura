-- ==============================================================================
-- AGRI-GENOME OS - SUPABASE POSTGRESQL INITIAL SCHEMA MIGRATION
-- Migration: 001_initial_schema.sql
-- Description: Core tables, enums, indexes, RLS policies, storage bucket, triggers & seed data
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Define Custom Types / Enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('farmer', 'agronomist', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'risk_level') THEN
        CREATE TYPE risk_level AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'advisory_domain') THEN
        CREATE TYPE advisory_domain AS ENUM ('SOIL_AND_NUTRIENT', 'PEST_AND_PATHOGEN', 'IRRIGATION_AND_WATER', 'CULTIVAR_AND_HARVEST');
    END IF;
END $$;

-- 3. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role DEFAULT 'farmer'::user_role NOT NULL,
    phone_number TEXT,
    preferred_language TEXT DEFAULT 'en' NOT NULL,
    measurement_system TEXT DEFAULT 'metric' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. Farms Table
CREATE TABLE IF NOT EXISTS farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL,
    location_latitude NUMERIC(10, 7),
    location_longitude NUMERIC(10, 7),
    state_province TEXT NOT NULL,
    country TEXT NOT NULL,
    total_acreage NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. Plots Table
CREATE TABLE IF NOT EXISTS plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    plot_name TEXT NOT NULL,
    soil_type TEXT NOT NULL,
    acreage NUMERIC(10, 2) NOT NULL,
    current_crop TEXT,
    sowing_date DATE,
    irrigation_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Advisories Table
CREATE TABLE IF NOT EXISTS advisories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plot_id UUID NOT NULL REFERENCES plots(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    domain advisory_domain NOT NULL,
    input_parameters JSONB NOT NULL,
    ai_raw_response JSONB NOT NULL,
    executive_summary TEXT NOT NULL,
    overall_risk_level risk_level NOT NULL,
    confidence_score NUMERIC(5, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Advisory Action Items (Normalized for actionable queries)
CREATE TABLE IF NOT EXISTS advisory_action_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    advisory_id UUID NOT NULL REFERENCES advisories(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    action_text TEXT NOT NULL,
    urgency_days INT NOT NULL,
    status TEXT DEFAULT 'PENDING' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_farms_user_id ON farms(user_id);
CREATE INDEX IF NOT EXISTS idx_plots_farm_id ON plots(farm_id);
CREATE INDEX IF NOT EXISTS idx_advisories_plot_id ON advisories(plot_id);
CREATE INDEX IF NOT EXISTS idx_advisories_user_id ON advisories(user_id);
CREATE INDEX IF NOT EXISTS idx_advisories_created_at ON advisories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_items_advisory_id ON advisory_action_items(advisory_id);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON advisory_action_items(status);

-- 9. Auto-trigger for Profiles when an Auth User signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, phone_number, preferred_language, measurement_system)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Agri-Genome Farmer'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'farmer'::user_role),
        NEW.raw_user_meta_data->>'phone_number',
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
        COALESCE(NEW.raw_user_meta_data->>'measurement_system', 'metric')
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. Enable Row Level Security (RLS) across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisory_action_items ENABLE ROW LEVEL SECURITY;

-- 11. Row Level Security Policies
-- Profiles: Users manage their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Farms: Data isolation by auth.uid()
DROP POLICY IF EXISTS "Users can perform all CRUD on their farms" ON farms;
CREATE POLICY "Users can perform all CRUD on their farms"
    ON farms FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Plots: Data isolation via ownership of parent farm
DROP POLICY IF EXISTS "Users can access plots in their farms" ON plots;
CREATE POLICY "Users can access plots in their farms"
    ON plots FOR ALL
    USING (
        EXISTS (SELECT 1 FROM farms WHERE farms.id = plots.farm_id AND farms.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM farms WHERE farms.id = plots.farm_id AND farms.user_id = auth.uid())
    );

-- Advisories: Isolation by direct user_id reference
DROP POLICY IF EXISTS "Users can manage their advisories" ON advisories;
CREATE POLICY "Users can manage their advisories"
    ON advisories FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Advisory Action Items: Isolation through parent advisory
DROP POLICY IF EXISTS "Users can access action items for their advisories" ON advisory_action_items;
CREATE POLICY "Users can access action items for their advisories"
    ON advisory_action_items FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM advisories 
            WHERE advisories.id = advisory_action_items.advisory_id 
              AND advisories.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM advisories 
            WHERE advisories.id = advisory_action_items.advisory_id 
              AND advisories.user_id = auth.uid()
        )
    );

-- 12. Storage Bucket for Crop Symptoms
INSERT INTO storage.buckets (id, name, public)
VALUES ('crop-symptoms', 'crop-symptoms', true)
ON CONFLICT (id) DO NOTHING;

-- Storage bucket access policies
DROP POLICY IF EXISTS "Authenticated users can upload crop symptoms" ON storage.objects;
CREATE POLICY "Authenticated users can upload crop symptoms"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'crop-symptoms');

DROP POLICY IF EXISTS "Public can view crop symptoms" ON storage.objects;
CREATE POLICY "Public can view crop symptoms"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'crop-symptoms');

DROP POLICY IF EXISTS "Users can delete their own uploaded symptoms" ON storage.objects;
CREATE POLICY "Users can delete their own uploaded symptoms"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'crop-symptoms' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================================================
-- SEED DATA (Demonstration & Sandbox Verification)
-- Creates demo profile, farm, plots, and sample agronomic advisories
-- ==============================================================================

DO $$
DECLARE
    demo_user_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_farm_id UUID := '11111111-1111-1111-1111-111111111111';
    plot_wheat_id UUID := '22222222-2222-2222-2222-222222222222';
    plot_tomato_id UUID := '33333333-3333-3333-3333-333333333333';
    plot_corn_id UUID := '44444444-4444-4444-4444-444444444444';
    demo_advisory_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Only insert seed data if demo user does not already exist
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = demo_user_id) THEN
        -- Insert mock auth user if auth.users exists and has access
        BEGIN
            INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
            VALUES (
                demo_user_id,
                'demo.farmer@agrigenome.io',
                crypt('AgriGenome2026!', gen_salt('bf')),
                NOW(),
                '{"full_name": "Dr. Sarah Vance", "role": "farmer"}'::jsonb
            )
            ON CONFLICT (id) DO NOTHING;
        EXCEPTION WHEN OTHERS THEN
            -- In restricted Supabase env, profiles can be seeded directly
            NULL;
        END;

        -- Insert Profile
        INSERT INTO profiles (id, full_name, role, phone_number, preferred_language, measurement_system)
        VALUES (
            demo_user_id,
            'Dr. Sarah Vance',
            'farmer',
            '+1 (555) 349-2810',
            'en',
            'metric'
        )
        ON CONFLICT (id) DO NOTHING;

        -- Insert Demo Farm
        INSERT INTO farms (id, user_id, farm_name, location_latitude, location_longitude, state_province, country, total_acreage)
        VALUES (
            demo_farm_id,
            demo_user_id,
            'Verdant Valley Bio-Farm',
            36.778259,
            -119.417931,
            'California',
            'United States',
            120.50
        )
        ON CONFLICT (id) DO NOTHING;

        -- Insert Sample Plots
        INSERT INTO plots (id, farm_id, plot_name, soil_type, acreage, current_crop, sowing_date, irrigation_type)
        VALUES
        (
            plot_wheat_id,
            demo_farm_id,
            'North Ridge Plot A',
            'Loamy',
            45.00,
            'Wheat',
            CURRENT_DATE - INTERVAL '35 days',
            'Sprinkler System'
        ),
        (
            plot_tomato_id,
            demo_farm_id,
            'Creek Basin Plot B',
            'Black Soil (Vertisol)',
            30.50,
            'Tomato',
            CURRENT_DATE - INTERVAL '20 days',
            'Drip Irrigation'
        ),
        (
            plot_corn_id,
            demo_farm_id,
            'Sun Prairie Plot C',
            'Sandy',
            45.00,
            'Corn (Maize)',
            CURRENT_DATE - INTERVAL '15 days',
            'Drip Irrigation'
        )
        ON CONFLICT (id) DO NOTHING;

        -- Insert Seed Advisory
        INSERT INTO advisories (
            id,
            plot_id,
            user_id,
            domain,
            input_parameters,
            ai_raw_response,
            executive_summary,
            overall_risk_level,
            confidence_score
        )
        VALUES (
            demo_advisory_id,
            plot_wheat_id,
            demo_user_id,
            'SOIL_AND_NUTRIENT',
            '{
                "cropType": "Wheat",
                "growthStage": "Vegetative Growth",
                "sowingDate": "2026-02-18",
                "acreage": 45,
                "soilType": "Loamy",
                "irrigationType": "Sprinkler System",
                "domain": "SOIL_AND_NUTRIENT",
                "soilMetrics": {
                    "ph": 6.2,
                    "nitrogenPpm": 18.5,
                    "phosphorusPpm": 24.0,
                    "potassiumPpm": 140.0,
                    "organicCarbonPercent": 1.2
                },
                "weather": {
                    "temperatureC": 22.5,
                    "humidityPercent": 65,
                    "recentRainfallMm": 18
                },
                "symptomsDescription": "Slight chlorosis on lower leaves; slow canopy development noted in quadrant 3."
            }'::jsonb,
            '{
                "executiveSummary": "Wheat crop at early vegetative stage exhibits acute sub-surface Nitrogen deficiency (18.5 ppm vs optimal 45+ ppm), manifesting as basal chlorosis. Recommended split-dose urea top-dressing with zinc chelate foliar spray.",
                "overallRiskLevel": "MODERATE",
                "confidenceScore": 94.5,
                "soilAndNutrientAnalysis": {
                    "currentStatus": "Nitrogen depleted, Phosphorus adequate, Potassium optimal. Mild acidity at pH 6.2 within tolerable bounds.",
                    "deficienciesIdentified": ["Nitrogen (Sub-acute)", "Zinc (Trace deficit)"],
                    "npkAdjustmentRegimen": {
                        "nitrogenKgPerHa": 48.0,
                        "phosphorusKgPerHa": 0.0,
                        "potassiumKgPerHa": 15.0,
                        "applicationTiming": "Immediate morning application prior to next scheduled sprinkler cycle",
                        "applicationMethod": "Top-dressing with granular urea coated with neem extract followed by fertigation"
                    },
                    "phRemediation": "Soil pH 6.2 is currently stable for Triticum aestivum; no lime amendment required."
                },
                "pestAndPathogenDiagnosis": {
                    "diagnosedIssues": [
                        {
                            "name": "Physiological Nitrogen Chlorosis",
                            "scientificName": "Abiotic Nitrogen Deprivation",
                            "severity": "MODERATE",
                            "symptomsObserved": ["Pale green/yellow lower leaves", "Stunted tillering"],
                            "causalAgent": "Leaching following 18mm rainfall and high vegetative uptake"
                        }
                    ],
                    "integratedPestManagement": {
                        "culturalControls": [
                            "Implement shallow aeration between furrows to stimulate microbial mineralisation",
                            "Monitor field quadrant 3 for secondary rhizoctonia incidence"
                        ],
                        "biologicalControls": [
                            "Inoculate root zone with Azotobacter chroococcum bio-fertilizer slurry at 5 kg/ha"
                        ],
                        "chemicalInterventions": [
                            {
                                "activeIngredient": "Zinc EDTA Chelate 12%",
                                "commercialFormulation": "Chelamin Soluble Powder",
                                "dosagePerAcre": "500 g per 200 L water",
                                "preHarvestIntervalDays": 14,
                                "safetyPrecautions": "Wear nitrile gloves, particulate respirator (N95), and avoid drift near water runoff channels."
                            }
                        ]
                    }
                },
                "irrigationSchedule": {
                    "weeklyEvapotranspirationEstimateMm": 28.5,
                    "wateringFrequencyDays": 4,
                    "litersPerPlotArea": 125000,
                    "criticalDroughtMitigationWarning": null
                },
                "actionableTasks": [
                    {
                        "category": "Nutrient Management",
                        "action": "Broadcast 48 kg/ha Urea split-dose across Plot A before next irrigation",
                        "urgencyDays": 2
                    },
                    {
                        "category": "Foliar Nutrition",
                        "action": "Apply Zinc EDTA foliar spray (500g/acre) during low-sun hours",
                        "urgencyDays": 4
                    },
                    {
                        "category": "Irrigation",
                        "action": "Run 2.5-hour sprinkler cycle delivering 28.5mm effective water",
                        "urgencyDays": 3
                    },
                    {
                        "category": "Monitoring",
                        "action": "Photograph tiller development in quadrant 3 and record SPAD chlorophyll index",
                        "urgencyDays": 7
                    }
                ]
            }'::jsonb,
            'Wheat crop at early vegetative stage exhibits acute sub-surface Nitrogen deficiency (18.5 ppm vs optimal 45+ ppm), manifesting as basal chlorosis. Recommended split-dose urea top-dressing with zinc chelate foliar spray.',
            'MODERATE',
            94.50
        )
        ON CONFLICT (id) DO NOTHING;

        -- Insert Seed Action Items
        INSERT INTO advisory_action_items (advisory_id, category, action_text, urgency_days, status)
        VALUES
        (
            demo_advisory_id,
            'Nutrient Management',
            'Broadcast 48 kg/ha Urea split-dose across Plot A before next irrigation',
            2,
            'PENDING'
        ),
        (
            demo_advisory_id,
            'Foliar Nutrition',
            'Apply Zinc EDTA foliar spray (500g/acre) during low-sun hours',
            4,
            'PENDING'
        ),
        (
            demo_advisory_id,
            'Irrigation',
            'Run 2.5-hour sprinkler cycle delivering 28.5mm effective water',
            3,
            'DONE'
        ),
        (
            demo_advisory_id,
            'Monitoring',
            'Photograph tiller development in quadrant 3 and record SPAD chlorophyll index',
            7,
            'PENDING'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
