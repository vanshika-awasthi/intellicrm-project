import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID parameter." }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, status, priority, assignedTo } = body;

    // Check if the status is changing to 'resolved' or 'closed' to log resolution time
    let resolvedAt = undefined;
    if (status === "resolved" || status === "closed") {
      resolvedAt = new Date();
    } else if (status === "open" || status === "in_progress") {
      resolvedAt = null; // reset if re-opened
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(resolvedAt !== undefined && { resolvedAt })
      },
      include: {
        assignedUser: { select: { id: true, fullName: true, employeeId: true } },
      }
    });

    return NextResponse.json(updatedTicket);
  } catch (error: any) {
    console.error("[PUT /api/tickets/[id]]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json({ error: "Missing ticket ID parameter." }, { status: 400 });
    }

    await prisma.ticket.delete({
      where: { id: ticketId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DELETE /api/tickets/[id]]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
