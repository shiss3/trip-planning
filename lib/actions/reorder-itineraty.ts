"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 接收 clientTimestamp
export async function reorderItinerary(
    tripId: string,
    newOrder: string[],
    clientTimestamp: number
) {
    const session = await auth();
    if (!session) throw new Error("Not authenticated");

    return await prisma.$transaction(async (tx) => {
        const trip = await tx.trip.findUnique({
            where: { id: tripId },
            select: { lastModified: true }
        });

        if (!trip) throw new Error("Trip not found");

        // BigInt 在 JS 中处理需要注意，prisma client 返回的是 BigInt 类型
        const dbTimestamp = Number(trip.lastModified);

        // [核心逻辑] LWW (Last-Write-Wins) 策略
        // 如果客户端的时间戳 <= 数据库时间戳，说明这是过期请求或旧设备请求
        if (clientTimestamp <= dbTimestamp) {
            console.log(`[Server] Ignored stale request. Client: ${clientTimestamp}, DB: ${dbTimestamp}`);
            // 返回 DB 中的最新时间，方便客户端更新本地基准（可选）
            return { success: true, syncedTimestamp: dbTimestamp, ignored: true };
        }

        // 更新时间戳
        await tx.trip.update({
            where: { id: tripId },
            data: { lastModified: clientTimestamp } // 直接存 BigInt
        });

        // 更新顺序
        const updatePromises = newOrder.map((locationId, index) =>
            tx.location.update({
                where: { id: locationId },
                data: { order: index },
            })
        );

        await Promise.all(updatePromises);

        return { success: true, syncedTimestamp: clientTimestamp };
    });
}