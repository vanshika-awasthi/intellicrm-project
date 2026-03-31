import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId parameter" }, { status: 400 });
    }

    // 1. Total Contacts
    const contactsCount = await prisma.contact.count({
      where: { companyId }
    });

    // 2. Active Opportunities
    const activeOpsCount = await prisma.opportunity.count({
      where: { 
        companyId,
        stage: { in: ['lead', 'qualified', 'proposal'] }
      }
    });

    // 3. Pipeline Value & Deals
    const allOps = await prisma.opportunity.findMany({
      where: { companyId },
      select: { id: true, value: true, stage: true, expectedClose: true }
    });
    
    // Calculate current pipeline value (excluding lost)
    const activeAndWonOps = allOps.filter(op => op.stage !== 'closed_lost');
    const pipelineVal = activeAndWonOps.reduce((sum: number, op: any) => sum + op.value, 0);

    // 4. Open Tickets
    const openTicketsCount = await prisma.ticket.count({
      where: { 
        companyId,
        status: { in: ['open', 'in_progress'] }
      }
    });

    // 5. Activity Logs (Recent 5)
    let activities = await prisma.activityLog.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    // Transform missing fields for UI
    const mappedActivities = activities.map((act: any) => {
      let color = "#1D9E75";
      if (act.type === 'email') color = "#F39C12";
      if (act.type === 'call') color = "#3498DB";
      if (act.type === 'stage_change') color = "#9B59B6";

      return {
        id: act.id,
        type: act.type,
        subject: act.subject,
        desc: act.body || "No details provided",
        time: act.createdAt.toLocaleDateString(),
        color
      };
    });

    // 6. Pipeline stages Breakdown (For pie chart & progress bar)
    const stageCounts = activeAndWonOps.reduce((acc: any, op: any) => {
      acc[op.stage] = (acc[op.stage] || 0) + 1;
      return acc;
    }, {});

    const totalDealsForStages = activeAndWonOps.length || 1; // avoid div by zero
    const pipelineBreakdown = {
      leadPercent: Math.round(((stageCounts.lead || 0) / totalDealsForStages) * 100),
      qualPercent: Math.round(((stageCounts.qualified || 0) / totalDealsForStages) * 100),
      propPercent: Math.round(((stageCounts.proposal || 0) / totalDealsForStages) * 100),
      wonPercent: Math.round(((stageCounts.closed_won || 0) / totalDealsForStages) * 100),
      
      // Additional precise values for Pie Chart
      distribution: [
        { name: 'Lead', value: stageCounts.lead || 0, fill: '#3498DB' },
        { name: 'Qualified', value: stageCounts.qualified || 0, fill: '#F39C12' },
        { name: 'Proposal', value: stageCounts.proposal || 0, fill: '#9B59B6' },
        { name: 'Closed Won', value: stageCounts.closed_won || 0, fill: '#1D9E75' }
      ].filter(d => d.value > 0)
    };

    // 7. Revenue Forecast (Grouping by expected close month)
    const forecastMap: Record<string, { month: string, wonSum: number, pipelineSum: number }> = {};
    
    allOps.forEach(op => {
      if (!op.expectedClose) return;
      const date = new Date(op.expectedClose);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = date.toLocaleString('default', { month: 'short' }) + ' ' + date.getFullYear();
      
      if (!forecastMap[monthKey]) {
        forecastMap[monthKey] = { month: monthLabel, wonSum: 0, pipelineSum: 0 };
      }
      
      if (op.stage === 'closed_won') {
        forecastMap[monthKey].wonSum += op.value;
      } else if (op.stage !== 'closed_lost') {
        forecastMap[monthKey].pipelineSum += op.value;
      }
    });

    const revenueForecast = Object.values(forecastMap).sort((a: any, b: any) => {
      return new Date(a.month).getTime() - new Date(b.month).getTime(); // rudimentary sort by month string parse
    });

    // 8. Team Productivity
    // Get top users in company and count their activities and open ops
    const topUsers = await prisma.user.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        _count: {
          select: {
            opportunitiesAssigned: true,
            activities: true
          }
        }
      },
      take: 6
    });

    const teamProductivity = topUsers.map(user => ({
      name: user.fullName || user.employeeId,
      deals: user._count.opportunitiesAssigned,
      activities: user._count.activities
    }));

    return NextResponse.json({
      metrics: {
        contacts: contactsCount,
        activeOps: activeOpsCount,
        pipelineVal,
        openTickets: openTicketsCount
      },
      pipelineBreakdown,
      revenueForecast,
      teamProductivity,
      activities: mappedActivities.length ? mappedActivities : [
        { id: 'none', type: 'note', subject: 'Welcome to IntelliCRM', desc: 'No activities yet. Start adding contacts!', time: 'Now', color: '#1D9E75' }
      ]
    });

  } catch (error: any) {
    console.error("[GET /api/dashboard]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
