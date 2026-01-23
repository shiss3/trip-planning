'use server'
import {auth} from "@/auth";
import {prisma} from "@/lib/prisma";
import {redirect} from "next/navigation";


async function geocodeAddress(address: string) {
    const apiKey = process.env.GAODE_MAPS_API_KEY!;
    const response = await fetch(
        `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&key=${apiKey}&output=json`
    );
    const data = await response.json();
    console.log('bg', data)
    if (data.status === '1' && data.geocodes && data.geocodes.length > 0) {
        const locationString = data.geocodes[0].location;
        const [lng, lat] = locationString.split(',');
        return { lng: parseFloat(lng), lat: parseFloat(lat) }; // 记得转成数字，否则可能还有坑
    } else {
        // 2. 如果失败，抛出具体错误
        console.error('地理编码失败:', data.info);
        return null;
    }
}


export async function addLocation(formData:FormData,tripId:string):Promise<void> {
    const session = await auth();
    console.log("当前页面接收到的 TripID:", tripId);
    if (!session) {
        throw new Error("Not authenticated");
    }

    const address = formData.get("address")?.toString();
    if (!address) {
        throw new Error("Missing address");
    }

    const coords = await geocodeAddress(address);
    if(!coords){
        throw new Error("无法获取该地址的经纬度，请检查地址是否正确");
    }
    const { lng, lat } = coords;
    const count = await prisma.location.count({
        where: { tripId },
    });

    await prisma.location.create({
        data: {
            location: address,
            lat,
            lng,
            tripId,
            order: count,
        },
    });

    redirect(`/trips/${tripId}`);

}