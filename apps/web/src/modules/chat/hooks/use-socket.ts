import { useEffect, useCallback } from "react";
import { socketService, type TypedSocket } from "../services/socket.service";
import { useSocketStore } from "../store/socket.store";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socket.types";

export const useSocket = () => {
  const isConnected = useSocketStore((state) => state.isConnected);
  const isConnecting = useSocketStore((state) => state.isConnecting);
  const connectionError = useSocketStore((state) => state.connectionError);

  useEffect(() => {
    socketService.init();
  }, []);

  const getSocket = useCallback((): TypedSocket | null => {
    return socketService.getSocket();
  }, []);

  const connect = useCallback(() => {
    return socketService.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketService.disconnect();
  }, []);

  const emit = useCallback(
    <K extends keyof ClientToServerEvents>(
      event: K,
      ...args: Parameters<ClientToServerEvents[K]>
    ) => {
      const socket = socketService.getSocket();
      if (!socket || !socket.connected) {
        console.warn(`[SOCKET] Cannot emit ${String(event)}: Socket not connected.`);
        return;
      }
      (socket as any).emit(event, ...args);
    },
    [],
  );

  const subscribe = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      listener: ServerToClientEvents[K],
    ) => {
      const socket = socketService.getSocket();
      if (!socket) return () => {};

      (socket as any).on(event, listener);

      return () => {
        (socket as any).off(event, listener);
      };
    },
    [],
  );

  return {
    socket: getSocket(),
    isConnected,
    isConnecting,
    connectionError,
    connect,
    disconnect,
    emit,
    subscribe,
  };
};

export default useSocket;
