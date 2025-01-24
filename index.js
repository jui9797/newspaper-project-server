const express =require('express')
const cors =require('cors')
const app =express()
const jwt =require('jsonwebtoken')

require('dotenv').config()
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
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
const publisherCollection =client.db('newsdb').collection('publishers')

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

// get all users for homepage
app.get('/allUsers', async(req, res)=>{
  const result = await userCollection.find().toArray()
  res.send(result)
})

// get all users
app.get('/users',verifyToken,verifyAdmin, async(req,res)=>{
  // console.log(req.headers)
  const page = parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex =(page-1)*limit
  const total =await userCollection.countDocuments()
    const parPage =await userCollection.find().skip(startIndex).limit(limit).toArray()
    res.json({total, parPage})
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

// get user by email public
app.get('/user/:email', async(req, res) =>{
  const email =req.params.email
  const query ={email: email}
  const result = await userCollection.findOne(query)
  res.send(result)
})


// patch user info public
app.patch('/user/:email', async(req, res) =>{
  const item =req.body
  const email =req.params.email
  const query ={email: email}
  const updatedDoc = {
    $set: {
      name:item.name,
      photoURL:item.photo
    }
  }
  const result = await userCollection.updateOne(query, updatedDoc)
  res.send(result)
})

// make admin api
app.patch('/users/admin/:id',verifyToken, verifyAdmin, async(req, res)=>{
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
    const {publisher, tag, title, email} = req.query
    let query ={}
    if(publisher) query.publisher = publisher
    
    if(tag) query.tag = tag
    if(title) query.title = {
      $regex: title || '',
      $options: 'i'
    }
    if (email) query.authorEmail = email
    const result =await articlesCollection.find(query).toArray()
    res.send(result);
  }
  catch (error){
  console.error('Error fetching articles', error)
  res.status(500).send({error: 'Internal server error'})
  }
    
})

// get top 6 articles for home page
app.get('/topViewed' , async(req, res) =>{
  // const articles = req.body
  const result = await articlesCollection.find().sort({ view: -1 }).limit(6).toArray()
  res.send(result)
})

// get all articles for pagination
app.get('/allArticles', async(req, res) =>{
  const page =parseInt(req.query.page)
  const limit = parseInt(req.query.limit)
  const startIndex =(page-1)*limit
  const total =await articlesCollection.countDocuments()
  const parPage =await articlesCollection.find().skip(startIndex).limit(limit).toArray()
  res.json({total, parPage})
})

// get article by id
app.get('/articles/:id',  async(req,res)=>{
  const id =req.params.id
  const query ={_id:new ObjectId(id)}
  const result =await articlesCollection.findOne(query)
  res.send(result)
})



// post article
app.post('/articles', async(req, res) =>{
  const article =req.body;
  const result = await articlesCollection.insertOne(article)
  res.send(result);
})




// increment related api


// increse view count
app.patch('/articles/:id', async(req, res)=>{
  const id =req.params.id
  const query = { _id: new ObjectId(id)};
  const update = { $inc: { view: 1 }};
  const options = { returnDocument: 'after'};
  const result = await articlesCollection.findOneAndUpdate(query, update, options);
  res.send(result);
})

// patch whole article data
app.patch('/article/update/:id', async(req, res) =>{
  const id = req.params.id
  const item =req.body
  const filter ={_id: new ObjectId(id)}
  const updatedDoc = {
    $set: {
      title:item.title,
      image:item.image,
      publisher:item.publisher,
      description:item.description,
      view: item.view,
      authorName:item.authorName,
      authorEmail: item.authorEmail,
      authorPhoto:item.authorPhoto,
      postedDate:item.postedDate,
      status:item.status,
      tag:item.tag,
      type:item.type
    }
  }
  const result =await articlesCollection.updateOne(filter, updatedDoc)
  res.send(result)
})

// patch for updaing status
app.patch('/articles/status/:id',verifyToken, verifyAdmin, async(req, res)=>{
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

// patch for decline article
app.patch('/articles/decline/:id',verifyToken, verifyAdmin, async(req, res)=>{
  const item =req.body
  const id =req.params.id
  const filter ={_id: new ObjectId(id)}
  const updatedDoc ={
    $set: {
      status:'declined',
      declineReason: item.declineReason
    }
  }
  const result =await articlesCollection.updateOne(filter, updatedDoc)
  res.send(result)
})

// patch for updating type premium
app.patch('/articles/premium/:id',verifyToken, verifyAdmin, async(req, res)=>{
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

// delete article by admin and user too
app.delete('/articles/:id',verifyToken,  async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await articlesCollection.deleteOne(query);
  res.send(result);
})

// add publisher by admin
app.post('/publishers',verifyToken, verifyAdmin, async(req, res) =>{
  const publisher =req.body;
  const result = await publisherCollection.insertOne(publisher)
  res.send(result);
})

// get all publisher
app.get('/publishers', async(req,res)=>{
  
    const result =await publisherCollection.find().toArray()
    res.send(result)
})



// payment intent
app.post('/create-payment-intent', async(req, res) =>{
const {price} = req.body
const amount = parseInt(price*100)
const paymentIntent = await stripe.paymentIntents.create({
  amount: amount,
  currency: 'usd',
  payment_method_types: ['card']
})
res.send({
  clientSecret: paymentIntent.client_secret
})

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