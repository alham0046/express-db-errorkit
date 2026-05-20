export class ApiResponse<T> {
    public statusCode: number;
    public data: T;
    public message: string;
    public success: boolean;
    constructor(
        message : string,
        data : T,
        statusCode : number = 200,
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

// export const sendResponse = (message, data, statusCode = 200) => res.status(statusCode).json(new ApiResponse(message, data, statusCode));