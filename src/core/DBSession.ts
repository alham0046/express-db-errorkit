import { Request } from "express";
import mongoose, { ClientSession } from "mongoose";

export class DBSession {

    private session : ClientSession | null = null

    async start() {

        if (this.session) {
            await this.abort()
        }

        this.session = await mongoose.startSession()

        this.session.startTransaction()

        return this.session
    }

    async commit() {

        if (!this.session) return

        await this.session.commitTransaction()

        await this.session.endSession()

        this.session = null
    }

    async abort() {

        if (!this.session) return

        await this.session.abortTransaction()

        await this.session.endSession()

        this.session = null
    }
}

export const startSession = async (req : Request) => {
    const dbSession = new DBSession()
    req.dbSession = dbSession
    const session = await dbSession.start()
    return session
}