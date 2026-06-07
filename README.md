# 🚀 Express Mongoose Advanced Error & Transaction Manager

An enterprise-grade orchestration utility framework for Node.js/Express and Mongoose. This framework automates database transactions (supporting single and distributed multi-connection engines), intercepts and normalizes database driver crashes, and adds declarative functional query methods to your database access models.

---

## 📦 Core Features Overview

* **Automatic Lifecycle Transactions:** Safely initiates, commits, or aborts atomic queries inside the Express routing workflow loop.
* **Declarative Query Middleware Hooks:** Extends Mongoose queries with instant chaining expressions like `.orThrow()` and `.throwIfExists()`.
* **Dynamic Constraint Formatters:** Maps ugly driver database server errors (`MongoServerError: E11000 duplicate key`) and validation failures (`CastError`) into legible, readable API error responses.
* **Contextual Meta Tracking:** Automatically injects contextual data metadata (like source collection indicators) directly into error handling pipelines using built-in database hooks.

---

## 🛠️ Global Initialization Setup

Initialize the plugin parameters during your backend server configuration boot cycle before configuring standard app routes.

### 1. Register Global Plugins and Request Middlewares also global initialization
Inject the structural tracking hooks into your global Mongoose instance and plug in the core error response middleware handler:

```typescript
// app.ts
import express from "express";
import mongoose from "mongoose";
import { errorMiddleware, errorMetaPlugin, throwErrorQueryPlugin, errorConfigInit } from "express-db-errorkit";

errorConfigInit(ErrorCustomMessage)

const app = express();
app.use(express.json());

// 🟢 Apply transactional/query plugins globally to ALL database schemas
mongoose.plugin(errorMetaPlugin);
mongoose.plugin(throwErrorQueryPlugin);

// ... connect with your mongodb database

// ... Define your standard controller route routers here ...

// 🟢 Register global application centralized error interceptor last
app.use(errorMiddleware);
```typescript


### 2. Initialize Error Configuration Map
Configure your custom human-readable translation dictionary mappings:

```typescript
// config/errorMessages.ts
// Always keep the object property keys in-sync with the target database collection names
export const ErrorCustomMessage = {
    duplicateKeyMap: {
        // The object property key MUST explicitly match the target database collection name
        Movies: {
            tmdbId: ({ value }) => `Movie with TMDB reference code "${value}" already exists.`,
            title_year: ({ fields }) => `A movie entry titled "${fields.title}" released in ${fields.year} is already registered.`
        },
        Students: {
            rollNumber: ({ value }) => `Registration roll number "${value}" is already claimed by another active student record.`
        }
    },
    // Optional custom runtime transformer overrides for CastError overrides
    handleCastError: (err) => ({
        statusCode: 422,
        message: `The structural value "${err.value}" is not a valid alphanumeric MongoDB object identifier.`
    })
};
```typescript



🕹️ Structural Implementation Reference Examples
A. Utilizing Custom Query Chaining Methods
Instead of cluttering your code blocks with repetitive conditional checks, handle operational assertions directly inside the Mongoose query statement:

```typescript
import { asyncHandler, ApiResponse } from "express-db-errorkit";
import { bookModel, borrowRecordModel } from "../models";

export const processBookIssue = asyncHandler(async (req, res) => {
    const { borrowerId, bookId, bookNumber } = req.body;

    // 1. .orThrow() automatically fires a 404 ApiError if the query yields empty results
    const targetBook = await bookModel.findById(bookId).orThrow("Target book volume does not exist inside repository");

    // 2. .throwIfExists() stops execution and throws a 409 ApiError if a matching record exists
    await borrowRecordModel.findOne({ borrowerId, bookId, returnedAt: null })
        .throwIfExists("This individual currently possesses an unreturned copy of this book record.");

    return new ApiResponse("Operational evaluations completed successfully", { targetBook });
});
```typescript



B. Automating Single or Distributed Database Transactions
Use the explicit startSession(req) driver function. Your wrapper library handles the automated lifecycle orchestration automatically.

```typescript
import { asyncHandler, ApiResponse, startSession } from "express-db-errorkit";
import { borrowRecordModel, bookCopyModel } from "../models";

export const addBorrowRecord = asyncHandler(async (req, res) => {
    const { borrowerId, bookId, bookNumber } = req.body;

    // 1. Instantiates transaction session loop context and links it to req.dbSession automatically
    const session = await startSession(req);

    // 2. Perform write interactions bound directly to the tracking transaction session
    const [newRecord] = await borrowRecordModel.create(
        [{ borrowerId, bookId, bookNumber }], 
        { session }
    );

    await bookCopyModel.findOneAndUpdate(
        { accessionNumber: bookNumber }, 
        { isBorrowed: true }, 
        { session }
    ).orThrow("Target catalog book item serial lookup failed");

    // 🟢 No manual commit needed! 
    // asyncHandler commits automatically if the route completes without errors.
    // If ANY line throws an exception, errorMiddleware intercepts it and calls abort() safely.
    return new ApiResponse("Borrow tracker record logged successfully", newRecord, 201);
});
```typescript



📐 Internal Technical Processing Sequence
asyncHandler Wrapper: Intercepts outgoing requests, checks if a route initialization session has been initialized on req.dbSession, and resolves the execution controller.

errorMetaPlugin: Injects a custom runtime processing layer onto all target model save and query cycles, automatically capturing the source context details (like .meta.collectionName).

errorMiddleware Interceptor: If a query fails, this middleware intercepts the native database exceptions, triggers an atomic rollback via req.dbSession.abort(), runs the formatting registry rules to generate a human-readable message, and sends an standard formatted error schema down to the user:

```json
{
  "success": false,
  "statusCode": 409,
  "message": "Registration roll number \"2026-0042\" is already claimed by another active student record.",
  "data": null
}
```json