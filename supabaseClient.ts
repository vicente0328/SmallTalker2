
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.45.4';

const supabaseUrl = 'https://vrzjyckllqjcbvtmktus.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyemp5Y2tsbHFqY2J2dG1rdHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMTI1NDcsImV4cCI6MjA4NTc4ODU0N30.dIP0wE6Nw8xrwUX6SlOW5FEdikHvgx9XW1AYeDbIYZs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
