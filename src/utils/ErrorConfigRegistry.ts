// import { UserDuplicateKeyMap, ProcessedErrorResult } from "./types";
export interface ProcessedErrorResult {
    statusCode: number;
    message: string;
}
export interface DuplicateFormatterArgs {
    value?: any;
    fields: Record<string, any>;
}
export type CollectionDuplicateMap = Record<string, (args: DuplicateFormatterArgs) => string>;
export type UserDuplicateKeyMap = Record<string, CollectionDuplicateMap>;

class ErrorConfigRegistry {
    // 1. Maintain private reactive configuration state
    private duplicateKeyMap: UserDuplicateKeyMap = {};
    private castErrorHandler?: (err: any) => ProcessedErrorResult;

    /**
     * Initializes or updates the shared library options
     */
    public init(options: {
        duplicateKeyMap: UserDuplicateKeyMap;
        handleCastError?: (err: any) => ProcessedErrorResult;
    }) {
        this.duplicateKeyMap = options.duplicateKeyMap;
        if (options.handleCastError) {
            this.castErrorHandler = options.handleCastError;
        }
    }

    // 2. Clear getters so your internal library engine can safely extract values
    public getDuplicateKeyMap(): UserDuplicateKeyMap {
        return this.duplicateKeyMap;
    }

    public getCastErrorHandler() {
        return this.castErrorHandler;
    }
}

// 🟢 Export a SINGLE instance of this class (The Singleton Pattern)
export const errorConfig = new ErrorConfigRegistry();

export const errorConfigInit = errorConfig.init