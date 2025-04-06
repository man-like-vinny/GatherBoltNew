const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const fs = require('fs');
const nodemailer = require('nodemailer');

//Below should be 5000 for prod
const port = process.env.PORT || 5570;
const app = express();
app.use(bodyParser.json());
app.use(express.json());

// Serve your HTML file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

//Serve your HTML file
// Add route for /events without .html
app.get('/events', (req, res) => {
  res.sendFile(__dirname + '/events.html');
});

// Add routes for other pages without .html
app.get('/contact', (req, res) => {
  res.sendFile(__dirname + '/contact.html');
});

app.get('/checkout', (req, res) => {
  res.sendFile(__dirname + '/checkout.html');
});

app.get('/success', (req, res) => {
  res.sendFile(__dirname + '/success.html');
});

// Add routes for event pages
app.get('/MaynoothUniversityBollywoodNight2024', (req, res) => {
  res.sendFile(__dirname + '/MaynoothUniversityBollywoodNight2024.html');
});

app.get('/OorThiruvizha_10', (req, res) => {
  res.sendFile(__dirname + '/OorThiruvizha_10.html');
});

app.get('/MaynoothUniversityHoli2024', (req, res) => {
  res.sendFile(__dirname + '/MaynoothUniversityHoli2024.html');
});

app.get('/SangeethaArangu', (req, res) => {
  res.sendFile(__dirname + '/SangeethaArangu.html');
});

app.get('/YeShamMasthani', (req, res) => {
  res.sendFile(__dirname + '/YeShamMasthani.html');
});

app.use(express.static(__dirname));

var WebSocketServer = require("ws").Server
const server = app.listen(port, () => console.log(`Node server listening on port ${port}`));

console.log("http server listening on %d", port)

var wss = new WebSocketServer({server: server})
console.log("websocket server created")

require("dotenv").config();

const {KindeClient, GrantType} = require("@kinde-oss/kinde-nodejs-sdk");
const { type } = require('os');

const options = {
    domain: process.env.KINDE_DOMAIN,
    clientId: process.env.KINDE_CLIENT_ID,
    clientSecret: process.env.KINDE_CLIENT_SECRET,
    redirectUri: process.env.KINDE_REDIRECT_URI,
    logoutRedirectUri: process.env.KINDE_LOGOUT_REDIRECT_URI,
    grantType: GrantType.PKCE
};

const kindeClient = new KindeClient(options);

// Middleware to check if the user is authenticated
const isAuthenticatedMiddleware = async (req, res, next) => {
  const isAuthenticated = await kindeClient.isAuthenticated(req);

  if (isAuthenticated) {
    // User is authenticated, proceed to the next middleware or route handler
    next();
  } else {
    // User is not authenticated, redirect to the login page
    res.redirect("/login");
  }
};

// Login route with authentication middleware
app.get("/login", kindeClient.login(), (req, res) => {
  return res.redirect("https://eventifyed.kinde.com/knock-knock");
});

// Register route with authentication middleware
app.get("/register", kindeClient.register(), (req, res) => {
  return res.redirect("https://eventifyed.kinde.com/knock-knock");
});

// Callback route with authentication middleware
app.get("/callback", kindeClient.callback(), (req, res) => {
  return res.redirect("/");
});

// Logout route
app.get("/logout", kindeClient.logout());

// Dashboard route with authentication middleware
app.get("/dashboard.html", isAuthenticatedMiddleware, (req, res) => {
  // User is authenticated, render the dashboard.html or perform other actions
  res.send("Welcome to the dashboard!");
});

const mongoURI = process.env.MDB_KEY; // Update with your MongoDB URI

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const seatSchema = new mongoose.Schema({
  eventId: String,
  seatNumber: String,
  row: String,
  column: Number,
  status: {
    type: String,
    enum: ['available', 'selected', 'unavailable', 'in_cart'],
    default: 'available'
  },
  price: Number,
  type: String
});

