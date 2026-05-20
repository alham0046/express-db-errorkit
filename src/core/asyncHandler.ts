import { ClientSession } from "mongoose";
import { ApiResponse } from "./ApiResponse";
import {Request, Response, NextFunction, RequestHandler} from 'express'

// // 1. Extend Express's native Request interface to recognize 'dbSession'
// declare global {
//     namespace Express {
//         interface Request {
//             dbSession?: ClientSession | null;
//         }
//     }
// }

// 2. Define a flexible type for your custom controller functions
type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<ApiResponse<any> | void | any>;

export const asyncHandler = (fn : AsyncController) : RequestHandler => (req : Request, res : Response, next : NextFunction) : void => {
    Promise.resolve(fn(req, res, next))
        .then(async (resolvedValue) => {
            if (req.dbSession) {
                await req.dbSession.commit()
                req.dbSession = null
                console.log("Database Transaction Committed Cleanly ✅");
            }
            if (resolvedValue instanceof ApiResponse) {

                return res.status(resolvedValue.statusCode).json(resolvedValue);
            }
            else {
                return resolvedValue
            }
        })
        .catch(next)
}