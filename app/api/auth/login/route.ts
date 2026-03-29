import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const prisma = new PrismaClient();
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "default_super_secret_key_12345");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_id, employee_id, password } = body;

    const user = await prisma.user.findUnique({
      where: {
        companyId_employeeId: {
          companyId: company_id,
          employeeId: employee_id,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await new SignJWT({
      sub: user.id,
      companyId: user.companyId,
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
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json(
      { error: `API CRASHED: ${error.message} \n ${error.stack}` },
      { status: 500 }
    );
  }
}
