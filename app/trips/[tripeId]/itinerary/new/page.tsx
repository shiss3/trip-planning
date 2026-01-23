'use server'
import NewLocationClient from "@/app/components/NewLocationClient";


const NewLocation = async ({params}:{params:Promise<{tripeId:string}>}) => {

    const {tripeId} = await params;


    return <NewLocationClient tripeId={tripeId}/>;
};

export default NewLocation;