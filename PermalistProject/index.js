import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;
const db= new pg.Client({
  user:"postgres",
  host:"localhost",
  database:"myworld",
  password:"root",
  port:5432
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
db.connect();

let items = [];

async function dataItems() {
  const result=await db.query("SELECT * FROM items");
  const data=result.rows;
  return data;
}

app.get("/", async(req, res) => {
  items= await dataItems();
  res.render("index.ejs", {
    listTitle: "Today",
    listItems: items,
  });
});

app.post("/add", async (req, res) => {
  const item = req.body.newItem;
  console.log(typeof(item));
  if(item===""){
    res.redirect("/");
  }else{
    const result=await db.query("INSERT INTO items(title) VALUES($1)",[item]);
    console.log(result);
    res.redirect("/");
  }
});

app.post("/edit", async (req, res) => {
  const result= await db.query("UPDATE items SET title=$1 WHERE id=$2",[req.body.updatedItemTitle,req.body.updatedItemId]);
  console.log(result);
  res.redirect("/");
});

app.post("/delete", async (req, res) => {
  const id=req.body.deleteItemId;
  const result=await db.query("DELETE FROM items WHERE id=$1",[id]);
  console.log(result.rowCount);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
