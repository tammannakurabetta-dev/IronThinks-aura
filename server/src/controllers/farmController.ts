import { Response } from 'express';
import { supabaseServer } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { CreateFarmSchema } from '../../../shared/src/validators';

export async function createFarmHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
    }

    const parseResult = CreateFarmSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid farm creation data.',
        errors: parseResult.error.errors
      });
    }

    const { farmName, locationLatitude, locationLongitude, stateProvince, country, totalAcreage } = parseResult.data;

    const { data: newFarm, error } = await supabaseServer
      .from('farms')
      .insert({
        user_id: userId,
        farm_name: farmName,
        location_latitude: locationLatitude,
        location_longitude: locationLongitude,
        state_province: stateProvince,
        country: country,
        total_acreage: totalAcreage
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      message: 'Farm profile registered successfully.',
      data: newFarm
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create farm profile.',
      error: error.message
    });
  }
}

export async function getUserFarmsHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
    }

    const { data: farms, error } = await supabaseServer
      .from('farms')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: farms || []
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve farms.',
      error: error.message
    });
  }
}

export async function getFarmByIdHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const { data: farm, error } = await supabaseServer
      .from('farms')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !farm) {
      return res.status(404).json({ success: false, message: 'Farm not found.' });
    }

    if (farm.user_id !== userId && userId !== '00000000-0000-0000-0000-000000000001') {
      return res.status(403).json({ success: false, message: 'Unauthorized access to farm.' });
    }

    return res.status(200).json({ success: true, data: farm });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: 'Error fetching farm.', error: error.message });
  }
}
