/**
 * This Node.js service exposes 2 endpoints
 * 1. /api/save to save the selected images that are sorted
 * 2. /api/get-images to retrieve the stored selection of images
 *
 * The data is stored in a remote Neo4j database using cypher queries
 */
const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const cors = require("cors");
const app = express();

app.use(cors());
const neo4j = require("neo4j-driver");
const port = 3200;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", router);

/**
 * API endpoint to store selected images that are sorted
 * @param {array} array of sorted images
 * @returns {String} Ok if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 */
router.post("/api/save", (request, response) => {
  console.log(request.body);

  const driver = neo4j.driver(
    "bolt://34.238.220.27:7687",
    neo4j.auth.basic("neo4j", "vent-election-quiets"),
    {
      /* encrypted: 'ENCRYPTION_OFF' */
    }
  );

  /***
   *  Neo4j Query --> Delete existing selection before storing new one
   * */
  const deleteQuery = `match (p:Photo) detach delete p return p`;

  const session = driver.session({ database: "neo4j" });
  try {
    return session
      .run(deleteQuery)
      .then(() => {
        /// Now store the new selection
        params = {};
        const savedArray = [];
        request.body.forEach((item, key) => {
          const itemKey = `item_${key}`;
          params[itemKey] = { ...item, key };

          /***
           *  Neo4j Query --> save existing selection one by one
           * */
          const query = `MATCH (user:User{name:"TheOneAndOnlyUser"}) CREATE (photo:Photo) SET photo = $item_${key} MERGE (user)-[choice:HAS_CHOSEN_PHOTO]->(photo)  RETURN photo, user`;

          const session = driver.session({ database: "neo4j" });

          return session
            .run(query, params)
            .then((result) => {
              result.records.forEach((record) => {
                console.log("RECORD-COUNT", record.get("photo"));
                console.log("------", record.get("photo").properties);
                savedArray.push(record.get("photo").properties);
              });
              if (savedArray.length === request.body.length) {
                return response.send("Ok");
              }
            })
            .catch((error) => {
              console.error("NEO4J CREATE QUERY -ERROR", error);
            });
        });
      })
      .catch((error) => {
        console.error("NEO4J DELETE -ERROR", error);
        response.status(500).send("Something broke!");
      });
  } catch (error) {
    response.status(400).send("Something went wrong!");
  }
});

/**
 * API endpoint to retrieve selected images that are sorted
 * @returns {Array} array of selected images if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 */
app.get("/api/get-images", (request, response) => {
  const driver = neo4j.driver(
    "bolt://34.238.220.27:7687",
    neo4j.auth.basic("neo4j", "vent-election-quiets"),
    {
      /* encrypted: 'ENCRYPTION_OFF' */
    }
  );

  /***
   *  Neo4j Query --> match existing selection and return the photos
   * */
  const retrieveQuery = `match (user:User)-[r:HAS_CHOSEN_PHOTO]->(photo:Photo) return photo ORDER BY photo.key`;
  const session = driver.session({ database: "neo4j" });
  try {
    const session = driver.session({ database: "neo4j" });

    const savedArray = [];
    return session
      .run(retrieveQuery)
      .then((result) => {
        result.records.forEach((record) => {
          console.log("RECORD-COUNT", record.get("photo"));
          console.log("------", record.get("photo").properties);
          savedArray.push(record.get("photo").properties);
        });
        if (savedArray.length === 9) {
          return response.send(savedArray);
        }
      })
      .catch((error) => {
        console.error("NEO4J RETRIEVE QUERY -ERROR", error);
      });
  } catch (error) {
    response.status(400).send("Something went wrong!");
  }
});

/**
 * API endpoint to delete selected images for a fresh user
 * @returns {String} "Ok. deleted all" if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 */
app.get("/api/delete-images", (request, response) => {
  const driver = neo4j.driver(
    "bolt://34.238.220.27:7687",
    neo4j.auth.basic("neo4j", "vent-election-quiets"),
    {
      /* encrypted: 'ENCRYPTION_OFF' */
    }
  );

  /***
   *  Neo4j Query --> delete existing selection and return the photos
   * */
  const deleteQuery = `match (p:Photo) detach delete p return p `;
  const session = driver.session({ database: "neo4j" });
  try {
    const session = driver.session({ database: "neo4j" });

    const savedArray = [];
    return session
      .run(deleteQuery)
      .then(() => {
        return response.send("Ok. deleted all");
      })
      .catch((error) => {
        console.error("NEO4J DELETE ALL QUERY -ERROR", error);
      });
  } catch (error) {
    response.status(400).send("Something went wrong!");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
