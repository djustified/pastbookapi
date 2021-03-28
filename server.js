const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const cors = require("cors");
const app = express();
app.use(cors());

const neo4j = require("neo4j-driver");

const port = 3200;

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post("/api/save", (request, response) => {
  console.log(request.body);

  const driver = neo4j.driver(
    "bolt://34.238.220.27:7687",
    neo4j.auth.basic("neo4j", "vent-election-quiets"),
    {
      /* encrypted: 'ENCRYPTION_OFF' */
    }
  );

  // Delete existing selection before storing new one
  const deleteQuery = `match (p:Photo) detach delete p return p`;
  const session = driver.session({ database: "neo4j" });
  const result = [];
  return session
    .run(deleteQuery)
    .then(() => {
      /// Now store the new selection
      params = {};
      request.body.forEach((item, key) => {
        const itemKey = `item_${key}`;
        params[itemKey] = item;

        const query = `MATCH (user:User{name:"TheOneAndOnlyUser"}) CREATE (photo:Photo) SET photo = $item_${key} MERGE (user)-[choice:HAS_CHOSEN_PHOTO]->(photo)  RETURN photo, user`;

        const session = driver.session({ database: "neo4j" });

        return session
          .run(query, params)
          .then((result) => {
            result.records.forEach((record) => {
              console.log("RECORD-COUNT", record.get("photo"));
              result.push(record.get("photo"));
            });
          })
          .catch((error) => {
            console.error("NEO4J -ERROR", error);
          });
      });
    })
    .catch((error) => {
      console.error("NEO4J -ERROR", error);
    });
});

// add router in the Express app.
app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
