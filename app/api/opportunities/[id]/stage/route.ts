import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { triggerWorkflow } from "@/app/lib/workflows";

const prisma = new PrismaClient();

// The atomic endpoint designated explicitly for Lightning-Fast Drag and Drop status mutations.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();
    const { companyId, stage } = body;

    if (!companyId || !stage) {
      return NextResponse.json({ error: "Missing Stage Mutation context" }, { status: 400 });
    }

    // Verify
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized manipulation access." }, { status: 403 });
    }

    // Update
    const updated = await prisma.opportunity.update({
      where: { id },
      data: { stage },
      include: {
        contact: { select: { name: true, email: true } },
        assignedUser: { select: { fullName: true } }
      }
    });

    // Scoring Engine Trigger: If moved, add a small engagement interaction score.
    // Specially heavy score given if moving directly into Closed Won.
    if (existing.contactId && stage !== existing.stage) {
      let bump = 5; // standard stage change
      if (stage === "closed_won") bump += 20;
      if (stage === "closed_lost") bump -= 10;
      
      await prisma.contact.update({
        where: { id: existing.contactId },
        data: { leadScore: { increment: bump } }
      });
      
      await prisma.activityLog.create({
        data: {
          companyId,
          contactId: existing.contactId,
          opportunityId: id,
          type: "stage_change",
          subject: "Stage Progression",
          body: `Deal moved from ${existing.stage} to ${stage}. Lead score adjusted by ${bump}.`
        }
      });
    }

    // --- WORKFLOW ENGINE HOOK --- //
    // Detects status progression logic globally asynchronously mapping Background Job Queues.
    await triggerWorkflow(companyId, "Opportunity", "status_change", updated);

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("[PATCH /api/opportunities/[id]/stage]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
