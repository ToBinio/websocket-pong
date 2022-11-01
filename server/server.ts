import path = require("path");

let cors = require('cors')

const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server);

app.use(cors())

app.use(express.static(path.join(__dirname, '../client/dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

let winner: number | undefined = undefined;

let playerScore: { p1: number, p2: number } = {p1: 0, p2: 0}
let playerPos: { p1: number, p2: number } = {p1: 0.5, p2: 0.5};

let ballPos: { x: number, y: number } = {x: 0.5, y: 0.5};
let ballVel: { x: number, y: number } = {x: 1, y: 0};

const ballSpeed = 0.015;
const maxAngle = Math.PI / 3;

io.on('connection', (socket) => {
    console.log('a user connected');

    let currentPlayer: number = 0;

    socket.on("selectPlayer", (player: number) => {
        currentPlayer = player;
    })

    socket.on("sendPosition", (position: number) => {
        if (currentPlayer == 1) {
            playerPos.p1 = position;
        } else {
            playerPos.p2 = position;
        }

        io.emit("updatePositions", playerPos)
    })

    socket.on("restart", () => {

        playerScore.p2 = 0;
        playerScore.p1 = 0;

        io.emit("updateScore", playerScore)
        winner = undefined;

        io.emit("restart")
    })
});

server.listen(8080, () => {
    console.log('listening on *:8080');

    setInterval(() => {

        if (winner != undefined) {
            io.emit("updateWinner", winner)
            return
        }

        ballPos.x += ballVel.x * ballSpeed;
        ballPos.y += ballVel.y * ballSpeed;

        if (ballPos.x <= 0.02) {
            let diff = playerPos.p1 - ballPos.y;

            if (Math.abs(diff) <= (0.22 / 2)) {

                let newAngle = (diff / (0.22 / 2) * maxAngle);
                ballVel.x = Math.cos(newAngle);
                ballVel.y = -Math.sin(newAngle);

            } else {
                ballPos = {x: 0.9, y: 0.5};
                ballVel = {x: -1, y: 0};

                playerScore.p2++;
                io.emit("updateScore", playerScore)

                if (playerScore.p2 >= 10) {
                    io.emit("updateWinner", 2)
                    winner = 2;
                }
            }
        }


        if (ballPos.x >= 1 - 0.02) {
            let diff = playerPos.p2 - ballPos.y;

            if (Math.abs(diff) <= (0.22 / 2)) {

                let newAngle = (diff / (0.22 / 2) * maxAngle);
                ballVel.x = -Math.cos(newAngle);
                ballVel.y = -Math.sin(newAngle);

            } else {
                ballPos = {x: 0.1, y: 0.5};
                ballVel = {x: 1, y: 0};

                playerScore.p1++;
                io.emit("updateScore", playerScore)

                if (playerScore.p1 >= 10) {
                    io.emit("updateWinner", 1)
                    winner = 1;
                }
            }
        }

        if (ballPos.y <= 0 || ballPos.y >= 1) {
            ballVel.y = -ballVel.y
        }

        io.emit("updateBallPosition", {pos: ballPos, vel: ballVel})
    }, 10)
});