import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { SymptomPhotoUploader } from '../components/forms/SymptomPhotoUploader';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  FlaskConical, 
  CloudSun, 
  AlertCircle, 
  Layers, 
  Check, 
  Save, 
  RotateCcw,
  Loader2
} from 'lucide-react';
import { 
  CROP_TYPES, 
  SOIL_TYPES, 
  GROWTH_STAGES, 
  IRRIGATION_TYPES, 
  ADVISORY_DOMAINS 
} from '@shared/constants';
import { GenerateAdvisoryInput } from '@shared/validators';

const STORAGE_KEY = 'agri_advisory_draft';

export const AdvisoryWizard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPlotId = searchParams.get('plotId');

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [draftSavedToast, setDraftSavedToast] = useState<boolean>(false);

  const { data: plots = [] } = useQuery({
    queryKey: ['plots'],
    queryFn: () => api.getPlots(),
  });

  // Default Initial Form State
  const initialFormState: GenerateAdvisoryInput = {
    plotId: preselectedPlotId || '',
    inputData: {
      cropType: 'Wheat',
      growthStage: 'Vegetative Growth',
      sowingDate: new Date().toISOString().split('T')[0],
      acreage: 45,
      soilType: 'Loamy',
      irrigationType: 'Sprinkler System',
      domain: 'SOIL_AND_NUTRIENT',
      soilMetrics: {
        ph: 6.5,
        nitrogenPpm: 22.0,
        phosphorusPpm: 24.0,
        potassiumPpm: 140.0,
        organicCarbonPercent: 1.2,
      },
      weather: {
        temperatureC: 22.5,
        humidityPercent: 65,
        recentRainfallMm: 18,
      },
      symptomsDescription: '',
      symptomImageUrls: [],
    },
  };

  const [formData, setFormData] = useState<GenerateAdvisoryInput>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (preselectedPlotId) parsed.plotId = preselectedPlotId;
        return parsed;
      } catch {
        return initialFormState;
      }
    }
    return initialFormState;
  });

  // Update default plot when plots load if not set
  useEffect(() => {
    if (!formData.plotId && plots.length > 0) {
      const targetPlot = preselectedPlotId 
        ? plots.find(p => p.id === preselectedPlotId) || plots[0] 
        : plots[0];
      setFormData(prev => ({
        ...prev,
        plotId: targetPlot.id,
        inputData: {
          ...prev.inputData,
          cropType: targetPlot.current_crop || prev.inputData.cropType,
          soilType: targetPlot.soil_type || prev.inputData.soilType,
          acreage: Number(targetPlot.acreage) || prev.inputData.acreage,
          irrigationType: targetPlot.irrigation_type || prev.inputData.irrigationType,
          sowingDate: targetPlot.sowing_date || prev.inputData.sowingDate,
        }
      }));
    }
  }, [plots, preselectedPlotId]);

  // Persist draft to local storage for offline resilience (Master Prompt Section 4)
  const saveDraft = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2000);
  };

  const resetDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData(initialFormState);
  };

  const generateMutation = useMutation({
    mutationFn: (input: GenerateAdvisoryInput) => api.generateAdvisory(input),
    onSuccess: (res) => {
      localStorage.removeItem(STORAGE_KEY);
      navigate(`/advisory/${res.advisoryId}`);
    },
    onError: (err: any) => {
      alert(`Advisory generation error: ${err.message}`);
    },
  });

  const handlePlotSelect = (plotId: string) => {
    const selected = plots.find(p => p.id === plotId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        plotId: selected.id,
        inputData: {
          ...prev.inputData,
          cropType: selected.current_crop || prev.inputData.cropType,
          soilType: selected.soil_type || prev.inputData.soilType,
          acreage: Number(selected.acreage) || prev.inputData.acreage,
          irrigationType: selected.irrigation_type || prev.inputData.irrigationType,
          sowingDate: selected.sowing_date || prev.inputData.sowingDate,
        }
      }));
    }
  };

  const steps = [
    { number: 1, title: 'Baseline Context', icon: Layers, desc: 'Target crop, plot, sowing window' },
    { number: 2, title: 'Soil Matrix', icon: FlaskConical, desc: 'pH, N-P-K, organic carbon' },
    { number: 3, title: 'Microclimate', icon: CloudSun, desc: 'Temperature, rainfall, RH' },
    { number: 4, title: 'Symptom Triage', icon: AlertCircle, desc: 'Visual diagnosis & anomalies' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Diagnostic Engine (Gemini 2.5 Pro)</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 font-display">
            Crop Advisory Intake Wizard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Deterministic agronomic ingestion with strict multi-layer JSON Schema validation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={saveDraft}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Save draft to local storage"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{draftSavedToast ? 'Draft Saved!' : 'Save Draft'}</span>
          </button>
          <button
            type="button"
            onClick={resetDraft}
            className="p-2 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl"
            title="Reset form to defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Step Stepper Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.number;
          const isCompleted = currentStep > s.number;

          return (
            <div
              key={s.number}
              onClick={() => setCurrentStep(s.number)}
              className={`glass-card p-3 rounded-xl cursor-pointer transition-all ${
                isActive
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : isCompleted
                  ? 'border-emerald-500/40 bg-slate-900/60'
                  : 'border-slate-800 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-emerald-500 text-slate-950'
                      : isActive
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.number}
                </span>
                <span className={`text-xs font-bold ${isActive ? 'text-emerald-300' : 'text-slate-300'}`}>
                  {s.title}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">{s.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Step Content Container */}
      <div className="glass-card p-6 sm:p-8">
        {/* STEP 1: Baseline Context */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg">Step 1: Baseline Context & Crop Target</h3>
              <p className="text-xs text-slate-400">Select target farm plot, crop cultivar, and advisory domain</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Selected Plot</label>
                <select
                  value={formData.plotId}
                  onChange={(e) => handlePlotSelect(e.target.value)}
                  className="select-field text-sm"
                >
                  {plots.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.plot_name} ({p.soil_type}, {p.acreage} ac)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Advisory Domain</label>
                <select
                  value={formData.inputData.domain}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, domain: e.target.value as any }
                  })}
                  className="select-field text-sm text-emerald-400 font-semibold"
                >
                  {ADVISORY_DOMAINS.map((domain) => (
                    <option key={domain} value={domain}>
                      {domain.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Crop Type</label>
                <select
                  value={formData.inputData.cropType}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, cropType: e.target.value }
                  })}
                  className="select-field text-sm"
                >
                  {CROP_TYPES.map((crop) => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Growth Phenology Stage</label>
                <select
                  value={formData.inputData.growthStage}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, growthStage: e.target.value }
                  })}
                  className="select-field text-sm"
                >
                  {GROWTH_STAGES.map((stage) => (
                    <option key={stage} value={stage}>{stage}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Sowing Date</label>
                <input
                  type="date"
                  value={formData.inputData.sowingDate}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, sowingDate: e.target.value }
                  })}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Soil Type</label>
                <select
                  value={formData.inputData.soilType}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, soilType: e.target.value }
                  })}
                  className="select-field text-sm"
                >
                  {SOIL_TYPES.map((soil) => (
                    <option key={soil} value={soil}>{soil}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Irrigation Delivery Mode</label>
                <select
                  value={formData.inputData.irrigationType}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: { ...formData.inputData, irrigationType: e.target.value }
                  })}
                  className="select-field text-sm"
                >
                  {IRRIGATION_TYPES.map((irr) => (
                    <option key={irr} value={irr}>{irr}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Soil Matrix */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg">Step 2: Subsurface Soil Matrix Metrics</h3>
              <p className="text-xs text-slate-400">Laboratory test values for accurate stoichiometric fertilizer calculation</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Soil pH (3.0 - 11.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="3.0"
                  max="11.0"
                  value={formData.inputData.soilMetrics?.ph ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      soilMetrics: {
                        ...formData.inputData.soilMetrics,
                        ph: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 6.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Available Nitrogen (N) ppm
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="2000"
                  value={formData.inputData.soilMetrics?.nitrogenPpm ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      soilMetrics: {
                        ...formData.inputData.soilMetrics,
                        nitrogenPpm: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 22.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Available Phosphorus (P) ppm
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="1000"
                  value={formData.inputData.soilMetrics?.phosphorusPpm ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      soilMetrics: {
                        ...formData.inputData.soilMetrics,
                        phosphorusPpm: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 24.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Exchangeable Potassium (K) ppm
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="3000"
                  value={formData.inputData.soilMetrics?.potassiumPpm ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      soilMetrics: {
                        ...formData.inputData.soilMetrics,
                        potassiumPpm: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 140.0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Organic Carbon (OC %)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="15"
                  value={formData.inputData.soilMetrics?.organicCarbonPercent ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      soilMetrics: {
                        ...formData.inputData.soilMetrics,
                        organicCarbonPercent: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 1.2"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Environmental Factors */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg">Step 3: Microclimate & Environmental Conditions</h3>
              <p className="text-xs text-slate-400">Local climatic parameters for evapotranspiration and disease pressure</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Average Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.inputData.weather?.temperatureC ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      weather: {
                        ...formData.inputData.weather,
                        temperatureC: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 22.5"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Relative Humidity (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={formData.inputData.weather?.humidityPercent ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      weather: {
                        ...formData.inputData.weather,
                        humidityPercent: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 65"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recent 7-Day Rainfall (mm)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.inputData.weather?.recentRainfallMm ?? ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    inputData: {
                      ...formData.inputData,
                      weather: {
                        ...formData.inputData.weather,
                        recentRainfallMm: parseFloat(e.target.value) || undefined,
                      }
                    }
                  })}
                  className="input-field text-sm"
                  placeholder="e.g., 18"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Visual/Symptom Triage */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg">Step 4: Visual Pathology & Symptom Triage</h3>
              <p className="text-xs text-slate-400">Upload symptom imagery and detail field anomalies</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Field Imagery & Leaf Symptoms
              </label>
              <SymptomPhotoUploader
                onImagesUploaded={(urls) => setFormData({
                  ...formData,
                  inputData: { ...formData.inputData, symptomImageUrls: urls }
                })}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observed Field Symptoms & Agronomic Observations
              </label>
              <textarea
                rows={4}
                value={formData.inputData.symptomsDescription || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  inputData: { ...formData.inputData, symptomsDescription: e.target.value }
                })}
                placeholder="Describe leaf discoloration (interveinal chlorosis, marginal scorch), fungal lesions, insect feeding patterns, or stunted growth..."
                className="input-field text-sm leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* Wizard Controls Bottom Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(prev => prev - 1)}
            className="btn-secondary text-xs sm:text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous Step</span>
          </button>

          {currentStep < 4 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(prev => prev + 1)}
              className="btn-primary text-xs sm:text-sm"
            >
              <span>Next: {steps[currentStep].title}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate(formData)}
              className="btn-primary bg-gradient-to-r from-emerald-600 via-teal-500 to-green-600 text-white font-bold text-sm px-6 py-3 shadow-xl shadow-emerald-950/50"
            >
              {generateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Agronomic Intelligence...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-emerald-200" />
                  <span>Execute Gemini 2.5 Pro Inference</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
