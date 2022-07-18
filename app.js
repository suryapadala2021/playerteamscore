const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
module.exports = app;
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();
app.get("/players/", async (request, response) => {
  const playersDetails = `
     SELECT 
     *
     FROM
     player_details;`;
  const playersArray = await db.all(playersDetails);
  response.send(
    playersArray.map((obj) => ({
      playerId: obj.player_id,
      playerName: obj.player_name,
    }))
  );
});
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = `
     SELECT 
     *
     FROM
     player_details
     WHERE
     player_id=${playerId};`;
  const player = await db.get(playerDetails);
  response.send({ playerId: player.player_id, playerName: player.player_name });
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
    UPDATE
    player_details
    SET
    player_name='${playerName}'
    WHERE
    player_id=${playerId};`;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchDetails = `
     SELECT 
     *
     FROM
     match_details
     WHERE
     match_id=${matchId};`;
  const match = await db.get(matchDetails);
  response.send({
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  });
});
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatchesQuery = `
    SELECT
    *
    FROM
    player_match_score INNER JOIN match_details
    ON player_match_score.match_id=match_details.match_id
    WHERE
    player_id=${playerId};`;
  const playerMatches = await db.all(playerMatchesQuery);
  response.send(
    playerMatches.map((obj) => ({
      matchId: obj.match_id,
      match: obj.match,
      year: obj.year,
    }))
  );
});
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatch = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName
    FROM
    (match_details INNER JOIN player_match_score
    ON match_details.match_id=player_match_score.match_id) AS t
    INNER JOIN player_details 
    ON t.player_id=player_details.player_id
    WHERE
    match_details.match_id=${matchId};`;
  const playersArray = await db.all(getPlayersOfMatch);
  response.send(playersArray);
});
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const statesOfAPlayer = `
    SELECT 
    player_id AS playerId,
    player_name AS playerName,
    SUM(score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes
    FROM player_match_score NATURAL JOIN player_Details
    WHERE player_match_score.player_id=${playerId};`;
  response.send(await db.get(statesOfAPlayer));
});
