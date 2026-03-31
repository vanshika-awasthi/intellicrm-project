import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId context" }, { status: 400 });
    }

    const opportunities = await prisma.opportunity.findMany({
      where: { companyId },
      include: {
        contact: { select: { name: true, email: true } },
        assignedUser: { select: { fullName: true } }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: opportunities });
  } catch (err: any) {
    console.error("[GET /api/opportunities]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, title, value, probability, expectedClose, stage, assignedTo, contactId } = body;

    if (!companyId || !title) {
      return NextResponse.json({ error: "CompanyId and Title are strictly required" }, { status: 400 });
    }

    const newDeal = await prisma.opportunity.create({
      data: {
        companyId,
        title,
        value: typeof value === "number" ? value : parseFloat(value) || 0,
        probability: typeof probability === "number" ? probability : parseInt(probability) || 0,
        expectedClose: expectedClose ? new Date(expectedClose) : null,
        stage: stage || "lead",
        assignedTo: assignedTo || null,
        contactId: contactId || null
      },
      include: {
        contact: { select: { name: true, email: true } },
        assignedUser: { select: { fullName: true } }
      }
    });

    // Auto Lead-Scoring Mechanism (+10 for active deal, +1 per $1000 size)
    if (contactId) {
      const scoreIncrease = 10 + Math.floor(newDeal.value / 1000);
      await prisma.contact.update({
        where: { id: contactId },
        data: { leadScore: { increment: scoreIncrease } }
      });
      
      await prisma.activityLog.create({
        data: {
          companyId,
          contactId,
          opportunityId: newDeal.id,
          type: "note",
          subject: "Deal Initiated",
          body: `An opportunity worth ₹${newDeal.value} was registered. Contact Lead Score increased artificially by ${scoreIncrease}.`
        }
      });
    }

    return NextResponse.json({ success: true, data: newDeal }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/opportunities]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
