const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
const convertStateIntoResponse = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states", async (request, response) => {
  const getStates = `SELECT * FROM state;`;
  const statesName = await db.all(getStates);
  response.send(
    statesName.map((eachState) => convertStateIntoResponse(eachState))
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getState = `SELECT * FROM state WHERE state_id=${stateId};`;
  const stateName = await db.get(getState);
  response.send(convertStateIntoResponse(stateName));
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const addDistrict = `INSERT INTO
    district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  await db.run(addDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id=${districtId};`;
  const districtName = await db.get(getDistrict);
  response.send({
    districtId: districtName.district_id,
    districtName: districtName.district_name,
    stateId: districtName.state_id,
    cases: districtName.cases,
    cured: districtName.cured,
    active: districtName.active,
    deaths: districtName.deaths,
  });
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrict = `UPDATE district
    SET district_name='${districtName}',
    state_id=${stateId},
    cases=${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE district_id=${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatics = `SELECT SUM(cases) AS total_cases,SUM(cured) AS total_cured,
    SUM(active) AS total_active,SUM(deaths) AS total_deaths
    FROM district
    WHERE state_id=${stateId};`;
  const statics = await db.get(getStatics);
  response.send({
    totalCases: statics.total_cases,
    totalCured: statics.total_cured,
    totalActive: statics.total_active,
    totalDeaths: statics.total_deaths,
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const { stateId } = request.params;
  const getStateName = `SELECT state_name FROM district 
    NATURAL JOIN state WHERE district_id=${districtId};  `;
  const stateName = await db.get(getStateName);
  response.send({
    stateName: stateName.state_name,
  });
});

module.exports = app;
