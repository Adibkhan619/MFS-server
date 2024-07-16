const express = require("express");
const cors = require("cors");
const app = express();
const bcrypt = require('bcryptjs');
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
        const transactionCollection = client.db("mfs").collection("transactions");

        // GET ALL USER DATA ---------->
        app.get("/users",  async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        // REGISTER USER INTO DB --------->
        app.post("/users", async(req, res) =>{
            const user = req.body;
            const saltRounds = 10;
             user.PIN = await bcrypt.hash(user.PIN, saltRounds);
            const result = await userCollection.insertOne(user);
              
            console.log(result);
            res.send(result)
        })

        // LOGIN ------->
        app.post('/login', async (req, res) => {
            const { email, PIN } = req.body; 
            try {
              // Find the user in the database
              const user = await userCollection.findOne({ email });               
              // Compare the provided PIN with the hashed PIN in the database
              const isMatch = await bcrypt.compare(PIN, user.PIN);
              
              if (isMatch) {
                res.status(200).send('Login successful hoyeche');
              } else {
                res.status(401).send('Invalid PIN');
              }
            } catch (error) {
              res.status(500).send(error.message);
            }
          });



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
            balance: parseFloat(10000)
        }, 
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});

// ACTIVATE USERS ------------> 
app.patch("/users/activate/:id",  async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: "Active"
        },     
        $inc: {
            balance: parseFloat(40)
        },   
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});

// USER BY EMAIL ----------->
app.get("/users/:email", async(req, res) => {
    const email = req.params.email
    const query = {email: email}
    const result = await userCollection.findOne(query)
    res.send(result)
})
    

app.post("/transactions", async (req, res) => {
    const transactions = req.body
    const result = await transactionCollection.insertOne(transactions)
    res.send(result)
})

app.get("/transactions", async(req,res) => {
    const result = await transactionCollection.find().toArray()
    res.send(result)
})

// SEND MONEY ---->
app.patch("/send-money/:mobile", async(req, res) =>{
    const mobile = req.params.mobile
    const {moneyChange} = req.body
    const query = {mobile: mobile}
    const updateDoc = {   
        $inc: {
            balance: parseFloat(moneyChange)
        },   
    };
    const result = await userCollection.updateOne(query, updateDoc);
    res.send(result);
})


app.patch("/reduce-money/:id", async (req, res) =>{
    const id = req.params.id
    const {moneyChange} = req.body
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {  
        $inc: {
            balance: parseFloat(moneyChange)
        },   
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
})









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
