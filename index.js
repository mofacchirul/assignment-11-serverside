require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const port = process.env.PORT || 5000;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://volunteer-management-dee20.web.app",
      "https://volunteer-management-dee20.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json())

const varifytoken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized" });
    }
    res.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.BB_USER}:${process.env.BD_PASSWORD}@cluster0.xpotf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    const Volunteer_collection = client
      .db("Volunteer_management")
      .collection("Volunteers");
    const Volunteer_apply = client
      .db("Volunteer_management")
      .collection("Volunteers_apply");

    // token
    app.post("/jwt", (req, res) => {
      const user = req.body.user;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENM === "production",
          sameSite: process.env.NODE_ENM === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    app.post("/loginout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENM === "production",
          sameSite: process.env.NODE_ENM === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });



    app.post('/Volunteers', async (req, res) => {
      const applicationData = req.body;
      const result = await Volunteer_collection.insertOne(applicationData);
      res.send(result);
    });
    app.get("/Volunteers", async (req, res) => {
      const query = Volunteer_collection.find().sort({ rating: -1 }).limit(6);
      const result = await query.toArray();
      res.send(result);
    });
    app.get("/Volunteers", async (req, res) => {
      const cousor = Volunteer_collection.find();
      const result = await cousor.toArray();
      res.send(result);
    });

    app.get("/Volunteers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Volunteer_collection.findOne(query);
      res.send(result);
    });

    
    app.post('/Volunteers_apply', async (req, res) => {
      const applicationData = req.body;
      const result = await Volunteer_apply.insertOne(applicationData);
      res.send(result);
    });
    
    
    
   
    app.get("/Volunteers_apply", async (req, res) => {
      const cousor = Volunteer_apply.find();
      const result = await cousor.toArray();
      res.send(result);
    });


    
    

    app.delete("/Volunteers_apply/:id", varifytoken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Volunteer_apply.deleteOne(query); // Corrected collection
      res.send(result);
    });

    

  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
