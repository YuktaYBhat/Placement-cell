import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { token } = await req.json();
        if (!token) {
            return NextResponse.json({ error: "Token is required" }, { status: 400 });
        }

        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: { fcmToken: token },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error saving FCM token:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
