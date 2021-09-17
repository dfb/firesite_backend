// firestore-related helpers
const admin = require('firebase-admin');
const firestore = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

exports.firestore = firestore;
exports.FieldValue = FieldValue;

// helper that takes a firestore query for a list of documents and returns them as a list of
// objects with their .id member set.
exports.GetDocs = function(query, limit=null)
{
    if (limit != null)
        query = query.limit(limit);
    return query.get().then(res =>
    {
        let ret = [];
        for (let d of res.docs)
        {
            let obj = d.data();
            obj.id = d.id;
            ret.push(obj);
        }
        return ret;
    })
}

// like GetDocs, but for retrieving a single document. Can be called in two ways:
// - GetDoc(query) - same as GetDocs
// - GetDoc(colName, ID) - for when you know the primary ID
exports.GetDoc = function(collectionNameOrQuery, docID)
{
    if (typeof collectionNameOrQuery === 'string')
    {   // lookup by primary key
        return firestore.collection(collectionNameOrQuery).doc(docID).get().then(doc =>
        {
            let ret = null;
            if (doc.exists)
            {
                ret = doc.data();
                ret.id = doc.id;
            }
            return ret;
        });
    }
    else
    {   // a query
        return exports.GetDocs(collectionNameOrQuery, 1).then(docs =>
        {
            if (docs && docs.length)
                return docs[0];
            return null;
        });
    }
}

