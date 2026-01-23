import React, { useId, useState } from 'react';
import { Location } from "@/app/generated/prisma/client";
import {
    closestCenter,
    DndContext,
    DragEndEvent,//引入必要的传感器组件
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
import { reorderItinerary } from "@/lib/actions/reorder-itineraty";
import { CSS } from "@dnd-kit/utilities";

interface SortableItineraryProps {
    locations: Location[];
    tripId: string;
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
                // 拖拽时提高层级，并在移动端禁用默认的触摸操作以防止滚动冲突
                zIndex: isDragging ? 50 : 'auto',
                touchAction: 'none'
            }}
            //UI适配：使用 flex-1 和 min-w-0 确保在小屏幕上文字能正确截断,防止挤压右侧内容
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

const SortableItinerary = ({ locations, tripId }: SortableItineraryProps) => {
    const id = useId();
    const [localLocation, setLocalLocation] = useState<Location[]>(locations);

    // 定义传感器
    const sensors = useSensors(
        // 鼠标传感器：为了防止点击时意外拖拽，设置移动 10px 后才视为拖拽
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        // 触摸传感器（移动端核心）：
        // 设置 delay: 250ms，意味着用户必须0.25秒才会触发拖拽。
        // 这样普通的快速滑动仍然会触发页面滚动，不会误触拖拽。
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 100,
                tolerance: 5, // 容忍度：长按时手指轻微抖动 5px 范围内不取消拖拽
            },
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = localLocation.findIndex((item) => item.id === active.id);
            const newIndex = localLocation.findIndex((item) => item.id === over.id);

            // 乐观更新：先在前端更新 UI，让用户感觉“立刻”完成了
            const newLocationsOrder = arrayMove(
                localLocation,
                oldIndex,
                newIndex
            ).map((item, index) => ({ ...item, order: index }));

            setLocalLocation(newLocationsOrder);

            // 后端同步
            try {
                await reorderItinerary(
                    tripId,
                    newLocationsOrder.map((item) => item.id)
                );
            } catch (error) {
                console.error("Failed to reorder itinerary:", error);
            }
        }
    };

    return (
        <DndContext
            id={id} // 显式传递 id 以避免 SSR hydration mismatch
            sensors={sensors} // 绑定配置好的 sensors
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