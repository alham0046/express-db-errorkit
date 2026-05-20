import {
    Model
} from "mongoose"

import {
    ErrorTypes
} from "../../types/ErrorTypes"

export const modelErrorMiddleware =
function(
    this: Model<any>,

    error: ErrorTypes,

    result: any,

    next: (err?: any) => void
) {

    error.meta = {

        type: "model",

        modelName:
            this.modelName,

        collectionName:
            this.collection?.name,

        operation:
            "insertMany",

        keyPattern:
            (error as any).keyPattern,

        keyValue:
            (error as any).keyValue
    }

    next(error)
}