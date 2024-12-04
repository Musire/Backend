require('dotenv').config();
const port = process.env.PORT || 5000
const http = require('http');
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const socketIo = require('socket.io');
const mongoose = require('mongoose')
const { router } = require('./routes/api')
const { setupSocket } = require('./sockets/socketHandler')

// instantiate express server as app
const app = express();
const server = http.createServer(app);
const allowedOrigins = ['http://localhost:5173', 'https://neoteric-ls.netlify.app']

const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
  },
});

// Enable CORS for Express routes
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  credentials: true, // If you plan to use cookies/auth
}));


// Bodyparser middleware
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );

// Connect to MongoDB
const db = process.env.MONGOURI;
mongoose.connect(db)
        .then(() => console.log("DB successfully connected"))
        .catch(err => console.log(err));


app.use(express.json());
// setIoInstance(io); // Set the io instance for the routes
app.use('/api', router);


// Setup Socket.IO
setupSocket(io);

server.listen(port, () => {
    console.log(`Server running on port: ${port}`)
})