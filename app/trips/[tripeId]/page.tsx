'use server'
import React from 'react';
import {auth} from "@/auth";
import {prisma} from "@/lib/prisma";
import TripeDetailClient from "@/app/components/TripeDetailClient";

const TripeDetail = async ({params}:{params :Promise<{tripeId:string}>}) => {

    const {tripeId} = await params
    const data = await params
    console.log('data',data)
    const session = await auth()
    if(!session){
        return <div>请登录</div>
    }
    const trip = await prisma.trip.findFirst({
        where:{
            id:tripeId,
            userId:session.user?.id
        },
        include:{locations:true}
    })
    if(!trip){
        return <div>旅行没有找到qwq</div>
    }
    return (
        <TripeDetailClient trip={trip} key={tripeId}/>
    );
};

export default TripeDetail;