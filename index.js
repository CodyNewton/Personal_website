// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************

const express = require('express'); // To build an application server or API
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')(); // To connect to the Postgres DB from the node server
const bodyParser = require('body-parser');
const session = require('express-session'); // To set the session object. To store or access session data, use the `req.session`, which is (generally) serialized as JSON by the store.

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************

// create `ExpressHandlebars` instance and configure the layouts and partials dir.
const hbs = handlebars.create({
  extname: 'hbs',
  layoutsDir: __dirname + '/views/layouts',
  partialsDir: __dirname + '/views/partials',
});


// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************

// Register `hbs` as our view engine using its bound `engine()` function.
app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json()); // specify the usage of JSON for parsing request body.

// initialize session variables
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
// Authentication Middleware.


app.get('/login', (req, res) => {
    res.render('pages/lo')
  });
  app.get('/register', (req, res) => {
    res.render('pages/register')
  });

  app.post('/register', async(req,res)=>{
    const hash =await bcrypt.hash(req.body.password,10);
try {   await db.none(
    `INSERT INTO users (username, password) VALUES ($1,$2)`,
    [req.body.username,hash]
  );
    res.redirect('/login');
} catch (err) {
    console.log(err);
    res.redirect('/register');
}
  })


app.post('/login', async(req,res)=>{
try {    const user = await db.one(
    `SELECT * FROM users u WHERE u.username = $1`,
    [req.body.username]
  );
    if(!user){
        return res.render('/register');
    }

      
    const match =await bcrypt.compare(req.body.password,user.password);
if(!match){
    return res.render('/login',{message: 'Incorrect username or password.'});
}
        // Save user details in session
        req.session.user = user;
        req.session.save(() => {
            res.redirect('/discover');
        })
} catch (err) {
    console.log(err);
    res.redirect('/register');
}
  })
  const auth = (req, res, next) => {
    if (!req.session.user) {
      // Default to login page.
      return res.redirect('/login');
    }
    next();
  };
  
  // Authentication Required
  app.use(auth);

  app.get('/discover', async (req, res) => {
    try {
        const response = await axios({
            url: 'https://app.ticketmaster.com/discovery/v2/events.json',
            method: 'GET',
            dataType: 'json',
            headers: { 'Accept-Encoding': 'application/json' },
            params: {
                apikey: process.env.API_KEY,
                keyword: 'Coldplay', 
                size: 10,
            },
        });

        const events = response.data._embedded ? response.data._embedded.events.map(event => ({
            name: event.name,
            image: event.images?.[0]?.url,
            date: event.dates.start.localDate,
            time: event.dates.start.localTime,
            booking_url: event.url,
        })) : [];

        res.render('pages/discover', { events});
    } catch (err) {
        console.log(err);
        res.render('pages/discover', { events: [], message: 'Failed to fetch events. Please try again later.' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(function(err) {
      res.render('pages/logout');
    });
  });
  

// *****************************************************
// <!-- Section 5 : Start Server-->
// *****************************************************
// starting the server and keeping the connection open to listen for more requests
app.listen(3000);
console.log('Server is listening on port 3000');