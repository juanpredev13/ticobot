#!/usr/bin/env tsx
/**
 * Secure Admin User Creation Script
 *
 * This script creates an admin user with a securely provided password.
 * DO NOT hardcode passwords in migrations or source code.
 *
 * Usage:
 *   cd backend
 *   pnpm tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { hashPassword } from '../src/auth/password.utils.js';
import { validatePasswordStrength } from '../src/auth/password-validator.js';
import { env } from '../src/config/env.js';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Ask a question and return the answer as a promise
 */
function question(prompt: string, hidden = false): Promise<string> {
  return new Promise((resolve) => {
    if (hidden) {
      // For password input, use raw mode to hide characters
      const stdin = process.stdin;
      const originalMode = stdin.isRaw;
      stdin.setRawMode?.(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      let password = '';
      process.stdout.write(prompt);

      const onData = (char: string) => {
        char = char.toString('utf8');

        // Handle Enter key
        if (char === '\n' || char === '\r' || char === '\u0004') {
          stdin.setRawMode?.(originalMode);
          stdin.pause();
          stdin.removeListener('data', onData);
          process.stdout.write('\n');
          resolve(password);
        }
        // Handle Ctrl+C
        else if (char === '\u0003') {
          process.stdout.write('\n');
          process.exit(1);
        }
        // Handle Backspace
        else if (char === '\u007f' || char === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.clearLine(0);
            process.stdout.cursorTo(0);
            process.stdout.write(prompt + '*'.repeat(password.length));
          }
        }
        // Regular character
        else {
          password += char;
          process.stdout.write('*');
        }
      };

      stdin.on('data', onData);
    } else {
      rl.question(prompt, resolve);
    }
  });
}

async function createAdminUser() {
  console.log('🔐 TicoBot - Secure Admin User Creation\n');
  console.log('This script will create an admin user with secure credentials.');
  console.log('Make sure you have configured backend/.env with Supabase credentials.\n');

  try {
    // Get admin email
    const email = await question('Admin email: ');

    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }

    // Get admin name
    const name = await question('Admin name (optional): ');

    // Get password with validation
    let password = '';
    let passwordValid = false;

    while (!passwordValid) {
      password = await question('\nAdmin password (min 12 chars): ', true);

      if (!password || password.length < 12) {
        console.error('❌ Password must be at least 12 characters');
        continue;
      }

      const confirmPassword = await question('Confirm password: ', true);

      if (password !== confirmPassword) {
        console.error('❌ Passwords do not match. Please try again.\n');
        continue;
      }

      // Validate password strength
      const validation = validatePasswordStrength(password, [email, name || '']);

      if (!validation.valid) {
        console.error('\n❌ Password is not strong enough:');
        validation.errors.forEach(error => console.error(`   - ${error}`));

        if (validation.suggestions.length > 0) {
          console.error('\n💡 Suggestions:');
          validation.suggestions.forEach(suggestion => console.error(`   - ${suggestion}`));
        }

        console.error('');
        continue;
      }

      passwordValid = true;
    }

    console.log('\n✅ Password strength: Excellent');
    console.log('\n⏳ Creating admin user...');

    // Connect to Supabase
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('email, tier')
      .eq('email', email)
      .single();

    if (existingUser) {
      console.error(`❌ User with email ${email} already exists`);

      if (existingUser.tier === 'admin') {
        console.error('   This user is already an admin');
      } else {
        console.error(`   This user has tier: ${existingUser.tier}`);
        const upgrade = await question('\nUpgrade to admin? (yes/no): ');

        if (upgrade.toLowerCase() === 'yes') {
          const { error } = await supabase
            .from('users')
            .update({ tier: 'admin' })
            .eq('email', email);

          if (error) {
            console.error('❌ Error upgrading user:', error.message);
            process.exit(1);
          }

          console.log('✅ User upgraded to admin successfully');
          process.exit(0);
        }
      }

      process.exit(1);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create admin user
    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: name || 'Admin User',
        tier: 'admin',
        email_verified: true,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating admin user:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Email: ${data.email}`);
    console.log(`   Name: ${data.name}`);
    console.log(`   Tier: ${data.tier}`);
    console.log(`   ID: ${data.id}`);
    console.log('\n🔑 You can now login with these credentials');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  } finally {
    rl.close();
    process.exit(0);
  }
}

// Run the script
createAdminUser();
