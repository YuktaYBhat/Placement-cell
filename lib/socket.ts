import { Server as NetServer } from "http"
import { Server as SocketIOServer } from "socket.io"
import { NextApiResponse } from "next"

export const config = {
    api: {
        bodyParser: false,
    },
}

let io: SocketIOServer

export const initSocket = (server: NetServer) => {
    if (!io) {
        io = new SocketIOServer(server, {
            path: "/api/socket/io",
            addTrailingSlash: false,
        })

        io.on("connection", (socket) => {
            console.log("DEBUG: New socket connection:", socket.id)

            socket.on("join-room", (userId: string) => {
                socket.join(userId)
                console.log(`DEBUG: Socket ${socket.id} joined room ${userId}`)
            })

            socket.on("disconnect", () => {
                console.log("DEBUG: Socket disconnected:", socket.id)
            })
        })
    }
    return io
}

export const getIO = () => io

export const emitNotification = (userId: string, notification: any) => {
    if (io) {
        // Emit to the specific user's room
        io.to(userId).emit("new_notification", notification)
        console.log(`DEBUG: Emitted notification to room ${userId}`)
    } else {
        console.warn("DEBUG: Socket.io not initialized")
    }
}
