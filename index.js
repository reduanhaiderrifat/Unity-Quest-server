const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//midlewares
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://volunteer-management-web.web.app",
      "https://volunteer-management-web.firebaseapp.com",
    ],
    credentials: true,
  })
);
//verify middlewares

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token is the middle ware", token);
  //no token avaiable
  if (!token) {
    return res.status(401).send({ message: "unAuthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unAuthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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
    const copyRightCollection = client
      .db("volunteerDB")
      .collection("copyRightRequest");
    // API auth

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    };
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.cookie("token", token, cookieOptions).send({ token });
    });
    app.post("/logout", async (req, res) => {
      const user = req.body;
      res
        .clearCookie("token", { ...cookieOptions, maxAge: 0 })
        .send({ success: true });
    });
    //API DAta
    app.get("/allPost", async (req, res) => {
      const result = await volunteerCollection.find().toArray();
      res.send(result);
    });
    app.get("/singlePost/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.findOne(query);
      res.send(result);
    });

    app.get("/posts/:organizer_email", verifyToken, async (req, res) => {
      const email = req.params.organizer_email;
      if (req.user.email !== req.params.organizer_email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await volunteerCollection
        .find({ organizer_email: email })
        .toArray();
      res.send(result);
    });
    app.post("/post", verifyToken, async (req, res) => {
      const postData = req.body;
      const result = await volunteerCollection.insertOne(postData);
      res.send(result);
    });
    app.post("/request", verifyToken, async (req, res) => {
      const requestData = req.body;
      const result = await beVolunteerCollection.insertOne(requestData);
      res.send(result);
    });
    app.get("/request/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: "Forbidden Access" });
      }
      const result = await beVolunteerCollection
        .find({ email: email })
        .toArray();
      res.send(result);
    });
    app.put("/update/:id", verifyToken, async (req, res) => {
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

    app.delete("/delete/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await volunteerCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/requestDelete/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await beVolunteerCollection.deleteOne(query);
      res.send(result);
    });
    //search by title
    app.get("/titlePost/:title", async (req, res) => {
      const title = req.params.title;
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

    //post report
    app.get("/copy/:email", async (req, res) => {
      const email = req.params.email;
      const result = await copyRightCollection.find({ email: email }).toArray();
      res.send(result);
    });
    app.post("/copy", async (req, res) => {
      const copyRight = req.body;
      const result = await copyRightCollection.insertOne(copyRight);
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
