// import { ApiError } from "./apiError.js"
// import { getDuplicateFields } from "./ErrorMethods.js"

import { ApiError } from "./ApiError"

interface MongoTypes {
    operation: () => any
    callback: ({ err, duplicateFields }: { err: any; duplicateFields: any }) => any
}

export const mongoTry = async (
    operation : () => any,
    // customMessageMap = {}
    callback : ({ err, duplicateFields }: { err: any; duplicateFields: any }) => any
) => {

    try {

        return await operation()

    } catch (err) {
        console.log('the err is', err)
        if (err instanceof ApiError) {
            throw err
        }
        let duplicateFields = null
        if (err.code === 11000) {
            duplicateFields = getDuplicateFields(err)
        }
        const { statusCode, message} = callback({ err, duplicateFields })
        throw new ApiError(message, statusCode)
    }
}