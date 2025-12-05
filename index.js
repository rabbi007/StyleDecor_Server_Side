const express = require('express');              // Express-JS imported 
const { MongoClient, ServerApiVersion } = require('mongodb'); // Mongo-DB imported
const cors = require('cors');                    // CORS imported

const admin = require("firebase-admin");         // Firebase imported
const serviceAccount = require("./firebase_service_key.json"); // Firebase service Account

require("dotenv").config();                      // dot-env imported

const app = express();                           // Express-JS 
const port = 3000;                               // Service port

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());                                 // Enable CORS
app.use(express.json());                         // Enable express-json

// MongoDB Configuration
const uri = process.env.MONGO_URI;               // Get the URI from .env file

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// MongoDB Collections
const dbName = 'StyleDecor_DB';
const UserCollection = client.db(dbName).collection('users');
const ServiceCollection = client.db(dbName).collection('services');
const DecoratorCollection = client.db(dbName).collection('decorators');
const BookingCollection = client.db(dbName).collection('bookings');
const PaymentCollection = client.db(dbName).collection('payments');

// Connect to MongoDB and start the server
async function run() {
  try {
    // Connect the client to the server
    await client.connect();
    console.log("MongoDB connection successful!");

    // Root Route with Hyperlinks
    app.get('/', (req, res) => {
      res.status(200).send(`
        <h1>Welcome to the StyleDecor API Server</h1>
        <p>This is the API for the StyleDecor platform where you can manage users, services, decorators, bookings, and payments.</p>
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

    // Get All Users
    app.get('/users', async (req, res) => {
      try {
        const users = await UserCollection.find().toArray();
        res.status(200).json(users);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
      }
    });

    // Create a new user
    app.post('/users', async (req, res) => {
      const newUserData = req.body;  // Get data from the request body
      try {
        // Check if the user already exists
        const existingUser = await UserCollection.findOne({ email: newUserData.email });
        if (existingUser) {
          return res.status(400).json({ message: 'User already exists' });
        }

        // Add createdAt and updatedAt fields
        newUserData.createdAt = new Date();
        newUserData.updatedAt = new Date();

        // Insert new user data into MongoDB
        const result = await UserCollection.insertOne(newUserData);
        res.status(201).json({ message: 'User created successfully', user: result.ops[0] });
      } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
      }
    });


    // Get All Services
    app.get('/services', async (req, res) => {
      try {
        const services = await ServiceCollection.find().toArray();
        res.status(200).json(services);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching services', error });
      }
    });

    // Create a new service
    app.post('/services', async (req, res) => {
      const newServiceData = req.body;
      try {
        // Add createdAt and updatedAt fields
        newServiceData.createdAt = new Date();
        newServiceData.updatedAt = new Date();

        // Insert new service data into MongoDB
        const result = await ServiceCollection.insertOne(newServiceData);
        res.status(201).json({ message: 'Service created successfully', service: result.ops[0] });
      } catch (error) {
        res.status(500).json({ message: 'Error creating service', error });
      }
    });


    // Get All Decorators
    app.get('/decorators', async (req, res) => {
      try {
        const decorators = await DecoratorCollection.find().toArray();
        res.status(200).json(decorators);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching decorators', error });
      }
    });

    // Create a new decorator
    app.post('/decorators', async (req, res) => {
      const newDecoratorData = req.body;
      try {
        // Add createdAt and updatedAt fields
        newDecoratorData.createdAt = new Date();
        newDecoratorData.updatedAt = new Date();

        // Insert new decorator data into MongoDB
        const result = await DecoratorCollection.insertOne(newDecoratorData);
        res.status(201).json({ message: 'Decorator created successfully', decorator: result.ops[0] });
      } catch (error) {
        res.status(500).json({ message: 'Error creating decorator', error });
      }
    });


    // Get All Bookings
    app.get('/bookings', async (req, res) => {
      try {
        const bookings = await BookingCollection.find().toArray();
        res.status(200).json(bookings);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching bookings', error });
      }
    });

    // Get All Payments
    app.get('/payments', async (req, res) => {
      try {
        const payments = await PaymentCollection.find().toArray();
        res.status(200).json(payments);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error });
      }
    });

    // Start Express Server
    app.listen(port, () => {
      console.log(`This app is listening on port: ${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

run().catch(console.error);
