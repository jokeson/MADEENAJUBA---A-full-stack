import { NextResponse } from "next/server";
import { signUpWithRole } from "@/lib/server-actions/auth";

export async function GET() {
  try {
    const email = "ayuelmjok@gmail.com";
    const password = "123456pass";
    const role = "admin";

    console.log("Creating admin user...");
    console.log(`Email: ${email}`);
    console.log(`Role: ${role}`);

    const result = await signUpWithRole(email, password, role);

    if (result.success && result.user) {
      return NextResponse.json(
        {
          success: true,
          message: "Admin user created successfully!",
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
            createdAt: result.user.createdAt,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message || "Failed to create admin user",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to create admin user",
      },
      { status: 500 }
    );
  }
}

