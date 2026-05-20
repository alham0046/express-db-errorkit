import { getDuplicateFields } from "../utils/DuplicateError";
import { errorConfig } from "../utils/ErrorConfigRegistry";


export const handleMongoServerError = (err : any) => {
    if (!err.code || err.code !== 11000) return
    const fields = getDuplicateFields(err);
    const collectionName = err.meta?.collectionName;
    const keys = Object.keys(fields)

    const duplicateKeyMap = errorConfig.getDuplicateKeyMap()

    const collectionMap = duplicateKeyMap[collectionName]

    if (collectionMap) {

        if (keys.length > 1) {
            let compoundKey = keys.sort().join("_")
            if (
                collectionMap[compoundKey]
            ) {
                console.log("compoundKey", compoundKey, fields)

                return {
                    statusCode: 409,
                    message:
                        collectionMap[compoundKey]({
                            fields
                        })
                }
            }
            else {
                compoundKey = keys.join(" and ")
                const formattedFields = compoundKey ? compoundKey.charAt(0).toUpperCase() + compoundKey.slice(1).toLowerCase() : "Field";
                return {
                    statusCode: 409,
                    message: `${formattedFields} already exists.`
                }
            }
        }
        // compound match
        // single field
        const key = keys[0]

        if (collectionMap[key]) {

            return {
                statusCode: 409,
                message:
                    collectionMap[key]({
                        value: fields[key],
                        fields
                    })
            }
        }
        return {
            statusCode: 409,
            message: "Duplicate field value"
        }
    }

    const modifiedKey = keys.join(" and ")
    const formattedFields = modifiedKey ? modifiedKey.charAt(0).toUpperCase() + modifiedKey.slice(1).toLowerCase() : "Field";
    return {
        statusCode: 409,
        message: `${formattedFields} already exists.`
    }
}