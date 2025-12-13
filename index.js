const express = require('express');              // Express-JS imported 
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb'); // Mongo-DB imported
const cors = require('cors');                    // CORS imported
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY); // stripe imported with Secret Key

const stripe = require("stripe")("sk_test_51Sd7KqCfmI2xjvINsO2Ef5ZfsCuUXiQF9y9U53TP02EjDAtXueCNZ9dsHTcAOIH9V5NNLLd5hhkwj1er9l6FuIrm00wpIN4Usx"); // stripe imported with Secret Key


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

    // // Get All Users
    // app.get('/users', async (req, res) => {
    //   try {
    //     const users = await UserCollection.find().toArray();
    //     res.status(200).json(users);
    //   } catch (error) {
    //     res.status(500).json({ message: 'Error fetching users', error });
    //   }
    // });

    // ------------------------------------------------------

    // GET USERS (OPTIONALLY FILTER BY ROLE & STATUS)
    //   GET /users                              -> all users
    //   GET /users?role=decorator               -> all decorators
    //   GET /users?role=decorator&status=active -> active decorators
    //   GET /users?role=user&status=active      -> active normal users

    app.get("/users", async (req, res) => {
      try {
        const { role, status } = req.query;

        const query = {};

        if (role) {
          query.role = role;       // "admin" | "decorator" | "user"
        }

        if (status) {
          query.status = status;   // "active" | "disabled" | etc.
        }

        const users = await UserCollection.find(query)
          .sort({ createdAt: -1 }) // optional: newest first
          .toArray();

        res.status(200).json(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Error fetching users", error });
      }
    });


    // CREATE A NEW USER 
    app.post('/users', async (req, res) => {
      const newUserData = req.body;  // Get data from the request body
      try {
        // Check if the user already exists
        const existingUser = await UserCollection.findOne({ email: newUserData.email });
        if (existingUser) {
          // Update lastLoggedIn & optionally update name/photo if changed
          const updatedUser = await UserCollection.updateOne(
            { email: newUserData.email },
            {
              $set: {
                lastLoggedIn: new Date(),
                name: newUserData.name || existingUser.name,
                photoURL: newUserData.photoURL || existingUser.photoURL,
                updatedAt: new Date(),
              },
            }
          );
          return res.status(200).json({
            message: "Existing user logged in. lastLoggedIn updated.",
          });
        }

        // Add-or-update: role, status, createdAt, updatedAt and lastLoggedIn fields
        newUserData.role = "user", // default role
          newUserData.status = "active",
          newUserData.createdAt = new Date(),
          newUserData.lastLoggedIn = new Date();
        newUserData.updatedAt = new Date();

        // Insert new user data into MongoDB
        const result = await UserCollection.insertOne(newUserData);
        res.status(201).json({ message: 'User created successfully!' });
      } catch (error) {
        res.status(500).json({ message: 'Error creating user!!', error });
      }
    });

    // GET USER'S ROLE INFO: /users/role?email
    app.get('/users/role', verifyToken, async (req, res) => {
      const user = await UserCollection.findOne(
        { email: req.user?.email },          // use 'req.user.email' from verifyToken
        { projection: { role: 1 } }
      );

      res.send({ role: user?.role || "user" });
    });


    // PATCH /users/:id/role  { role: "user" | "admin" | "decorator" }
    app.patch("/users/:id/role", async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;

      const allowedRoles = ["user", "admin", "decorator"];
      if (!allowedRoles.includes(role)) {
        return res.status(400).send({ message: "Invalid role. Use user/admin/decorator." });
      }

      try {
        const userFilter = { _id: new ObjectId(id) };

        // 1) Find target user (needed for email)
        const targetUser = await UserCollection.findOne(userFilter);
        if (!targetUser) {
          return res.status(404).send({ message: "User not found" });
        }

        // (Optional safety) Prevent admin from demoting themselves
        // if (req.user?.email === targetUser.email && role !== "admin") {
        //   return res.status(403).send({ message: "You cannot change your own admin role." });
        // }

        // 2) Update role in users collection
        const updateUser = await UserCollection.updateOne(userFilter, {
          $set: { role, updatedAt: new Date() },
        });

        // 3) Auto create/upsert decorator profile when role === "decorator"
        let decoratorUpsert = null;
        if (role === "decorator") {
          const decoratorFilter = { userId: targetUser.email }; // your frontend uses dec.userId as email

          decoratorUpsert = await DecoratorCollection.updateOne(
            decoratorFilter,
            {
              $setOnInsert: {
                userId: targetUser.email, // email link
                createdAt: new Date(),
              },
              $set: {
                name: targetUser.name || targetUser.fullName || "Decorator",
                profileImage: targetUser.photoURL || "",
                specialty: "",
                rating: 0,
                availability: [],
                status: "active",
                updatedAt: new Date(),
              },
            },
            { upsert: true }
          );
        }

        // 4) Optional: if role becomes NOT decorator -> disable decorator profile (don’t delete)
        if (role !== "decorator") {
          await DecoratorCollection.updateOne(
            { userId: targetUser.email },
            { $set: { status: "disabled", updatedAt: new Date() } }
          );
        }

        return res.send({
          success: true,
          message: "Role updated successfully",
          userEmail: targetUser.email,
          updatedRole: role,
          modified: updateUser.modifiedCount === 1,
          decoratorProfileAutoCreated: role === "decorator",
          decoratorUpserted: role === "decorator" ? decoratorUpsert?.upsertedCount === 1 : false,
        });
      } catch (error) {
        console.error("Error updating user role:", error);
        return res.status(500).send({ message: "Server error", error: error.message });
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

    // Update a new service
    app.put("/services/:id", async (req, res) => {
      const id = req.params.id;
      const {
        service_name,
        cost,
        unit,
        service_category,
        description,
        image,
        createdByEmail,
      } = req.body;

      try {
        const filter = { _id: new ObjectId(id) };

        const updateDoc = {
          $set: {
            service_name,
            cost: Number(cost) || 0,
            unit,
            service_category,
            description,
            image,
            // optional: track who last updated
            updatedByEmail: createdByEmail || null,
            updatedAt: new Date(),
          },
        };

        const result = await ServiceCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Service not found",
          });
        }

        if (result.modifiedCount === 0) {
          return res.status(200).json({
            success: true,
            message: "No changes applied (data may be identical)",
          });
        }

        res.status(200).json({
          success: true,
          message: "Service updated successfully",
        });
      } catch (error) {
        console.error("Error updating service:", error);
        res.status(500).json({
          success: false,
          message: "Failed to update service",
          error,
        });
      }
    });

    // Delete a new service
    app.delete("/services/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const result = await ServiceCollection.deleteOne({
          _id: new ObjectId(id)
        });

        if (result.deletedCount === 1) {
          return res.status(200).json({
            success: true,
            message: "Service deleted successfully",
          });
        } else {
          return res.status(404).json({
            success: false,
            message: "Service not found or already deleted",
          });
        }
      } catch (error) {
        console.error("Error deleting service:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while deleting service",
          error,
        });
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

    // UPDATE AN EXISTING DECORATOR (ADMIN)
    app.patch("/decorators/:id", async (req, res) => {
      const decoratorId = req.params.id;
      const {
        name,
        specialty,
        rating,
        profileImage,
        availability, // expect array of days
        status,       // 🔹 NEW: allow status update
      } = req.body;

      try {
        const filter = { _id: new ObjectId(decoratorId) };
        const updateFields = {};

        if (name !== undefined) updateFields.name = name;
        if (specialty !== undefined) updateFields.specialty = specialty;
        if (rating !== undefined) updateFields.rating = Number(rating);
        if (profileImage !== undefined) updateFields.profileImage = profileImage;
        if (availability !== undefined) updateFields.availability = availability;
        if (status !== undefined) updateFields.status = status; // 🔹 NEW

        updateFields.updatedAt = new Date();

        const updateDoc = { $set: updateFields };

        const result = await DecoratorCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Decorator not found",
          });
        }

        if (result.modifiedCount === 0) {
          return res.status(200).json({
            success: true,
            message: "No changes applied (data may be identical)",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Decorator updated successfully",
          updatedFields: updateFields,
        });
      } catch (error) {
        console.error("Error updating decorator:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while updating decorator",
          error,
        });
      }
    });


    // DELETE A DECORATOR (ADMIN)
    app.delete("/decorators/:id", async (req, res) => {
      const decoratorId = req.params.id;

      // Optional: validate ObjectId
      if (!ObjectId.isValid(decoratorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid decorator ID",
        });
      }

      try {
        const filter = { _id: new ObjectId(decoratorId) };

        const result = await DecoratorCollection.deleteOne(filter);

        if (result.deletedCount === 0) {
          return res.status(404).json({
            success: false,
            message: "Decorator not found",
          });
        }

        return res.status(200).json({
          success: true,
          message: "Decorator deleted successfully",
        });
      } catch (error) {
        console.error("Error deleting decorator:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while deleting decorator",
          error,
        });
      }
    });

    // Top active decorators (for Home page)
    app.get("/decorators/top", async (req, res) => {
      try {
        const topDecorators = await DecoratorCollection
          .find({ status: "active" })
          .sort({ rating: -1, createdAt: -1 }) // rating highest first
          .toArray();
        res.status(200).json(topDecorators);
      } catch (error) {
        res.status(500).json({ message: "Error fetching top decorators", error });
      }
    });

    // GET SINGLE DECORATOR BY ID for DECORATOR-DETAILS
    app.get("/decorators/:id", async (req, res) => {
      const decoratorId = req.params.id;

      if (!ObjectId.isValid(decoratorId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid decorator ID",
        });
      }

      try {
        const filter = { _id: new ObjectId(decoratorId) };
        const decorator = await DecoratorCollection.findOne(filter);

        if (!decorator) {
          return res.status(404).json({
            success: false,
            message: "Decorator not found",
          });
        }

        return res.status(200).json({
          success: true,
          data: decorator,
        });
      } catch (error) {
        console.error("Error fetching decorator:", error);
        return res.status(500).json({
          success: false,
          message: "Server error while fetching decorator",
          error,
        });
      }
    });


    // Get All Bookings
    // app.get('/bookings', async (req, res) => {
    //   try {
    //     const bookings = await BookingCollection.find().toArray();
    //     res.status(200).json(bookings);
    //   } catch (error) {
    //     res.status(500).json({ message: 'Error fetching bookings', error });
    //   }
    // });

    // Get Bookings (filter by userId || assignedDecoratorId)

    app.get('/bookings', async (req, res) => {
      try {
        const { userId, assignedDecoratorId } = req.query; // read ?userId= or ?assignedDecoratorId=

        let query = {};

        if (userId) {
          query.userId = userId; // Filter by userId if provided (optional)
        }

        if (assignedDecoratorId) {
          query.assignedDecoratorId = assignedDecoratorId; // Filter by assignedDecoratorId
        }

        const bookings = await BookingCollection.find(query).toArray(); // Fetch filtered bookings

        res.status(200).json(bookings); // Return the filtered bookings
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

    // Update an existing booking (status, payment, decorator assignment, etc.)
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;

      try {
        const filter = { _id: new ObjectId(id) };

        const updateFields = {};
        const {
          status,               // booking status
          paymentStatus,        // payment Status
          assignedDecoratorId,
          assignedDecoratorName,
          transactionId,
          paidAt,
          paymentMethod,
        } = req.body;

        // Booking lifecycle
        if (status) updateFields.status = status;

        // Payment lifecycle
        if (paymentStatus) updateFields.paymentStatus = paymentStatus;

        // Decorator assignment
        if (assignedDecoratorId)
          updateFields.assignedDecoratorId = assignedDecoratorId;

        if (assignedDecoratorName)
          updateFields.assignedDecoratorName = assignedDecoratorName;

        // Payment info
        if (transactionId) updateFields.transactionId = transactionId;
        if (paidAt) updateFields.paidAt = paidAt;
        if (paymentMethod) updateFields.paymentMethod = paymentMethod;

        // Always update updatedAt
        updateFields.updatedAt = new Date();

        if (Object.keys(updateFields).length === 0) {
          return res.status(400).send({
            message: "No valid fields provided for update",
          });
        }

        const result = await BookingCollection.updateOne(
          filter,
          { $set: updateFields }
        );

        if (result.matchedCount === 0) {
          return res.status(404).send({
            message: "Booking not found",
          });
        }

        res.send({
          success: true,
          message: "Booking updated successfully",
          updatedFields: updateFields,
        });
      } catch (error) {
        console.error("Error updating booking:", error);
        res.status(500).send({ message: "Server error", error });
      }
    });



    // Update an existing booking (status, decorator assignment, etc.)
    // app.patch("/bookings/:id", async (req, res) => {
    //   const id = req.params.id;

    //   try {
    //     const filter = { _id: new ObjectId(id) };

    //     // Build dynamic $set payload
    //     const updateFields = {};
    //     const { status, assignedDecoratorId, assignedDecoratorName } = req.body;

    //     if (status) updateFields.status = status;
    //     if (assignedDecoratorId) updateFields.assignedDecoratorId = assignedDecoratorId;
    //     if (assignedDecoratorName) updateFields.assignedDecoratorName = assignedDecoratorName;

    //     // If no valid fields to update
    //     if (Object.keys(updateFields).length === 0) {
    //       return res
    //         .status(400)
    //         .send({ message: "No valid fields provided for update" });
    //     }

    //     const result = await BookingCollection.updateOne(filter, {
    //       $set: updateFields,
    //     });

    //     if (result.modifiedCount === 1) {
    //       res.send({
    //         success: true,
    //         message: "Booking updated successfully",
    //         updatedFields: updateFields,
    //       });
    //     } else {
    //       res
    //         .status(400)
    //         .send({ message: "Booking not found or no changes applied" });
    //     }
    //   } catch (error) {
    //     console.error("Error updating booking:", error);
    //     res.status(500).send({ message: "Server error", error });
    //   }
    // });


    // Get a specific booking by ID
    app.get('/bookings/:id', async (req, res) => {
      const { id } = req.params; // Extract the booking ID from the URL

      try {
        // Check if the provided ID is a valid ObjectId
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ message: 'Invalid booking ID' });
        }

        // Fetch the booking document from MongoDB using the ID
        const booking = await BookingCollection.findOne({ _id: new ObjectId(id) });

        if (!booking) {
          return res.status(404).json({ message: 'Booking not found' });
        }

        // Return the booking data if found
        res.status(200).json(booking);
      } catch (error) {
        console.error('Error fetching booking:', error);
        res.status(500).json({ message: 'Error fetching booking', error });
      }
    });



    // Get All Payments
    // app.get('/payments', async (req, res) => {
    //   try {
    //     const payments = await PaymentCollection.find().toArray();
    //     res.status(200).json(payments);
    //   } catch (error) {
    //     res.status(500).json({ message: 'Error fetching payments', error });
    //   }
    // });

    // Get Payments (optional: filter by userId)
    app.get('/payments', async (req, res) => {
      try {
        const { userId } = req.query; // Read ?userId= from URL

        let query = {};
        if (userId) {
          query.userId = userId;
        }

        const payments = await PaymentCollection.find(query).toArray();

        res.status(200).json(payments);
      } catch (error) {
        res.status(500).json({ message: 'Error fetching payments', error });
      }
    });

    //   // Create a new payment
    // app.post('/payments', async (req, res) => {
    //   const newPaymentData = req.body;
    //   try {
    //     // Add createdAt and updatedAt fields
    //     newPaymentData.createdAt = new Date();
    //     newPaymentData.updatedAt = new Date();

    //     // Insert new payment data into MongoDB
    //     const result = await PaymentCollection.insertOne(newPaymentData);
    //     res.status(201).json({ message: 'Payment recorded successfully' });
    //   } catch (error) {
    //     res.status(500).json({ message: 'Error recording payment', error });
    //   }
    // });

    // ===============================================================================

    // Handle the payment
    app.post("/payments", async (req, res) => {
      const { paymentMethodId, amount } = req.body;

      try {
        // Create a payment intent
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount * 100, // Amount in cents
          currency: "usd", // Change to your preferred currency
          payment_method: paymentMethodId,
          confirm: true,
        });

        // Return the payment status
        res.status(200).json({ success: true, paymentIntent });
      } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    });

    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
          return res.status(400).send({ message: "Invalid amount" });
        }

        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.send({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });



    // ===============================================================================


    // Start Express Server
    app.listen(port, () => {
      console.log(`This app is listening on port: ${port}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);
  }
}

run().catch(console.error);
