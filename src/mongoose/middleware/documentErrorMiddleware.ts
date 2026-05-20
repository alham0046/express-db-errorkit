import { NextFunction } from "express"
import { ErrorTypes } from "../../types/ErrorTypes"
import { HydratedDocument, Model } from "mongoose"

type DocumentContext = HydratedDocument<any> & { constructor: Model<any> }

export const documentErrorMiddleware = function (
    // this: Document & { constructor: any } & { _id: string },
    this: DocumentContext,
    error: ErrorTypes,
    doc: any,
    next: NextFunction
) {
    error.meta = {

        type: "document",

        modelName:
            this.constructor.modelName,

        collectionName:
            this.constructor.collection.name,

        operation: "save",

        documentId:
            this._id
    }

    next(error)
}