// Define a schema for your data
const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    type: [
        {
            ticketType: String,
            price: Number,
            ticketQuantity: Number,
            id: Number
        }
    ],
    ticketDescription: String,
    image: String,
    staticImage: String,
    eventID:String
});

const promoSchema = new mongoose.Schema({
  type: [
      {
          promoType: String,
          percentOff: Number
      }
  ]
});

const customerSchema = new mongoose.Schema({
  eventName: String,
  customerName: String,
  customerEmail: String,
  customerID: String,
  ticketDescription: String,
  confirmedSeats: String,
  quantity: Number,
  totalPaid: Number,
  feePaid: Number,
  eventID: Number,
  bookingFeeRequired: String,
  promotionApplied: String
})

const Product = mongoose.model('Product', productSchema, 'events');
const Promo = mongoose.model('Promo', promoSchema, 'promotions');
const Seat = mongoose.model('Seat', seatSchema, 'seats');
const Customer = mongoose.model('Customer', customerSchema, 'customers');


// // Route to get all products
app.get('/getProducts', async (req, res) => {
  try {
    console.log('Accessed /getProducts route'); // Add this log statement

    const products = await Product.find({}); // Find all products in the collection

    console.log('Products fetched:', products); // Add this log statement

    // Send the products as JSON
    res.json(products);
  } catch (error) {
    console.error('Error fetching products from MongoDB:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/getPromo', async (req, res) => {
  try {
    console.log('Accessed /getPromo route'); // Add this log statement

    const promotionList = await Promo.find({}); // Find all products in the collection

    console.log('Promotions fetched:', promotionList); // Add this log statement

    // Send the products as JSON
    res.json(promotionList);
  } catch (error) {
    console.error('Error fetching promotions from MongoDB:', error);
    res.status(500).json({ error: 'Failed to fetch promotions' });
  }
});

// Add these new endpoints after your existing endpoints
app.get('/getSeats/:eventId', async (req, res) => {
  try {
      console.log('Accessed /getSeats route'); // Add this log statement
      const seats = await Seat.find({ eventId: req.params.eventId });
      console.log('Seats fetched:', seats); // Add this log statement
      res.json(seats);
  } catch (error) {
      console.error('Error fetching seats:', error);
      res.status(500).json({ error: 'Failed to fetch seats' });
  }
});

app.post('/updateSeat', async (req, res) => {
  try {
      const { eventId, seatNumber, status } = req.body;
      const updatedSeat = await Seat.findOneAndUpdate(
          { eventId, seatNumber },
          { status },
          { new: true }
      );

      // Broadcast seat update to all clients
      wss.clients.forEach((client) => {
          if (client.readyState === WebSocketServer.OPEN) {
              client.send(JSON.stringify({
                  action: 'seatUpdated',
                  seat: {
                      eventId,
                      seatNumber,
                      status
                  }
              }));
          }
      });

      res.json(updatedSeat);
  } catch (error) {
      console.error('Error updating seat:', error);
      res.status(500).json({ error: 'Failed to update seat' });
  }
});

app.post('/verifySeats', async (req, res) => {
  try {
      const { eventId, seats } = req.body;
      const seatStatuses = await Seat.find({
          eventId,
          seatNumber: { $in: seats }
      });

      const allAvailable = seatStatuses.every(seat => 
          seat.status === 'available' || 
          seat.status === 'selected'
      );

      if (!allAvailable) {
          // Update seats to unavailable if they're taken
          for (const seat of seatStatuses) {
              if (seat.status === 'in_cart') {
                  await Seat.findOneAndUpdate(
                      { eventId, seatNumber: seat.seatNumber },
                      { status: 'unavailable' },
                      { new: true }
                  );

                  // Notify all clients about the status change
                  wss.clients.forEach((client) => {
                      if (client.readyState === WebSocketServer.OPEN) {
                          client.send(JSON.stringify({
                              action: 'seatUpdated',
                              seat: {
                                  eventId,
                                  seatNumber: seat.seatNumber,
                                  status: 'unavailable'
                              }
                          }));
                      }
                  });
              }
          }
      }

      res.json({ available: allAvailable });
  } catch (error) {
      console.error('Error verifying seats:', error);
      res.status(500).json({ error: 'Failed to verify seats' });
  }
});

let numberOfClients = 0;
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('A client has connected.');
  
  numberOfClients++;
  console.log("Clients connected: " + numberOfClients);
  broadcastNumberOfClients();
  clients.add(ws);

  // Define a function to send ping messages to clients
  function sendPing() {
    ws.ping();
  }

  // Set up a ping interval to periodically send ping messages
  const pingInterval = setInterval(sendPing, 30000);

  ws.on('pong', () => {
    console.log('Received a pong from the client.');
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.action === 'updateCart') {
          const cart = data.cart;
          const seats = data.seats;
          const validCart = cart.filter(item => item !== null);
  
          // Determine seat status update based on data.seats or item.selectedSeats
          validCart.forEach(async (item) => {
              let seatsToUpdateAvailable = [];
              let seatsToUpdateUnavailable = [];
  
              if (Array.isArray(seats) && seats.length > 0) {
                  seatsToUpdateAvailable = seats
                  console.log(`Updating seats from data.seats for event ${item.eventId}: ${seatsToUpdateAvailable.join(', ')} to available`);
              } else if (Array.isArray(item.selectedSeats) && item.selectedSeats.length > 0) {
                  // Use item.selectedSeats if data.seats is not provided
                  seatsToUpdateUnavailable = item.selectedSeats;
                  console.log(`Updating seats from item.selectedSeats for event ${item.eventId}: ${seatsToUpdateUnavailable.join(', ')} to unavailable`);
              }
  
              if (seatsToUpdateUnavailable.length > 0) {
                  try {
                      const result = await Seat.updateMany(
                          { 
                              eventId: item.eventId,
                              seatNumber: { $in: seatsToUpdateUnavailable }
                          },
                          { $set: { status: 'unavailable' } }
                      );
                      console.log(`Updated ${result.modifiedCount} seats to unavailable`);
                  } catch (error) {
                      console.error('Error updating seat status:', error);
                  }
              }
              else if (seatsToUpdateAvailable.length > 0){
                  try {
                    const result = await Seat.updateMany(
                        { 
                            eventId: item.eventId,
                            seatNumber: { $in: seatsToUpdateAvailable }
                        },
                        { $set: { status: 'available' } }
                    );
                    console.log(`Updated ${result.modifiedCount} seats to available`);
                } catch (error) {
                    console.error('Error updating seat status:', error);
                }
              }
              else{
                try {
                  // Update food quantity and price in the cart
                  if (item.foodCount !== undefined && item.foodPrice !== undefined) {
                      item.quantity = item.foodCount;
                      item.variablePrice += item.foodPrice;
                  }

                  // Broadcast cart update to all connected clients
                  wss.clients.forEach((client) => {
                      if (client !== ws && client.readyState === WebSocket.OPEN) {
                          client.send(JSON.stringify({
                              action: 'cartUpdated',
                              requestReload: true,
                              cart: cart
                          }));
                      }
                  });
              } catch (error) {
                  console.error('Error updating food details:', error);
                }
              }
          });
      }
    } catch (error) {
      console.error('WebSocket message handling error:', error);
  }
});

  ws.on('close', () => {
    console.log('A client has disconnected.');
    numberOfClients--;
    broadcastNumberOfClients();
    console.log("Clients connected: " + numberOfClients);
    clearInterval(pingInterval);
  });
});

