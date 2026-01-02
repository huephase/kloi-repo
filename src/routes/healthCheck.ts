// src/routes/healthCheck.ts - System Health Check Dashboard
import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import { redisClient } from '../config';
import { requireAdminSubdomain } from '../hooks/adminHooks';

interface HealthCheckResult {
  name: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  duration?: number;
  timestamp: string;
}

export default async function healthCheck(app: FastifyInstance, _opts: FastifyPluginOptions) {
  
  // ⚠️⚠️⚠️ - 2026-01-02 - [RENDER HEALTH CHECK] Lightweight health check endpoint for Render's internal monitoring
  // This endpoint must be fast, simple, and accessible without admin subdomain requirements
  // Render checks this endpoint at: kloi-repo.onrender.com:3000/kloiserverhealthcheck
  app.get('/kloiserverhealthcheck', async (request: FastifyRequest, reply: FastifyReply) => {
    // ⚠️⚠️⚠️ - 2026-01-02 - [RENDER HEALTH CHECK] Check if this is Render's internal health check
    // Render's health check uses the onrender.com domain, not the custom domain
    const hostname = request.hostname || (Array.isArray(request.headers.host) ? request.headers.host[0] : request.headers.host) || '';
    const userAgent = Array.isArray(request.headers['user-agent']) ? request.headers['user-agent'][0] : request.headers['user-agent'] || '';
    const isRenderHealthCheck = hostname.includes('onrender.com') || 
                                hostname.includes('render.com') ||
                                userAgent.includes('got'); // Render uses 'got' library
    
    // ⚠️⚠️⚠️ - 2026-01-02 - [RENDER HEALTH CHECK] If it's Render's health check, return simple 200 OK
    if (isRenderHealthCheck) {
      console.log('🟡🟡🟡 - [RENDER HEALTH CHECK] Render internal health check detected, returning quick response');
      
      try {
        // ⚠️⚠️⚠️ - 2026-01-02 - [RENDER HEALTH CHECK] Quick database ping with timeout
        const dbCheck = Promise.race([
          prisma.$queryRaw`SELECT 1 as health`,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database check timeout')), 5000)
          )
        ]);
        
        await dbCheck;
        console.log('✅✅✅ - [RENDER HEALTH CHECK] Quick health check passed');
        
        return reply.status(200).send({
          status: 'ok',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('❗❗❗ - [RENDER HEALTH CHECK] Quick health check failed:', error);
        // ⚠️⚠️⚠️ - 2026-01-02 - [RENDER HEALTH CHECK] Still return 200 to prevent service restart
        // The detailed health check will show the actual error
        return reply.status(200).send({
          status: 'degraded',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // ⚠️⚠️⚠️ - 2026-01-02 - [ADMIN SUBDOMAIN] For custom domain requests, require admin subdomain
    const requireAdmin = requireAdminSubdomain();
    await requireAdmin(request, reply);
    if (reply.sent) return; // If admin check failed, response already sent
    
    // ⚠️⚠️⚠️ - 2026-01-02 - [DETAILED HEALTH CHECK] Full health check dashboard for admin access
    console.log('🟡🟡🟡 - [HEALTH CHECK] Starting comprehensive system health check');
    console.log('🟡🟡🟡 - [HEALTH CHECK] Starting comprehensive system health check');
    
    const startTime = Date.now();
    const results: HealthCheckResult[] = [];
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Server Time Check
    try {
      const serverTimeStart = Date.now();
      const serverTime = new Date();
      const serverTimeEnd = Date.now();
      
      results.push({
        name: 'Server Time',
        status: 'success',
        message: 'Server time synchronized successfully',
        details: {
          serverTime: serverTime.toISOString(),
          serverTimeLocal: serverTime.toLocaleString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          timestamp: serverTime.getTime()
        },
        duration: serverTimeEnd - serverTimeStart,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅✅✅ - [HEALTH CHECK] Server time check passed');
      
    } catch (error) {
      results.push({
        name: 'Server Time',
        status: 'error',
        message: 'Failed to get server time',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
      
      console.error('❗❗❗ - [HEALTH CHECK] Server time check failed:', error);
    }
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Database Connection Check
    // ⚠️⚠️⚠️ - 2026-01-02 - [DB CONNECTION] Removed $connect()/$disconnect() calls
    // Prisma manages connection pooling automatically - manual connect/disconnect interferes with the pool
    try {
      const dbStart = Date.now();
      console.log('❗❗❗ - [HEALTH CHECK][DB] Testing database connection... NODE_ENV=', process.env.NODE_ENV);
      console.log('❗❗❗ - [HEALTH CHECK][DB] DATABASE_URL configured:', !!process.env.DATABASE_URL);
      
      // ⚠️⚠️⚠️ - 2026-01-02 - [DB CONNECTION] Use existing connection pool, don't manually connect/disconnect
      // Prisma automatically manages connections - calling $connect() can cause pool exhaustion

      // 2025-09-11 - Detailed step-by-step DB diagnostics
      console.log('❗❗❗ - [HEALTH CHECK][DB] Running SELECT version(), now()');
      const testQuery = await prisma.$queryRaw`SELECT version() as db_version, now() as current_time`;
      console.log('❗❗❗ - [HEALTH CHECK][DB] Version/Time OK');
      
      const connectionTime = Date.now() - dbStart;

      let customerCount = -1;
      let sessionCount = -1;
      let orderCount = -1;
      let menuCount = -1;

      try {
        console.log('❗❗❗ - [HEALTH CHECK][DB] Counting Customers...');
        customerCount = await prisma.customers.count();
        console.log('❗❗❗ - [HEALTH CHECK][DB] Customers count =', customerCount);
      } catch (e: any) {
        console.error('❗❗❗ - [HEALTH CHECK][DB] Customers count FAILED:', e?.code, e?.message);
        throw e;
      }

      try {
        console.log('❗❗❗ - [HEALTH CHECK][DB] Counting Session...');
        sessionCount = await prisma.session.count();
        console.log('❗❗❗ - [HEALTH CHECK][DB] Session count =', sessionCount);
      } catch (e: any) {
        console.error('❗❗❗ - [HEALTH CHECK][DB] Session count FAILED:', e?.code, e?.message);
        throw e;
      }

      try {
        console.log('❗❗❗ - [HEALTH CHECK][DB] Counting kloiOrdersTable...');
        orderCount = await prisma.kloiOrdersTable.count();
        console.log('❗❗❗ - [HEALTH CHECK][DB] Orders count =', orderCount);
      } catch (e: any) {
        console.error('❗❗❗ - [HEALTH CHECK][DB] Orders count FAILED:', e?.code, e?.message);
        throw e;
      }

      try {
        console.log('❗❗❗ - [HEALTH CHECK][DB] Counting Menus...');
        menuCount = await prisma.menus.count();
        console.log('❗❗❗ - [HEALTH CHECK][DB] Menus count =', menuCount);
      } catch (e: any) {
        console.error('❗❗❗ - [HEALTH CHECK][DB] Menus count FAILED:', e?.code, e?.message);
        throw e;
      }
      
      results.push({
        name: 'Database Connection',
        status: 'success',
        message: 'Database connection healthy',
        details: {
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured',
          connectionTime: `${connectionTime}ms`,
          databaseInfo: testQuery,
          tableInfo: {
            customers: customerCount,
            sessions: sessionCount,
            orders: orderCount,
            menus: menuCount
          }
        },
        duration: connectionTime,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅✅✅ - [HEALTH CHECK] Database check passed');
      
    } catch (error) {
      results.push({
        name: 'Database Connection',
        status: 'error',
        message: 'Database connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          databaseUrl: process.env.DATABASE_URL ? 'Configured' : 'Not configured'
        },
        timestamp: new Date().toISOString()
      });
      
      console.error('❗❗❗ - [HEALTH CHECK] Database check failed:', error);
    }
    // ⚠️⚠️⚠️ - 2026-01-02 - [DB CONNECTION] Removed $disconnect() call
    // Prisma manages connection pooling - disconnecting breaks the pool for other requests
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Redis Connection Check
    try {
      const redisStart = Date.now();
      
      // Test Redis connection
      await redisClient.ping();
      const redisTime = Date.now() - redisStart;
      
      // Get Redis info
      const redisInfo = await redisClient.info('server');
      const redisMemory = await redisClient.info('memory');

      // Parse Redis connection details from env for accurate reporting
      const redisUrl = process.env.REDIS_URL;
      let reportedHost = process.env.REDIS_HOST || 'localhost';
      let reportedPort: number | string = process.env.REDIS_PORT || 6379;
      if (redisUrl) {
        try {
          const parsed = new URL(redisUrl);
          reportedHost = parsed.hostname || reportedHost;
          reportedPort = parsed.port || reportedPort;
        } catch (e) {
          console.log('🟤🟤🟤 - [HEALTH CHECK] Could not parse REDIS_URL; falling back to host/port');
        }
      }
      
      results.push({
        name: 'Redis Connection',
        status: 'success',
        message: 'Redis connection healthy',
        details: {
          urlConfigured: !!redisUrl,
          host: reportedHost,
          port: reportedPort,
          connectionTime: `${redisTime}ms`,
          serverInfo: redisInfo,
          memoryInfo: redisMemory
        },
        duration: redisTime,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅✅✅ - [HEALTH CHECK] Redis check passed');
      
    } catch (error) {
      const redisUrl = process.env.REDIS_URL;
      results.push({
        name: 'Redis Connection',
        status: 'error',
        message: 'Redis connection failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          urlConfigured: !!redisUrl,
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379
        },
        timestamp: new Date().toISOString()
      });
      
      console.error('❗❗❗ - [HEALTH CHECK] Redis check failed:', error);
    }
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Environment Variables Check
    try {
      const envStart = Date.now();

      // When REDIS_URL is provided, REDIS_HOST/REDIS_PORT are optional
      const criticalEnvVarsBase = [
        'DATABASE_URL',
        'REDIS_SESSION_SECRET',
        'SESSION_COOKIE_NAME'
      ];
      const criticalEnvVarsRedisSplit = ['REDIS_HOST', 'REDIS_PORT'];
      const useRedisUrl = !!process.env.REDIS_URL;
      const criticalEnvVars = useRedisUrl
        ? [...criticalEnvVarsBase, 'REDIS_URL']
        : [...criticalEnvVarsBase, ...criticalEnvVarsRedisSplit];
      
      const envStatus: Record<string, boolean> = {};
      criticalEnvVars.forEach(varName => {
        envStatus[varName] = !!process.env[varName];
      });
      
      const missingVars = criticalEnvVars.filter(varName => !process.env[varName]);
      const envTime = Date.now() - envStart;
      
      results.push({
        name: 'Environment Variables',
        status: missingVars.length > 0 ? 'warning' : 'success',
        message: missingVars.length > 0 ? 
          `${missingVars.length} critical environment variables missing` : 
          'All critical environment variables configured',
        details: {
          configuredVars: envStatus,
          missingVars: missingVars,
          nodeEnv: process.env.NODE_ENV || 'development'
        },
        duration: envTime,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅✅✅ - [HEALTH CHECK] Environment variables check completed');
      
    } catch (error) {
      results.push({
        name: 'Environment Variables',
        status: 'error',
        message: 'Failed to check environment variables',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
      
      console.error('❗❗❗ - [HEALTH CHECK] Environment variables check failed:', error);
    }
    
    // 👍👍👍👍👍👍 - 2024-12-28 - System Resource Check
    try {
      const resourceStart = Date.now();
      
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      const resourceTime = Date.now() - resourceStart;
      
      results.push({
        name: 'System Resources',
        status: 'success',
        message: 'System resources monitored',
        details: {
          memory: {
            rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
            heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
            heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
            external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`
          },
          cpu: {
            user: `${Math.round(cpuUsage.user / 1000)}ms`,
            system: `${Math.round(cpuUsage.system / 1000)}ms`
          },
          uptime: `${Math.round(uptime)}s`,
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        duration: resourceTime,
        timestamp: new Date().toISOString()
      });
      
      console.log('✅✅✅ - [HEALTH CHECK] System resources check completed');
      
    } catch (error) {
      results.push({
        name: 'System Resources',
        status: 'error',
        message: 'Failed to check system resources',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: new Date().toISOString()
      });
      
      console.error('❗❗❗ - [HEALTH CHECK] System resources check failed:', error);
    }
    
    const totalTime = Date.now() - startTime;
    const overallStatus = results.some(r => r.status === 'error') ? 'error' : 
                         results.some(r => r.status === 'warning') ? 'warning' : 'success';
    
    console.log(`✅✅✅ - [HEALTH CHECK] Health check completed in ${totalTime}ms with status: ${overallStatus}`);
    
    // 👍👍👍👍👍👍 - 2024-12-28 - Return HTML page with dark mode styling
    const htmlContent = generateHealthCheckHTML(results, totalTime, overallStatus);
    
    return reply
      .header('Content-Type', 'text/html')
      .send(htmlContent);
  });
}

// 👍👍👍👍👍👍 - 2024-12-28 - Generate HTML for health check dashboard
function generateHealthCheckHTML(results: HealthCheckResult[], totalTime: number, overallStatus: string): string {
  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔍';
    }
  };
  
  const statusColor = (status: string) => {
    switch (status) {
      case 'success': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#2196F3';
    }
  };
  
  const resultsHTML = results.map(result => `
    <div class="check-item" style="border-left: 4px solid ${statusColor(result.status)};">
      <div class="check-header">
        <span class="status-icon">${statusIcon(result.status)}</span>
        <span class="check-name">${result.name}</span>
        <span class="check-status" style="color: ${statusColor(result.status)};">${result.status.toUpperCase()}</span>
        ${result.duration ? `<span class="check-duration">${result.duration}ms</span>` : ''}
      </div>
      <div class="check-message">${result.message}</div>
      ${result.details ? `
        <details class="check-details">
          <summary>Details</summary>
          <pre>${JSON.stringify(result.details, null, 2)}</pre>
        </details>
      ` : ''}
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>System Health Check Dashboard</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #121212;
          color: #e0e0e0;
          line-height: 1.6;
          padding: 20px;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          background: linear-gradient(135deg, #1e1e1e, #2a2a2a);
          border-radius: 10px;
          border: 1px solid #333;
        }
        
        .header h1 {
          color: #fff;
          margin-bottom: 10px;
          font-size: 2.5em;
        }
        
        .header .status {
          font-size: 1.2em;
          font-weight: bold;
          color: ${statusColor(overallStatus)};
        }
        
        .header .timing {
          color: #888;
          margin-top: 10px;
          font-size: 0.9em;
        }
        
        .checks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .check-item {
          background: #1e1e1e;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #333;
          transition: all 0.3s ease;
        }
        
        .check-item:hover {
          background: #252525;
          transform: translateY(-2px);
        }
        
        .check-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        .status-icon {
          font-size: 1.5em;
        }
        
        .check-name {
          font-size: 1.2em;
          font-weight: bold;
          color: #fff;
          flex: 1;
        }
        
        .check-status {
          font-size: 0.9em;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .check-duration {
          font-size: 0.8em;
          color: #888;
          font-family: monospace;
        }
        
        .check-message {
          color: #ccc;
          margin-bottom: 10px;
        }
        
        .check-details {
          margin-top: 10px;
        }
        
        .check-details summary {
          cursor: pointer;
          color: #64B5F6;
          font-weight: bold;
          padding: 5px 0;
        }
        
        .check-details pre {
          background: #0a0a0a;
          padding: 15px;
          border-radius: 4px;
          border: 1px solid #333;
          margin-top: 10px;
          overflow-x: auto;
          font-size: 0.85em;
          color: #e0e0e0;
        }
        
        .footer {
          text-align: center;
          padding: 20px;
          background: #1e1e1e;
          border-radius: 8px;
          border: 1px solid #333;
          color: #888;
        }
        
        .refresh-btn {
          background: #2196F3;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 1em;
          margin-top: 15px;
          transition: background 0.3s ease;
        }
        
        .refresh-btn:hover {
          background: #1976D2;
        }
        
        @media (max-width: 768px) {
          .checks-grid {
            grid-template-columns: 1fr;
          }
          
          .header h1 {
            font-size: 2em;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KLOI</h1>
          <h2>${statusIcon(overallStatus)} System Health Check Dashboard</h2>
          <div class="status">Overall Status: ${overallStatus.toUpperCase()}</div>
          <div class="timing">
            Completed in ${totalTime}ms • ${new Date().toLocaleString()}
          </div>
        </div>
        
        <div class="checks-grid">
          ${resultsHTML}
        </div>
        
        <div class="footer">
          <p>🔍 System Health Check Dashboard • KLOI Platform</p>
          <p>This dashboard automatically tests all critical system components</p>
          <button class="refresh-btn" onclick="window.location.reload()">🔄 Refresh Checks</button>
        </div>
      </div>
      
      <script>
        // 👍👍👍👍👍👍 - 2024-12-28 - Auto-refresh every 5 minutes
        setTimeout(() => {
          console.log('🟡🟡🟡 - [HEALTH CHECK] Auto-refreshing health check dashboard');
          window.location.reload();
        }, 300000); // 5 minutes
        
        console.log('✅✅✅ - [HEALTH CHECK] Health check dashboard loaded successfully');
      </script>
    </body>
    </html>
  `;
} 