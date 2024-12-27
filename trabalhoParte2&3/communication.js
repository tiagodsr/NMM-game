const SERVER = "http://twserver.alunos.dcc.fc.up.pt:8008/";  // server fornecido 
//const SERVER = "http://twserver.alunos.dcc.fc.up.pt:8109/";  // server criado e publicado no twserver
//const SERVER = "http://localhost:8008/"; 				// server local do meu pc
const group = 9;
var game = 0;
var game_board = [[]];
var piece_selected = "";
var last_player = "";
var last_step = "";
var last_phase = "drop";
var square = null;
var position = null;
var adjCircles = null;
var previousPiece = null;
let playerColor = null;
let totalPiecesPlaced = null;

async function callServer(request_name, info) {
	return	fetch(SERVER + request_name, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(info)
	})
	.then(response => response.json());
}

// Método Register Request 
async function clickRegister() {
	let nick = document.getElementById("username-input").value;
	let password = document.getElementById("password-input").value;
	let response_json = await callServer("register", { nick, password });
	if (!("error" in response_json)) {
		console.log("Registration successful");
		switchPage('auth-page', 'homepage');
	} else {
		console.log("Register failed. Response:");
		console.log(response_json);
	}
}

// Método Join Request 
async function lookForGame() {
	let nick = document.getElementById("username-input").value;
	let password = document.getElementById("password-input").value;
	let squares = 3; // devido a nao termos outro tipo de tabuleiro
	console.log(squares);
	let response_json = await callServer("join", {group, nick, password, "size":squares});
	if ("game" in response_json) {
		console.log("Sucessfuly joined a game with ID: "+ response_json.game);
		game = response_json.game;
		switchPage("menu", "wait-game");
		await update();
	}
	else{
		console.log("Join failed. Response:");
		console.log(response_json);
	}
}

// Método Notify Request 
async function notify(square, position){
	let svColor;
	let nick = document.getElementById("username-input").value;
	let password = document.getElementById("password-input").value;
	let response_json = await callServer("notify", {nick, password, game, "cell":{square,position}});
	if ("error" in response_json){
		console.log(square,position);
		console.log("Notify error. Response:");
		console.log(response_json);
		let message = document.getElementById("text");
		message.innerText = response_json.error;
	}
	else{
		totalPiecesPlaced ++;
		console.log(playerColor);
		console.log(totalPiecesPlaced);
		if (playerColor === "white") playerColor = "black";
		else playerColor = "white";
		console.log("Successfuly notified the server");
		last_player = nick;
	}
}

// Método Update Request (SSE)
async function update(){
	var posicaoHTML = null;
	var adjHighlight = null;
	let nick = document.getElementById("username-input").value;
	let url = SERVER + "update?nick="+nick+"&game="+game;
	const eventSource = new EventSource(url);
	eventSource.onmessage = function(message){
		console.log("Mensagem recebida do servidor:", message.data);
		let json = JSON.parse(message.data);
		if ("error" in json){
			console.log("Update error. Response:");
			console.log(json);
			switchPage("wait-game", "menu");
		}
		if ("winner" in json){
			// no caso do jogo estar completamente finalizado / nao acontece forfeit
			if ("board" in json){
				game_board = json.board;
				updateBoardPvP(game_board);
			}
			// dar update a game message
			console.log("Successfuly received an update from server");
			console.log("Game finished - Winner: " + json.winner);
			eventSource.close();
			let message = document.getElementById("text");
			message.innerText = "Game finished - Winner: " + json.winner;
		}
		else if ("board" in json){
			game_board = json.board;
			// go to the game page if still at the waiting page
			if (document.getElementById("wait-game").style.display=="flex"){
				console.log("Successfuly received an update from server");
				switchPage('wait-game','board', ['play-game-name', 'text','quit-game-button','give-up-button']);
			}
			// mudar a board e as mensagens do jogo no browser side
			let move = json.move;
			console.log(move);
			let phase = json.phase;
			console.log(phase);
			let step = json.step;
			let turn = json.turn;
			let players = json.players;
			if (json.cell) { // Verifica se o campo "cell" existe
				square = json.cell.square;
				position = json.cell.position;
				if (step == "to"){
					let arraypos = [square,position];
					let posHTML = arrayPositionToCoordinatesPvP(arraypos);
					let [sq,pos] = posHTML.split('-');
					sq = parseInt(sq);
					pos = parseInt(pos);
					piece_selected = document.querySelector(`.circle[data-row="${sq}"][data-column="${pos}"]`);
					adjCircles = getAdjacentBoardPieceCircles(piece_selected);
					adjacentBoardPieceCirclesHighlight(adjCircles,true);
				}
				else if (piece_selected != ""){
					let arraypos = [square,position];
					let posHTML = arrayPositionToCoordinatesPvP(arraypos);
					let [sq,pos] = posHTML.split('-');
					sq = parseInt(sq);
					pos = parseInt(pos);
					piece_selected = document.querySelector(`.circle[data-row="${sq}"][data-column="${pos}"]`);
					adjacentBoardPieceCirclesHighlight(adjCircles,false);
					piece_selected = "";
				}
				console.log(`Square: ${square}, Position: ${position}`);
			}
			svColor = players[turn];
			updateBoardPvP(game_board,last_phase,last_step,svColor);
			updateMessage(phase, step, turn);
			last_step = step;
			last_phase = phase;
		}
	}
}

