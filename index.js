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
      .collection("beVolunteerRequest");

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

    app.get("/posts/:organizer_email", async (req, res) => {
      const email = req.params.organizer_email;
      const result = await volunteerCollection
        .find({ organizer_email: email })
        .toArray();
      res.send(result);
    });
    app.post("/post", async (req, res) => {
      const postData = req.body;
      // console.log(postData);
      const result = await volunteerCollection.insertOne(postData);
      res.send(result);
    });
    app.post("/request", async (req, res) => {
      const requestData = req.body;
      // console.log(requestData);
      const result = await beVolunteerCollection.insertOne(requestData);
      res.send(result);
    });
    app.get("/request/:email", async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const result = await beVolunteerCollection
        .find({ useremail: email })
        .toArray();
      res.send(result);
    });
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upset: true };
      const updatePost = req.body;
      const post = {
        $set: {
          title: updatePost.title,
          thumbnail: updatePost.thumbnail,
          location: updatePost.location,
          description: updatePost.description,
          category: updatePost.category,
          deadline: updatePost.deadline,
          number: updatePost.number,
        },
      };
      const result = await volunteerCollection.updateOne(filter, post, options);
      res.send(result);
    });

    app.delete("/delete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/requestDelete/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await beVolunteerCollection.deleteOne(query);
      res.send(result);
    });
    //search by title
    app.get("/titlePost/:title", async (req, res) => {
      const title = req.params.title;
      // console.log(title);
      const result = await volunteerCollection.find({ title: title }).toArray();
      res.send(result);
    });

    //sort by deadline
    app.get("/sortPost", async (req, res) => {
      const cursor = volunteerCollection.find();
      cursor.sort({ deadline: 1 });
      const result = await cursor.toArray();
      res.json(result);
    });
    //request update number decrese volunteer
    app.patch("/requestUpdate/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateOperation = {
        $inc: {
          number: -1,
        },
      };
      const result = await volunteerCollection.updateOne(
        filter,
        updateOperation
      );
      res.json(result);
    });
    // update number increse
    app.patch("/requestUpdateIncrese/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateOperation = {
        $inc: {
          number: 1,
        },
      };
      const result = await volunteerCollection.updateOne(
        filter,
        updateOperation
      );
      res.json(result);
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
