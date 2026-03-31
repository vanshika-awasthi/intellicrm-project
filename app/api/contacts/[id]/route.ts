import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch Contact AND their activity timeline chronologically
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        activities: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    console.error("[GET /api/contacts/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { companyId, name, email, phone, companyName, type } = body;

    if (!companyId) {
      return NextResponse.json({ error: "Missing verification payload companyId" }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: { name, email, phone, companyName, type }
    });

    // Log update
    await prisma.activityLog.create({
      data: {
        companyId,
        contactId: id,
        type: "note",
        subject: "Profile Updated",
        body: "Contact details were modified."
      }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[PUT /api/contacts/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { companyId } = body;

    const existing = await prisma.contact.findUnique({ where: { id } });
    if (!existing || existing.companyId !== companyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.contact.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/contacts/[id]]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
