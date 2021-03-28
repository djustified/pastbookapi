/**
 * This Node.js service exposes 2 endpoints
 * 1. /api/save to save the selected images that are sorted
 * 2. /api/get-images to retrieve the stored selection of images
 *
 * NOTE : Database The data is stored in a remote Neo4j database using cypher queries
 * This Sandbox database will expire in 10 days (5th of April 2021). if so please contact me (Mohamed Irshad)
 * via email so I can spin up a new instance
 */
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const router = express.Router();
const neo4j = require("neo4j-driver");
const app = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/", router);

/**
 * DEFINE APPLICATION CONSTANTS HERE
 */
const PORT = 3200;
const SAVE_API = "/api/save";
const RETRIEVE_API = "/api/get-images";
const DELETE_API = "/api/delete-images";
const DATABASE_HOST = "bolt://34.238.220.27:7687";
const DATABASE_USER = "neo4j";
const DATABASE_PASSWORD = "vent-election-quiets";

const initializeDatabaseDriver = () => {
  return neo4j.driver(
    DATABASE_HOST,
    neo4j.auth.basic(DATABASE_USER, DATABASE_PASSWORD),
    {
      /* encrypted: 'ENCRYPTION_OFF' */
    }
  );
};

/**
 *
 * API endpoint to store selected images that are sorted
 * @param {array} array of sorted images
 * @returns {String} Ok if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 *
 */
router.post(SAVE_API, (request, response) => {
  console.log(request.body);

  const driver = initializeDatabaseDriver();

  // Neo4j Query --> Delete existing selection before storing new one
  const deleteQuery = `match (p:Photo) detach delete p return p`;

  const session = driver.session({ database: "neo4j" });
  try {
    return session
      .run(deleteQuery)
      .then(() => {
        // Now store the new selection in the database
        params = {};
        const dbResultArray = [];
        request.body.forEach((item, key) => {
          const itemKey = `item_${key}`;
          params[itemKey] = { ...item, key };

          //  Neo4j Query --> save existing selection one by one
          const query = `MATCH (user:User{name:"TheOneAndOnlyUser"}) CREATE (photo:Photo) SET photo = $item_${key} MERGE (user)-[choice:HAS_CHOSEN_PHOTO]->(photo)  RETURN photo, user`;

          // declare a seperate session for the storing process
          const session = driver.session({ database: "neo4j" });

          return session
            .run(query, params)
            .then((result) => {
              result.records.forEach((record) => {
                // add every recored saved to the dbResultArray array
                dbResultArray.push(record.get("photo").properties);
              });
              if (dbResultArray.length === request.body.length) {
                // send success after all records have been stored
                return response.send("Ok");
              }
            })
            .catch((error) => {
              console.error("Neo4j create query error", error);
              response.status(500).send("Neo4j create query error!");
            });
        });
      })
      .catch((error) => {
        console.error("Neo4j Delete error", error);
        response.status(500).send("Something broke!");
      });
  } catch (error) {
    console.log("Server error: ", error);
    response.status(400).send("Something went wrong!");
  }
});

/**
 *
 * API endpoint to retrieve selected images that are sorted
 * @returns {Array} array of selected images if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 *
 */
app.get(RETRIEVE_API, (request, response) => {
  const driver = initializeDatabaseDriver();

  // Neo4j Query --> match existing selection and return the photos
  const retrieveQuery = `match (user:User)-[r:HAS_CHOSEN_PHOTO]->(photo:Photo) return photo ORDER BY photo.key`;
  try {
    const session = driver.session({ database: "neo4j" });

    const dbResultArray = [];
    return session
      .run(retrieveQuery)
      .then((result) => {
        result.records.forEach((record) => {
          // add every recored saved to the dbResultArray array
          dbResultArray.push(record.get("photo").properties);
        });
        if (dbResultArray.length === 9) {
          // send success after all records have been retrieved
          return response.send(dbResultArray);
        }
      })
      .catch((error) => {
        console.error("Neo4j retrieve query error", error);
        response.status(500).send("Neo4j retrieve query error!");
      });
  } catch (error) {
    console.log("Server error: ", error);
    response.status(400).send("Something went wrong!");
  }
});

/**
 *
 * API endpoint to delete selected images for a fresh user
 * @returns {String} "Ok. deleted all" if success
 * @returns {String} "Something went wrong!" if there was an generic error
 * @returns {String} "Something broke!" if there was a server error
 *
 */

app.get(DELETE_API, (request, response) => {
  const driver = initializeDatabaseDriver();

  // Neo4j Query --> delete existing selection and return the photos
  const deleteQuery = `match (p:Photo) detach delete p return p `;
  try {
    const session = driver.session({ database: "neo4j" });

    return session
      .run(deleteQuery)
      .then(() => {
        // return success if delte query succeeded
        return response.send("Ok. deleted all");
      })
      .catch((error) => {
        console.error("neo4j delete all query error ", error);
        response.status(500).send("Neo4j retrieve query error!");
      });
  } catch (error) {
    console.log("Server error: ", error);
    response.status(400).send("Something went wrong!");
  }
});

app.listen(PORT, () => {
  console.log(`PastBook photo app listening at http://localhost:${PORT}`);
  console.log(`Save images API      ----> http://localhost:${PORT}${SAVE_API}`);
  console.log(
    `Retrieve images API  ----> http://localhost:${PORT}${RETRIEVE_API}`
  );
  console.log(
    `Delete Images API    ----> http://localhost:${PORT}${DELETE_API}`
  );
});
