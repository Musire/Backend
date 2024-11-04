require('dotenv').config();
const port = process.env.PORT || 5000
const http = require('http');
const bodyParser = require('body-parser')
const cors = require('cors')
const express = require('express')
const socketIo = require('socket.io');
const mongoose = require('mongoose')
const { router, setIoInstance } = require('./routes/api')
const { setupSocket } = require('./sockets/socketHandler')

// instantiate express server as app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
      origin: '*', // Allow any origin
      methods: ['GET', 'POST'],
      credentials: true, // Allow credentials if needed
  }
});

// Enable CORS for Express routes
app.use(cors({
  origin: '*', // Allow any origin
  methods: ['GET', 'POST'],
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Bodyparser middleware
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );

// Connect to MongoDB
const db = process.env.MONGOURI;
mongoose.connect(db)
        .then(() => console.log("DB successfully connected"))
        .catch(err => console.log(err));


app.use(express.json());
setIoInstance(io); // Set the io instance for the routes
app.use('/api', router);


// Setup Socket.IO
setupSocket(io);

server.listen(port, () => {
    console.log(`Server running on port: ${port}`)
})