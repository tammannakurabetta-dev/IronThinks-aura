import { Response } from 'express';
import { supabaseServer } from '../config/supabase';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { UpdateActionItemSchema } from '../../../shared/src/validators';

export async function updateActionItemStatusHandler(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthenticated session.' });
    }

    const parseResult = UpdateActionItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be PENDING or DONE.',
        errors: parseResult.error.errors
      });
    }

    const { status } = parseResult.data;

    const { data: updatedItem, error } = await supabaseServer
      .from('advisory_action_items')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `Action item marked as ${status}.`,
      data: updatedItem
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update action item status.',
      error: error.message
    });
  }
}
