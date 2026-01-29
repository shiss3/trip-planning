'use client'
import React, {useState} from 'react';
import {Prisma} from "@/app/generated/prisma/client";
import Image from "next/image";
import {Calendar, MapPin, Plus} from "lucide-react";
import Link from "next/link";
import {Button} from "@/app/components/ui/button";
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/app/components/ui/tabs'
import MyMap from '@/app/components/MyMap'
import SortableItinerary from "@/app/components/SortableItinerary";

type TripWithLocationProps = Prisma.TripGetPayload<{
    include: { locations: true }
}>;
interface TripDetailClientProps {
    trip: TripWithLocationProps;
}

const TripeDetailClient = ({trip}:TripDetailClientProps) => {
    const [activeTab, setActiveTab] = useState<string>('overview');
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            {trip.imageUrl && (
                <div className="w-full h-72 md:h-96 overflow-hidden rounded-xl shadow-lg relative">
                    <Image
                        src={trip.imageUrl}
                        alt={trip.title}
                        className="object-cover"
                        fill
                        priority
                    />
                </div>
            )}
            <div className="bg-white p-6 shadow rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900">
                        {trip.title}
                    </h1>
                    <div className="flex items-center text-gray-500 mt-2">
                        <Calendar className="h-5 w-5 mr-2" />
                        <span className="text-lg">
                            {trip.startDate.toLocaleDateString()} -{" "}
                            {trip.endDate.toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <div className="mt-4 md:mt-0">
                    <Link href={`/trips/${trip.id}/itinerary/new`}>
                        <Button>
                            <Plus className="mr-1 h-5 w-5" />新增地点
                        </Button>
                    </Link>
                </div>
            </div>
            <div className="bg-white p-6 shadow rounded-lg">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6 w-full flex overflow-x-auto">
                        <TabsTrigger value="overview" className="flex-1">
                            总览
                        </TabsTrigger>
                        <TabsTrigger value="itinerary" className="flex-1">
                            详情
                        </TabsTrigger>
                        <TabsTrigger value="map" className="flex-1">
                            路线
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="text-2xl font-semibold mb-4">
                                <h2 className="text-2xl font-semibold mb-4">行程总览</h2>
                                <div className="space-y-4">
                                    <div className="flex items-start">
                                        <Calendar className="h-6 w-6 mr-3 text-gray-500 mt-1" />
                                        <div >
                                            <p className="font-medium text-gray-700">时间安排</p>
                                            <p className="text-sm text-gray-500">
                                                {trip.startDate.toLocaleDateString()} -
                                                {trip.endDate.toLocaleDateString()}
                                                <br />
                                                {`${Math.round(
                                                    (trip.endDate.getTime() - trip.startDate.getTime()) /
                                                    (1000 * 60 * 60 * 24)
                                                )} days(s)`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <MapPin className="h-6 w-6 mr-3 text-gray-500 mt-1" />
                                        <div>
                                            <p>目的地</p>
                                            <p>
                                                {trip.locations.length}
                                                {trip.locations.length === 1 ? "location" : "locations"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-72 rounded-lg overflow-hidden shadow">
                                <MyMap itineraries={trip.locations} key={trip.id} />
                            </div>
                            {trip.locations.length === 0 && (
                                <div className="text-center p-4">
                                    <p>添加行程以在地图上查看它们。</p>
                                    <Link href={`/trips/${trip.id}/itinerary/new`}>
                                        <Button>
                                            <Plus className="mr-2 h-5 w-5" /> 新增行程
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-600 leading-relaxed">
                                    {trip.description}
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                    <TabsContent value="itinerary" className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-semibold"> Full Itinerary</h2>
                        </div>

                        {trip.locations.length === 0 ? (
                            <div className="text-center p-4">
                                <p>Add locations to see them on the itinerary.</p>
                                <Link href={`/trips/${trip.id}/itinerary/new`}>
                                    <Button>
                                        <Plus className="mr-2 h-5 w-5" /> Add Location
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <SortableItinerary locations={trip.locations} tripId={trip.id}/>
                        )}
                    </TabsContent>
                    <TabsContent value="map" className="space-y-6">
                        <div className="h-64 sm:h-72 rounded-lg overflow-hidden shadow">
                            <MyMap itineraries={trip.locations} />
                        </div>
                        {trip.locations.length === 0 && (
                            <div className="text-center p-4">
                                <p>Add locations to see them on the map.</p>
                                <Link href={`/trips/${trip.id}/itinerary/new`}>
                                    <Button>
                                        <Plus className="mr-2 h-5 w-5" /> Add Location
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
};

export default TripeDetailClient;