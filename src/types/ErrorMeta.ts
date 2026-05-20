import {
    UpdateQuery,
    UpdateWithAggregationPipeline
} from "mongoose"

export interface ErrorMeta {

    type:
        | "query"
        | "document"
        | "model"

    modelName?: string

    collectionName?: string

    operation?: string

    documentId?: string

    query?: object

    update?:
        | UpdateQuery<any>
        | UpdateWithAggregationPipeline
        | null

    keyPattern?: object

    keyValue?: object
}