import { handlers } from "@/lib/auth/config";
import type { NextRequest } from "next/server";

export const GET  = (req: NextRequest) => handlers.GET(req);
export const POST = (req: NextRequest) => handlers.POST(req);
