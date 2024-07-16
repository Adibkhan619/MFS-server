const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;

// MIDDLEWARE -------->
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.vfffbgl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
async function run() {
    try {
        const userCollection = client.db("mfs").collection("users");

        // GET ALL USER DATA ---------->
        app.get("/users",  async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.post("/users", async(req, res) =>{
            const user = req.body;
            const result = await userCollection.insertOne(user)
            res.send(result)
        })

// MAKE AGENT -------->

app.patch("/users/:id",  async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            role: "Agent",
            status: "Active"
        },
        $inc: {
            money: parseFloat(10000)
        },
        
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});

// ACTIVE USERS ------------> 
app.patch("/users/active/:id",  async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: "Active"
        },       
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("App is running");
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
