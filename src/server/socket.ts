import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "../utils/logger";
import { IEscalation } from "../models/escalation.model";

let io: SocketIOServer | null = null;

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Dashboard client connected");

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Dashboard client disconnected");
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

export function emitEscalationEvent(escalation: IEscalation): void {
  if (io) {
    io.emit("new-escalation", {
      id: escalation._id,
      callSid: escalation.callSid,
      reason: escalation.reason,
      callerPhone: escalation.callerPhone,
      status: escalation.status,
      createdAt: escalation.createdAt,
    });
    logger.info({ escalationId: escalation._id }, "Escalation event emitted");
  }
}

export function emitEscalationResolved(escalationId: string): void {
  if (io) {
    io.emit("escalation-resolved", { id: escalationId });
  }
}
