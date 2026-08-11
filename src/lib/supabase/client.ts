import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null;

export function createClient() {
  if (!supabaseInstance) {
    // URL corrigida sem o ponto e vírgula no meio
    const url = "https://rxfcawozlobjpksyjkbw.supabase.co".trim();
    
    // A chave que você mandou
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4ZmNhd296bG9ianBrc3lqa2J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYxMzM5NTYsImV4cCI6MjEwMTcwOTk1Nn0.16cy08hHGYZNkDDkFIn4bYhGHZayQRp7_THF-of3o_Y".trim(); 
    
    supabaseInstance = createSupabaseClient(url, key);
  }
  
  return supabaseInstance;
}