// Método Leave Request
async function giveUpRequest(){
	let nick = document.getElementById("username-input").value;
	let password = document.getElementById("password-input").value;
	let response_json = await callServer("leave", {nick, password, game});
	if (!("error" in response_json)){
		console.log("Successfuly left the game");
	}
	else{
		console.log("Leave failed. Response:");
		console.log(response_json);
	}
}


// Método Ranking Request
async function ranking(size){
	let squares;
	if (size === "3 X 3") {
		squares = 3;
	} else if (size === "2 X 2") {
		squares = 2;
	} else if (size === "4 X 4") {
		squares = 4;
	}
	console.log(squares);
	let response_json = await callServer("ranking", {group, "size": squares});
	if (!("error" in response_json)){
		console.log("Successfuly received the ranking table");
		console.log(response_json);
		let table = document.getElementById("win-rate-table");
		let tbody = table.querySelector("tbody");
		while (tbody.rows.length > 1) {
			tbody.deleteRow(1);
		}
		// generate the new table
		let ranking_list = response_json.ranking;
		for (let player_stats of ranking_list){
			let row = document.createElement("tr");
			let player_nick = document.createElement("td"); player_nick.textContent = player_stats["nick"]; row.appendChild(player_nick);
			let player_victories = document.createElement("td"); player_victories.textContent = player_stats["victories"]; row.appendChild(player_victories);
			let player_games = document.createElement("td"); player_games.textContent = player_stats["games"]; row.appendChild(player_games);
			tbody.appendChild(row);
		}
	}
	else{
		console.log("Ranking error. Response:");
		console.log(response_json);
	}
}

// Funçoes Auxiliares

// Mapeamento dos quadrados para suas coordenadas
const quadrado1novo = ['1-1', '1-4', '1-7', '4-7', '7-7', '7-4', '7-1', '4-1'];
const quadrado2novo = ['2-2', '2-4', '2-6', '4-6', '6-6', '6-4', '6-2', '4-2'];
const quadrado3novo = ['3-3', '3-4', '3-5', '4-5', '5-5', '5-4', '5-3', '4-3'];


