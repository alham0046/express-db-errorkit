// src/types/express.d.ts
import { ClientSession } from "mongoose";
import { DBSession } from "../core/DBSession";

declare global {
    namespace Express {
        interface Request {
            /** Custom database session tracker for transaction rollbacks */
            dbSession?: DBSession<any> | null;
        }
    }
}