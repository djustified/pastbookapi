const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const cors = require("cors");
const app = express();
app.use(cors());

// npm install --save neo4j-driver
// node example.js
const neo4j = require("neo4j-driver");

const port = 3200;

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post("/api/save", (request, response) => {
  //code to perform particular action.
  //To access POST variable use req.body()methods.
  console.log(request.body);

  // const splitArray = {};
  // request.body.forEach((item, key) => {
  //   splitArray[key] = item;
  // });
  // console.log("splitArray", splitArray);
  const params = {};
  request.body.forEach((item, key) => {
    // const query = `MERGE (user:User{name:'TheOneAndOnlyUser'})-[choice:HAS_CHOSEN_PHOTO]->(photo:Photo) SET photo = $itemKey RETURN photo, user`;

    const query = `MATCH (user:User{name:"TheOneAndOnlyUser"}) MERGE (photo:Photo) SET photo = $item_${key} MERGE (user)-[choice:HAS_CHOSEN_PHOTO]->(photo)  RETURN photo, user`;
    console.log("query: ", query);

    const itemKey = `item_${key}`;
    params[itemKey] = item;
    console.log("params: ", params);

    const driver = neo4j.driver(
      "bolt://34.238.220.27:7687",
      neo4j.auth.basic("neo4j", "vent-election-quiets"),
      {
        /* encrypted: 'ENCRYPTION_OFF' */
      }
    );

    const session = driver.session({ database: "neo4j" });

    return session
      .run(query, params)
      .then((result) => {
        console.log("result: ", result);
        console.log("params: ", params);
        console.log("query: ", query);
        result.records.forEach((record) => {
          console.log("RECORD-COUNT", record.get("user"));
        });
        session.close();
        driver.close();
      })
      .catch((error) => {
        console.error("NEO4J -ERROR", error);
      })
      .finally(() => {
        session.close();
        response.end("yes");
      });
  });
});

// add router in the Express app.
app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
