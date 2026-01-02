// 🟡🟡🟡 - [seedAdmin] CLI utility to create admin accounts
import process from 'process';
import { AdminService } from '../services/adminService';

// 🟡🟡🟡 - [CLI OPTIONS] Parse command-line arguments
type CLIOptions = {
  username: string;
  password: string;
  theme: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: 'SUPER_ADMIN' | 'EDITOR' | 'READ_ONLY';
  status?: 'PENDING' | 'EMAIL_VERIFIED' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  emailVerified?: boolean;
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

      if (key === 'username' || key === 'password' || key === 'theme' || key === 'email' || 
          key === 'firstName' || key === 'lastName' || key === 'phone') {
        (options as any)[key] = value;
      } else if (key === 'role') {
        if (value === 'SUPER_ADMIN' || value === 'EDITOR' || value === 'READ_ONLY') {
          (options as any)[key] = value;
        } else {
          logError(`Invalid role: ${value}. Must be SUPER_ADMIN, EDITOR, or READ_ONLY`);
          return null;
        }
      } else if (key === 'status') {
        if (value === 'PENDING' || value === 'EMAIL_VERIFIED' || value === 'APPROVED' || 
            value === 'ACTIVE' || value === 'INACTIVE') {
          (options as any)[key] = value;
        } else {
          logError(`Invalid status: ${value}. Must be PENDING, EMAIL_VERIFIED, APPROVED, ACTIVE, or INACTIVE`);
          return null;
        }
      } else if (key === 'emailVerified') {
        (options as any)[key] = value === 'true' || value === '1';
      }
      
      i++; // Skip next argument as it's the value
    }
  }

  // 🟡🟡🟡 - [VALIDATION] Validate required arguments
  if (!options.username || !options.password || !options.theme) {
    logError('Missing required arguments');
    console.log('\nUsage: npm run admin:seed -- --username <username> --password <password> --theme <theme> [options]');
    console.log('\nRequired:');
    console.log('  --username <username>     Admin username');
    console.log('  --password <password>     Admin password');
    console.log('  --theme <theme>           Theme subdomain (e.g., "admin" for backend superadmin)');
    console.log('\nOptional:');
    console.log('  --email <email>          Admin email address');
    console.log('  --firstName <name>       First name');
    console.log('  --lastName <name>         Last name');
    console.log('  --phone <phone>          Phone number');
    console.log('  --role <role>            Role: SUPER_ADMIN, EDITOR, or READ_ONLY (default: READ_ONLY)');
    console.log('  --status <status>        Status: PENDING, EMAIL_VERIFIED, APPROVED, ACTIVE, or INACTIVE (default: PENDING)');
    console.log('  --emailVerified <true|false>  Email verified flag (default: false)');
    console.log('\nExamples:');
    console.log('  # Create backend superadmin (for invitation management):');
    console.log('  npm run admin:seed -- --username superadmin --password SecurePass123 --theme admin --role SUPER_ADMIN --status ACTIVE --emailVerified true --email superadmin@example.com --firstName "Backend" --lastName "Admin"');
    console.log('\n  # Create regular theme admin:');
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
    // 🟡🟡🟡 - [DEFAULTS] Set defaults for optional parameters
    const role = options.role || 'READ_ONLY';
    const status = options.status || 'PENDING';
    // If status is ACTIVE, automatically set emailVerified to true (required for login)
    const emailVerified = options.emailVerified !== undefined 
      ? options.emailVerified 
      : (status === 'ACTIVE' ? true : false);

    logInfo('Creating admin account', {
      username: options.username,
      theme: options.theme,
      email: options.email || 'not provided',
      role,
      status,
      emailVerified
    });

    // ⚠️⚠️⚠️ - [WARNING] Warn if creating ACTIVE admin without email verification
    if (status === 'ACTIVE' && !emailVerified) {
      logError('WARNING: Creating ACTIVE admin without email verification. Admin will not be able to log in.');
      console.log('⚠️⚠️⚠️ - [seedAdmin] Authentication requires emailVerified=true for ACTIVE admins');
    }

    // 🟡🟡🟡 - [CREATE ADMIN] Create admin using AdminService
    const admin = await AdminService.createAdmin(
      options.username,
      options.password,
      options.theme,
      options.email,
      options.firstName,
      options.lastName,
      options.phone,
      role,
      status,
      emailVerified
    );

    logSuccess('Admin account created successfully', {
      id: admin.id.substring(0, 8) + '...',
      username: admin.username,
      theme: admin.theme,
      email: admin.email || 'not set',
      role: admin.role,
      status: admin.status,
      emailVerified: admin.emailVerified
    });

    console.log('\n✅✅✅ Admin account created successfully!');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Username: ${admin.username}`);
    console.log(`   Theme: ${admin.theme}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Email Verified: ${admin.emailVerified ? 'Yes' : 'No'}`);
    if (admin.email) {
      console.log(`   Email: ${admin.email}`);
    }
    if (admin.firstName || admin.lastName) {
      console.log(`   Name: ${admin.firstName} ${admin.lastName}`.trim());
    }
    console.log(`   Created at: ${admin.createdAt.toISOString()}`);
    
    // ⚠️⚠️⚠️ - [LOGIN INFO] Display login instructions for ACTIVE admins
    if (admin.status === 'ACTIVE' && admin.emailVerified) {
      console.log('\n⚠️⚠️⚠️ Login Information:');
      console.log(`   URL: https://${admin.theme}.yourdomain.com/admin/login`);
      console.log(`   Username: ${admin.username}`);
      console.log(`   Password: [the password you provided]`);
      console.log(`   ⚠️⚠️⚠️ Make sure to change the default password after first login!`);
    } else if (admin.status === 'ACTIVE' && !admin.emailVerified) {
      console.log('\n❗❗❗ WARNING: Admin is ACTIVE but email is not verified.');
      console.log('   Admin will NOT be able to log in until email is verified.');
    } else {
      console.log('\n⚠️⚠️⚠️ Note: Admin status is not ACTIVE. Admin cannot log in yet.');
      console.log('   To activate: Update status to ACTIVE and set emailVerified=true');
    }

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

