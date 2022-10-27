const express = require("express");
const bodyParser = require("body-parser")
const MongoClient = require('mongodb').MongoClient

const app = express()
app.set('view engine', 'ejs')
app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

/* ---- Connection with the DB ---- */
const db_url = "mongodb://0.0.0.0:27017"
const db_name = 'db2'
let db

MongoClient.connect(db_url, { useNewUrlParser: true }, (err, client) => {
  if (err) return console.log(err)
  db = client.db(db_name)
  console.log(`Connected to MongoDB`)
  console.log(`Database: ${db_name}`)
  app.listen(3000, () => console.log('listening on 3000'))
})

/* ---- Begin Logic ---- */

/* ---- Home ---- */
app.get('/', (req, res) => {
  db.collection('songs').aggregate([{
    $sample:{
      size: 100
    }}]).sort({"Popularity": -1}).toArray().then(results => {
      res.render('songs.ejs', { songs: results })
    })
})

/* ---- Search Bar ---- */
app.post('/search', (req, res) => {
  var name = req.body.name
  db.collection('songs').find({$or: [
    {"Song Name" : {
      $regex : name, $options : 'i'}},
    {"Artist" : {
      $regex : name, $options : 'i'}}
  ]}).sort({"Popularity": -1}).toArray().then(results => {
    res.render('songs', { songs: results })
  })
})

/* ---- Query Menu ---- */
app.post('/query', (req, res) => {
  var genre = req.body.genre
  var field = req.body.field
  var value = parseFloat(req.body.value)

  if (req.body.query_type === 'less') {
    if (genre === "any"){
      db.collection('songs').find({[field] : {$lt : value}}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } else {
      db.collection('songs').find({[field] : {$lt : value}, "Genre" : {$regex : genre, $options : 'i'}}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } 
  }

  if (req.body.query_type === 'more') {
    if (genre === "any"){
      db.collection('songs').find({[field] : {$gt : value}}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } else {
      db.collection('songs').find({[field] : {$gt : value}, "Genre" : {$regex : genre, $options : 'i'}}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } 
  }

  if (req.body.query_type === 'equal') {
    if (genre === "any"){
      db.collection('songs').find({[field] : value}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } else {
      db.collection('songs').find({[field] : value, "Genre" : {$regex : genre, $options : 'i'}}).sort({[field] : 1}).toArray()
        .then(results => {
          res.render('songs', { songs: results })
        })
    } 
  }
})

/* ---- Most Followed Artists ---- */
app.get('/topFollowers', (req, res) => {
  db.collection('songs').aggregate([{
    $group:{
      _id: "$Artist",
      "followers": {"$first": "$Artist Followers"},
      "songs": {"$sum": 1}
    }},{
    $sort: { "followers": -1, "songs": -1, "_id": -1} }]).limit(50).toArray().then(results => {
      res.render('artists', { artists: results })
    })
})

/* ---- Most Streamed Songs ---- */

app.get('/topStreams', (req, res) => {
  db.collection('songs').aggregate([{
    $sort: { "Streams": -1}}]).limit(50).toArray().then(results => {
      res.render('streams', { songs: results })
    })
})

/* ---- Song Card DA FINIRE O ELIMINARE---- */
app.get('/song', (req, res) => {
  var name = req.param("song").replaceAll("%20", " ")
  console.log(name)
  db.collection('songs').aggregate([{
    $match:{
      "Song Name": name}
    }]).toArray().then(results => {
      res.render('song', { song: results })
    })
})