// src/core/ApiResponse.ts
var ApiResponse = class {
  statusCode;
  data;
  message;
  success;
  constructor(message, data, statusCode = 200) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
};

// src/core/asyncHandler.ts
var asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).then(async (resolvedValue) => {
    if (req.dbSession) {
      await req.dbSession.commit();
      req.dbSession = null;
      console.log("Database Transaction Committed Cleanly \u2705");
    }
    if (resolvedValue instanceof ApiResponse) {
      return res.status(resolvedValue.statusCode).json(resolvedValue);
    } else {
      return resolvedValue;
    }
  }).catch(next);
};

// src/core/DBSession.ts
import mongoose from "mongoose";
var { Connection: MongooseConnectionValue } = mongoose;
var DBSession = class {
  target;
  // Holds either our map of sessions or a single session
  sessions = null;
  constructor(target) {
    this.target = target || mongoose.connection;
  }
  async start() {
    await this.cleanupActive();
    if (this.target instanceof MongooseConnectionValue) {
      const session = await this.target.startSession();
      session.startTransaction();
      this.sessions = session;
      return session;
    } else {
      const sessionMap = {};
      for (const [key, conn] of Object.entries(this.target)) {
        const session = await conn.startSession();
        session.startTransaction();
        sessionMap[key] = session;
      }
      this.sessions = sessionMap;
      return sessionMap;
    }
  }
  async commit() {
    const activeSessions = this.getActiveSessions();
    if (activeSessions.length === 0) return;
    await Promise.all(activeSessions.map((s) => s.commitTransaction()));
    await this.end();
  }
  async abort() {
    const activeSessions = this.getActiveSessions();
    if (activeSessions.length === 0) return;
    await Promise.allSettled(
      activeSessions.map((s) => s.inTransaction() ? s.abortTransaction() : Promise.resolve())
    );
    await this.end();
  }
  async end() {
    const activeSessions = this.getActiveSessions();
    await Promise.all(activeSessions.map((s) => s.endSession()));
    this.sessions = this.target instanceof MongooseConnectionValue ? null : {};
  }
  async cleanupActive() {
    const activeSessions = this.getActiveSessions();
    if (activeSessions.length > 0) {
      await this.abort();
    }
  }
  // Helper to normalize active sessions into a single flat array for iteration
  getActiveSessions() {
    if (!this.sessions) return [];
    if (this.target instanceof MongooseConnectionValue) {
      return [this.sessions];
    }
    return Object.values(this.sessions);
  }
};
var startSession = async (req, connections) => {
  const dbSession = new DBSession(connections);
  req.dbSession = dbSession;
  return await dbSession.start();
};

// src/core/ApiError.ts
var ApiError = class _ApiError extends Error {
  statusCode;
  data;
  message;
  success;
  constructor(message = "Something went wrong", statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    Object.setPrototypeOf(this, _ApiError.prototype);
  }
};

// src/utils/ErrorConfigRegistry.ts
var ErrorConfigRegistry = class {
  // 1. Maintain private reactive configuration state
  duplicateKeyMap = {};
  castErrorHandler;
  /**
   * Initializes or updates the shared library options
   */
  init(options) {
    this.duplicateKeyMap = options.duplicateKeyMap;
    if (options.handleCastError) {
      this.castErrorHandler = options.handleCastError;
    }
  }
  // 2. Clear getters so your internal library engine can safely extract values
  getDuplicateKeyMap() {
    return this.duplicateKeyMap;
  }
  getCastErrorHandler() {
    return this.castErrorHandler;
  }
};
var errorConfig = new ErrorConfigRegistry();
var errorConfigInit = errorConfig.init;

// src/errors/handleCastError.ts
var handleCastError = (err) => {
  const castHandlerFunc = errorConfig.getCastErrorHandler();
  if (castHandlerFunc) {
    const evaluationResult = castHandlerFunc(err);
    return {
      statusCode: evaluationResult.statusCode,
      message: evaluationResult.message
    };
  }
  return {
    statusCode: 400,
    message: `Resource not found. Invalid: ${err.path} : ${err.value}`
  };
};

