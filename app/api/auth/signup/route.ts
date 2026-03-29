import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_12345");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_id, company_name, employee_id, full_name, email, password } = body;

    // Fast check if company ID exists
    const existingCompany = await prisma.company.findUnique({
      where: { companyId: company_id },
    });

    if (existingCompany) {
      return NextResponse.json({ error: "Company ID already taken" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create Company and Admin User in a single transaction
    const newCompany = await prisma.company.create({
      data: {
        companyId: company_id,
        name: company_name,
        users: {
          create: {
            employeeId: employee_id,
            fullName: full_name,
            emailEnc: email,
            passwordHash: passwordHash,
            role: "admin",
          },
        },
      },
      include: {
        users: true,
      },
    });

    const user = newCompany.users[0];

    // Issue JWT
    const token = await new SignJWT({
      sub: user.id,
      companyId: newCompany.companyId,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      access_token: token,
      user: {
        id: user.id,
        company_id: user.companyId,
        employee_id: user.employeeId,
        role: user.role,
      },
    });

    response.cookies.set("refresh_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/auth/signup]", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
