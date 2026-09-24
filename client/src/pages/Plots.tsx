import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  MapPin, 
  Plus, 
  Sprout, 
  Droplets, 
  Calendar, 
  Layers, 
  Sparkles, 
  Check, 
  X,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { CROP_TYPES, SOIL_TYPES, IRRIGATION_TYPES } from '@shared/constants';
import { CreatePlotInput } from '@shared/validators';

export const Plots: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');

  // Form State
  const [formData, setFormData] = useState<{
    plotName: string;
    soilType: string;
    acreage: number;
    currentCrop: string;
    sowingDate: string;
    irrigationType: string;
  }>({
    plotName: '',
    soilType: SOIL_TYPES[2],
    acreage: 25.0,
    currentCrop: CROP_TYPES[0],
    sowingDate: new Date().toISOString().split('T')[0],
    irrigationType: IRRIGATION_TYPES[0],
  });

  const { data: plots = [], isLoading } = useQuery({
    queryKey: ['plots'],
    queryFn: () => api.getPlots(),
  });

  const createPlotMutation = useMutation({
    mutationFn: (newPlot: CreatePlotInput) => api.createPlot(newPlot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plots'] });
      setShowAddModal(false);
      setFormData({
        plotName: '',
        soilType: SOIL_TYPES[2],
        acreage: 25.0,
        currentCrop: CROP_TYPES[0],
        sowingDate: new Date().toISOString().split('T')[0],
        irrigationType: IRRIGATION_TYPES[0],
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlotMutation.mutate({
      farmId: '11111111-1111-1111-1111-111111111111',
      plotName: formData.plotName,
      soilType: formData.soilType,
      acreage: Number(formData.acreage),
      currentCrop: formData.currentCrop,
      sowingDate: formData.sowingDate,
      irrigationType: formData.irrigationType,
    });
  };

  const filteredPlots = selectedCropFilter === 'ALL'
    ? plots
    : plots.filter(p => p.current_crop === selectedCropFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Farm Plot & Crop Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-100 font-display">Plot Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Registry of cultivated sub-plots, active phenological growth, and irrigation systems.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Plot</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-4 h-4 text-emerald-400" />
          <span>Filter by Crop:</span>
          <select
            value={selectedCropFilter}
            onChange={(e) => setSelectedCropFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Crops ({plots.length})</option>
            {CROP_TYPES.map((crop) => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Showing <strong className="text-slate-200">{filteredPlots.length}</strong> of {plots.length} active plots
        </div>
      </div>

      {/* Plots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlots.map((plot) => (
          <div
            key={plot.id}
            className="glass-card glass-card-hover p-6 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {plot.soil_type}
                  </span>
                  <h3 className="font-bold text-slate-100 text-lg mt-3">{plot.plot_name}</h3>
                  <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                    <Sprout className="w-4 h-4" />
                    {plot.current_crop || 'Unplanted'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-slate-100">{plot.acreage}</span>
                  <span className="text-xs text-slate-400 block">Acres</span>
                </div>
              </div>

              <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    Irrigation
                  </span>
                  <span className="font-medium text-slate-200">{plot.irrigation_type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Sowing Date
                  </span>
                  <span className="font-medium text-slate-200">{plot.sowing_date || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <Link
                to={`/advisory/new?plotId=${plot.id}`}
                className="w-full btn-primary text-xs py-2 bg-gradient-to-r from-emerald-600 to-teal-600"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                <span>Run Advisory</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add Plot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 bg-slate-900 border-slate-700 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Register New Farm Plot
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Plot Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., East Ridge Sector 4"
                  value={formData.plotName}
                  onChange={(e) => setFormData({ ...formData, plotName: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Crop Variety</label>
                  <select
                    value={formData.currentCrop}
                    onChange={(e) => setFormData({ ...formData, currentCrop: e.target.value })}
                    className="select-field"
                  >
                    {CROP_TYPES.map((crop) => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Soil Classification</label>
                  <select
                    value={formData.soilType}
                    onChange={(e) => setFormData({ ...formData, soilType: e.target.value })}
                    className="select-field"
                  >
                    {SOIL_TYPES.map((soil) => (
                      <option key={soil} value={soil}>{soil}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Acreage (Acres)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={formData.acreage}
                    onChange={(e) => setFormData({ ...formData, acreage: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Sowing Date</label>
                  <input
                    type="date"
                    required
                    value={formData.sowingDate}
                    onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Primary Irrigation System</label>
                <select
                  value={formData.irrigationType}
                  onChange={(e) => setFormData({ ...formData, irrigationType: e.target.value })}
                  className="select-field"
                >
                  {IRRIGATION_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlotMutation.isPending}
                  className="btn-primary"
                >
                  {createPlotMutation.isPending ? 'Registering...' : 'Register Plot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
