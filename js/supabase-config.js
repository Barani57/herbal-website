// Supabase Configuration
const SUPABASE_URL = 'https://ffcovgtuxtllneeeeecf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmY292Z3R1eHRsbG5lZWVlZWNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1NTk4MDAsImV4cCI6MjA4MTEzNTgwMH0.awWCpGwDpTPQkYmcW8TelHSc9A3H9rZ1z5YpnUNS04g';

// Initialize Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('✅ Supabase client initialized');

// Helper function to generate order number
function generateOrderNumber() {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
}
