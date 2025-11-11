const express = require('express')
const app = express()
const admin = require("firebase-admin");
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = 3000
require("dotenv").config()
const cors = require('cors');
app.use(cors());
app.use(express.json());



const serviceAccount = require("./serviceKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    await admin.auth().verifyIdToken(token);

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};



const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_PASSWORD}@cluster0.f5i9hzs.mongodb.net/?appName=Cluster0`;
//const uri = "mongodb+srv://halalkaj:ld9y8HxMxCcluW84@cluster0.f5i9hzs.mongodb.net/?appName=Cluster0";

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
    //await client.connect();

    const db = client.db("halalkaj");
    const jobsCollection = db.collection("jobs");
    const taskCollection = db.collection("myTask");


    app.get("/allJobs", async (req, res) => {
      const result = await jobsCollection.find().toArray()
      res.send(result)
    })

    app.get("/allJobs/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const job = await jobsCollection.findOne(query);
      res.send(job);
    });


    //latest Jobs
    app.get("/latest-Jobs", async (req, res) => {
      const jobs = await jobsCollection.find().sort({ postedAt: -1 }).limit(6).toArray();
      res.send(jobs);
    });

    //Add A jobs
    app.post("/add-job", async (req, res) => {
      const job = req.body;
      job.postedAt = new Date();
      job.acceptedBy = null;
      const result = await jobsCollection.insertOne(job);
      res.send(result);
    })

    //Update Job

    app.patch("/updateJob/:id", async (req, res) => {
      const id = req.params.id;
      const updatedJob = req.body;
      const userEmail = updatedJob.userEmail;

      const filter = {
        _id: new ObjectId(id),
        userEmail: userEmail
      };

      const updateDoc = {
        $set: updatedJob,
      };
      const result = await jobsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // Delete Job

    app.delete("/deleteJob/:id", async (req, res) => {
      const id = req.params.id;
      const filter = {
        _id: new ObjectId(id),
      };

      const result = await jobsCollection.deleteOne(filter);
      res.send(result);
    });

    //Accepted Task collection
    app.post("/accepted-task-collection", async (req, res) => {
      const data = req.body
      const result = await taskCollection.insertOne(data)
      res.send(result);
    })

    //Accepted Task
    app.get("/my-accepted-tasks",verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await taskCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });
    // my posted jobs
    app.get("/my-posted-jobs", verifyToken, async (req, res) => {
      const email = req.query.email;
      const result = await jobsCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });



    // Send a ping to confirm a successful connection
    //await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
