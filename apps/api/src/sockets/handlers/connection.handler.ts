import type { AuthenticatedSocket, TypedServer } from "../socket.types.js";
import presenceService from "../presence.service.js";

export const registerConnectionHandlers = (
  _io: TypedServer,
  socket: AuthenticatedSocket,
) => {
  const user = socket.data.user;

  if (user?.id) {
    // Join user-specific personal room for notifications & targeted events
    const personalRoom = `user:${user.id}`;
    socket.join(personalRoom);

    // Track presence
    presenceService.addUserSocket(user.id, socket.id);

    console.log(
      `[SOCKET] User ${user.id} (${user.role}) connected on socket ${socket.id} and joined ${personalRoom}`,
    );
  }

  socket.on("disconnect", (reason) => {
    if (user?.id) {
      presenceService.removeUserSocket(user.id, socket.id);
    }
    console.log(
      `[SOCKET] User ${user?.id || "unknown"} disconnected from socket ${socket.id}. Reason: ${reason}`,
    );
  });

  socket.on("error", (err) => {
    console.error(`[SOCKET] Error on socket ${socket.id}:`, err);
  });
};
