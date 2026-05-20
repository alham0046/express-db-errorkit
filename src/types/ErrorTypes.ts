// import { UpdateQuery, UpdateWithAggregationPipeline } from "mongoose";

// export interface ErrorTypes extends Error {
//     statusCode: number;
//     success : boolean
//     data : object | null
//     meta : {
//         type : string
//         modelName : string
//         collectionName : string
//         operation : any
//         documentId? : string
//         query?: object
//         update?: UpdateWithAggregationPipeline | UpdateQuery<any> | null
//     }
// }


import { ErrorMeta } from "./ErrorMeta"

export interface ErrorTypes extends Error {

    statusCode?: number

    success?: boolean

    data?: object | null

    meta?: ErrorMeta
}