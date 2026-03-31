import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      companyId, 
      name, 
      email, 
      role, 
      department, 
      address, 
      status, 
      targetValue, 
      targetDate, 
      notify,
      userId // user who performed the action onboarding
    } = body;

    if (!companyId || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Since we need to create multiple records atomically, we use a Prisma transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Contact
      const newContact = await tx.contact.create({
        data: {
          companyId,
          name,
          email,
          jobTitle: role,
          type: status === "closed_won" ? "customer" : "lead",
          customFields: {
            department: department || "",
            address: address || ""
          },
          assignedTo: userId || null
        }
      });

      // 2. Create the Opportunity
      const newOp = await tx.opportunity.create({
        data: {
          companyId,
          contactId: newContact.id,
          title: `New Deal: ${name}`,
          stage: status || "lead",
          value: parseFloat(targetValue) || 0,
          expectedClose: targetDate ? new Date(targetDate) : null,
          assignedTo: userId || null
        }
      });

      // 3. Create an Activity Log representing this onboarding
      await tx.activityLog.create({
        data: {
          companyId,
          contactId: newContact.id,
          opportunityId: newOp.id,
          performedBy: userId || null,
          type: notify ? "email" : "note",
          subject: notify ? "Sent Welcome Email to New Contact" : "Onboarded New Contact manually",
          body: `Added ${name} to pipeline at stage ${status} with expected value ₹${targetValue}. Department: ${department}. Address: ${address}.`,
        }
      });

      return { contact: newContact, opportunity: newOp };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Onboarding successful", 
      data: result 
    }, { status: 201 });

  } catch (error: any) {
    console.error("[POST /api/onboarding] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
