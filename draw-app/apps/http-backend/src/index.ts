import express from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";
import { middleware } from "./middleware";
import {
  CreateUserSchema,
  SigninSchema,
  CreateRoomSchema,
} from "@repo/common/types";
import { prismaClient } from "@repo/db/clients";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/signup", async (req, res) => {
  // db call here.....!
  const parseData = CreateUserSchema.safeParse(req.body);

  if (!parseData.success) {
    console.log(parseData.error);
    return res.json({
      message: "Incorrect Input.",
    });
  }
  try {
    const user = await prismaClient.user.create({
      data: {
        email: parseData.data?.username,
        // TODO": Hash password here.
        password: parseData.data.password,
        name: parseData.data.name,
      },
    });
    res.json({
      userId: user.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "User already exists with this username",
    });
  }

  res.json({
    message: "signup",
  });
});

app.post("/signin", async (req, res) => {
  const parseData = SigninSchema.safeParse(req.body);

  if (!parseData.success) {
    return res.json({
      message: "Incorrect Inputs for signin.",
    });
  }

  // TODO: Compare the hashed pws here.
  const user = await prismaClient.user.findFirst({
    where: {
      email: parseData.data.username,
      password: parseData.data.password,
    },
  });

  if (!user) {
    return res.status(403).json({
      message: "Not authorized",
    });
  }
  const token = jwt.sign(
    {
      userId: user?.id,
    },
    JWT_SECRET
  );

  res.json({
    token,
  });
});

app.post("/room", middleware, async (req, res) => {
  const parseData = CreateRoomSchema.safeParse(req.body);
  if (!parseData.success) {
    res.json({
      message: "Incorrect Inputs for CreateRoomSchema.",
    });
    return;
  }
  // @ts-ignore: TODO: Fix this
  const userId = req.userId;

  try {
    const room = await prismaClient.room.create({
      data: {
        slug: parseData.data.name,
        adminId: userId,
      },
    });

    res.json({
      roomId: room.id,
    });
  } catch (e) {
    res.status(411).json({
      message: "Room already exist with this name.",
    });
  }
});

app.get("/chats/:roomId", async (req, res) => {
  try {
    const roomId = Number(req.params.roomId);
    console.log(req.params.roomId);
    const messages = await prismaClient.chat.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 50,
    });

    res.json({
      messages,
    });
  } catch (e) {
    console.log(e);
    return res.json({
      message: e,
    });
  }
});

app.get("/room/:slug", async (req, res) => {
  const slug = req.params.slug;
  const room = await prismaClient.room.findFirst({
    where: {
      slug,
    },
  });

  res.json({
    room,
  });
});

app.listen(3001);
