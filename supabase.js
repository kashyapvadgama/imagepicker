import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://foimaapdfdhvyrhvpxtw.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW1hYXBkZmRodnlyaHZweHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQyMTAsImV4cCI6MjA2NjI2MDIxMH0.KlooWo0U3CknmaHwV-45smnpXxZaK47O2ijZn4I5IEI';

export const supabase = createClient(supabaseUrl, supabaseKey);
