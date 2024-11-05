import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "myworld",
  password: "root",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;
let users = [];

async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id=visited_countries.user_id WHERE users.id=$1",[currentUserId])
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}
async function allUser() {
  const result=await db.query("SELECT * FROM users");
  return result.rows;
}
async function findCurrentUser() {
  const result=await allUser();
  let user=result.find((user)=>user.id==currentUserId);
  return user;
}
app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const users=await allUser();
  const currentUser=await findCurrentUser();
  console.log(users);
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"];
  const currentUser=await findCurrentUser();

  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE  $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1,$2)",
        [countryCode,currentUserId]
      );
      res.redirect("/");
    } catch(err){
      const countries = await checkVisisted();
      const users=await allUser();
      const currentUser=await findCurrentUser();
      console.log(users);
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error:"country already exist"
      });}
  } 
  catch(err){
    const countries = await checkVisisted();
      const users=await allUser();
      const currentUser=await findCurrentUser();
      console.log(users);
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        users: users,
        color: currentUser.color,
        error:"country does not exist try again"
      });
  } 
});
app.post("/user", async (req, res) => {
  if(req.body.add==="new"){
    res.render("new.ejs");

  }else{
    console.log(req.body);
    currentUserId=req.body.user;
    res.redirect("/");
  }
 
});

app.post("/new", async (req, res) => {
  console.log(req.body)
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
    const result= await db.query("INSERT INTO users(name,color) VALUES($1,$2) RETURNING *",[req.body.name,req.body.color]);
    const id=result.rows[0].id;
    currentUserId=id;
    res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
