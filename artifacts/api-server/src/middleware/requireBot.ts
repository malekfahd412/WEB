import type { RequestHandler } from "express";

export const requireBot: RequestHandler = (req, res, next) => {
  const expected = process.env["BOT_API_TOKEN"];
  if (!expected) {
    res.status(503).json({ error: "BOT_API_TOKEN is not configured on the server" });
    return;
  }
  const provided = req.header("x-bot-token");
  if (!provided || provided !== expected) {
    res.status(401).json({ error: "Invalid bot token" });
    return;
  }
  next();
};
