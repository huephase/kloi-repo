// 🟡🟡🟡 - [seedAdmin] CLI utility to create admin accounts
import process from 'process';
import { AdminService } from '../services/adminService';

// 🟡🟡🟡 - [CLI OPTIONS] Parse command-line arguments
type CLIOptions = {
  username: string;
  password: string;
  theme: string;
  email?: string;
};

function logInfo(message: string, payload?: unknown) {
  console.log(`🟡🟡🟡 - [seedAdmin ${new Date().toISOString()}] ${message}`, payload ?? '');
}

function logSuccess(message: string, payload?: unknown) {
  console.log(`✅✅✅ - [seedAdmin ${new Date().toISOString()}] ${message}`, payload ?? '');
}

function logError(message: string, payload?: unknown) {
  console.error(`❗❗❗ - [seedAdmin ${new Date().toISOString()}] ${message}`, payload ?? '');
}

// 🟡🟡🟡 - [PARSE ARGS] Parse command-line arguments
function parseArgs(): CLIOptions | null {
  const args = process.argv.slice(2);
  const options: Partial<CLIOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.substring(2) as keyof CLIOptions;
      const value = args[i + 1];
      
      if (!value || value.startsWith('--')) {
        logError(`Missing value for argument: ${arg}`);
        return null;
      }

      if (key === 'username' || key === 'password' || key === 'theme' || key === 'email') {
        (options as any)[key] = value;
      }
      
      i++; // Skip next argument as it's the value
    }
  }

  // 🟡🟡🟡 - [VALIDATION] Validate required arguments
  if (!options.username || !options.password || !options.theme) {
    logError('Missing required arguments');
    console.log('\nUsage: npm run admin:seed -- --username <username> --password <password> --theme <theme> [--email <email>]');
    console.log('\nExample:');
    console.log('  npm run admin:seed -- --username admin --password SecurePass123 --theme default --email admin@example.com');
    return null;
  }

  return options as CLIOptions;
}

// 🟡🟡🟡 - [MAIN] Main function to create admin
async function main() {
  logInfo('Starting admin seed script');

  const options = parseArgs();
  if (!options) {
    process.exit(1);
    return;
  }

  try {
    logInfo('Creating admin account', {
      username: options.username,
      theme: options.theme,
      email: options.email || 'not provided'
    });

    // 🟡🟡🟡 - [CREATE ADMIN] Create admin using AdminService
    const admin = await AdminService.createAdmin(
      options.username,
      options.password,
      options.theme,
      options.email
    );

    logSuccess('Admin account created successfully', {
      id: admin.id.substring(0, 8) + '...',
      username: admin.username,
      theme: admin.theme,
      email: admin.email || 'not set'
    });

    console.log('\n✅✅✅ Admin account created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Theme: ${admin.theme}`);
    if (admin.email) {
      console.log(`   Email: ${admin.email}`);
    }
    console.log(`   Created at: ${admin.createdAt.toISOString()}`);

    process.exit(0);
  } catch (error) {
    logError('Error creating admin account', error);
    
    if (error instanceof Error) {
      if (error.message.includes('already exists')) {
        console.error('\n❗❗❗ Admin with this username already exists. Please use a different username.');
      } else {
        console.error('\n❗❗❗ Error:', error.message);
      }
    } else {
      console.error('\n❗❗❗ Unknown error occurred');
    }

    process.exit(1);
  }
}

// 🟡🟡🟡 - [RUN] Run main function
main().catch((error) => {
  logError('Unhandled error', error);
  process.exit(1);
});

