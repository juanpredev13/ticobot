#!/usr/bin/env tsx
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL || 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const { data } = await supabase
  .from('parties')
  .select('*')
  .or('name.ilike.%PAC%,name.ilike.%Acción Ciudadana%,abbreviation.ilike.%PAC%');

console.log('PAC/Acción Ciudadana parties:', JSON.stringify(data, null, 2));
