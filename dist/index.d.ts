import { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose, { Schema } from 'mongoose';

declare class ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
    constructor(message: string, data: T, statusCode?: number);
}

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<ApiResponse<any> | void | any>;
declare const asyncHandler: (fn: AsyncController) => RequestHandler;

declare class DBSession {
    private session;
    start(): Promise<mongoose.mongo.ClientSession>;
    commit(): Promise<void>;
    abort(): Promise<void>;
}
declare const startSession: (req: Request) => Promise<mongoose.mongo.ClientSession>;

declare const errorMiddleware: (err: any, req: Request, res: Response, next: NextFunction) => Promise<void>;

interface ProcessedErrorResult {
    statusCode: number;
    message: string;
}
interface DuplicateFormatterArgs {
    value?: any;
    fields: Record<string, any>;
}
type CollectionDuplicateMap = Record<string, (args: DuplicateFormatterArgs) => string>;
type UserDuplicateKeyMap = Record<string, CollectionDuplicateMap>;
declare const errorConfigInit: (options: {
    duplicateKeyMap: UserDuplicateKeyMap;
    handleCastError?: (err: any) => ProcessedErrorResult;
}) => void;

declare module "mongoose" {
    interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown, QueryOp = 'find'> {
        orThrow(customMessage?: string, statusCode?: number): this;
        throwIfExists(messageOrCallback: string | ((doc: DocType | DocType[]) => string), statusCode?: number): this;
    }
}
declare const throwErrorQueryPlugin: (schema: Schema) => void;

declare const errorMetaPlugin: (schema: Schema) => void;

export { ApiResponse, DBSession, asyncHandler, errorConfigInit, errorMetaPlugin, errorMiddleware, startSession, throwErrorQueryPlugin };
