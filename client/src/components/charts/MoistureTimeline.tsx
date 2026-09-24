import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { IrrigationSchedule } from '@shared/types';
import { Droplets, Calendar, AlertTriangle } from 'lucide-react';

interface MoistureTimelineProps {
  schedule: IrrigationSchedule;
  irrigationType: string;
}

export const MoistureTimeline: React.FC<MoistureTimelineProps> = ({ schedule, irrigationType }) => {
  // Generate 7-day projected ET curve
  const days = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
  const baseET = schedule.weeklyEvapotranspirationEstimateMm / 7;

  const data = days.map((day, idx) => {
    // slight natural oscillation
    const variance = (idx % 2 === 0 ? 0.4 : -0.3);
    const et = Math.max(1.0, Math.round((baseET + variance) * 10) / 10);
    const isWateringDay = idx % schedule.wateringFrequencyDays === 0;

    return {
      day,
      et,
      soilMoisture: isWateringDay ? 88 : Math.max(35, 88 - (idx % schedule.wateringFrequencyDays) * 18),
      isWateringDay,
    };
  });

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-lg">Evapotranspiration & Water Budget</h3>
            <p className="text-xs text-slate-400">Weekly ET: {schedule.weeklyEvapotranspirationEstimateMm} mm | Delivery: {irrigationType}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Total Volume</span>
          <p className="text-lg font-bold text-blue-400">
            {(schedule.litersPerPlotArea).toLocaleString()} <span className="text-xs font-normal text-slate-400">Liters</span>
          </p>
        </div>
      </div>

      {schedule.criticalDroughtMitigationWarning && (
        <div className="mt-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-semibold text-amber-200">Thermal / Drought Mitigation Alert: </span>
            {schedule.criticalDroughtMitigationWarning}
          </div>
        </div>
      )}

      <div className="h-56 mt-4 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="day" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload;
                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{d.day}</p>
                      <p className="text-sky-300">Soil Moisture: <span className="font-bold">{d.soilMoisture}%</span></p>
                      <p className="text-slate-400">Evapotranspiration: <span className="font-bold">{d.et} mm/day</span></p>
                      {d.isWateringDay && (
                        <p className="text-emerald-400 font-semibold pt-1 border-t border-slate-800">💧 Scheduled Irrigation Cycle</p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="soilMoisture" stroke="#38bdf8" strokeWidth={2} fillOpacity={1} fill="url(#moistureGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span>Watering Frequency: Every <strong className="text-slate-200">{schedule.wateringFrequencyDays} days</strong></span>
        </div>
        <div className="text-xs text-emerald-400">
          Optimal Window: 04:00 - 08:00 AM (Minimal Evaporation)
        </div>
      </div>
    </div>
  );
};
