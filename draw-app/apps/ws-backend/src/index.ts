import { WebSocketServer } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { prismaClient } from "@repo/db/clients";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}
const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET); // decoding that token.
    if (typeof decoded == "string") {
      return null;
    }
    if (!decoded || !(decoded as JwtPayload).userId) {
      return null;
    }
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  // fetching the whole url..before even connecting to the another person.
  const url = request.url;
  // close websocket server if url is not present.
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || ""; // what token they have sent for connection.
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async function message(data) {
    let parseData;
    if (typeof data !== "string") {
      parseData = JSON.parse(data.toString());
    } else {
      parseData = JSON.parse(data);
    }

    if (parseData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(parseData.roomId);
    }

    if (parseData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x === parseData.room);
    }

    if (parseData.type === "chat") {
      // broadcast the message.
      const roomId = parseData.userId;
      const message = parseData.message;

      // Before broadcasting the message to everyone store that message to that database.
      await prismaClient.chat.create({
        data: {
          roomId,
          message,
          userId,
        },
      });

      // Broadcasting message to everyone.
      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message: message,
              roomId,
            })
          );
        }
      });
    }
  });
});
