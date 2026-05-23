import { Request, Response, NextFunction, RequestHandler } from 'express';
import mongoose, { Connection, ClientSession, Schema } from 'mongoose';

declare class ApiResponse<T> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
    constructor(message: string, data: T, statusCode?: number);
}

type AsyncController = (req: Request, res: Response, next: NextFunction) => Promise<ApiResponse<any> | void | any>;
declare const asyncHandler: (fn: AsyncController) => RequestHandler;

type SessionMap<T> = {
    [K in keyof T]: ClientSession;
};
declare class DBSession<T extends Record<string, Connection> | Connection = Connection> {
    private target;
    sessions: T extends Record<string, Connection> ? SessionMap<T> : ClientSession | null;
    constructor(target?: T);
    start(): Promise<T extends Record<string, Connection> ? SessionMap<T> : ClientSession>;
    commit(): Promise<void>;
    abort(): Promise<void>;
    private end;
    private cleanupActive;
    private getActiveSessions;
}
declare const startSession: <T extends Record<string, Connection> | Connection>(req: Request, connections?: T) => Promise<T extends Record<string, mongoose.Connection> ? SessionMap<T> : mongoose.mongo.ClientSession>;

declare class ApiError extends Error {
    statusCode: number;
    data: Record<string, any> | null;
    message: string;
    success: boolean;
    constructor(message?: string, statusCode?: number, data?: Record<string, any> | null);
}

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

export { ApiError, ApiResponse, DBSession, asyncHandler, errorConfigInit, errorMetaPlugin, errorMiddleware, startSession, throwErrorQueryPlugin };
