import { createClient } from '@supabase/supabase-js';
import { 
  GenerateAdvisoryInput, 
  CreateFarmInput, 
  CreatePlotInput 
} from '@shared/validators';
import { 
  AdvisoryRecord, 
  FarmRecord, 
  PlotRecord, 
  CropAdvisoryStructuredResponse 
} from '@shared/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

export const isSupabaseClientConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project') &&
  supabaseAnonKey !== 'placeholder-anon-key'
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Retrieve auth token or provide demo token
async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // In sandbox mode without active Supabase session, use demo token
      headers['Authorization'] = 'Bearer demo-sandbox-token';
      headers['x-demo-user-id'] = '00000000-0000-0000-0000-000000000001';
    }
  } catch {
    headers['Authorization'] = 'Bearer demo-sandbox-token';
    headers['x-demo-user-id'] = '00000000-0000-0000-0000-000000000001';
  }

  return headers;
}

export const api = {
  // Advisory Endpoints
  async generateAdvisory(input: GenerateAdvisoryInput): Promise<{
    success: boolean;
    advisoryId: string;
    data: CropAdvisoryStructuredResponse;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/advisory/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(input),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Failed to generate crop advisory.');
    }
    return data;
  },

  async getAllAdvisories(): Promise<AdvisoryRecord[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/advisory`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch advisories');
    return data.data;
  },

  async getAdvisoryById(id: string): Promise<AdvisoryRecord> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/advisory/${id}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch advisory details');
    return data.data;
  },

  async getPlotAdvisories(plotId: string): Promise<AdvisoryRecord[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/advisory/plot/${plotId}`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch plot advisories');
    return data.data;
  },

  async updateActionItem(actionId: string, status: 'PENDING' | 'DONE'): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/advisory/action/${actionId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update action item');
  },

  // Farm Endpoints
  async getFarms(): Promise<FarmRecord[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/farms`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch farms');
    return data.data;
  },

  async createFarm(farm: CreateFarmInput): Promise<FarmRecord> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/farms`, {
      method: 'POST',
      headers,
      body: JSON.stringify(farm),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create farm');
    return data.data;
  },

  // Plot Endpoints
  async getPlots(): Promise<PlotRecord[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/plots`, { headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch plots');
    return data.data;
  },

  async createPlot(plot: CreatePlotInput): Promise<PlotRecord> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE_URL}/plots`, {
      method: 'POST',
      headers,
      body: JSON.stringify(plot),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to create plot');
    return data.data;
  },

  // Image Upload via Supabase Storage or Local Base64 preview
  async uploadSymptomImage(file: File): Promise<string> {
    if (isSupabaseClientConfigured) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('crop-symptoms')
        .upload(filePath, file);

      if (uploadError) {
        console.warn('Storage upload error, falling back to local object URL:', uploadError);
        return URL.createObjectURL(file);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('crop-symptoms')
        .getPublicUrl(filePath);

      return publicUrl;
    } else {
      // In sandbox mode: Convert to data URL for instant client-side preview
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  }
};
