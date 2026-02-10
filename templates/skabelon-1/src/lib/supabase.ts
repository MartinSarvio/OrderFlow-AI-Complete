import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qymtjhzgtcittohutmay.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF5bXRqaHpndGNpdHRvaHV0bWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3MjMzNjYsImV4cCI6MjA2NzI5OTM2Nn0.n6FYURqirRHO0pLPVDflAjH34aiiSxx7a_ZckDPW4DE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
