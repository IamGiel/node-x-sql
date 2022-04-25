const mysql = require("mysql");
const express = require("express");
const bodyParser = require("body-parser");

const cors = require("cors");
const { login_user_password_mismatch, login_succesful_for_user, login_not_successful } = require("./constants/strings");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  multipleStatements: true,
  // database : 'my_db'
});

connection.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("no error on mysql connection");
  }
});

// create db
app.get("/createdb/:dbname", (req, res) => {
  console.log("create db >>>>  ", req.params);
  let sql_drop_db_if_exists = `DROP DATABASE IF EXISTS ${req.params.dbname}`;
  let sql = `CREATE DATABASE ${req.params.dbname}`;
  res.send(`database created with name: ${req.params.dbname}`);
  connection.query(`${sql_drop_db_if_exists}; ${sql}`, (err, result) => {
    if (err) throw err;
    console.log(result);
    // connection.end();
  });
});
// DROP db
app.get("/dropdb/:dbname", (req, res) => {
  console.log("drop db >>>>  ", req.params);
  let dropdbquery = `DROP DATABASE IF EXISTS ${req.params.dbname}`;
  res.send(`database DROPPED with name: ${req.params.dbname}`);
  connection.query(`${dropdbquery}`, (err, result) => {
    if (err) throw err;
    console.log(result);
    // connection.end();
  });
});
// create table
app.get("/createposttable", (req, res) => {
  let use_my_db = `USE my_db`;
  let sql = `CREATE TABLE people (id INTEGER(11) AUTO_INCREMENT NOT NULL, name VARCHAR(30) NOT NULL, has_pet BOOLEAN NOT NULL, pet_name VARCHAR(30), pet_age INTEGER(10), PRIMARY KEY (id)
  );`;
  res.send("table people created");
  connection.query(`${use_my_db}; ${sql}`, (err, result) => {
    if (err) throw err;
    console.log(result);
    // connection.end();
  });
});

// add user
app.post("/register_user", (req, res) => {
  console.log("this is req  register_user >>>>> ", req.body);
  let responseToClientPayload = {}; // proper error message to UI
  let sql = `USE testdb; INSERT INTO mysampletable (ID, NAME, EMAIL, PASSWORD) VALUES (NULL, "${req.body.name}", "${req.body.email}", "${req.body.password}");`;

  // check if form is filled
  if (
    req.body &&
    req.body.name &&
    req.body.email &&
    req.body.password !== "" &&
    req.body.passwordConfirmed !== "" &&
    req.body.password === req.body.passwordConfirmed
  ) {
    // INSERT INTO `mysampletable` (`ID`, `NAME`, `EMAIL`, `PASSWORD`) VALUES (NULL, 'Gentry', 'gent@mail.com', 'gentpw123');

    connection.query(sql, (err, result) => {
      if (err) {
        console.log("this is ERROR >>>>>>> ", err.sqlMessage);
        responseToClientPayload.reason = err.sqlMessage;
        responseToClientPayload.message = `Registration unsuccessful for ${req.body.name}`;
        responseToClientPayload.success = false;
        res.send(responseToClientPayload);
      } else {
        responseToClientPayload.success = true;
        responseToClientPayload.message = `Registration successful for ${req.body.name}`;
        responseToClientPayload.reason = "";
        res.send(responseToClientPayload);
      }

      console.log(result);
      // connection.end();
    });
  } else {
    // general err message
    responseToClientPayload.message = `BACKEND ERRCODE: form-invalid-or-incomplete`;
    // specific error message
    if (req.body.password !== req.body.passwordConfirmed) {
      responseToClientPayload.message = `BACKEND ERRCODE: password_mismatch.`;
      responseToClientPayload.reason = "Please check password.";
    }
    if (!req.body.checkAgreement) {
      responseToClientPayload.message = `BACKEND ERRCODE: check-agreement.`;
      responseToClientPayload.reason = "Please check the agreement box.";
    }
    responseToClientPayload.success = false;
    res.send(responseToClientPayload);
  }
});

// delete user
app.delete("/delete_person", (req, res) => {
  console.log("this is req >>>>> ", req.body);
  let sql = `USE my_db; DELETE FROM people WHERE name="${req.body.name}";`;
  res.send("person delete method ");
  connection.query(sql, (err, result) => {
    if (err) {
      throw err;
    }

    console.log(result);
    // connection.end();
  });
});

// login user
app.post("/login_user", (req, res) => {
  console.log("this is req login_user >>>>> ", req.body);
  let responseToClientPayload = {}; // proper error message to UI
  let sql = `USE testdb; SELECT * FROM mysampletable WHERE email="${req.body.email}" AND PASSWORD="${req.body.password}"`;
  let passwordToTest = null;
  // check if form is filled
  if (req.body && req.body.email) {
    // INSERT INTO `mysampletable` (`ID`, `NAME`, `EMAIL`, `PASSWORD`) VALUES (NULL, 'Gentry', 'gent@mail.com', 'gentpw123');

    connection.query(sql, (err, result) => {
      if (err) {
        // console.log("this is ERROR >>>>>>> ", err.sqlMessage);
        responseToClientPayload.reason = err.sqlMessage;
        responseToClientPayload.message = login_not_successful(req.body.email);
        responseToClientPayload.success = false;
        res.send(responseToClientPayload);
      } else {
        if (result[1].length === 1) {
          passwordToTest = JSON.stringify(result[1][0].PASSWORD);
          if (passwordToTest == `"${req.body.password}"`) {
            console.log("WELCOME!");
            responseToClientPayload.message = login_succesful_for_user(req.body.email);
            responseToClientPayload.success = true;
            responseToClientPayload.result = result[1][0];
          } else {
            console.log("OPS! WRONG PASSWORD");
            responseToClientPayload.message = login_user_password_mismatch();
            responseToClientPayload.success = false;
          }

          res.send(responseToClientPayload);
        } else {
          console.log("OPS! WRONG PASSWORD");
          responseToClientPayload.message = login_user_password_mismatch();
          responseToClientPayload.success = false;
          res.send(responseToClientPayload);
        }
      }

      // connection.end();
    });
  } else {
    // general err message
    responseToClientPayload.message = login_user_password_mismatch();
    responseToClientPayload.success = false;
    res.send(responseToClientPayload);
  }
  console.log(responseToClientPayload)
});

app.put("/update_person_petname", (req, res) => {
  let sql = `USE my_db; UPDATE people SET has_pet = true, pet_name = "${req.body.pet_name}", pet_age = 2 WHERE name = "${req.body.name}";`;
  res.send("person pet name is updated");
  connection.query(sql, (err, result) => {
    if (err) throw err;
    console.log(result);
    // connection.end();
  });
});

app.listen("3000", () => {
  console.log("server started on 3000");
});
