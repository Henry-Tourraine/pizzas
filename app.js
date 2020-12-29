if(process.env.NODE_ENV !== 'production'){
  require('dotenv').config()
}
const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const fs = require('fs');
const cookie = require("cookie-parser")
const cookies = require('cookies');
const crypto = require('crypto').randomBytes(64).toString('hex')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt');
const stripeSecretKey = process.env.SECRET_KEY;
const stripePublictKey = process.env.PUBLIC_KEY;
process.env.CRYPT_KEY = crypto;

const mysql = require('mysql')
app.use(bodyParser.urlencoded({ extended: true}))
app.use(express.json())
app.use(cookie())
app.use(express.static('public'));
app.use('/static', express.static('public'))

app.set('views', './views')
app.set('view engine', 'ejs')

const stripe = require('stripe')('sk_test_THYEEo15duEie6HrMVxkPK5x00pNmSNRbl');

var con = mysql.createConnection({
  host: "127.0.0.80",
  user: "root",
  password: "",
  database: 'pizza'
  
});
con.connect(function(err) {
if (err) throw err;
console.log("Connected!");
});

app.get('/secret', async (req, res) => {
  console.log(req.cookies)
  var pizzaCount = 0;
  if(req.cookies.id){
    const id = req.cookies.id;
    jwt.verify(id, process.env.CRYPT_KEY, (err, data)=>{console.log("jwt : ", data, err);req.id = data.id})
    con.query('SELECT * FROM commandes WHERE id="'+req.id+'" ', (err, result)=>{
      if(err) throw err;
      fs.readFile('./pizzas.json', 'utf8', (err, jsonString) => {
        if (err) {
            console.log("File read failed:", err)
            return
        }
        console.log('File data:', result[0].delivery)
        if(result[0].delivery == "delivery"){console.log(pizzaCount += 2.5)}
        pizas = JSON.parse(jsonString).pizzas;
      for(x=0; x<JSON.parse(result[0].content).commande.length; x++){
        console.log("COMMANDE EN COURS :",result[0].content);
        pi = JSON.parse(result[0].content).commande[x].pizzas;
        numPi = parseInt(JSON.parse(result[0].content).commande[x].nombre);
       
          for (var i = 0; i < pizas.length; i++){
            // look for the entry with a matching `code` value
            if (pizas[i].name == pi){
              ry = numPi*parseFloat(pizas[i].price)
              pizzaCount += ry
               console.log("PIZZA TROUVEE :", pizas[i], "RESULT4 :", ry)
            }
          } 
     
      
      };
      console.log(pizzaCount)
      console.log("result amount ",result[0].amount);
       process.env.TEMPO = result[0].amount
       pizzaCount = Math.round(pizzaCount*10000)/100
       if(pizzaCount != parseFloat(result[0].amount)){
         console.log("redirect :", process.env.TEMPO, pizzaCount )
         process.env.TEMPO = pizzaCount;
        }
    })
    })
  }
  console.log("PPROCEEESSS :", process.env.TEMPO)
 setTimeout(async function(){console.log("temps écoulé");console.log("process : ",process.env.TEMPO);
  const intent = await stripe.paymentIntents.create({
      amount: process.env.TEMPO,
      currency: 'eur',
      // Verify your integration in this guide by including this parameter
      metadata: {integration_check: 'accept_a_payment'},
    });
  res.json({client_secret: intent.client_secret});
  process.env.TEMPO=""
}, 1000)
});


app.get('/test',(req, res)=>{
  res.send(stripeSecretKey+" "+stripePublictKey)
} )

app.get('/payment', (req, res)=>{
  if(req.cookies.id){
    const id = req.cookies.id;
    jwt.verify(id, process.env.CRYPT_KEY, (err, data)=>{console.log("jwt : ", data, err);req.id = data.id})
    con.query('SELECT * FROM commandes WHERE id="'+req.id+'" ', (err, result)=>{if(err) throw err;no=result[0].amount; re=JSON.parse(result[0].content).commande;console.log("result commande :",res); console.log("result amount ",result[0].prenom); process.env.TEMPO = result[0].amount; nom=result[0].nom; prenom=result[0].prenom })
    
  }
 
  res.render('payment', {stripePublictKey: stripePublictKey, re: re, no:no,nom:nom, prenom:prenom})

})
app.get('/tel', (req,res)=>{
  res.render('tel')
})
app.post('/update', (req, res)=>{
  con.query('UPDATE commandes SET complete=TRUE WHERE id="'+req.body.id+'"', (err, result)=>{if(err) throw err; console.log("payment updated")})
})
app.get('/jerome', (req, res)=>{
  con.query('SELECT * FROM commandes WHERE payment="paid"', (err, result)=>{
    if(err) throw err;
    for(i=0; i<result.length;i++){
    console.log(result[i])
    }

    re = result
    res.render('jerome', {re:re})
  })

 
})
setInterval(function(){
  today = new Date()
  dat = today.getHours()
  if(dat == 6 || dat == "6"){
    con.query('TRUNCATE TABLE commandes', (err, result)=>{
      if(err)throw err;

    })
  }
}, 1800000)
app.get('/success', (req, res)=>{
  if(req.cookies.id){
    const id = req.cookies.id;
  jwt.verify(id, process.env.CRYPT_KEY, (err, data)=>{console.log("jwt : ", data, err);req.id = data.id})
    con.query('UPDATE commandes SET payment="paid" WHERE id="'+req.id+'"', (err, result)=>{if(err) throw err; console.log("payment updated")})
  }
  res.render("success")
})
app.get('/fail', (req, res)=>{
  res.render('fail')
})
app.get('/', (req, res)=>{
  fs.readFile('pizzas.json', function(error, data){if(error){res.status(500).end()}else{res.render('menu', {pizzas:JSON.parse(data), stripePublictKey: stripePublictKey})}})
  
})

app.post('/pa', (req, res)=>{
  let amoun = req.body.amount;
  let nom = req.body.nom
  let prenom = req.body.prenom
  let tel = req.body.tel
  let delivery = req.body.delivery
  let address = req.body.address
  let city = req.body.city
  let date = req.body.date
  let content = req.body.content;
  console.log("DELIVERY :",delivery)
  data = [amoun, delivery, nom, prenom, tel, address, city, date, "unpaid", content]
  con.query('INSERT INTO commandes(amount, delivery, nom, prenom, tel, address, city, date, payment,content) VALUES (?,?,?,?,?,?,?,?,?,?)', data, (err, result)=>{
    if(err) throw err;
    console.log("content : ",content)
    access = jwt.sign({id: result.insertId}, process.env.CRYPT_KEY,{expiresIn: 20000000})
    res.cookie('id', access,{maxAge:600000,httpOnly:true})
    res.redirect('/payment')
    
  })
  
})



app.listen(3000, () => {
  console.log('Running on port 3000');
});