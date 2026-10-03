const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding...');

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.grievanceSimilarity.deleteMany();
  await prisma.grievanceAnalysis.deleteMany();
  await prisma.grievance.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // -------------------------------------------------------------
  // 1. SEED USERS (with bcrypt hashed passwords)
  // -------------------------------------------------------------
  console.log('[Seed] Seeding users with bcrypt password hashes...');
  const saltRounds = 10;
  
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', saltRounds);
  const authorityPasswordHash = await bcrypt.hash('AuthorityPass123!', saltRounds);
  const citizenPasswordHash = await bcrypt.hash('CitizenPass123!', saltRounds);

  // 1 Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator',
      email: 'admin@grievance.gov.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      department: 'Central IT & Governance Office'
    }
  });

  // 2 Authorities
  const authorityRoads = await prisma.user.create({
    data: {
      name: 'Inspector Rajesh Sharma',
      email: 'authority.roads@grievance.gov.in',
      passwordHash: authorityPasswordHash,
      role: 'AUTHORITY',
      department: 'Roads & Municipal Infrastructure'
    }
  });

  const authorityWater = await prisma.user.create({
    data: {
      name: 'Officer Priya Patel',
      email: 'authority.water@grievance.gov.in',
      passwordHash: authorityPasswordHash,
      role: 'AUTHORITY',
      department: 'Water Supply & Sewage Board'
    }
  });

  // 3 Citizens
  const citizen1 = await prisma.user.create({
    data: {
      name: 'Aarav Mehta',
      email: 'aarav.citizen@example.com',
      passwordHash: citizenPasswordHash,
      role: 'CITIZEN'
    }
  });

  const citizen2 = await prisma.user.create({
    data: {
      name: 'Ananya Roy',
      email: 'ananya.citizen@example.com',
      passwordHash: citizenPasswordHash,
      role: 'CITIZEN'
    }
  });

  const citizen3 = await prisma.user.create({
    data: {
      name: 'Vikram Singh',
      email: 'vikram.citizen@example.com',
      passwordHash: citizenPasswordHash,
      role: 'CITIZEN'
    }
  });

  console.log('[Seed] Users seeded successfully.');

  // -------------------------------------------------------------
  // 2. SEED CATEGORIES
  // -------------------------------------------------------------
  console.log('[Seed] Seeding grievance categories...');
  const categoryRoads = await prisma.category.create({
    data: {
      name: 'Roads & Transport Infrastructure',
      description: 'Potholes, damaged pavement, broken streetlights, traffic signals, road caving'
    }
  });

  const categoryWater = await prisma.category.create({
    data: {
      name: 'Water Supply & Sanitation',
      description: 'Pipeline leakage, sewage overflow, contaminated drinking water, low pressure'
    }
  });

  const categoryWaste = await prisma.category.create({
    data: {
      name: 'Waste Management & Cleanliness',
      description: 'Uncollected garbage, illegal dumping, blocked municipal drains, public bins overflowing'
    }
  });

  const categoryElectricity = await prisma.category.create({
    data: {
      name: 'Electricity & Power Distribution',
      description: 'Transformer sparks, hanging high-voltage cables, prolonged localized blackouts'
    }
  });

  const categorySafety = await prisma.category.create({
    data: {
      name: 'Public Safety & Civic Nuisance',
      description: 'Hazardous public structures, stray dog pack hazards, unauthorized commercial noise'
    }
  });

  console.log('[Seed] Categories seeded successfully.');

  // -------------------------------------------------------------
  // 3. SEED GRIEVANCES & ANALYSIS RECORDS
  // -------------------------------------------------------------
  console.log('[Seed] Seeding realistic grievances & AI intelligence analyses...');

  // Grievance 1: Severe road hazard (High Priority, In Progress)
  const grievance1 = await prisma.grievance.create({
    data: {
      title: 'Dangerous open manhole and large pothole near Metro Pillar 42',
      description: 'Deep pothole causing serious two-wheeler skids and an open manhole cover left unattended for 3 days on Station Road near Metro Pillar 42.',
      location: 'Station Road, Sector 4, near Metro Pillar 42',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      categoryId: categoryRoads.id,
      submittedById: citizen1.id,
      assignedToId: authorityRoads.id,
      analysis: {
        create: {
          predictedCategory: 'Roads & Transport Infrastructure',
          categoryConfidence: 0.94,
          severityScore: 0.85,
          predictedPriority: 'HIGH',
          isAnomalous: false,
          anomalyReason: null,
          modelVersion: 'distilbert-grievance-v1.0'
        }
      }
    },
    include: { analysis: true }
  });

  // Grievance 2: Similar complaint nearby (High Priority, Under Review)
  const grievance2 = await prisma.grievance.create({
    data: {
      title: 'Broken pavement and uncovered storm drain on Station Road',
      description: 'Pedestrians are at risk due to uncovered drain lid and deteriorating road surface near Metro Pillar 42. Multiple near-misses observed.',
      location: 'Station Road, adjacent to Pillar 42',
      status: 'UNDER_REVIEW',
      priority: 'HIGH',
      categoryId: categoryRoads.id,
      submittedById: citizen2.id,
      assignedToId: authorityRoads.id,
      analysis: {
        create: {
          predictedCategory: 'Roads & Transport Infrastructure',
          categoryConfidence: 0.91,
          severityScore: 0.78,
          predictedPriority: 'HIGH',
          isAnomalous: false,
          anomalyReason: null,
          modelVersion: 'distilbert-grievance-v1.0'
        }
      }
    },
    include: { analysis: true }
  });

  // Grievance 3: Contaminated water supply (Critical Priority, Assigned)
  const grievance3 = await prisma.grievance.create({
    data: {
      title: 'Main pipeline rupture causing severe contaminated drinking water supply',
      description: 'Drinking water has a strong sewage smell and brownish color across Block C since yesterday evening. Poses urgent health hazards for residential households.',
      location: 'Block C, Green Park Colony',
      status: 'ASSIGNED',
      priority: 'CRITICAL',
      categoryId: categoryWater.id,
      submittedById: citizen3.id,
      assignedToId: authorityWater.id,
      analysis: {
        create: {
          predictedCategory: 'Water Supply & Sanitation',
          categoryConfidence: 0.98,
          severityScore: 0.95,
          predictedPriority: 'CRITICAL',
          isAnomalous: false,
          anomalyReason: null,
          modelVersion: 'distilbert-grievance-v1.0'
        }
      }
    },
    include: { analysis: true }
  });

  // Grievance 4: Anomalous / Spam Complaint (Rejected)
  const grievance4 = await prisma.grievance.create({
    data: {
      title: 'TEST TEST !!! CASH PRIZE LOTTERY CLAIM 50000',
      description: 'Call immediately to claim lottery reward cash 50000 rupees urgent notice 9999999999 click promotional link.',
      location: 'Online / Unknown',
      status: 'REJECTED',
      priority: 'LOW',
      categoryId: categorySafety.id,
      submittedById: citizen3.id,
      assignedToId: null,
      analysis: {
        create: {
          predictedCategory: 'Public Safety & Civic Nuisance',
          categoryConfidence: 0.42,
          severityScore: 0.10,
          predictedPriority: 'LOW',
          isAnomalous: true,
          anomalyReason: 'High spam/promotional probability detected: commercial solicitation and non-civic payload pattern.',
          modelVersion: 'distilbert-grievance-v1.0'
        }
      }
    },
    include: { analysis: true }
  });

  // Grievance 5: Garbage accumulation (Submitted, Medium Priority)
  const grievance5 = await prisma.grievance.create({
    data: {
      title: 'Overflowing garbage pile accumulating beside primary school gate',
      description: 'Municipal waste collection vehicle has not arrived for 5 days. Stray animals are scattering waste directly near the school entrance.',
      location: 'Navodaya Primary School Gate, Ward 12',
      status: 'SUBMITTED',
      priority: 'MEDIUM',
      categoryId: categoryWaste.id,
      submittedById: citizen1.id,
      assignedToId: null,
      analysis: {
        create: {
          predictedCategory: 'Waste Management & Cleanliness',
          categoryConfidence: 0.95,
          severityScore: 0.60,
          predictedPriority: 'MEDIUM',
          isAnomalous: false,
          anomalyReason: null,
          modelVersion: 'distilbert-grievance-v1.0'
        }
      }
    },
    include: { analysis: true }
  });

  console.log('[Seed] Grievances and analyses seeded successfully.');

  // -------------------------------------------------------------
  // 4. SEED SIMILARITY RELATIONSHIPS
  // -------------------------------------------------------------
  console.log('[Seed] Seeding grievance similarity relationship...');
  const similarity = await prisma.grievanceSimilarity.create({
    data: {
      sourceGrievanceId: grievance1.id,
      targetGrievanceId: grievance2.id,
      similarityScore: 0.88
    }
  });

  // -------------------------------------------------------------
  // 5. SEED AUDIT LOGS
  // -------------------------------------------------------------
  console.log('[Seed] Seeding realistic audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: 'SYSTEM',
        details: { description: 'Civic grievance database initialized and categories configured.' },
        ipAddress: '127.0.0.1'
      },
      {
        userId: citizen1.id,
        action: 'GRIEVANCE_SUBMITTED',
        entityType: 'Grievance',
        entityId: grievance1.id,
        details: { title: grievance1.title, priority: grievance1.priority, category: categoryRoads.name },
        ipAddress: '192.168.1.101'
      },
      {
        userId: null,
        action: 'AI_ANALYSIS_EXECUTED',
        entityType: 'GrievanceAnalysis',
        entityId: grievance1.analysis.id,
        details: {
          predictedCategory: 'Roads & Transport Infrastructure',
          severityScore: 0.85,
          predictedPriority: 'HIGH'
        },
        ipAddress: '172.19.0.4'
      },
      {
        userId: citizen2.id,
        action: 'GRIEVANCE_SUBMITTED',
        entityType: 'Grievance',
        entityId: grievance2.id,
        details: { title: grievance2.title, priority: grievance2.priority, category: categoryRoads.name },
        ipAddress: '192.168.1.102'
      },
      {
        userId: null,
        action: 'SIMILARITY_DETECTED',
        entityType: 'GrievanceSimilarity',
        entityId: similarity.id,
        details: {
          sourceGrievanceId: grievance1.id,
          targetGrievanceId: grievance2.id,
          similarityScore: 0.88
        },
        ipAddress: '172.19.0.4'
      },
      {
        userId: authorityRoads.id,
        action: 'GRIEVANCE_ASSIGNED',
        entityType: 'Grievance',
        entityId: grievance1.id,
        details: {
          previousStatus: 'SUBMITTED',
          newStatus: 'IN_PROGRESS',
          assignedTo: authorityRoads.email
        },
        ipAddress: '192.168.1.50'
      },
      {
        userId: admin.id,
        action: 'GRIEVANCE_STATUS_UPDATED',
        entityType: 'Grievance',
        entityId: grievance4.id,
        details: {
          previousStatus: 'SUBMITTED',
          newStatus: 'REJECTED',
          reason: 'Automated spam detection verified by administrator'
        },
        ipAddress: '192.168.1.10'
      }
    ]
  });

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
