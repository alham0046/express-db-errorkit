// import { Request } from "express";
// import mongoose, { ClientSession } from "mongoose";

// export class DBSession {

//     private session : ClientSession | null = null

//     async start() {

//         if (this.session) {
//             await this.abort()
//         }

//         this.session = await mongoose.startSession()

//         this.session.startTransaction()

//         return this.session
//     }

//     async commit() {

//         if (!this.session) return

//         await this.session.commitTransaction()

//         await this.session.endSession()

//         this.session = null
//     }

//     async abort() {

//         if (!this.session) return

//         await this.session.abortTransaction()

//         await this.session.endSession()

//         this.session = null
//     }
// }

// export const startSession = async (req : Request) => {
//     const dbSession = new DBSession()
//     req.dbSession = dbSession
//     const session = await dbSession.start()
//     return session
// }


import { Request } from "express";
import mongoose, { type ClientSession, type Connection } from "mongoose";
// import { Connection, ClientSession, default as mongoose } from "mongoose";
const { Connection: MongooseConnectionValue } = mongoose;

// A type helper to map connection keys to session keys
type SessionMap<T> = { [K in keyof T]: ClientSession };

export class DBSession<T extends Record<string, Connection> | Connection = Connection> {
    private target: T;
    // Holds either our map of sessions or a single session
    public sessions: T extends Record<string, Connection> ? SessionMap<T> : ClientSession | null = null as any;

    constructor(target?: T) {
        // Fallback to the default mongoose connection if nothing is provided
        this.target = (target || mongoose.connection) as T;
    }

    // OVERLOAD 1: If target is a dictionary of connections, returns a dictionary of sessions
    async start(): Promise<T extends Record<string, Connection> ? SessionMap<T> : ClientSession>;
    async start() {
        await this.cleanupActive();

        if (this.target instanceof MongooseConnectionValue) {
            // Single connection mode
            const session = await this.target.startSession();
            session.startTransaction();
            this.sessions = session as any;
            return session;
        } else {
            // Multi-connection map mode
            const sessionMap = {} as any;
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

        await Promise.all(activeSessions.map(s => s.commitTransaction()));
        await this.end();
    }

    async abort() {
        const activeSessions = this.getActiveSessions();
        if (activeSessions.length === 0) return;

        await Promise.allSettled(
            activeSessions.map(s => s.inTransaction() ? s.abortTransaction() : Promise.resolve())
        );
        await this.end();
    }

    private async end() {
        const activeSessions = this.getActiveSessions();
        await Promise.all(activeSessions.map(s => s.endSession()));
        this.sessions = (this.target instanceof MongooseConnectionValue ? null : {}) as any;
    }

    private async cleanupActive() {
        const activeSessions = this.getActiveSessions();
        if (activeSessions.length > 0) {
            await this.abort();
        }
    }

    // Helper to normalize active sessions into a single flat array for iteration
    private getActiveSessions(): ClientSession[] {
        if (!this.sessions) return [];
        if (this.target instanceof MongooseConnectionValue) {
            return [this.sessions as ClientSession];
        }
        return Object.values(this.sessions);
    }
}


// export const startSession1 = async (req : Request) => {
//     const dbSession = new DBSession()
//     req.dbSession = dbSession
//     const session = await dbSession.start()
//     return session
// }

// import { Request } from "express";

export const startSession = async <T extends Record<string, Connection> | Connection>(
    req: Request, 
    connections?: T
) => {
    const dbSession = new DBSession(connections);
    req.dbSession = dbSession as any; 
    
    // Automatically infers whether to return an object or a single session block
    return await dbSession.start(); 
};