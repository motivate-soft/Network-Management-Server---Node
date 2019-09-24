const config = require('../config/config.json');
const session = require("express-session");
const userRepo = require("./user-repo");
const passport = require('passport');
const JsonStratgy = require('passport-json').Strategy;
const bodyParser = require('body-parser')
const logger = require("../utils/logger");
const secret = process.env.JWT_SECRET || "0N37%M3";
const MongoStore = require('connect-mongo')(session);

module.exports = function(app) {  
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));	
  app.use(
    session({
      key: "user_sid",
      secret: secret,
      resave: false,
      saveUninitialized: false,
      store: new MongoStore({url: config.mongoUrl, mongoOptions: {dbName: config.dbName}}),
      cookie: {
        maxAge: 600000
      },
      rolling: true
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new JsonStratgy(
	{	
	    usernameProp: 'email',
	    passwordProp: 'password'
	  },	
    async function(email, password, done) {
      const user = await userRepo.getByEmail(email.toLowerCase());
          if(!user){
            return done(null, false, {message: 'Unknown User'});
          }
          userRepo.comparePassword(password, user.hash, function(err, isMatch){
            if(err) throw err;
          if(isMatch){
            return done(null, user);
          } else {
            return done(null, false, {message: 'Invalid password'});
          }
        });
    }
  ));
  passport.serializeUser(async function(user, done) {
    done(null, user._id);
  });
  passport.deserializeUser(async function(id, done) {
    const user = await userRepo.getById(id);
    const session_user = {
        sub: user._id.toString(),
        role: user.role,
        accessRight: user.accessRight,
        orgs: user.orgs.map(s => s.toString())
      };
    done(null, session_user);
  });
};