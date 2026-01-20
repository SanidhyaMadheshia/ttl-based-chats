// {
//     "type": "message",
//     "payload": "{\"userId\":\"hG5B24ex\",\"payload\":\"sanidhya\"}"
// }

import { randomUUID } from "crypto"

type Message = {
  id: string
  userId: string
  userName: string
  content: string
  // timestamp: number
  isSystemMessage?: boolean
}
interface messagePayload {
    userId :  string 
    payload : string 
}

type User = {
  id: string
  name: string
  isAdmin: boolean
}

export function messageParser(payload : string, users : User[] ) : Message {

    const message : messagePayload = JSON.parse(payload )
    const user = users.find((user, id)=> {
        return user.id === message.userId
    })
    console.log(users)
    const resMesaage : Message = {
        id : Math.random().toString(),
        userId : message.userId,
        userName : user?.name ? user.name : "unknown", 
        content : message.payload,

    }
    return resMesaage
}