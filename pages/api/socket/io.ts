import { NextApiRequest } from "next"
import { NextApiResponseServerIO } from "@/types/next"
import { initSocket } from "@/lib/socket"

export const config = {
  api: {
    bodyParser: false,
  },
}

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log("DEBUG: Initializing socket.io")
    res.socket.server.io = initSocket(res.socket.server as any)
  }
  res.end()
}
