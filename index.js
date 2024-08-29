const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { default: axios } = require('axios');
const app = express();
const port = process.env.PORT || 5000;

// middleware //

app.use(cors());
app.use(express.json());
app.use(express.urlencoded());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ezafyme.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        const usersCollection = client.db('rokomari').collection('users');
        const payments = client.db('rokomari').collection('payment');


        // get api //

        app.get('/products', async (req, res) => {
            const cursor = productCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })


        app.get('/selects', async (req, res) => {
            const cursor = selectsCollection.find();
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

        app.post('/products', async (req, res) => {
            const data = req.body;
            const result = await productCollection.insertOne(data);
            res.send(result);
        })

        app.post('/selects', async (req, res) => {
            const data = req.body;
            const result = await selectsCollection.insertOne(data);
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            if (existingUser) {
                return res.send({ message: 'user already existing' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });
        // put api //

        // delete api //

        app.delete('/selects/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await selectsCollection.deleteOne(query);
            res.send(result);
        })


        // payment SSLCOMMERZ //

        app.post('/create-payment', async (req, res) => {
            const paymentInfo = req.body;
            const trxId = new ObjectId().toString();
            const initiateData = {
                store_id: `${process.env.STORE_ID}`,
                store_passwd: `${process.env.STORE_PASS}`,
                total_amount: paymentInfo.amount,
                currency: "BDT",
                tran_id: trxId,
                success_url: "http://localhost:5000/success-payment",
                fail_url: "http://localhost:5000/fail",
                cancel_url: "http://localhost:5000/cancel",
                cus_name: "Customer Name",
                cus_email: "cust@yahoo.com&",
                cus_add1: "Dhaka&",
                cus_add2: "Dhaka&",
                cus_city: "Dhaka&",
                cus_state: "Dhaka&",
                cus_postcode: "1000&",
                cus_country: "Bangladesh&",
                cus_phone: "01711111111&",
                cus_fax: "01711111111&",
                shipping_method: "NO",
                product_name: "Book",
                product_category: "Book",
                product_profile: "general",
                multi_card_name: "mastercard,visacard,amexcard&",
                value_a: "ref001_A&",
                value_b: "ref002_B&",
                value_c: "ref003_C&",
                value_d: "ref004_D'"
            }

            const response = await axios({
                method: "post",
                url: "https://sandbox.sslcommerz.com/gwprocess/v4/api.php",
                data: initiateData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            })

            const saveData = {
                cus_name: "Dumy",
                paymentId: trxId,
                amount: paymentInfo.amount,
                status: "pending",
            };

            const save = await payments.insertOne(saveData);
            if (save) {
                res.send({
                    paymentUrl: response.data.GatewayPageURL,
                });
            }
        })

        app.post('/success-payment', async (req, res) => {
            const successData = req.body;
            if (successData.status !== "VALID") {
                throw new Error("Unauthorized payment, Invalid Payment");
            }

            // update the database //

            const query = {
                paymentId: successData.tran_id
            }
            const update = {
                $set: {
                    status: "Success",
                }
            }

            const updateData = await payments.updateOne(query, update);
            res.redirect("http://localhost:5173/success");

            console.log("successData", successData)
            console.log("updateData", updateData)
        });

        app.post('/fail', async (req, res) => {
            res.redirect("http://localhost:5173/fail")
        });

        app.post('/cancel', async (req, res) => {
            res.redirect("http://localhost:5173/cancel")
        });


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