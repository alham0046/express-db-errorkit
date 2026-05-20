import { Schema } from "mongoose"
import { queryErrorMiddleware } from "./middleware/queryErrorMiddleware"
import { modelErrorMiddleware } from "./middleware/modelErrorMiddleware"
import { documentErrorMiddleware } from "./middleware/documentErrorMiddleware"

const queryOps = [
    "find",
    "findOne",
    "findOneAndUpdate",
    "updateOne",
    "updateMany",
    "deleteOne",
    "deleteMany",
    "findOneAndDelete",
    "findOneAndReplace"
] as const

export const errorMetaPlugin = (schema: Schema) => {
    // schema.post(queryOps, queryErrorMiddleware)
    queryOps.forEach((op) => {

        schema.post(
            op,
            queryErrorMiddleware
        )
    })

    schema.post("save", documentErrorMiddleware)

    schema.post("insertMany", modelErrorMiddleware)
}