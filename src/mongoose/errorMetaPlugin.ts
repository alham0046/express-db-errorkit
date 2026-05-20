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
            op as any,
            queryErrorMiddleware as any
        )
    })

    schema.post("save" as any, documentErrorMiddleware as any)

    schema.post("insertMany", modelErrorMiddleware)
}