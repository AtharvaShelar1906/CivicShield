const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, department: true } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const grievances = await prisma.grievance.findMany({
    include: {
      category: { select: { name: true } },
      submittedBy: { select: { name: true, role: true } },
      assignedTo: { select: { name: true } },
      analysis: true,
      similarAsSource: true
    }
  });
  const analyses = await prisma.grievanceAnalysis.findMany();
  const similarities = await prisma.grievanceSimilarity.findMany();
  const auditLogs = await prisma.auditLog.findMany();

  const report = {
    counts: {
      users: users.length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      authorities: users.filter(u => u.role === 'AUTHORITY').length,
      citizens: users.filter(u => u.role === 'CITIZEN').length,
      categories: categories.length,
      grievances: grievances.length,
      analyses: analyses.length,
      similarities: similarities.length,
      auditLogs: auditLogs.length
    },
    users: users.map(u => ({ email: u.email, role: u.role, name: u.name, department: u.department })),
    categories: categories.map(c => c.name),
    grievances: grievances.map(g => ({
      title: g.title,
      status: g.status,
      priority: g.priority,
      category: g.category.name,
      submittedBy: g.submittedBy.name,
      assignedTo: g.assignedTo ? g.assignedTo.name : 'Unassigned',
      analysis: g.analysis ? {
        predictedCategory: g.analysis.predictedCategory,
        confidence: g.analysis.categoryConfidence,
        severity: g.analysis.severityScore,
        predictedPriority: g.analysis.predictedPriority,
        isAnomalous: g.analysis.isAnomalous
      } : null
    })),
    similarities: similarities.map(s => ({
      sourceGrievanceId: s.sourceGrievanceId,
      targetGrievanceId: s.targetGrievanceId,
      similarityScore: s.similarityScore
    })),
    auditLogs: auditLogs.map(a => ({ action: a.action, entityType: a.entityType, ipAddress: a.ipAddress }))
  };

  console.log(JSON.stringify(report, null, 2));
}

verify()
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
