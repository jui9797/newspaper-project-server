const express =require('express')
const cors =require('cors')
const app =express()
const jwt =require('jsonwebtoken')
require('dotenv').config()
const port =process.env.port || 5000




// middleware
app.use(cors())
app.use(express.json())


const { MongoClient, ServerApiVersion, ObjectId, ReturnDocument } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.jwr0f.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01`;

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

const userCollection =client.db("newsdb").collection("users")
const articlesCollection =client.db('newsdb').collection("articles")

// jwt related api
app.post('/jwt', async(req, res)=>{
  const user = req.body
  const token =jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1d'})
  res.send({token})
})

// middleware for jwt
const verifyToken =(req, res, next) =>{
  // console.log('inside verify token', req.headers)
  if(!req.headers.authorization){
    return res.status(401).send({message: 'unauthorized access'})
  }
  const token =req.headers.authorization.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorised access'})
    }
    req.decoded =decoded
    next()
  })
}

// use verify admin after verify token
const verifyAdmin = async(req, res, next)=>{
  const email = req.decoded.email
  const query ={email: email}
  const user =await userCollection.findOne(query)
  const isAdmin =user?.role === 'admin'
  if(!isAdmin){
    return res.status(403).send({message: 'forbidden access'})
  }
  next()
}

// user related api
app.post('/users', async(req, res)=>{
  
    const user =req.body
    // insert email if user doesnot exist
    const query ={email:user.email}
    const existingUser =await userCollection.findOne(query)
    if(existingUser){
        return res.send({message: 'user already exist', insertedId:null})
    }
    const result =await userCollection.insertOne(user)
    res.send(result)
})

// get all users
app.get('/users',verifyToken,verifyAdmin, async(req,res)=>{
  // console.log(req.headers)
    const result =await userCollection.find().toArray()
    res.send(result)
})

// check user admin or not api
app.get('/users/admin/:email', verifyToken, async(req, res)=>{
  const email =req.params.email
  if(email !== req.decoded.email){
    return res.status(403).send({message: 'unauthorized access'})
  }
  const query ={email:email}
  const user = await userCollection.findOne(query)
  let admin =false
  if(user){
    admin = user?.role === 'admin'
  }
  res.send({admin})
})

// make admin api
app.patch('/users/admin/:id', async(req, res)=>{
  const id =req.params.id
  const filter ={_id: new ObjectId(id)}
  const updatedDoc = {
    $set: {
      role: 'admin'
    }
  }
  const result =await userCollection.updateOne(filter, updatedDoc)
  res.send(result)
})



// articles related api
app.get('/articles', async(req, res)=>{
  try{
    const {publisher, tag, title} = req.query
    let query ={}
    if(publisher) query.publisher = publisher
    if(tag) query.tag = tag
    if(title) query.title = {
      $regex: title || '',
      $options: 'i'
    }
    const result =await articlesCollection.find(query).toArray()
    res.send(result);
  }
  catch (error){
  console.error('Error fetching articles', error)
  res.status(500).send({error: 'Internal server error'})
  }
    
})

// get article by id
app.get('/articles/:id',  async(req,res)=>{
  const id =req.params.id
  const query ={_id:new ObjectId(id)}
  const result =await articlesCollection.findOne(query)
  res.send(result)
})

// increment related api
// app.patch('/articles/:id/increment', async(req, res)=>{
//   const id = req.params.id;
//   try{
//     const query ={_id: new ObjectId(id)}
//     const update ={
//       $inc:{view:1}
//     }
//     const options = { returnDocument: 'after' }

//     const result =await articlesCollection.findOneAndUpdate(query, update, options)
//     res.send({message:'view count incresed'})
//   }
//   catch (error){
//     console.log('error incrementing view count', error)
//     res.status(500).send({error:'internal server error'})
//   }
// })

// increse view count
app.patch('/articles/:id', async(req, res)=>{
  const id =req.params.id
  const query = { _id: new ObjectId(id)};
  const update = { $inc: { view: 1 }};
  const options = { returnDocument: 'after'};
  const result = await articlesCollection.findOneAndUpdate(query, update, options);
  res.send(result);
})

// patch for updaing status
app.patch('/articles/status/:id', async(req, res)=>{
  const id =req.params.id
  const filter ={_id: new ObjectId(id)}
  const updatedDoc = {
    $set: {
      status: 'approved'
    }
  }
  const result =await articlesCollection.updateOne(filter, updatedDoc)
  console.log(result)
  res.send(result)
})

// patch for updating type premium
app.patch('/articles/premium/:id', async(req, res)=>{
  const id =req.params.id
  const filter ={_id: new ObjectId(id)}
  const updatedDoc = {
    $set: {
      type: 'premium'
    }
  }
  const result =await articlesCollection.updateOne(filter, updatedDoc)
  console.log(result)
  res.send(result)
})



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res)=>{
    res.send('news is watting')
})

app.listen(port, ()=>{
    console.log('news are ready')
})