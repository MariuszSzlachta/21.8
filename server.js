// EXPRESS:
var express = require('express');
var app = express();
app.use(express.static('./views/assets/'));
app.set('view engine', 'pug');
app.set('views','./views');

// MONGO + SHEMA 
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// zmiana referencji, koniecznie przed connect. Tutaj używamy globalnego promisa natywnego, zamiast mpromise
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://admin:admin1234@ds225492.mlab.com:25492/arnael-db-test', {
  useMongoClient: true
});


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

// CREATE USER FUNCTION:
const createUser = function(user, pass) {
  return new User ({
    name: user,
    username: user,
    password: pass
  })
}


// ENDPOINTS:

app.get('/', function(req, res){
  res.render('site');
});

app.get('/register', function(req, res) {
  let queryUsername = req.query.username;
  let queryPassword = req.query.password;
  // wywołanie funkcji tworzenia użytkownika w zmiennej będzie obiekt użytkownika
  const newUser = createUser(queryUsername, queryPassword);

  newUser.save(function (err) {
    if (err) throw err;
    console.log('Użytkownik ' + newUser.name + ' zapisany pomyślnie')
  });
  res.render('register', {username: req.query.username});
});

app.listen(3000);

app.use(function(req, res, next){
  console.log('404');
  res.status(404).send('Sorry but we couldn\'t find what you need');
});

// MONGO-DB
