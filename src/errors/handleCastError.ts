import { CastError } from "mongoose"
import { errorConfig } from "../utils/ErrorConfigRegistry"

export const handleCastError = (err: CastError) => {
    // 1. Get the handler function from your singleton store configuration
    const castHandlerFunc = errorConfig.getCastErrorHandler();

    if (castHandlerFunc) {
        // 2. 🟢 CRITICAL: Execute the function and pass the error object into it!
        const evaluationResult = castHandlerFunc(err);

        return {
            statusCode: evaluationResult.statusCode,
            message: evaluationResult.message
        };
    }
    return {
        statusCode: 400,
        message: `Resource not found. Invalid: ${err.path} : ${err.value}`
    }
}