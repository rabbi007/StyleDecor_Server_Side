const express = require('express');             // Express-JS imported
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');    // Mongo-DB imported
const cors = require('cors');                   // CORS imported

const admin = require("firebase-admin");        // Firebase imported
const serviceAccount = require("./firebase_service_key.json");   // Firebase service Account

require("dotenv").config();     // dot-env imported
const app = express();          // express-js 
const port = 3000;              // service port

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());                // enabled CORS
app.use(express.json());        // enabled express-json

// ******************************* Mongo-DB-Configuration-Start **********************

const uri = process.env.MONGO_URI;      // get the URI info from .env file

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
    // await client.connect();

    const db = client.db('StyleDecor_DB')                     // mongo-bd database name
    const UserCollection = db.collection('users')             // mongo-db collection name
    const ServiceCollection = db.collection('services')       // mongo-db collection name
    const DecoratorCollection = db.collection('decorators')   // mongo-db collection name
    const BookingCollection = db.collection('bookings')       // mongo-db collection name
    const PaymentCollection = db.collection('payments')       // mongo-db collection name

    // const User_Count = await UserCollection.countDocuments();   // mongo-bd database count in total

    // GET-API configured for: '/' (root)
    app.get('/', (req, res) => {
      res.status(200).send(`
        <h1>Welcome to the Style-Decor API Server</h1>
        <p>This is the API for the Style-Decor platform where you can manage users, services, decorators, bookings, and payments.</p>
        <h3>Available Endpoints:</h3>
        <ul>
            <li><a href="http://localhost:3000/users" target="_blank">GET /users - Fetch all users</a></li>
            <li><a href="http://localhost:3000/services" target="_blank">GET /services - Fetch all services</a></li>
            <li><a href="http://localhost:3000/decorators" target="_blank">GET /decorators - Fetch all decorators</a></li>
            <li><a href="http://localhost:3000/bookings" target="_blank">GET /bookings - Fetch all bookings</a></li>
            <li><a href="http://localhost:3000/payments" target="_blank">GET /payments - Fetch all payments</a></li>
        </ul>
    `);
    });


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    console.log("Finally!!! You successfully connected to MongoDB!");
  }
}

run().catch(console.dir);

// ******************************* Mongo-DB-Configuration-End **********************

app.listen(port, () => {
  console.log(`This app is listening on port: ${port}`);
});