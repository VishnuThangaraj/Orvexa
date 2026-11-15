import type { TypedServer } from "./socket.types.js";

let ioInstance: TypedServer | null = null;

export const setIO = (io: TypedServer | null): void => {
  ioInstance = io;
};

export const getIO = (): TypedServer => {
  if (!ioInstance) {
    throw new Error(
      "Socket.IO has not been initialized. Call initializeSocketServer(httpServer) first.",
    );
  }
  return ioInstance;
};
