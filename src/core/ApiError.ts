export class ApiError extends Error {
    public statusCode: number;
    public data: Record<string, any> | null;
    public message: string;
    public success: boolean
    constructor(
        message : string = "Something went wrong",
        statusCode : number = 500,
        data: Record<string, any> | null = null
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = false
        // 3. Fix the prototype chain tracking explicitly for TypeScript
        Object.setPrototypeOf(this, ApiError.prototype);

        // 4. Clean up the stack trace (Optional but useful for debugging logs)
        // if (Error.captureStackTrace) {
        //     Error.captureStackTrace(this, this.constructor);
        // }
    }
}