import { auth } from "@/auth";
import { Button } from "@/app/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function TripsPage() {
    const session = await auth();

    const trips = await prisma.trip.findMany({
        where: { userId: session?.user?.id },
    });

    const sortedTrips = [...trips].sort(
        (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingTrips = sortedTrips.filter(
        (trip) => new Date(trip.startDate) >= today
    );

    if (!session) {
        return (
            <div className="flex justify-center items-center h-screen text-gray-700 text-xl">
                请登录
            </div>
        );
    }

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h1 className="text-3xl font-bold tracking-tight">行程总览</h1>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Link href="/trips/new">
                        <Button className="w-full sm:w-auto">新的旅程</Button>
                    </Link>
                    <Link href="/trips/aiChat">
                        <Button className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-md shadow-md hover:opacity-90 transition flex items-center gap-2">
                             AI 一键规划
                        </Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle> 欢迎您！ {session.user?.name} </CardTitle>
                </CardHeader>

                <CardContent>
                    <p>
                        {trips.length === 0
                            ? "Start planning your first trip by clicking the button above."
                            : `您一共有 ${trips.length} 段旅行安排 ${
                                upcomingTrips.length > 0
                                    ? `${upcomingTrips.length} 段旅行即将到来.`
                                    : ""
                            } `}
                    </p>
                </CardContent>
            </Card>

            <div>
                <h2 className="text-xl font-semibold mb-4">旅行记录</h2>
                {trips.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <h3 className="text-xl font-medium mb-2">还没有任何旅行在规划中......</h3>
                            <p className="text-center mb-4 max-w-md">
                                开始规划您的第一段旅行吧！
                            </p>
                            <Link href="/trips/new">
                                <Button>新建旅行</Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sortedTrips.slice(0, 6).map((trip, key) => (
                            <Link key={key} href={`/trips/${trip.id}`}>
                                <Card className="h-full hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="line-clamp-1">{trip.title}</CardTitle>
                                    </CardHeader>

                                    <CardContent>
                                        <p className="text-sm line-clamp-2 mb-2">
                                            {trip.description}
                                        </p>
                                        <div className="text-sm">
                                            {new Date(trip.startDate).toLocaleDateString()} -{" "}
                                            {new Date(trip.endDate).toLocaleDateString()}
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}