//IMPORTS

const express = require("express");
const Contenedor = require("./contenedor");
const { normalizeMessages } = require("./normalizr");
const contenedor = new Contenedor("./products.txt");
const mensajes = new Contenedor("./mensajes.txt");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Usuarios = require("./usuario");
const { mongoose, connect } = require("mongoose");
const {
  getHome,
  testProductosRandom,
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  postLogout,
  getInfo,
  getApiRandoms,
} = require("./routes");
require("dotenv").config();
const mongoURL = process.env.MONGOPWD;
const PORT = parseInt(process.argv[2]) || 8080;

const app = express();

app.set("view engine", "pug");
app.set("views", "./views");

app.use(express.json());
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));

//IMPLEMENTACION SOCKETS

const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer);

httpServer.listen(PORT, () =>
  console.log("SERVER ON http://localhost:" + PORT)
);

io.on("connection", (socket) => {
  //atajo los mensajes
  socket.on("msg", async (data) => {
    mensajes.save(data);
    const allMsgs = await mensajes.getAll();
    const chatNormalizado = normalizeMessages(allMsgs);
    io.sockets.emit("msg-list", chatNormalizado);
  });

  socket.on("product", (data) => {
    contenedor.save(data);
    const listProducts = contenedor.getAll();
    io.sockets.emit("product-list", listProducts);
  });
});

//---------SESSION--------------

app.use(
  session({
    store: MongoStore.create({
      mongoUrl: mongoURL,
      mongoOptions: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      },
    }),
    secret: "secreto",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 600000,
    },
  })
);

// MONGOOSE

function connectMG() {
  try {
    connect(mongoURL, { useNewUrlParser: true });
  } catch (e) {
    console.log(e);
    throw "cannot connect to the db";
  }
}

mongoose.set("strictQuery", false);
connectMG();

// PASSPORT

function isValidPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function createHash(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
}

passport.use(
  "login",
  new LocalStrategy((username, password, done) => {
    Usuarios.findOne({ username }, (err, user) => {
      if (err) return done(err);

      if (!user) {
        console.log("User Not Found with username " + username);
        return done(null, false);
      }

      if (!isValidPassword(user, password)) {
        console.log("Invalid Password");
        return done(null, false);
      }

      return done(null, user);
    });
  })
);

passport.use(
  "signup",
  new LocalStrategy(
    {
      passReqToCallback: true,
    },
    (req, username, password, done) => {
      Usuarios.findOne({ username: username }, function (err, user) {
        if (err) {
          console.log("Error in SignUp: " + err);
          return done(err);
        }

        if (user) {
          console.log("User already exists");
          return done(null, false);
        }

        const newUser = {
          username: username,
          password: createHash(password),
        };

        Usuarios.create(newUser, (err, userWithId) => {
          if (err) {
            console.log("Error in Saving user: " + err);
            return done(err);
          }
          console.log(newUser);
          console.log("User Registration succesful");
          return done(null, userWithId);
        });
      });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  Usuarios.findById(id, done);
});

app.use(passport.initialize());
app.use(passport.session());

// RUTAS

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.listen(PORT, () => {
  console.log("Listen on ", PORT);
});

app.get("/", checkAuth, getHome, () => {
  console.log(PORT);
});

app.get("/api/productos-test", testProductosRandom);

app.get("/login", getLogin);

app.post(
  "/login",
  passport.authenticate("login", { failureRedirect: "/loginErrorAuth" }),
  postLogin
);

app.get("/loginErrorAuth", (req, res) => {
  res.render("loginError.pug");
});

app.get("/register", getRegister);

app.post(
  "/register",
  passport.authenticate("signup", { failureRedirect: "/registerErrorAuth" }),
  postRegister
);

app.get("/registerErrorAuth", (req, res) => {
  res.render("registerError.pug");
});

app.post("/logout", postLogout);

app.get("/info", getInfo);

app.get("/api/randoms", getApiRandoms);
