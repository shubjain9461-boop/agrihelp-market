# NC3-project
# 🌿 AGRIHELP — Smart Agriculture Marketplace

> A live map-based platform connecting farmers directly with buyers  
> using real-time geolocation, Haversine distance, and WebSocket updates.

---

## 📁 FOLDER STRUCTURE

```
agrihelp/
├── frontend/
│   ├── index.html              ← Main standalone demo (open in browser)
│   └── src/
│       ├── components/
│       │   ├── Map.jsx         ← Google Maps component
│       │   ├── BuyerCard.jsx   ← Sidebar buyer card
│       │   ├── DetailPanel.jsx ← Buyer detail slide-in panel
│       │   ├── ChatModal.jsx   ← Live chat window
│       │   └── Navbar.jsx      ← Top navigation bar
│       ├── pages/
│       │   ├── Auth.jsx        ← Login / Signup page
│       │   ├── FarmerDash.jsx  ← Farmer map dashboard
│       │   └── BuyerDash.jsx   ← Buyer post-requirements dashboard
│       ├── context/
│       │   └── AppContext.jsx  ← Global state (React Context)
│       ├── utils/
│       │   └── haversine.js    ← Haversine formula utility
│       └── hooks/
│           └── useSocket.js    ← Socket.IO custom hook
│
├── backend/
│   ├── server.js               ← Main Express + Socket.IO server
│   ├── models/
│   │   ├── User.js             ← Farmer & Buyer schema
│   │   ├── Requirement.js      ← Buyer posts schema
│   │   ├── Message.js          ← Chat messages
│   │   └── Rating.js           ← Star ratings
│   ├── routes/
│   │   ├── auth.js             ← /api/auth/*
│   │   ├── requirements.js     ← /api/requirements/*
│   │   ├── users.js            ← /api/users/*
│   │   ├── messages.js         ← /api/messages/*
│   │   └── ratings.js          ← /api/ratings/*
│   ├── middleware/
│   │   └── auth.js             ← JWT verify middleware
│   └── utils/
│       └── haversine.js        ← Server-side distance calc
│
├── docs/
│   └── README.md               ← This file
├── package.json                ← Backend dependencies
└── .env.example
```

---

## ⚙️ TECH STACK

| Layer       | Technology                    |
|-------------|-------------------------------|
| Frontend    | HTML5, CSS3, JavaScript (ES6) |
| Framework   | React.js (optional upgrade)   |
| Backend     | Node.js + Express.js          |
| Database    | MongoDB + Mongoose            |
| Real-Time   | Socket.IO                     |
| Auth        | JWT (JSON Web Tokens)         |
| Maps        | Google Maps API / Canvas      |
| Distance    | Haversine Formula             |
| Location    | Browser Geolocation API       |

---

## 🚀 SETUP INSTRUCTIONS

### Step 1 — Prerequisites
```bash
node --version   # v18+ required
mongod --version # MongoDB 6+ required
```

### Step 2 — Backend Setup
```bash
cd backend
npm init -y
npm install express mongoose bcryptjs jsonwebtoken cors \
            socket.io express-rate-limit dotenv
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
node server.js
```

### Step 3 — Frontend (Standalone)
```bash
# Just open index.html in a browser — no build needed!
open frontend/index.html
```

### Step 4 — Frontend (React upgrade)
```bash
npx create-react-app agrihelp-client
cd agrihelp-client
npm install axios socket.io-client @react-google-maps/api
npm start
```

---

## 🔌 API ROUTES

### Authentication
| Method | Route                  | Access  | Description              |
|--------|------------------------|---------|--------------------------|
| POST   | /api/auth/register     | Public  | Register farmer or buyer |
| POST   | /api/auth/login        | Public  | Login → returns JWT      |

**Register Request Body:**
```json
{
  "name": "Ramesh Patil",
  "email": "ramesh@email.com",
  "mobile": "9876543210",
  "password": "secret123",
  "role": "farmer",
  "lat": 18.5204,
  "lng": 73.8567
}
```

