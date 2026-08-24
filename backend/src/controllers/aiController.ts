import { Request, Response } from "express";
import { pingSarvam } from "../services/sarvamService";

export async function testAI(_req: Request, res: Response) {
  const sample = await pingSarvam();
  res.json({
    success: true,
    message: "Sarvam AI connection successful.",
    sample,
  });
}
