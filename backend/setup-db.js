const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Check if tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'User'
    `;
    
    if (tables.length === 0) {
      console.log('📋 Creating database tables...');
      
      // Create tables
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "signupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lifetimeFree" BOOLEAN NOT NULL DEFAULT false,
        "name" TEXT,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "StudyRoom" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "subject" TEXT NOT NULL,
        "maxParticipants" INTEGER NOT NULL,
        "isPrivate" BOOLEAN NOT NULL DEFAULT false,
        "createdById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "StudyRoom_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Message" (
        "id" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "roomId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "Participant" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
      )`;
      
      await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Participant_userId_roomId_key" ON "Participant"("userId", "roomId")`;
      
      console.log('✅ Database tables created successfully');
    } else {
      console.log('✅ Database tables already exist');
    }
    
    // Create a test user
    try {
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          passwordHash: 'test-hash',
          name: 'Test User',
          lifetimeFree: true
        }
      });
      console.log('✅ Test user created:', testUser.email);
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('ℹ️  Test user already exists');
      } else {
        console.error('❌ Error creating test user:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Try these solutions:');
    console.log('1. Check your DATABASE_URL in .env file');
    console.log('2. Make sure your Render database is running');
    console.log('3. Verify your database credentials');
    console.log('4. Try using SQLite for local development');
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase(); 