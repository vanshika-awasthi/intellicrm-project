import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId parameter." }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: { companyId },
      select: {
        id: true,
        employeeId: true,
        fullName: true,
        role: true,
        isActive: true,
      },
      orderBy: { fullName: 'asc' }
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("[GET /api/users] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { companyId, employeeId, fullName, email, role, password, isActive } = body;

    // Validate essential fields
    if (!companyId || !employeeId || !password) {
      return NextResponse.json({ error: "Company ID, Employee ID, and Password are required." }, { status: 400 });
    }

    // Check if employee ID already is taken in the workspace
    const existing = await prisma.user.findUnique({
      where: {
        companyId_employeeId: {
          companyId,
          employeeId
        }
      }
    });

    if (existing) {
      return NextResponse.json({ error: "That Employee ID is already registered in your workspace." }, { status: 409 });
    }

    // Securely hash the provided password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create User record
    const newUser = await prisma.user.create({
      data: {
        companyId,
        employeeId,
        fullName: fullName || "",
        emailEnc: email || "",
        role: role || "employee",
        passwordHash,
        isActive: isActive !== false 
      }
    });

    // We do not return the password hash
    return NextResponse.json({ 
      success: true, 
      message: "Team member successfully provisioned."
    }, { status: 201 });

  } catch (error: any) {
    console.error("[POST /api/users] Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
