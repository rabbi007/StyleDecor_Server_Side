const express = require('express');              // Express-JS imported 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Mongo-DB imported
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

// ***********************Token-Verify*************************

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "Unauthorized Access! Authorized Token not found!!",
    });
  }

  const token = authorization.split(" ")[1];

  try {
    // Verify and decode the Firebase token
    const decoded = await admin.auth().verifyIdToken(token);

    // Log the decoded email to the server console
    console.log("Decoded Email: ", decoded.email);  // Log email here

    // Attach the decoded information to the request object (including email)
    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,  // Get email from decoded token
    };

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification failed: ", error); // Log error if verification fails
    return res.status(401).send({
      message: "Unauthorized Access!!!",
    });
  }
};

// ***********************Token-Verify*************************

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
            <li><a href="https://style-decor-api-server.vercel.app/users" target="_blank">GET /users - Fetch all users</a></li>
            <li><a href="https://style-decor-api-server.vercel.app/services" target="_blank">GET /services - Fetch all services</a></li>
            <li><a href="https://style-decor-api-server.vercel.app/decorators" target="_blank">GET /decorators - Fetch all decorators</a></li>
            <li><a href="https://style-decor-api-server.vercel.app/bookings" target="_blank">GET /bookings - Fetch all bookings</a></li>
            <li><a href="https://style-decor-api-server.vercel.app/payments" target="_blank">GET /payments - Fetch all payments</a></li>
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
        res.status(201).json({ message: 'User created successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
      }
    });

    // Update an existing user by admin user
    app.patch("/users/:id", async (req, res) => {
      // const id = req.params.id;
      const { role, status } = req.body;
      const serviceId = req.params.id;  // Extract the service ID from the URL
      const objectId = new ObjectId(serviceId)

      try {
        // const filter = { _id: new ObjectId(id) };
        const filter = ({ _id: objectId });
        const updateFields = {};

        // Only modify fields that were sent
        if (role) updateFields.role = role;
        if (status) updateFields.status = status;

        const updateDoc = { $set: updateFields };
        const result = await UserCollection.updateOne(filter, updateDoc);

        if (result.modifiedCount === 1) {
          return res.status(200).json({
            success: true,
            message: "User updated successfully",
            updatedFields: updateFields,
          });
        } else {
          return res.status(400).json({
            success: false,
            message: "User not updated. Invalid user ID or no changes applied.",
          });
        }
      } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while updating user",
          error,
        });
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

    // Get a specific service by ID
    app.get('/services/:id', async (req, res) => {
      const serviceId = req.params.id;  // Extract the service ID from the URL
      const objectId = new ObjectId(serviceId)

      try {
        // Find the service by ID in the MongoDB collection
        const service = await ServiceCollection.findOne({ _id: objectId });

        // If the service is not found, return a 404 error
        if (!service) {
          return res.status(404).json({ message: 'Service not found' });
        }

        // If the service is found, return the service data
        res.status(200).json(service);
      } catch (error) {
        // If there's an error during the process, return a 500 error
        console.error('Error fetching service:', error);
        res.status(500).json({ message: 'Error fetching service', error });
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
        res.status(201).json({ message: 'Service created successfully' });
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
        res.status(201).json({ message: 'Decorator created successfully' });
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

    // Create a new booking
    app.post('/bookings', async (req, res) => {
      const newBookingData = req.body;
      try {
        // Add createdAt and updatedAt fields
        newBookingData.createdAt = new Date();
        newBookingData.updatedAt = new Date();

        // Insert new booking data into MongoDB
        const result = await BookingCollection.insertOne(newBookingData);
        res.status(201).json({ message: 'Booking created successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Error creating booking', error });
      }
    });

    // Update an old booking
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const { status } = req.body;

      try {
        const result = await BookingCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status: status } }
        );

        if (result.modifiedCount === 1) {
          res.send({ success: true, message: "Booking cancelled successfully" });
        } else {
          res.status(400).send({ message: "Booking not found or not updated" });
        }
      } catch (error) {
        res.status(500).send({ message: "Server error", error });
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

    // Create a new payment
    app.post('/payments', async (req, res) => {
      const newPaymentData = req.body;
      try {
        // Add createdAt and updatedAt fields
        newPaymentData.createdAt = new Date();
        newPaymentData.updatedAt = new Date();

        // Insert new payment data into MongoDB
        const result = await PaymentCollection.insertOne(newPaymentData);
        res.status(201).json({ message: 'Payment recorded successfully' });
      } catch (error) {
        res.status(500).json({ message: 'Error recording payment', error });
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
