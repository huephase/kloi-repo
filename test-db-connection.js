const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
    console.log('🔍 Testing database connection...');
    console.log('DATABASE_URL configured:', !!process.env.DATABASE_URL);
    
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });
    
    try {
        console.log('🔍 Attempting to connect...');
        await prisma.$connect();
        console.log('✅ Connected successfully');
        
        console.log('🔍 Testing query...');
        const result = await prisma.$queryRaw`SELECT version() as db_version, now() as current_time`;
        console.log('✅ Query result:', result);
        
        console.log('🔍 Testing table counts...');
        const customerCount = await prisma.customers.count();
        console.log('✅ Customers count:', customerCount);
        
        const orderCount = await prisma.kloiOrdersTable.count();
        console.log('✅ Orders count:', orderCount);
        
        console.log('✅ All database operations successful!');
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('❌ Error code:', error.code);
        console.error('❌ Full error:', error);
    } finally {
        await prisma.$disconnect();
        console.log('🔍 Disconnected from database');
    }
}

testDatabaseConnection().catch(console.error);