// src/utils/DuplicateError.ts
var getDuplicateFields = (err) => {
  if (!err.code || err.code !== 11e3) return;
  if (err.name === "MongoServerError") {
    return err.keyValue;
  } else if (err.name === "MongoBulkWriteError") {
    let keyValue = err.keyValue || err.writeErrors?.[0]?.err?.keyValue;
    if (!keyValue) {
      const errMsg = err.message;
      const matches = errMsg.match(/dup key:\s*\{\s*([^}]+)\s*\}/);
      if (matches && matches[1]) {
        const pairs = matches[1].split(",");
        keyValue = {};
        pairs.forEach((pair) => {
          const [rawKey, rawValue] = pair.split(":");
          if (rawKey && rawValue) {
            const key = rawKey.trim();
            const value = rawValue.trim().replace(/^["']|["']$/g, "");
            keyValue[key] = value;
          }
        });
      }
    }
    return keyValue;
  }
};

// src/errors/handleMongoServerError.ts
var handleMongoServerError = (err) => {
  if (!err.code || err.code !== 11e3) return;
  const fields = getDuplicateFields(err);
  const collectionName = err.meta?.collectionName;
  const keys = Object.keys(fields);
  const duplicateKeyMap = errorConfig.getDuplicateKeyMap();
  const collectionMap = duplicateKeyMap[collectionName];
  if (collectionMap) {
    if (keys.length > 1) {
      let compoundKey = keys.sort().join("_");
      if (collectionMap[compoundKey]) {
        console.log("compoundKey", compoundKey, fields);
        return {
          statusCode: 409,
          message: collectionMap[compoundKey]({
            fields
          })
        };
      } else {
        compoundKey = keys.join(" and ");
        const formattedFields2 = compoundKey ? compoundKey.charAt(0).toUpperCase() + compoundKey.slice(1).toLowerCase() : "Field";
        return {
          statusCode: 409,
          message: `${formattedFields2} already exists.`
        };
      }
    }
    const key = keys[0];
    if (collectionMap[key]) {
      return {
        statusCode: 409,
        message: collectionMap[key]({
          value: fields[key],
          fields
        })
      };
    }
    return {
      statusCode: 409,
      message: "Duplicate field value"
    };
  }
  const modifiedKey = keys.join(" and ");
  const formattedFields = modifiedKey ? modifiedKey.charAt(0).toUpperCase() + modifiedKey.slice(1).toLowerCase() : "Field";
  return {
    statusCode: 409,
    message: `${formattedFields} already exists.`
  };
};

// src/errors/errorMiddleware.ts
var ErrorMap = {
  "CastError": handleCastError,
  "MongoServerError": handleMongoServerError,
  "MongoBulkWriteError": handleMongoServerError
};
var handleAnonymousError = (err) => {
  const errName = err.name;
  if (ErrorMap[errName]) {
    const { message, statusCode } = ErrorMap[errName](err);
    return new ApiError(message, statusCode);
  }
  return err;
};
var errorMiddleware = async (err, req, res, next) => {
  console.log(err, err.name, err?.model);
  if (req.dbSession) {
    try {
      await req.dbSession.abort();
      req.dbSession = null;
      console.log("Database Transaction Aborted Cleanly \u21A9\uFE0F");
    } catch (abortError) {
      console.error("Failed to abort database transaction:", abortError);
    }
  }
  if (!(err instanceof ApiError)) {
    err = handleAnonymousError(err);
  }
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ statusCode, data: err.data, message: err.message || "Something went wrong", success: err.success });
};

// src/mongoose/queryThrowErrorPlugin.ts
var throwErrorQueryPlugin = (schema) => {
  const queryHelpers = schema.query;
  queryHelpers.orThrow = function(customMessage, statusCode = 404) {
    const modelName = this.model?.modelName || "Resource";
    const message = customMessage || `${modelName} not found`;
    return this.orFail(() => {
      throw new ApiError(message, statusCode);
    });
  };
  queryHelpers.throwIfExists = function(messageOrCallback, statusCode = 409) {
    return this.transform((res) => {
      const exists = Array.isArray(res) ? res.length > 0 : !!res;
      if (exists) {
        const message = typeof messageOrCallback === "function" ? messageOrCallback(res) : messageOrCallback;
        throw new ApiError(
          message || "Operational conflict",
          statusCode
        );
      }
      return res;
    });
  };
};

// src/mongoose/middleware/queryErrorMiddleware.ts
var queryErrorMiddleware = function(error, res, next) {
  error.meta = {
    type: "query",
    modelName: this.model?.modelName,
    collectionName: this.model?.collection?.name,
    operation: this.op,
    query: this.getQuery?.(),
    update: this.getUpdate?.()
  };
  next(error);
};

// src/mongoose/middleware/modelErrorMiddleware.ts
var modelErrorMiddleware = function(error, result, next) {
  error.meta = {
    type: "model",
    modelName: this.modelName,
    collectionName: this.collection?.name,
    operation: "insertMany",
    keyPattern: error.keyPattern,
    keyValue: error.keyValue
  };
  next(error);
};

// src/mongoose/middleware/documentErrorMiddleware.ts
var documentErrorMiddleware = function(error, doc, next) {
  error.meta = {
    type: "document",
    modelName: this.constructor.modelName,
    collectionName: this.constructor.collection.name,
    operation: "save",
    documentId: this._id
  };
  next(error);
};

// src/mongoose/errorMetaPlugin.ts
var queryOps = [
  "find",
  "findOne",
  "findOneAndUpdate",
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
  "findOneAndDelete",
  "findOneAndReplace"
];
var errorMetaPlugin = (schema) => {
  queryOps.forEach((op) => {
    schema.post(
      op,
      queryErrorMiddleware
    );
  });
  schema.post("save", documentErrorMiddleware);
  schema.post("insertMany", modelErrorMiddleware);
};
export {
  ApiResponse,
  DBSession,
  asyncHandler,
  errorConfigInit,
  errorMetaPlugin,
  errorMiddleware,
  startSession,
  throwErrorQueryPlugin
};
//# sourceMappingURL=index.js.map