function updateBoardPvP(board,phase,step,svColor) {
	let realColor;
    const color_value = { "empty": 0, "blue": 1, "red": 2 }; // Mapa das cores
    let piece_count = [0, 0]; // Contagem de peças (blue, red)

    // mapear os valores "empty", "blue", "red" para 0, 1, 2
	for (let i = 0; i < game_board.length; i++){
		for (let j = 0; j < game_board[0].length; j++){
			game_board[i][j] = color_value[game_board[i][j]];
			if (game_board[i][j] !== 0){ piece_count[game_board[i][j]-1]++; }
		}
	}

	// update the board

	//squares
	for(let r = 0; r < board.length; r++){
		//positions (board[0] pois todos os quadrados tem 8 posições)
		for(let c = 0; c < board[0].length; c++){
			//usar funcao reversa para passar para o formato do html
			let arraypos = [r,c];
			let posHTML = arrayPositionToCoordinatesPvP(arraypos);
			let [row,column] = posHTML.split('-');
			row = parseInt(row);
			column = parseInt(column);
			let piece = document.querySelector(`.circle[data-row="${row}"][data-column="${column}"]`);
			if (board[r][c] == 0){
				piece.style.backgroundColor = "rgb(177, 177, 177)"; // empty colour
				piece.setAttribute('occupied','false');
			}
			else if (board[r][c] == 1){
				piece.style.backgroundColor = "rgb(255, 255, 255)"; // white colour
				piece.setAttribute('occupied','true');
			}
			else if (board[r][c] == 2){
				piece.style.backgroundColor = "rgb(0, 0, 0)"; // black colour
				piece.setAttribute('occupied','true');
			}
		}
	}
	if (phase === "drop"){
		updateSideBoardswhenPlacePvP(piece_count[0],piece_count[1]);
	}
	if (step === "take"){
		if (svColor == "blue")	realColor = "rgb(255, 255, 255)";
		else if (svColor == "red") realColor = "rgb(0, 0, 0)";
		console.log("brancas");
		console.log(piece_count[0]);
		console.log(piece_count[1]);
		updateSideBoardWhenRemovePvP(realColor,piece_count[0],piece_count[1]);
		console.log("acrescentou");
	}
}

function updateSideBoardswhenPlacePvP(p1_count, p2_count) {
	for (let i = 0; i < p1_count; i++) {
		leftBoardCircles[i].style.backgroundColor = "rgb(177, 177, 177)";
	}
	for (let i = 0; i < p2_count; i++) {
		rightBoardCircles[i].style.backgroundColor = "rgb(177, 177, 177)";
	}
}

function updateSideBoardWhenRemovePvP(realColor,p1_count,p2_count) {
	console.log("cor real" + realColor);
    if (realColor === "rgb(255, 255, 255)"){ // white
            leftBoardCircles[p1_count].style.backgroundColor = "rgb(255, 255, 255)"; // black
    }
    else if (realColor=== "rgb(0, 0, 0)"){ // black
            rightBoardCircles[p2_count].style.backgroundColor = "rgb(0, 0, 0)" // white
    }
}

function coordinatesToArrayPositionPvP(coordinates) {

    // Checar em qual quadrado a coordenada está e retornar a posição
    if (quadrado1novo.includes(coordinates)) {
        return [0, quadrado1novo.indexOf(coordinates)];
    } else if (quadrado2novo.includes(coordinates)) {
        return [1, quadrado2novo.indexOf(coordinates)];
    } else if (quadrado3novo.includes(coordinates)) {
        return [2, quadrado3novo.indexOf(coordinates)];
    } else {
        return null; // Coordenada inválida
    }
}

function arrayPositionToCoordinatesPvP(arrayPosition) {
    const [quadrado, posicao] = arrayPosition;

    // Retornar a coordenada com base no quadrado e na posição
    if (quadrado === 0) {
        return quadrado1novo[posicao];
    } else if (quadrado === 1) {
        return quadrado2novo[posicao];
    } else if (quadrado === 2) {
        return quadrado3novo[posicao];
    } else {
        return null; // Posição inválida
    }
}

function updateMessage(phase, step, turn){
	let message = document.getElementById("text");
	if (phase == "drop"){
		message.innerText = "[Drop Phase] Turn: " + turn;
	}
	else if (step == "from"){
		message.innerText = "[Move Phase - Select Piece] Turn: " + turn;
	}
	else if (step == "to"){
		message.innerText = "[Move Phase - Select Destination] Turn: " + turn;
	}
	else if (step == "take"){
		message.innerText = "[Move Phase - Take Oponent's Piece] Turn: " + turn;
	}
}

// GAME

// Event listener para cada circulo

boardPieceCircles.forEach(boardPieceCircle => {
    boardPieceCircle.addEventListener('click', (event) => {
		lastPlayedCoordinates = getCoordinatesFromCircle(boardPieceCircle);
		console.log(lastPlayedCoordinates);
		let array = coordinatesToArrayPositionPvP(lastPlayedCoordinates);
		console.log(array);
		notify(array[0],array[1]);
		previousPiece = boardPieceCircle;
    });
});