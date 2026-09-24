import { Request, Response, NextFunction } from 'express';
import { supabaseServer, isSupabaseConfigured } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
    [key: string]: any;
  };
}

export async function verifySupabaseAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In sandbox mode without real Supabase, allow demo user header or default demo user
      if (!isSupabaseConfigured) {
        req.user = {
          id: (req.headers['x-demo-user-id'] as string) || '00000000-0000-0000-0000-000000000001',
          email: 'demo.farmer@agrigenome.io',
          role: 'farmer'
        };
        return next();
      }

      return res.status(401).json({
        success: false,
        message: 'Missing or malformed Authorization header. Expected Bearer token.'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!isSupabaseConfigured) {
      // Sandbox mode token validation
      req.user = {
        id: (req.headers['x-demo-user-id'] as string) || '00000000-0000-0000-0000-000000000001',
        email: 'demo.farmer@agrigenome.io',
        role: 'farmer'
      };
      return next();
    }

    const { data: { user }, error } = await supabaseServer.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Supabase authentication session token.',
        error: error?.message
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.user_metadata?.role || 'farmer',
      ...user
    };

    return next();
  } catch (err: any) {
    console.error('[Auth Middleware Error]:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal authorization error.',
      error: err.message
    });
  }
}
