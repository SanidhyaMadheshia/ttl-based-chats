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
  userId: string
  payload: string
}

type User = {
  id: string
  name: string
  isAdmin: boolean
}

export function messageParser(payload: any, users: Map<string, User>) {

  console.log(payload)
  const data = typeof payload === "string" ? JSON.parse(payload) : payload

  return {
    id: crypto.randomUUID(),
    userId: data.userId,
    userName: users.get(data.userId)?.name ?? "unknown",
    content: data.payload,
    isSystemMessage: false
  }
}


export function membersParser(payload: string, setOnlineMembers : React.Dispatch<React.SetStateAction<string[]>>) {
  const members : string[] = JSON.parse(payload)
  console.log("online Members :", members)
  setOnlineMembers(members)
  return 
}