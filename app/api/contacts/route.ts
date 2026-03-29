import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { triggerWorkflow } from "@/app/lib/workflows";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    const contacts = await prisma.contact.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ success: true, data: contacts });
  } catch (error: any) {
    console.error("[GET /api/contacts]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, name, email, phone, companyName, type } = body;

    if (!companyId || !name) {
      return NextResponse.json({ error: "CompanyId and Name are required" }, { status: 400 });
    }

    const newContact = await prisma.contact.create({
      data: {
        companyId,
        name,
        email: email || null,
        phone: phone || null,
        companyName: companyName || null,
        type: type || "lead"
      }
    });

    // Auto-log creation activity
    await prisma.activityLog.create({
      data: {
        companyId,
        contactId: newContact.id,
        type: "note",
        subject: "Contact Created",
        body: `Contact ${name} was added to the CRM.`
      }
    });

    // --- WORKFLOW ENGINE HOOK --- //
    // Dispatches background job queue events automatically if matching rules exist!
    await triggerWorkflow(companyId, "Contact", "created", newContact);

    return NextResponse.json({ success: true, data: newContact }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/contacts]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
