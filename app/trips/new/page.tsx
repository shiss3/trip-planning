'use client';
import React, {useState, useTransition} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from "@/app/components/ui/card";
import {Button} from "@/app/components/ui/button";
import {createTrip} from "@/lib/actions/create-trips";
import {UploadButton} from "@/lib/uploadthing";
import Image from "next/image";

const NewPage = () => {

    const [isPending,startTransition] = useTransition()
    const [imageUrl,setImageUrl] = useState<string | null>(null);

    return (
        <div className="max-w-lg mx-auto mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>新的旅程</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-6"
                          action={(formData:FormData)=>{
                              if(imageUrl){
                                  formData.append('imageUrl',imageUrl)
                              }
                              startTransition(() => (createTrip(formData)))
                          }}
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                主题
                            </label>
                            <input
                                name="title"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                描述
                            </label>
                            <textarea
                                name="description"
                                className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    开始时间
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    结束时间
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label>目的地图片</label>
                            {imageUrl && <Image
                                            src={imageUrl}
                                            alt="image"
                                            width={200}
                                            height={200}
                                            className='w-full mb-4 rounded-md max-h-48 object-cover'
                            />}
                            <UploadButton
                                endpoint="imageUploader"
                                onClientUploadComplete={(res) => {
                                    if(res && res[0].ufsUrl){
                                        setImageUrl(res[0].ufsUrl)
                                    }
                                }}
                                onUploadError={(error: Error) => {
                                    alert(`ERROR! ${error.message}`);
                                }}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            {isPending ? "创建中" : "创建本次旅程"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default NewPage;