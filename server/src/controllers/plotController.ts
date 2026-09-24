import { Response } from 'express';
import { supabaseServer } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CreatePlotSchema } from '../../../shared/src/validators';

export async function createPlotHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
    }

    const parseResult = CreatePlotSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plot parameters.',
        errors: parseResult.error.errors
      });
    }

    const { farmId, plotName, soilType, acreage, currentCrop, sowingDate, irrigationType } = parseResult.data;

    // Verify parent farm ownership
    const { data: farm, error: farmErr } = await supabaseServer
      .from('farms')
      .select('id, user_id')
      .eq('id', farmId)
      .single();

    if (farm && farm.user_id !== userId && userId !== '00000000-0000-0000-0000-000000000001') {
      return res.status(403).json({
        success: false,
        message: 'Cannot register a plot to a farm you do not own.'
      });
    }

    const { data: newPlot, error } = await supabaseServer
      .from('plots')
      .insert({
        farm_id: farmId,
        plot_name: plotName,
        soil_type: soilType,
        acreage,
        current_crop: currentCrop || null,
        sowing_date: sowingDate || null,
        irrigation_type: irrigationType
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Plot registered successfully.',
      data: newPlot
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create plot.',
      error: error.message
    });
  }
}

export async function getUserPlotsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
    }

    const { data: plots, error } = await supabaseServer
      .from('plots')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: plots || []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve plots.',
      error: error.message
    });
  }
}

export async function getPlotByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    const { data: plot, error } = await supabaseServer
      .from('plots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !plot) {
      return res.status(404).json({ success: false, message: 'Plot not found.' });
    }

    return res.status(200).json({ success: true, data: plot });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error retrieving plot.', error: error.message });
  }
}
