require('dotenv').config()
const express = require('express')
const app = express()

const cors = require('cors');
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser');
app.use(cors())
const prot = process.env.PORT || 5000
app.use(express.json())
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
app.use(cookieParser());
app.use(cors({
  origin: ['http://localhost:5173',
          'https://volunteer-management-dee20.web.app',
          'https://volunteer-management-dee20.firebaseapp.com'
  ] ,
  credentials: true,
}));
const varifytoken = (req,res,next)=>{
  const token = req.cookies?.token
  if(!token){
    return res.status(401).send({message: "unauthorized access"})
  }


jwt.verify(token,process.env.JWT_SECRET,(err, decoded) =>{
  if(err){
    return res.status(401).send({message: "unauthorized "})
  }
  res.user = decoded
  next()
})
}



const uri = `mongodb+srv://${process.env.BB_USER}:${process.env.BD_PASSWORD}@cluster0.xpotf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const Volunteer_collection = client.db('Volunteer_management').collection('Volunteers')
    const Volunteer_apply = client.db('Volunteer_management').collection('Volunteers_apply')
      
    // token 
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'20s'})
      res.
      cookie('token',token,{
        httpOnly:true,
        secure:process.env.NODE_ENM=== 'production'
      })
      .send({success:true});
    })


    app.post('/login', async(req,res)=>{
      res.clearCookie('token',{
        httpOnly:true,
        secure:false
      })
      .send({success:true});

    })
    
    app.get('/volunteer',async(req,res)=>{
        const query=  Volunteer_collection.find().sort({rating:-1}).limit(6);
        const result = await query.toArray();
        res.send(result) 
       
        
    })
    app.get('/volunteers',async(req,res)=>{
      const cousor=  Volunteer_collection.find()
      const result = await cousor.toArray();
      res.send(result) 
     
      
  })

    app.get('/volunteer/:id',async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await Volunteer_collection.findOne(query)
      res.send(result);
    })
   

    app.post('/volunteerapply',async(req,res)=>{
      const query = req.body;
      const result = await Volunteer_collection.insertOne(query);
      res.send(result);
      })

    
      app.post("/volunteerapply", varifytoken, async (req, res) => {
        const { volunteerId, volunteerName, volunteerEmail, suggestion, status = "requested" } = req.body;
      
        try {
          const volunteerPost = await Volunteer_collection.findOne({ _id: new ObjectId(volunteerId) });
      
          if (!volunteerPost) {
            return res.status(404).send({ message: "Volunteer post not found" });
          }
      
          if (volunteerPost.volunteersNeeded <= 0) {
            return res.status(400).send({ message: "No more volunteers needed for this post" });
          }
      
          const application = {
            volunteerId,
            volunteerName,
            volunteerEmail,
            suggestion,
            status,
            appliedAt: new Date(),
          };
      
          // Insert Application
          const insertResult = await Volunteer_apply.insertOne(application);
      
          // Decrease Volunteers Needed
          const updateResult = await Volunteer_collection.updateOne(
            { _id: new ObjectId(volunteerId) },
            { $inc: { volunteersNeeded: -1 } }
          );
      
          if (insertResult.acknowledged && updateResult.modifiedCount > 0) {
            res.send({ message: "Application submitted successfully" });
          } else {
            res.status(500).send({ message: "Failed to submit application" });
          }
        } catch (error) {
          console.error(error);
          res.status(500).send({ message: "Internal server error" });
        }
      });
      
      
      
      app.get('/myPosts', varifytoken, async (req, res) => {
        const userEmail = req.query.email;
        let query = {}
      if(userEmail){
        query={"organizer.email": userEmail}
      }
       const posts = await Volunteer_collection.find(query).toArray();
          res.send(posts);
       
      });
      
    
    
      app.delete('/myPosts/:id',async (req,res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await Volunteer_collection.deleteOne(query);
        res.send(result);
       })
    
    
    
 

   
  } finally {
  
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello World!')
  })
app.listen(prot, () => {
  console.log(`Example app listening on port ${prot}`)
})