**Login Response:**
```json
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "Ramesh", "role": "farmer" }
}
```

---

### Requirements (Buyer Posts)
| Method | Route                       | Access | Description                     |
|--------|-----------------------------|--------|---------------------------------|
| POST   | /api/requirements           | Buyer  | Post a new requirement          |
| GET    | /api/requirements/nearby    | Farmer | Get nearby buyers (geospatial)  |
| GET    | /api/requirements/my        | Buyer  | Get own requirements            |
| PUT    | /api/requirements/:id       | Buyer  | Update a requirement            |
| DELETE | /api/requirements/:id       | Buyer  | Delete a requirement            |

**POST /api/requirements:**
```json
{
  "product": "Tomatoes",
  "quantity": 500,
  "priceOffered": 2400,
  "phone": "9876543210",
  "buyerType": "Wholesaler",
  "deadline": "2026-04-15",
  "lat": 18.55,
  "lng": 73.88,
  "urgent": false
}
```

**GET /api/requirements/nearby?lat=18.52&lng=73.85&maxDistanceKm=25&product=Tomatoes**
```json
{
  "count": 3,
  "requirements": [
    {
      "_id": "...",
      "product": "Tomatoes",
      "quantity": 500,
      "priceOffered": 2400,
      "distanceKm": 4.2,
      "buyerName": "Suresh Wholesalers",
      "urgent": false
    }
  ]
}
```

---

### Users
| Method | Route              | Access | Description          |
|--------|--------------------|--------|----------------------|
| GET    | /api/users/profile | Auth   | Get own profile      |
| PUT    | /api/users/profile | Auth   | Update profile + GPS |

---

### Ratings
| Method | Route        | Access | Description             |
|--------|--------------|--------|-------------------------|
| POST   | /api/ratings | Auth   | Rate a farmer or buyer  |

```json
{ "userId": "...", "stars": 4, "comment": "Good quality produce." }
```

---

### Messages
| Method | Route                 | Access | Description              |
|--------|-----------------------|--------|--------------------------|
| POST   | /api/messages         | Auth   | Send a message           |
| GET    | /api/messages/:userId | Auth   | Get conversation history |

---

### Analytics
| Method | Route                    | Access | Description         |
|--------|--------------------------|--------|---------------------|
| GET    | /api/analytics/dashboard | Auth   | Dashboard stats     |

---

## 🗄️ DATABASE SCHEMA (MongoDB)

### users
```js
{
  _id:         ObjectId,
  name:        String,          // "Ramesh Patil"
  email:       String,          // unique
  mobile:      String,
  password:    String,          // bcrypt hashed
  role:        "farmer"|"buyer",
  location: {
    type:        "Point",
    coordinates: [lng, lat]     // GeoJSON
  },
  state:       String,
  district:    String,
  primaryCrop: String,          // farmer only
  farmSize:    Number,          // acres
  rating:      Number,          // avg star rating
  ratingCount: Number,
  isVerified:  Boolean,
  isActive:    Boolean,
  lastSeen:    Date,
  createdAt:   Date
}
```

### requirements
```js
{
  _id:          ObjectId,
  buyer:        ObjectId → User,
  buyerName:    String,
  product:      String,
  quantity:     Number,         // quintals
  priceOffered: Number,         // ₹ per quintal
  phone:        String,
  buyerType:    String,
  deadline:     Date,
  location: {
    type:        "Point",
    coordinates: [lng, lat]
  },
  urgent:       Boolean,
  isActive:     Boolean,
  interestedFarmers: [ObjectId],
  createdAt:    Date
}
```

### messages
```js
{
  _id:       ObjectId,
  sender:    ObjectId → User,
  recipient: ObjectId → User,
  content:   String,
  read:      Boolean,
  createdAt: Date
}
```

### ratings
```js
{
  _id:       ObjectId,
  ratedBy:   ObjectId → User,
  ratedUser: ObjectId → User,
  stars:     Number (1-5),
  comment:   String,
  createdAt: Date
}
```

---

