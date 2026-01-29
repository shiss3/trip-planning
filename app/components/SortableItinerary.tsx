'use client'; // 确保是 Client Component
import React, { useId, useState } from 'react';
import { Location } from "@/app/generated/prisma/client";
import {
    closestCenter,
    DndContext,
    DragEndEvent,
    TouchSensor,
    MouseSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// [修改] 引入 Hook
import { useTripSync } from '@/lib/hooks/useTripSync';

// [修改] 接口需增加 initialVersion
interface SortableItineraryProps {
    locations: Location[];
    tripId: string;// 从服务端传入的初始版本号
}

function SortableItem({ item }: { item: Location }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({ id: item.id });

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                zIndex: isDragging ? 50 : 'auto',
                touchAction: 'none'
            }}
            className={`p-4 border rounded-md flex justify-between items-center transition-shadow bg-white ${
                isDragging ? 'shadow-xl ring-2 ring-blue-500 opacity-80' : 'hover:shadow'
            }`}
        >
            <div className="flex-1 min-w-0 mr-4">
                <h4 className="font-medium text-gray-800 truncate">
                    {item.location}
                </h4>
                <p className="text-sm text-gray-500 truncate">
                    {`Latitude: ${item.lat}, Longitude: ${item.lng}`}
                </p>
            </div>
            <div className="text-sm text-gray-600 whitespace-nowrap font-medium">
                Day {item.order + 1}
            </div>
        </div>
    );
}

const SortableItinerary = ({ locations, tripId}: SortableItineraryProps) => {
    const id = useId();
    const [localLocation, setLocalLocation] = useState<Location[]>(locations);

    // [修改] 初始化同步 Hook
    const { triggerSync } = useTripSync(tripId);

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 100, tolerance: 5 },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localLocation.findIndex((item) => item.id === active.id);
            const newIndex = localLocation.findIndex((item) => item.id === over.id);

            // 1. 乐观更新：立即计算并设置 UI
            const newLocationsOrder = arrayMove(
                localLocation,
                oldIndex,
                newIndex
            ).map((item, index) => ({ ...item, order: index }));

            setLocalLocation(newLocationsOrder);

            // 2. [修改] 触发架构同步，而不是直接 await fetch
            // 剩下的防抖、存储、版本管理全交给 Hook
            triggerSync(newLocationsOrder.map((item) => item.id));
        }
    };

    return (
        <DndContext
            id={id}
            sensors={sensors}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
        >
            <SortableContext
                items={localLocation.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4 touch-manipulation">
                    {localLocation.map((item) => (
                        <SortableItem key={item.id} item={item} />
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
};

export default SortableItinerary;