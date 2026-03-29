import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, contactId, type, subject, body: content } = body;

    if (!companyId || !contactId || !type || !subject) {
      return NextResponse.json({ error: "Missing required dashboard payloads" }, { status: 400 });
    }

    // Insert generic activity timeline log
    const activity = await prisma.activityLog.create({
      data: {
        companyId,
        contactId,
        type, 
        subject,
        body: content || null
      }
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/activities]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
