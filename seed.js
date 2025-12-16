// seed.js
// Run with: node seed.js
// Make sure you have a .env file with: MONGO_URI=your_mongodb_connection_string

require("dotenv").config();
const { MongoClient, ObjectId } = require("mongodb");

const uri = process.env.MONGO_URI;

if (!uri) {
  console.error("❌ MONGO_URI is not set in .env");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: { version: "1", strict: true, deprecationErrors: true },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("StyleDecor_DB");
    const UserCollection = db.collection("users");
    const DecoratorCollection = db.collection("decorators");
    const ServiceCollection = db.collection("services");
    const BookingCollection = db.collection("bookings");
    const PaymentCollection = db.collection("payments");

    // ⚠ WARNING: This will wipe existing data from these collections!
    await Promise.all([
      UserCollection.deleteMany({}),
      DecoratorCollection.deleteMany({}),
      ServiceCollection.deleteMany({}),
      BookingCollection.deleteMany({}),
      PaymentCollection.deleteMany({}),
    ]);

    console.log("🧹 Cleared existing data from users, decorators, services, bookings, payments");

    // --------------------------------------------------
    // 1️⃣ USERS (admin, basic user, and decorator accounts)
    // --------------------------------------------------

    const users = [
      // Admin sample (from your real data)
      {
        name: "Khandaker Reza-e-Rabbi",
        email: "rabbi@live.com",
        photoURL: "https://i.ibb.co/xSDFH4QH/DSC-0139.jpg",
        role: "admin",
        status: "active",
        createdAt: new Date("2025-12-08T21:08:53.006Z"),
        lastLoggedIn: new Date("2025-12-09T12:53:14.400Z"),
        updatedAt: new Date("2025-12-09T12:53:14.400Z"),
      },
      // Decorator sample (from your real data)
      {
        name: "Lotus Khandaker",
        email: "lotus@live.com",
        photoURL: "https://i.ibb.co/xSDFH4QH/DSC-0139.jpg",
        role: "user",
        status: "active",
        createdAt: new Date("2025-12-08T21:09:54.652Z"),
        lastLoggedIn: new Date("2025-12-09T12:03:35.532Z"),
        updatedAt: new Date("2025-12-09T12:03:35.532Z"),
      },
      // Normal user sample (from your real data)
      {
        name: "Tuba Khandaker",
        email: "tuba@live.com",
        photoURL: "https://i.ibb.co/xSDFH4QH/DSC-0139.jpg",
        role: "user",
        status: "active",
        createdAt: new Date("2025-12-08T21:14:18.565Z"),
        lastLoggedIn: new Date("2025-12-09T12:06:20.002Z"),
        updatedAt: new Date("2025-12-09T12:06:20.002Z"),
      }, 

      {
        name: "REZA FX Lighting",
        email: "reza@live.com",
        photoURL: "https://i.ibb.co/xSDFH4QH/DSC-0139.jpg",
        role: "decorator",
        status: "active",
        createdAt: new Date("2025-12-08T21:14:18.565Z"),
        lastLoggedIn: new Date("2025-12-09T12:06:20.002Z"),
        updatedAt: new Date("2025-12-09T12:06:20.002Z"),
      },

      // Extra decorator user accounts matching decorator userId emails
      // {
      //   name: "Elegant Wedding Artistry",
      //   email: "decorator1@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-12-01T12:00:00Z"),
      //   lastLoggedIn: new Date("2025-12-02T12:00:00Z"),
      //   updatedAt: new Date("2025-12-02T12:00:00Z"),
      // },
      // {
      //   name: "Celebration Moments Studio",
      //   email: "decorator2@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-11-28T10:00:00Z"),
      //   lastLoggedIn: new Date("2025-11-30T09:30:00Z"),
      //   updatedAt: new Date("2025-11-30T09:30:00Z"),
      // },
      // {
      //   name: "Elite Corporate Styling Co.",
      //   email: "decorator3@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-12-03T15:20:00Z"),
      //   lastLoggedIn: new Date("2025-12-04T11:40:00Z"),
      //   updatedAt: new Date("2025-12-04T11:40:00Z"),
      // },
      // {
      //   name: "Harmony Home Decor Studio",
      //   email: "decorator4@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "disabled",
      //   createdAt: new Date("2025-11-25T08:45:00Z"),
      //   lastLoggedIn: new Date("2025-11-27T13:10:00Z"),
      //   updatedAt: new Date("2025-11-27T13:10:00Z"),
      // },
      // {
      //   name: "Floral Fantasy Creations",
      //   email: "decorator5@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-12-02T16:00:00Z"),
      //   lastLoggedIn: new Date("2025-12-03T18:30:00Z"),
      //   updatedAt: new Date("2025-12-03T18:30:00Z"),
      // },
      // {
      //   name: "Cultural Color House",
      //   email: "decorator6@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-11-22T09:10:00Z"),
      //   lastLoggedIn: new Date("2025-11-23T10:20:00Z"),
      //   updatedAt: new Date("2025-11-23T10:20:00Z"),
      // },
      // {
      //   name: "Lumière Lighting & Themes",
      //   email: "decorator7@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "disabled",
      //   createdAt: new Date("2025-12-05T14:22:00Z"),
      //   lastLoggedIn: new Date("2025-12-06T12:00:00Z"),
      //   updatedAt: new Date("2025-12-06T12:00:00Z"),
      // },
      // {
      //   name: "NatureVista Outdoor Décor",
      //   email: "decorator8@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-11-29T11:50:00Z"),
      //   lastLoggedIn: new Date("2025-12-01T13:30:00Z"),
      //   updatedAt: new Date("2025-12-01T13:30:00Z"),
      // },
      // {
      //   name: "Grand Stage Creations Ltd.",
      //   email: "decorator9@styledecor.com",
      //   photoURL: "",
      //   role: "decorator",
      //   status: "active",
      //   createdAt: new Date("2025-12-04T12:10:00Z"),
      //   lastLoggedIn: new Date("2025-12-05T16:40:00Z"),
      //   updatedAt: new Date("2025-12-05T16:40:00Z"),
      // },

    ];

    const userResult = await UserCollection.insertMany(users);
    console.log(`👤 Inserted ${userResult.insertedCount} users`);

    // Helper to find user email to ObjectId mapping (if needed)
    const userIdByEmail = {};
    Object.values(userResult.insertedIds).forEach((id, index) => {
      const email = users[index].email;
      userIdByEmail[email] = id;
    });

    // --------------------------------------------------
    // 2️⃣ DECORATORS (company-style decorators)
    // --------------------------------------------------

    const decorators = [
      {
        userId: "decorator1@styledecor.com",
        name: "Elegant Wedding Artistry",
        specialty: "Wedding Decorations",
        rating: 4.7,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-12-01T12:00:00Z"),
        updatedAt: new Date("2025-12-02T12:00:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator2@styledecor.com",
        name: "Celebration Moments Studio",
        specialty: "Birthday Event Decorations",
        rating: 4.5,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-11-28T10:00:00Z"),
        updatedAt: new Date("2025-11-30T09:30:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator3@styledecor.com",
        name: "Elite Corporate Styling Co.",
        specialty: "Corporate Event Styling",
        rating: 4.9,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-12-03T15:20:00Z"),
        updatedAt: new Date("2025-12-04T11:40:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator4@styledecor.com",
        name: "Harmony Home Decor Studio",
        specialty: "Home Interior Decorations",
        rating: 4.3,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-11-25T08:45:00Z"),
        updatedAt: new Date("2025-11-27T13:10:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator5@styledecor.com",
        name: "Floral Fantasy Creations",
        specialty: "Floral & Stage Decorations",
        rating: 4.8,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-12-02T16:00:00Z"),
        updatedAt: new Date("2025-12-03T18:30:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator6@styledecor.com",
        name: "Cultural Color House",
        specialty: "Cultural Event Decorations",
        rating: 4.2,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-11-22T09:10:00Z"),
        updatedAt: new Date("2025-11-23T10:20:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator7@styledecor.com",
        name: "Lumière Lighting & Themes",
        specialty: "Lighting & Theme Decorations",
        rating: 4.6,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-12-05T14:22:00Z"),
        updatedAt: new Date("2025-12-06T12:00:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator8@styledecor.com",
        name: "NatureVista Outdoor Décor",
        specialty: "Outdoor Decorations",
        rating: 4.4,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-11-29T11:50:00Z"),
        updatedAt: new Date("2025-12-01T13:30:00Z"),
        role: "decorator",
        status: "active",
      },
      {
        userId: "decorator9@styledecor.com",
        name: "Grand Stage Creations Ltd.",
        specialty: "Stage & Venue Setup",
        rating: 4.1,
        profileImage: "",
        availability: [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: new Date("2025-12-04T12:10:00Z"),
        updatedAt: new Date("2025-12-05T16:40:00Z"),
        role: "decorator",
        status: "active",
      },

      {
        "userId": "decorator10@styledecor.com",
        "name": "Artful Blossoms Decor",
        "specialty": "Floral Arrangements & Centerpieces",
        "rating": 4.8,
        "profileImage": "",
        "availability": [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: "2024-11-15T09:30:00Z",
        updatedAt: "2025-12-09T10:05:00Z",
        role: "decorator",
        status: "disabled"
      },

      {
        "userId": "reza@live.com",
        "name": "REZA FX Lighting",
        "specialty": "Themed Lighting & Projections",
        "rating": 4.5,
        "profileImage": "",
        "availability": [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ],
        createdAt: "2025-05-20T14:55:00Z",
        updatedAt: "2025-11-30T11:22:00Z",
        role: "decorator",
        status: "active"
      }
    ];

    const decoratorResult = await DecoratorCollection.insertMany(decorators);
    console.log(`Inserted ${decoratorResult.insertedCount} decorators`);

    // --------------------------------------------------
    // 3️⃣ SERVICES (basic package samples)
    // --------------------------------------------------

    const services = [
      {
        "service_name": "Classic Wedding Stage",
        "cost": 50000,
        "unit": "per event",
        "service_category": "wedding",
        "description": "Elegant stage setup with floral arrangements, mood lighting, and a premium backdrop for wedding ceremonies.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-12-01T10:00:00Z",
        "updatedAt": "2025-12-02T11:00:00Z"
      },
      {
        "service_name": "Birthday Party Decoration Basic",
        "cost": 15000,
        "unit": "per event",
        "service_category": "birthday",
        "description": "Colorful balloon arches, banners, themed table décor, and backdrop styling for birthday parties.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-11-29T09:00:00Z",
        "updatedAt": "2025-11-30T10:00:00Z"
      },
      {
        "service_name": "Corporate Seminar Setup",
        "cost": 40000,
        "unit": "per event",
        "service_category": "corporate",
        "description": "Professional seminar arrangement with podium, stage, branded backdrop, seating alignment, and AV setup.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-12-03T08:30:00Z",
        "updatedAt": "2025-12-04T09:30:00Z"
      },
      {
        "service_name": "Home Interior Festive Makeover",
        "cost": 20000,
        "unit": "per day",
        "service_category": "home",
        "description": "Festive lighting, wall décor, entrance styling, and living room transformation for special occasions.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-11-25T07:30:00Z",
        "updatedAt": "2025-11-26T12:30:00Z"
      },
      {
        "service_name": "Floral Stage Luxury Package",
        "cost": 55000,
        "unit": "per event",
        "service_category": "wedding",
        "description": "Premium floral stage design with real flower arrangements, overhead floral canopy, and spotlight illumination.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-12-02T15:40:00Z",
        "updatedAt": "2025-12-03T18:00:00Z"
      },
      {
        "service_name": "Cultural Fest Pavilion Setup",
        "cost": 30000,
        "unit": "per event",
        "service_category": "cultural",
        "description": "Traditional pavilion decoration featuring ethnic patterns, vibrant drapery, cultural lighting, and stage setup.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-11-22T09:00:00Z",
        "updatedAt": "2025-11-23T10:00:00Z"
      },
      {
        "service_name": "Dynamic Event Lighting Package",
        "cost": 25000,
        "unit": "per event",
        "service_category": "lighting",
        "description": "Thematic lighting, spotlighting, ambient glow effects, and DMX-controlled light sequences for events.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-12-05T14:20:00Z",
        "updatedAt": "2025-12-06T12:00:00Z"
      },
      {
        "service_name": "Outdoor Garden Event Setup",
        "cost": 35000,
        "unit": "per event",
        "service_category": "outdoor",
        "description": "Garden seating, fairy lights, floral arches, and nature-themed arrangement for outdoor celebrations.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-11-29T11:00:00Z",
        "updatedAt": "2025-12-01T12:00:00Z"
      },
      {
        "service_name": "Premium Stage & Venue Combo",
        "cost": 70000,
        "unit": "per event",
        "service_category": "wedding",
        "description": "Full venue decoration including stage, entrance gate, table centerpieces, and venue-wide lighting design.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-12-04T12:10:00Z",
        "updatedAt": "2025-12-05T13:10:00Z"
      },
      {
        "service_name": "Luxury Floral Centerpieces Collection",
        "cost": 12000,
        "unit": "per table",
        "service_category": "floral",
        "description": "Premium floral centerpieces, table bouquets, scented arrangements, and theme-matched floral art.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2024-11-15T09:30:00Z",
        "updatedAt": "2025-12-09T10:05:00Z"
      },
      {
        "service_name": "Ambient Projection & Theme Lighting",
        "cost": 28000,
        "unit": "per event",
        "service_category": "lighting",
        "description": "Full-event lighting with animated projections, theme coloration, spotlight effects, and immersive ambience styles.",
        "image": "",
        "createdByEmail": "rabbi@live.com",
        "createdAt": "2025-05-20T14:55:00Z",
        "updatedAt": "2025-11-30T11:22:00Z"
      }
    ];


    const serviceResult = await ServiceCollection.insertMany(services);
    console.log(`Inserted ${serviceResult.insertedCount} services`);

    // --------------------------------------------------
    // 4️⃣ BOOKINGS (sample bookings with status)
    // --------------------------------------------------

    const serviceIds = Object.values(serviceResult.insertedIds);
    const decoratorIds = Object.values(decoratorResult.insertedIds);

    const bookings = [
      {
        userId: "tuba@live.com",
        mobileNumber: "12345678910",
        service_name: "Ambient Projection & Theme Lighting",
        serviceId: serviceIds[0],
        cost: 50000,
        bookingDate: new Date("2025-12-10"),
        eventLocation: "Dhanmondi, Dhaka",
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date("2025-12-12"),
        updatedAt: new Date("22025-12-12"),
      },
      {
        userId: "tuba@live.com",
        mobileNumber: "12345678910",
        service_name: "Ambient Projection & Theme Lighting",
        serviceId: serviceIds[1],
        cost: 40000,
        bookingDate: new Date("2025-12-11"),
        eventLocation: "Mirpur, Dhaka",
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date("2025-12-12"),
        updatedAt: new Date("2025-12-12"),
      },
      {
        userId: "tuba@live.com",
        mobileNumber: "12345678910",
        service_name: "Ambient Projection & Theme Lighting",
        serviceId: serviceIds[2],
        cost: 30000,
        bookingDate: new Date("2025-12-12"),
        eventLocation: "Banani, Dhaka",
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date("2025-12-12"),
        updatedAt: new Date("2025-12-12"),
      },
    ];

    const bookingResult = await BookingCollection.insertMany(bookings);
    console.log(`Inserted ${bookingResult.insertedCount} bookings`);

    // --------------------------------------------------
    // 5️⃣ PAYMENTS (sample Stripe-like payments)
    // --------------------------------------------------

    // const bookingIds = Object.values(bookingResult.insertedIds);

    // const payments = [
    //   {
    //     bookingId: bookingIds[0],
    //     userId: "tuba@live.com",
    //     service_name: "Ambient Projection & Theme Lighting",
    //     cost: 50000,
    //     currency: "BDT",
    //     status: "succeeded",
    //     transactionId: "txn_50000_001",
    //     method: "card",
    //     createdAt: new Date("2025-12-05T10:20:00Z"),
    //     updatedAt: new Date("2025-12-05T10:20:00Z"),
    //   },
    //   {
    //     bookingId: bookingIds[2],
    //     userId: "troyee@live.com",
    //     service_name: "Ambient Projection & Theme Lighting",
    //     cost: 40000,
    //     currency: "BDT",
    //     status: "succeeded",
    //     transactionId: "txn_40000_002",
    //     method: "Card",
    //     createdAt: new Date("2025-12-02T09:10:00Z"),
    //     updatedAt: new Date("2025-12-02T09:10:00Z"),
    //   },
    // ];

    // const paymentResult = await PaymentCollection.insertMany(payments);
    // console.log(`💳 Inserted ${paymentResult.insertedCount} payments`);

    console.log("✅ Seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

run();