function broadcastNumberOfClients() {
  // Send the current number of connected clients to all clients
  const message = JSON.stringify({
    action: 'numberOfClients',
    count: numberOfClients,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocketServer.OPEN) {
      client.send(message);
    }
  });
}

const stripe = require("stripe")('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');
//const stripeKey = process.env.SK_Key
//const stripe = require("stripe")(stripeKey);
//const stripe = require("stripe")('sk_test_51O2y4dASLMn2l3lqB9tO9e4Ob1eEB8DyfaUC8i8Tz6iHADtchanmJcxCKpR1dWMSu4hafsa0jCPBzfuUiSH2tway00EqpaBNHn')
const calculateOrderAmount = (items) => {
  // Replace this constant with a calculation of the order's amount
  // Calculate the order total on the server to prevent
  // people from directly manipulating the amount on the client
  let totalAmountCents = 0; // Initialize total amount to zero

  totalAmountCents = items.reduce((total, item) => {
    
    const itemTotal = item.price;

    return total + itemTotal;
  
  }, 0);

  return totalAmountCents;
};

async function process_qr(customerData) {
  const url = "https://api.qr-code-generator.com/v1/create?access-token=RUGJzNw2b2JzuKvzq6YM8C71wxezWmz5DCJX5qhwu5C28YAIX75pqqb8pgHPBIv3";

  const payload = JSON.stringify({
    "frame_name": "bottom-frame",
    "qr_code_text": JSON.stringify(customerData),
    "image_format": "PNG",
    "frame_color": "#131313",
    "frame_icon_name": "mobile",
    "image_width": 400,
    "frame_text": "Eventifyed",
    "marker_left_template": "version13",
    "marker_right_template": "version13",
    "marker_bottom_template": "version13",
  });
  
  const headers = {
    'Content-Type': 'application/json',
    'Cookie': 'AWSALB=mjK0XwMtS9Sta9QVo0hZaph6Nyqb9tqVQfZvFDr93eL/Zx9zqUnssj56QNCB1v6cCSzB9vfsQ3lb+LSmaTICrBh5ugDeeTj9yctmifsNWfEFtphXyg5LE4Tc8sE6; AWSALBCORS=mjK0XwMtS9Sta9QVo0hZaph6Nyqb9tqVQfZvFDr93eL/Zx9zqUnssj56QNCB1v6cCSzB9vfsQ3lb+LSmaTICrBh5ugDeeTj9yctmifsNWfEFtphXyg5LE4Tc8sE6'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: payload,
    });

    if (response.ok) {
      const pngContent = await response.arrayBuffer();

      // Convert array buffer to Buffer
      const byteArray = new Uint8Array(pngContent);
      const pngBuffer = Buffer.from(byteArray);

      fs.writeFileSync(`CustomerQRCodes/${customerData.customerID}_${customerData.eventName}_Eventifyed_Pass.png`, pngBuffer);
      console.log(`PNG saved as CustomerQRCodes/${customerData.customerID}_${customerData.eventName}_Eventifyed_Pass.png`);

      return `CustomerQRCodes/${customerData.customerID}_${customerData.eventName}_Eventifyed_Pass.png`;
    } else {
      const errorMessage = await response.text();
      console.error(`Error: ${response.status} - ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

app.post("/create-payment-intent", async (req, res) => {
  const { items } = req.body;
  // Alternatively, set up a webhook to listen for the payment_intent.succeeded event
  // and attach the PaymentMethod to a new Customer
  const customer = await stripe.customers.create();
  const ticketDescription = items.map(item => {
    let description = `${item.description} x ${item.quantity}`;
    if (Array.isArray(item.selectedSeats) && item.selectedSeats.length > 0) {
      description += `\n  Seats: ${item.selectedSeats.join(', ')}`;
    }

        // Only include food info if it exists
    if (item.foodCount && typeof item.foodCount === 'object') {
      const foodDetails = Object.entries(item.foodCount).map(([foodName, quantity]) => {
        return `\n  Meal: ${foodName} x ${quantity}`;
      }).join('');
      description += foodDetails;
    }

    return description;
    
  }).join('\n\n');

  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    customer: customer.id,
    setup_future_usage: "off_session",
    amount: calculateOrderAmount(items),
    currency: "eur",
    description: ticketDescription,
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    payment_method_types: ["card"], // Specify the payment method types
    automatic_payment_methods: {
      enabled: false,
    }
  });

  console.log(paymentIntent);

  totalAmountCents = 0;

  res.send({
    clientSecret: paymentIntent.client_secret,
    givenCustomerID: customer.id,
  });
});

//Insert customer details into MongoDB
app.post("/insert-customer-details", async (req, res) => {
  try {
    console.log('Accessed /insertCustomer route'); // Add this log statement

      const { items, customerName, customerEmail, customerID } = req.body;

      const eventName = items[0].id;
      const firstName = customerName.split(" ")[0];
      const totalPaid = calculateOrderAmount(items)/100;
      const feePaid = (items[0].fee/100);
      //const ticketDescription = items.map(item => `${item.description} x ${item.quantity}`).join('\n');
      const ticketDescription = items.map(item => {
        let description = `${item.description} x ${item.quantity}`;
        if (Array.isArray(item.selectedSeats) && item.selectedSeats.length > 0) {
          description += `\n  Seats: ${item.selectedSeats.join(', ')}`;
        }

        // Only include food info if it exists
        if (item.foodCount && typeof item.foodCount === 'object') {
          const foodDetails = Object.entries(item.foodCount).map(([foodName, quantity]) => {
            return `\n  Meal: ${foodName} x ${quantity}`;
          }).join('');
          description += foodDetails;
        }

        return description;
      }).join('\n\n');
      
      const ticketDescriptionWithLineBreaks = ticketDescription.split('\n').join('<br>');
      const bookingFeeRequired = items[0].inclFee;
      const promotionApplied = items[0].promoAmount;
      const confirmedSeats = items.map(item => `${item.selectedSeats}`).join('\n');

      // Create a new customer document
      const customer = new Customer({
        eventName,
        customerName,
        customerEmail,
        customerID,
        ticketDescription,
        confirmedSeats,
        totalPaid,
        feePaid,
        bookingFeeRequired,
        promotionApplied
      });

    // Save the customer document to MongoDB
    await customer.save();
    console.log('Customer inserted into MongoDB:', customer); // Add this log statement


    //Embed schema into QR
    await process_qr(customer);

    //Send email to customer
    await sendEmail(customerEmail, firstName, customerID, eventName, ticketDescriptionWithLineBreaks);
    res.status(200).json({ message: 'Customer inserted and email sent successfully' });
    //res.status(500).json({ message: 'Customer inserted and email sent successfully' });

    } catch (error) {
    console.error('Error inserting customer into MongoDB:', error);
    res.status(500).json({ error: 'Failed to insert customer' });
    }
});

async function sendEmail(emailAddress, firstName, customerID, eventName, ticketDescriptionWithLineBreaks) {
  try {
    const pngContent = fs.readFileSync(`CustomerQRCodes/${customerID}_${eventName}_Eventifyed_Pass.png`);
    console.log(typeof(pngContent));

    // Create a SMTP transporter
    let transporter = nodemailer.createTransport({
      host: "smtp.mailersend.net",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send mail with defined transport object
    let info = transporter.sendMail({
      from: 'Eventifyed <team@eventifyed.com>',
      sender: 'Eventifyed <team@eventifyed.com>',
      to: emailAddress,
      bcc: 'Eventifyed <team@eventifyed.com>',
      replyTo: 'team@eventifyed.com',
      subject: "You've got tickets from Eventifyed",
      html: `<p>Hi ${firstName},</p>
            <p>We are pleased to inform you that you have successfully received the following tickets for ${eventName}:
            <p><strong>${ticketDescriptionWithLineBreaks}</strong></p>
            <p>Enclosed within this email, you will find your personalized QR code, which will serve as your entry pass. Please ensure to present this QR code to the designated ticket organizer upon arrival at the event venue.</p>
            <p>Should you encounter any challenges in accessing or retrieving your QR code, please do not hesitate to contact us by simply replying to this email. Our team is readily available to assist you in resolving any queries or concerns you may have.</p>
            <p>We look forward to your attendance and wish you an enjoyable experience at ${eventName}.</p>
            <p>Warm regards,</p>
            <p>Vinayak<br>Founder @ Eventifyed</p>
            `,
      attachments: [
        {
          filename: `${customerID}_${eventName}_Eventifyed_Pass.png`,
          content: pngContent
        }
      ]
    });

    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
