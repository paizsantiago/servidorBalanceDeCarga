const { createNProducts } = require("./faker");
const parseArgs = require('minimist');
const { fork } = require("child_process");

const getHome = (req, res) =>{
    const {username, password} = req.user;
    const user = {username, password};
    res.render("index.pug", {user: user, userExist: true})
}

const testProductosRandom = (req, res) =>{
    let randomProducts = [];
  createNProducts(randomProducts, 5);
  res.render("productosFaker.pug", {title: "Productos random", products: randomProducts, productsExist: true})
}

const getLogin = (req, res) =>{
    if(req.isAuthenticated()){
     const {username, password} = req.user;
     const user = {username, password};
       res.render('index.pug' , {user: user, userExist: true})
    } else {
     res.render('login.pug')
    }
 }

const postLogin = (req, res) => {
    const {username, password} = req.user;
    const user = {username, password};
    const userExist = true;
    res.render('index.pug', {user: user, userExist: userExist})
}

const getRegister =  (req, res) =>{
    if (req.isAuthenticated()) {
      const {username, password} = req.user;
      const user = {username, password};
      res.render('index.pug' , {user: user, userExist: true});
    } else {
      res.render('register.pug');
    }
}

const postRegister =  (req, res) =>{
    const {username, password} = req.body;
    const user = {username, password};
    res.render('index.pug', {user: user, userExist: true});
  }

const postLogout =  (req, res) => {
    req.session.destroy((error) =>{
        if (error) {
            res.send("no pudo desloguear")
        } else {
            res.render('login.pug')
        }
    })
  }

const getInfo = (req, res) =>{
    const argumentos = JSON.stringify(parseArgs(process.argv.slice(2)));
    const path = process.argv[0];
    const id = process.pid;
    const version = process.version;
    const carpeta = process.cwd();
    const SO = process.platform;
    const memoria = process.memoryUsage().rss;

    res.render('info.pug', {argumentos: argumentos, path: path , id:id, version: version, carpeta: carpeta, SO: SO, memoria: memoria})
}

const getApiRandoms = (req, res) =>{
    let cantidad = req.query.cantidad || 100000;

    let proceso = fork('./calcular.js');
    proceso.send(cantidad);

    proceso.on("message", (msg)=>{
        console.log(msg)
        const data = msg;
        res.json(data);
    })
}

module.exports = {
    getHome,
    testProductosRandom,
    getLogin,
    postLogin,
    getRegister,
    postRegister,
    postLogout,
    getInfo,
    getApiRandoms
}