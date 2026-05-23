import { Query, Schema } from "mongoose";
import { ApiError } from "../core/ApiError";

// 1. Declare the new helper signatures globally inside Mongoose's Query type registry
declare module "mongoose" {
    interface Query<ResultType, DocType, THelpers = {}, RawDocType = unknown, QueryOp = 'find'> {
        orThrow(customMessage?: string, statusCode?: number): this;
        throwIfExists(
            messageOrCallback: string | ((doc: DocType | DocType[]) => string),
            statusCode?: number
        ): this;
    }
}

export const throwErrorQueryPlugin = (schema: Schema) => {
    /**
     * Custom Query Helper: .orThrow()
     * Uses Mongoose's native .orFail engine under the hood, 
     * but normalizes the thrown error to our ApiError structure.
     */

    const queryHelpers = schema.query as any;

    queryHelpers.orThrow = function (this: Query<any, any>, customMessage: string, statusCode: number = 404) {
        // 'this' refers to the current Mongoose Query object
        const modelName = this.model?.modelName || "Resource";
        const message = customMessage || `${modelName} not found`;

        // Leverage Mongoose's native listener, but throw our specialized error class
        return this.orFail(() => {
            throw new ApiError(message, statusCode);
        });
    };

    queryHelpers.throwIfExists = function (this: Query<any, any>, messageOrCallback: string | ((doc: any) => string), statusCode: number = 409) {


        return this.transform((res) => {

            const exists = Array.isArray(res) ? res.length > 0 : !!res

            if (exists) {
                const message = typeof messageOrCallback === 'function' ? messageOrCallback(res) : messageOrCallback

                throw new ApiError(
                    message || "Operational conflict",
                    statusCode,
                    res
                )
            }

            return res
        })
    }
}