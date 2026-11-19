import { Server as HttpServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import corsOptions from "../config/cors.js";
import { socketAuthMiddleware } from "./socket.middleware.js";
import { registerConnectionHandlers } from "./handlers/connection.handler.js";
import { registerChatHandlers } from "./handlers/chat.handler.js";
import { registerMeetHandlers } from "./handlers/meet.handler.js";
import { setIO, getIO } from "./socket.instance.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  TypedServer,
  AuthenticatedSocket,
} from "./socket.types.js";

export { getIO };

export const initializeSocketServer = (httpServer: HttpServer): TypedServer => {
  const io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: corsOptions,
    pingTimeout: 20000,
    pingInterval: 25000,
    transports: ["websocket", "polling"],
  });

  setIO(io);

  // Attach authentication middleware
  io.use(socketAuthMiddleware);

  // Connection listener
  io.on("connection", (socket: AuthenticatedSocket) => {
    registerConnectionHandlers(io, socket);
    registerChatHandlers(io, socket);
    registerMeetHandlers(io, socket);
  });

  console.log("[SOCKET] WebSocket server initialized and listening for connections.");

  return io;
};

export const closeSocketServer = async (): Promise<void> => {
  let io: TypedServer | null = null;
  try {
    io = getIO();
  } catch {
    return;
  }

  if (!io) return;

  return new Promise((resolve) => {
    io!.close(() => {
      console.log("[SOCKET] Socket.IO server closed.");
      setIO(null);
      resolve();
    });
  });
};
