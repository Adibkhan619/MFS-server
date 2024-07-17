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
        const cashInCollection = client.db("mfs").collection("cashIn");
        const cashOutCollection = client.db("mfs").collection("cashOut");

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

// BLOCK USER ----------:>
app.patch("/users/block/:id",  async (req, res) => {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: "Blocked"
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
    
// POST TRANSACTIONS ------------->
app.post("/transactions", async (req, res) => {
    const transactions = req.body
    const result = await transactionCollection.insertOne(transactions)
    res.send(result)
})

// GET ALL TRANSACTIONS ------------->
app.get("/transactions", async(req,res) => {
    const result = await transactionCollection.find().toArray()
    res.send(result)
})

// SEND MONEY ---->
app.patch("/send-money/:id", async(req, res) =>{
    const id = req.params.id
    const {moneyChange} = req.body
    const moneyChangeNumber = parseFloat(moneyChange);
 
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {   
        $inc: {
            balance: moneyChangeNumber
        },   
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
    console.log(result);
    console.log(`send-money - Update Result: ${JSON.stringify(result)}`);
})

// REDUCE MONEY OF SENDER ------>
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

// CASH IN -------->
app.post("/cash-in", async(req, res) => {
    const cashIn = req.body
    const result = await cashInCollection.insertOne(cashIn)
    res.send(result)
})

// GET CASH IN -------->
app.get("/cash-in", async(req, res) => {
    const result = await cashInCollection.find().toArray()
    res.send(result)
})

app.get("/cash-in/:id", async(req, res) => {
    const id = req.params.id
    const filter = { _id: new ObjectId(id) };
    const result = await cashInCollection.findOne(filter)
    res.send(result)
})

app.patch("/cash-in/:id", async(req, res) =>{
    const id = req.params.id
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            status: "Approved"
        },      
    };
    const result = await cashInCollection.updateOne(filter, updateDoc);
    res.send(result);
})

// CASH OUT -------->
app.post("/cash-out", async(req, res) => {
    const cashOut = req.body
    const result = await cashOutCollection.insertOne(cashOut)
    res.send(result)
})

// GET CASH OUT -------->
app.get("/cash-out", async(req, res) => {
    const result = await cashOutCollection.find().toArray()
    res.send(result)
})

// PIN VALIDATION --------->
app.post('/validate-pin', async (req, res) => {
    const { name, PIN } = req.body;
    try {
      // Retrieve the user from the database
      const user = await userCollection.findOne({ name });
      if (!user) {
        return res.status(404).send({ valid: false, message: 'User not found' });
      }
      // Compare the provided PIN with the hashed PIN in the database
      const isMatch = await bcrypt.compare(PIN, user.PIN);
  
      if (isMatch) {
        res.status(200).send({ valid: true, message: 'PIN is valid' });
      } else {
        res.status(401).send({ valid: false, message: 'Invalid PIN' });
      }
    } catch (error) {
    //   res.status(500).send({ valid: false, message: error.message });
    }
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
