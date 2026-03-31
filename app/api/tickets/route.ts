import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId parameter." }, { status: 400 });
    }

    // Fetch tickets with assigned users and related contacts
    const tickets = await prisma.ticket.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      include: {
        assignedUser: { select: { id: true, fullName: true, employeeId: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(tickets);
  } catch (error: any) {
    console.error("[GET /api/tickets]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, title, description, priority, assignedTo, contactId } = body;

    if (!companyId || !title) {
      return NextResponse.json({ error: "Missing required fields: companyId, title" }, { status: 400 });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        companyId,
        title,
        description: description || null,
        priority: priority || "medium",
        status: "open",
        assignedTo: assignedTo || null,
        contactId: contactId || null,
      },
      include: {
        assignedUser: { select: { id: true, fullName: true, employeeId: true } },
      }
    });

    return NextResponse.json(newTicket, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/tickets]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
