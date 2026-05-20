import { Query } from "mongoose"
import { ErrorTypes } from "../../types/ErrorTypes"
import { NextFunction, Response } from "express"

export const queryErrorMiddleware = function (
    this : Query<any, any> & { op: string },
    error : ErrorTypes,
    res : Response,
    next : NextFunction
) {

    error.meta = {

        type: "query",

        modelName:
            this.model?.modelName,

        collectionName:
            this.model?.collection?.name,

        operation:
            this.op,

        query:
            this.getQuery?.(),

        update:
            this.getUpdate?.()
    }

    next(error)
}