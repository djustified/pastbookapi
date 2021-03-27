const express = require("express");
const bodyParser = require("body-parser");
const router = express.Router();
const cors = require("cors");
const app = express();
app.use(cors());

const port = 3200;

//Here we are configuring express to use body-parser as middle-ware.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

router.post("/api/save", (request, response) => {
  //code to perform particular action.
  //To access POST variable use req.body()methods.
  console.log(request.body);
  response.end("yes");
});

// add router in the Express app.
app.use("/", router);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
