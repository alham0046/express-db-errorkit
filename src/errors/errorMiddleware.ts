import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/ApiError";
import { handleCastError } from "./handleCastError";
import { handleMongoServerError } from "./handleMongoServerError";

const ErrorMap : any = {
    "CastError": handleCastError,
    "MongoServerError": handleMongoServerError,
    "MongoBulkWriteError" : handleMongoServerError
}

const handleAnonymousError = (err: any) => {
    const errName = err.name
    if (ErrorMap[errName]) {
        const { message, statusCode } = ErrorMap[errName](err)
        return new ApiError(message, statusCode)
    }
    // return new ApiError("Something went wrong", 500)
    return err
}

export const errorMiddleware = async (
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log(err, err.name, err?.model);
    if (req.dbSession) {
        try {
            await req.dbSession.abort();
            req.dbSession = null
            console.log("Database Transaction Aborted Cleanly ↩️");
        } catch (abortError) {
            console.error("Failed to abort database transaction:", abortError);
        }
    }
    if (!(err instanceof ApiError)) {
        err = handleAnonymousError(err)
    }
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ statusCode: statusCode, data: err.data, message: err.message || "Something went wrong", success: err.success });
};