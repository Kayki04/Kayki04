import { createClient } from '@supabase/supabase-js';
import { createDemoClient } from './demo';

export const DEMO = import.meta.env.VITE_DEMO === '1';
const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = DEMO
  ? createDemoClient()
  : createClient(url, anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
