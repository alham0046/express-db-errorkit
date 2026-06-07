import { ApiResponse } from "./ApiResponse";
import { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction
) => Promise<ApiResponse<any> | void | any>;

export const asyncHandler = (fn: AsyncController): RequestHandler => (req: Request, res: Response, next: NextFunction): void => {
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
            //// recommended by ai
            // if (!res.headersSent) {
            //     return res.status(200).json({
            //         success: true,
            //         message: "Operation completed successfully"
            //     });
            // }
            else {
                return resolvedValue
            }
        })
        .catch(next)
}