import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    // AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Zap } from "lucide-react"
import { Input } from "./ui/input"
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import axios from "axios";
import { CreateRoomResponse } from "@/lib/types";
interface SelectTimeProps {
    setTimePeriod: Dispatch<SetStateAction<string>>;
}
async function createRoom({
    roomName,
    adminName,
    timePeriod
}: {
    roomName: string,
    adminName: string,
    timePeriod: string
}
) {
    // fetch('http://localhost:8080/createRoom' , {
    //     method : 'POST' ,
    //     headers : {
    //         'Content-Type' : 'application/json'
    //     },
    //     body : JSON.stringify({
    //         roomName : roomName ,
    //         adminName : adminName ,
    //         timePeriod : timePeriod
    //     })
    // })
    // .then(res => res.json())
    // .then(data => {



    //     console.log('Room Created:', data);


    // })

    const { data } = await axios.get<CreateRoomResponse>(
        process.env.NEXT_PUBLIC_BACKEND_URL + '/createRoom?' + "admin=" + adminName + "&roomName=" + roomName + "&ttl=" + timePeriod
    )

    localStorage.setItem("userKey", data.userKey);
    // localStorage.setItem("chatID", data.chatID);
    localStorage.setItem("userId", data.userId);

    window.location.href = `/chat/${data.chatID}`;

}
function SelectTime(
    {
        setTimePeriod,
    }: SelectTimeProps

) {
    return (
        <Select onValueChange={setTimePeriod}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select a time period"
                />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectLabel>time period</SelectLabel>
                    <SelectItem value="30m">30m</SelectItem>
                    <SelectItem value="45m">45m</SelectItem>
                    <SelectItem value="15m">15m</SelectItem>
                    <SelectItem value="1h">1h</SelectItem>
                    <SelectItem value="2h">2h</SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
    )
}


export function CreateRoomDialog() {
    const [roomName, setRoomName] = useState("");
    const [adminName, setAdminName] = useState("");
    const [timePeriod, setTimePeriod] = useState("");


    return <>
        <AlertDialog>
            <AlertDialogTrigger>
                <div className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition inline-flex items-center justify-center gap-2">
                    <Zap className="w-4 h-4" />
                    Create a Room
                </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>RoomName</AlertDialogTitle>
                    {/* <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account
                        and remove your data from our servers.
                    </AlertDialogDescription> */}
                    <Input
                        onChange={(e) => {
                            setRoomName(e.target.value);
                            e.preventDefault();
                        }}
                        value={roomName}
                        placeholder="Enter room name"

                    />
                    <AlertDialogTitle>admin Name</AlertDialogTitle>
                    <Input
                        onChange={(e) => {
                            setAdminName(e.target.value);
                            e.preventDefault();
                        }}
                        value={adminName}
                        placeholder="Enter admin name"
                    />
                    <AlertDialogTitle>select time period of Chat</AlertDialogTitle>

                    <SelectTime
                        setTimePeriod={setTimePeriod}
                    />

                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            console.log(roomName, adminName, timePeriod);
                            createRoom({ roomName, adminName, timePeriod });
                        }}
                    >Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
}