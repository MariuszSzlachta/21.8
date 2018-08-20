// EXPRESS:
const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cookieParser = require('cookie-parser');
app.use(express.static('./views/assets/'));
app.set('view engine', 'pug');
// app.set('views', path.join(__dirname, 'views'));
app.set('views', './views');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser());
app.use(session({secret: "Your secret key"}));

// MONGO + SHEMA
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// zmiana referencji, koniecznie przed connect. Tutaj używamy globalnego promisa natywnego, zamiast mpromise
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://admin:admin1234@ds225492.mlab.com:25492/arnael-db-test', { useNewUrlParser:
true });

// , {
  // useMongoClient: true
// }
const userSchema = new Schema({
  name: String,
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  admin: Boolean,
  created_at: Date,
  updated_at: Date
});


// zmiana imienia instancji dodając -boy na końcu
userSchema.methods.manify = function (next) {
  this.name = this.name + '-boy';
  return next(null, this.name);
};

userSchema.pre('save', function (next) {
  // aktualny czas
  const currentDate = new Date();
  // update - aktualny czas
  this.updated_at = currentDate;

  // jeśli nie stworzono to stworzono teraz
  if (!this.created_at) {
    this.created_at = currentDate;
  }
  next();
});

const User = mongoose.model('User', userSchema);

// DB HANDLERS
function findUser(user, pass) {
  return User.find({
    username: user
  })
}

function checkLogin(user, pass){
  return User.find({
    username: user,
    password: pass
  })
}

const createUser = function(user, pass){
  return new User ({
    username: user,
    password: pass
  })
}

// Session methods

function sessionChecker(request, response, next){
  if (request.session.user){
    next();
  } else {
    const err = new Error('Nie jesteś zalogowany')
    response.send('Nie jesteś zalogowany')
    next()
  }
}


// ENDPOINTS:

app.get('/', function(request, response){
  console.log("SESJA:");
  console.log(request.session.user);
  response.render('site')
});

// REJESTRACJA
app.post('/register', function(request, response) {
  const username = request.body.username;
  const password = request.body.password;
  let message = '';

  // szukam w bazie gostka i w zależności od tego czy znajde tworze lub nie nowego użytkownika i dostosowuje odpowiedz z serwera
  findUser(username, password)
  .then(function(res){
    if ( res.length !== 0 ){
      message = 'Taki użytkownik już istnieje';
      response.render('register', {mes: message})
    }
    if ( res.length === 0 ) {
      const newUser = createUser( username, password );
      newUser.save(function(err){
        if (err) throw err;
        message = 'Użytkownik ' + newUser.username + ' zarejestrowany pomyślnie';
        response.render('register', {mes: message})
      })
    }
  })
});

// LOGOWANIE
app.post('/login', function(request, response){
  const username = request.body.username;
  const password = request.body.password;

  checkLogin(username, password)
  .then(function(res){
    if (res.length !== 0){
      request.session.user = {
        username,
        password
      }
      response.redirect('content')
    }
    if(res.length === 0){
      let message = 'Nieprawidłowe dane logowania';
      response.redirect('/');
    }
  })
});

// WYLOGOWYWANIE
app.get('/logout', function(request, response){
  request.session.destroy(function(){
    console.log('session destroyed, user logged out')
  });
  response.redirect('/')
})

app.get('/content', sessionChecker ,function(request, response){
  response.render('content', { username: request.session.user.username });
})


app.listen(3000);

app.use(function(req, res, next){
  console.log('404');
  res.status(404).send('Sorry but we couldn\'t find what you need');
});
