// import { Clock, X } from "lucide-react"
// import { Button } from "@/components/ui/button"

// interface ChatHeaderProps {
//   roomId: string
//   ttl: number
//   formattedTime: string
//   roomName : string 
// }

// export function ChatHeader({  ttl, formattedTime , roomName }: ChatHeaderProps) {
//   return (
//     <header className="border-b border-border bg-card px-6 py-4">

//       <div className="flex items-center justify-between">

//         <div className="flex items-center gap-4">
//           <h1 className="text-xl font-semibold text-foreground">Room {roomName}</h1>
//         </div>
//         <div className="flex items-center gap-4">
//           <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary ${ttl < 300 ? "timer-glow" : ""}`}>
//             <Clock className="h-4 w-4 text-accent" />
//             <span className="text-sm font-mono text-foreground">{formattedTime}</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   )
// }



import { Clock } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface ChatHeaderProps {
  roomId: string
  ttl: number
  formattedTime: string
  roomName: string
}

export function ChatHeader({
  ttl,
  formattedTime,
  roomName,
}: ChatHeaderProps) {
  return (
    <header className="border-b border-border bg-card px-6 py-4">
      <div className="flex items-center justify-between">

        {/* LEFT: Sidebar trigger + room name */}
        <div className="flex items-center gap-3 min-w-0">
          <SidebarTrigger className="h-9 w-9 shrink-0" />

          <h1 className="text-xl font-semibold text-foreground truncate">
            Room {roomName}
          </h1>
        </div>

        {/* RIGHT: TTL */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary ${ttl < 300 ? "timer-glow" : ""
              }`}
          >
            <Clock className="h-4 w-4 text-accent" />
            <span className="text-sm font-mono text-foreground">
              {formattedTime}
            </span>
          </div>
        </div>

      </div>
    </header>
  )
}
