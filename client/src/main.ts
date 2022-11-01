import './style.css'
import {io} from "socket.io-client";

const login = document.getElementById("login") as HTMLDivElement;
const game = document.getElementById("game") as HTMLDivElement;
const score = document.getElementById("score") as HTMLDivElement;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

const playerInput = document.getElementById("player") as HTMLSelectElement;
const sendButton = document.getElementById("send") as HTMLButtonElement;

const gameWidth = 800;
const gameHeight = 600;

const boardHeight = 0.2;
const boardWidth = 0.02;

const boardSPeed = 0.01;

const ballSpeed = 0.015;

let socket = io()

let winner: number | undefined = undefined;

let pos: { p1: number, p2: number } = {p1: 0.5, p2: 0.5};

let ballPos: { x: number, y: number } = {x: 0.5, y: 0.5};
let ballVel: { x: number, y: number } = {x: 0.5, y: 0.5};

let isDown = false;
let isUp = false;

sendButton.addEventListener("click", () => {
    socket.emit("selectPlayer", playerInput.value)

    login.classList.add("hidden");
    game.classList.remove("hidden");
})

document.addEventListener("keydown", (e) => {
    if (e.key == "ArrowDown" || e.key == "s") {
        isDown = true;
    } else if (e.key == "ArrowUp" || e.key == "w") {
        isUp = true;
    }

    if (winner != undefined && e.key == " ") {
        socket.emit("restart")
    }
})

document.addEventListener("keyup", (e) => {
    if (e.key == "ArrowDown" || e.key == "s") {
        isDown = false;
    } else if (e.key == "ArrowUp" || e.key == "w") {
        isUp = false;
    }
})

socket.on("updatePositions", (newPos: { p1: number, p2: number }) => {
    if (parseInt(playerInput.value) == 1) {
        pos.p2 = newPos.p2;
    } else {
        pos.p1 = newPos.p1;
    }
})

socket.on("updateBallPosition", (newBall: { pos: { x: number, y: number }, vel: { x: number, y: number } }) => {
    ballPos = newBall.pos;
    ballVel = newBall.vel;
})

socket.on("updateScore", (newScore: { p1: number, p2: number }) => {
    score.innerText = newScore.p1 + " | " + newScore.p2
})

socket.on("updateWinner", (newWinner: number) => {
    winner = newWinner;
})

socket.on("restart", () => {
    winner = undefined;
})


setInterval(() => {
    if (winner != undefined) {

        context.font = '50px "Arial"';
        context.textAlign = "center";

        if (winner == parseInt(playerInput.value)) {
            context.fillText("You WON!", gameWidth / 2, gameHeight / 2);
        } else {
            context.fillText("You Lost!", gameWidth / 2, gameHeight / 2);
        }

        context.font = '15px "Arial Black"';
        context.fillText("press SPACE to restart", gameWidth / 2, gameHeight / 2 + 40);

        return
    }
    let multi = 0;

    if (isDown) {
        multi = 1;
    }

    if (isUp) {
        multi = -1;
    }

    if (parseInt(playerInput.value) == 1) {
        pos.p1 += multi * boardSPeed;
        pos.p1 = Math.max(Math.min(pos.p1, 1 - (boardHeight / 2)), boardHeight / 2);

        socket.emit("sendPosition", pos.p1)
    } else {
        pos.p2 += multi * boardSPeed;
        pos.p2 = Math.max(Math.min(pos.p2, 1 - (boardHeight / 2)), boardHeight / 2);

        socket.emit("sendPosition", pos.p2)
    }

    ballPos.x += ballVel.x * ballSpeed;
    ballPos.y += ballVel.y * ballSpeed;

    context.fillStyle = "#211f1f"
    context.fillRect(0, 0, gameWidth, gameHeight);

    context.fillStyle = "white"
    context.fillRect(0, (pos.p1 * gameHeight) - (gameHeight * boardHeight / 2), gameWidth * boardWidth, gameHeight * boardHeight);
    context.fillRect(gameWidth * (1 - boardWidth), (pos.p2 * gameHeight) - (gameHeight * boardHeight / 2), gameWidth * boardWidth, gameHeight * boardHeight);

    context.beginPath();
    context.arc(ballPos.x * gameWidth, ballPos.y * gameHeight, 8, 0, 2 * Math.PI, false);
    context.closePath()
    context.fill();
}, 10)

