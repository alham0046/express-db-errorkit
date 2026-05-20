export const getDuplicateFields = (err : any) => {
    if (!err.code || err.code !== 11000) return
    if (err.name === "MongoServerError") {
        return err.keyValue
    }
    else if (err.name === "MongoBulkWriteError") {
        let keyValue = err.keyValue || err.writeErrors?.[0]?.err?.keyValue;
        if (!keyValue) {
            const errMsg = err.message
            const matches = errMsg.match(/dup key:\s*\{\s*([^}]+)\s*\}/);

            if (matches && matches[1]) {
                // matches[1] string looks like: accessionNumber: "56", bookType: "ncert"
                const pairs = matches[1].split(",");
                // console.log('the pair is', pairs)
                // Create a temporary data dictionary object
                keyValue = {};

                pairs.forEach((pair : string) => {
                    const [rawKey, rawValue] = pair.split(":");
                    if (rawKey && rawValue) {
                        const key = rawKey.trim();
                        // Strip out spaces and double quotes from the value
                        const value = rawValue.trim().replace(/^["']|["']$/g, '');
                        keyValue[key] = value;
                    }
                })
            }

        }
        return keyValue
    }
}