## ⚡ SOCKET.IO EVENTS

### Client → Server
| Event              | Payload                    | Description                  |
|--------------------|----------------------------|------------------------------|
| `auth`             | `token`                    | Authenticate socket          |
| `update_location`  | `{ lat, lng }`             | Farmer updates GPS           |
| `express_interest` | `{ requirementId }`        | Farmer is interested         |
| `send_message`     | `{ to, content }`          | Send a chat message          |
| `typing`           | `{ to }`                   | Typing indicator             |

### Server → Client
| Event                   | Payload                    | Description                |
|-------------------------|----------------------------|----------------------------|
| `new_requirement`       | requirement object          | New buyer posted           |
| `requirement_updated`   | requirement object          | Buyer updated post         |
| `requirement_deleted`   | `{ id }`                   | Buyer deleted post         |
| `farmer_interested`     | `{ requirementId, farmerId }` | Farmer showed interest  |
| `new_message`           | `{ from, content }`        | Incoming chat message      |
| `user_typing`           | `{ from }`                 | Someone is typing          |
| `user_online`           | `{ userId, count }`        | User came online           |
| `user_offline`          | `{ userId, count }`        | User went offline          |

---

## 📐 HAVERSINE FORMULA

```js
// utils/haversine.js

/**
 * Calculate the distance between two GPS coordinates.
 * Uses the Haversine formula.
 * 
 * @param {number} lat1 - Latitude of point 1 (decimal degrees)
 * @param {number} lon1 - Longitude of point 1 (decimal degrees)
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers

  // Convert degrees to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
}

module.exports = haversine;
```

---

## 🌐 GOOGLE MAPS INTEGRATION

Replace the canvas map in index.html with:

```html
<!-- In <head> -->
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>

<!-- In <body> -->
<div id="google-map" style="width:100%;height:100%"></div>

<script>
// Initialize Google Map
const map = new google.maps.Map(document.getElementById('google-map'), {
  center: { lat: STATE.farmerLat, lng: STATE.farmerLng },
  zoom: 13,
  styles: [ /* dark map style JSON */ ],
});

// Farmer marker
const farmerMarker = new google.maps.Marker({
  position: { lat: STATE.farmerLat, lng: STATE.farmerLng },
  map,
  icon: { url: 'farmer-icon.png', scaledSize: new google.maps.Size(40, 40) },
  title: 'Your Location'
});

// Buyer markers
buyers.forEach(buyer => {
  const marker = new google.maps.Marker({
    position: { lat: buyer.lat, lng: buyer.lng },
    map,
    icon: { url: 'buyer-icon.png', scaledSize: new google.maps.Size(32, 32) },
    title: buyer.name
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding:12px;min-width:200px">
        <h3>${buyer.name}</h3>
        <p>Product: <b>${buyer.product}</b></p>
        <p>Quantity: <b>${buyer.qty} quintals</b></p>
        <p>Price: <b>₹${buyer.price}/qt</b></p>
        <p>Distance: <b>${haversine(STATE.farmerLat, STATE.farmerLng, buyer.lat, buyer.lng).toFixed(1)} km</b></p>
      </div>
    `
  });

  marker.addListener('click', () => infoWindow.open(map, marker));
});
</script>
```

---

## .env Configuration

```bash
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/agrihelp_db
JWT_SECRET=your_super_secret_jwt_key_here
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

---

## 🎓 College Submission Notes

This project demonstrates:
- **Full-stack MVC architecture** (Express + MongoDB + Frontend)
- **Geospatial queries** (MongoDB $nearSphere, 2dsphere index)
- **Haversine Formula** for accurate GPS distance calculation
- **JWT Authentication** with role-based access control
- **WebSocket real-time** bidirectional communication
- **RESTful API** design with proper HTTP methods and status codes
- **Rate limiting** for security
- **Canvas 2D rendering** for the interactive map
- **Responsive design** using pure CSS Grid/Flexbox

---

*AgriHelp © 2026 — Agriculture · FoodTech · Rural Development*
