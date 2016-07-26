// Server
//
var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var RKYAI_COLLECTION = "informations";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connexion OK");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App en cours d'execution sur le port", port);
  });
});

// API ROUTES

// Error handler pour les endpoints.
function handleError(res, cause, message, code) {
  console.log("ERREUR: " + cause);
  res.status(code || 500).json({"erreur": message});
}

/*  "/api/v1"
 *    GET: finds all contacts
 *    POST: creates a new contact
 */

app.get("/api/v1/map", function(req, res) {
  db.collection(RKYAI_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Erreur pour recuperer les infos.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/v1/map", function(req, res) {
  var newUser = req.body;
  var SHA3 = require("crypto-js/sha3");
  var SHA1 = require("crypto-js/sha1");
  var d = new Date();
    newUser.date = d.toUTCString();
    newUser.UTC = d.getTime();
    newUser.json = d.toJSON();
  newUser.userSHA3 = SHA3(req.body.user);
  newUser.userSHA1 = SHA1(req.body.user);

  if (!(req.body.source || req.body.latitude)) {
    handleError(res, "Donnees Invalides", "Doit comporter la source et/ou localisation.", 400);
  }

  db.collection(RKYAI_COLLECTION).insertOne(newUser, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Impossible de creer nouveau user");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

/*  "/api/v1/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/api/v1/id/:id", function(req, res) {
  db.collection(RKYAI_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed: impossible de recuperer le user");
    } else {
      res.status(200).json(doc);
    }
  });
});
app.get("/api/v1/user/:id", function(req, res) {
  db.collection(RKYAI_COLLECTION).findOne({ "user": req.params.id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed: impossible de recuperer le user");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/v1/map/:id", function(req, res) {
  var updateDoc = req.body;
  var SHA3 = require("crypto-js/sha3");
  delete updateDoc._id;
  var d = new Date();
    updateDoc.date = d.toUTCString();
    updateDoc.UTC = d.getTime();
    updateDoc.json = d.toJSON();
  console.log(SHA3(req.params.niveau));
  db.collection(RKYAI_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed: impossible de mettre à jour le user");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/api/v1/user/:id", function(req, res) {
  db.collection(RKYAI_COLLECTION).deleteOne({"user": req.params.id }, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed: impossible d'effacer le user");
    } else {
      res.status(204).end("kool");
    }
  });
});
