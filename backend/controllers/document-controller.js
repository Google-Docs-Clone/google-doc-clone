const Document = require('../models/document-model.js')

createDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
    const {name} = req.body

    if (!name){
        return res
                .status(200)
                .json({
                    error: true,
                    message: 'invalid name'
                })
    }

    const existingDocument = await Document.findOne({name: name})
    if (existingDocument) {
        return res
                .status(200)
                json({
                    error: true,
                    message: 'document already exists'
                })
    }

    const newDocument = new Document({
        name: name,
        yjs: []
    })

    const savedDocument = await newDocument.save()

    return res
            .status(200)
            .json({
                id: savedDocument._id
            })
}

deleteDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
    const {id} = req.body

    if (!id) {
        return res 
                .status(200)
                .json({
                    error: true,
                    message: "invalid id for deletion"
                })
    }

    Document.findByIdAndDelete(id, function (id, docs) {
        if (err) {
            return res
                    .status(200)
                    .json({
                        error: true,
                        message: err
                    })
        }
    })

    return res
            .status(200)
            .json({
                status: 'OK'
            })
}

listDocument = async (req, res) => {
    res.set("X-CSE356", "6339f8feca6faf39d6089077");
    const docs = await Document.find().sort({ createdAt: -1 }).limit(10)
    let latestTen = []
    for (const doc in docs) {  
        latestTen.push({
            id: doc._id,
            name: doc.name
        })
    }
    return res
            .status(200)
            .json(latestTen)

} 