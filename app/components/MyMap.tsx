'use client'
import { Location } from "@/app/generated/prisma/client";
import {Map, Marker, APILoader, ToolBarControl} from '@uiw/react-amap';

interface MapProps {
    itineraries: Location[];
}

const MyMap = ({itineraries}:MapProps) => {
    //console.log(`[Map组件] 接收到的 itineraries:`, itineraries);
    const MapComponent = Map as any;
    const MarkerComponent = Marker as any;
    const ToolBarComponent = ToolBarControl as any;
    const center = itineraries.length > 0
        ? [itineraries[0].lng, itineraries[0].lat] as [number, number]
        : [116.397, 39.918] as [number, number];

    return (
        <div style={{ width: '100%', height: '290px' }}>
            <APILoader akey={"5de6060aa4e88b3e0fe24ebff5005cf2"}>
                <MapComponent center={center} zoom={13} >
                    <ToolBarComponent position="RB" />
                    {itineraries.map((loc, index) => (
                        <MarkerComponent
                            key={loc.id}
                            position={[loc.lng, loc.lat] as [number, number]}
                            title={loc.location}
                            label={{
                                content: `<div style="color:blue; font-weight:bold;">${index + 1}. ${loc.location}</div>`,
                                offset: typeof window !== 'undefined' && (window as any).AMap
                                    ? new (window as any).AMap.Pixel(0, -20)
                                    : [0, -20]
                            }}
                        />
                    ))}

                </MapComponent>
            </APILoader>
        </div>
    );
};
export default MyMap;