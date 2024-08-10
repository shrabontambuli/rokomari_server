const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware //

app.use(cors());
app.use(express.json());

// rokomari
// sdUviAgZt0MZeALZ


const uri = "mongodb+srv://rokomari:sdUviAgZt0MZeALZ@cluster0.ezafyme.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        const productCollection = client.db('rokomari').collection('allProduct');
        const selectsCollection = client.db('rokomari').collection('selects');


        // get api //

        app.get('/products', async (req, res) => {
            const cursor = productCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        // get api with id //

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await productCollection.findOne(query)
            res.send(result);
        })

        // post api //

        app.post('/selects', async (req, res) => {
            const data = req.body;
            const result = await selectsCollection.insertOne(data);
            res.send(result);
        })

        // put api //

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);





app.get('/', (req, res) => {
    res.send("Hello Server........!!!!!!!!!!")
})

app.listen(port, () => {
    console.log(`Server is running on port, ${port}`);
})