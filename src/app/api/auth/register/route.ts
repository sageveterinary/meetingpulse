import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    });

    if (existingUser) {
      // If user exists with Google but no password, link accounts
      if (!existingUser.hashedPassword) {
        const hashed = await hashPassword(password);
        await prisma.user.update({
          where: { email },
          data: { hashedPassword: hashed, name: name || existingUser.name },
        });
        return NextResponse.json(
          { message: "Password added to existing account" },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Create new user with hashed password
    const hashed = await hashPassword(password);
    await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        hashedPassword: hashed,
      },
    });

    return NextResponse.json(
      { message: "Account created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
