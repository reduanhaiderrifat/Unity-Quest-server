const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//midlewares
app.use(express.json());
app.use(cors({ origin: ["http://localhost:5173"], credentials: true }));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.u9zrvau.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)

    const volunteerCollection = client
      .db("volunteerDB")
      .collection("volunteerPost");
    const beVolunteerCollection = client
      .db("volunteerDB")
      .collection("beVolunteer");

    app.get("/allPost", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.send(result);
    });
    app.get("/singlePost/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });
    app.post("/post", async (req, res) => {
      const postData = req.body;
      console.log(postData);
      const result = await volunteerCollection.insertOne(postData);
      res.send(result);
    });

    // Send a ping to confirm a successful connection

    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("This eserver is running volunteer management");
});
app.listen(port, () => {
  console.log(`this server is running on http://localhost:${port}`);
});
