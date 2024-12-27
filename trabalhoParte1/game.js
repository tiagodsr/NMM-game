// Constantes para as peças e a lógica do jogo
const NUMBER_OF_PIECES_PER_PLAYER = 9;
const TOTAL_NUMBER_OF_PIECES = NUMBER_OF_PIECES_PER_PLAYER * 2;

// Variáveis ​​de círculo e do estado do jogo
const boardPieceCircles = document.querySelectorAll('.circle');
let positionedWhitePieces = 0;
let positionedBlackPieces = 0;
let previousSelectedBoardPieceCircle = null;
let previousAdjacentCircles = [];
var millCoordinates = [];
let wildCardMove = 0; // Wildcardmove é uma variável de 3 estados sendo 0 - disabled, 1 - enabled e 2 - desabilitado para sempre
let removeAdversaryPiece = false;
var nextMenColor = 'white'; // Primeira cor a ser colocada
var currentBlackPieces = 0;
var currentWhitePieces = 0;
var counter = 0;
let draw = false;   
const leftBoardCircles = document.querySelectorAll('.left-board .circleP');
const rightBoardCircles = document.querySelectorAll('.right-board .circleP');
var whiteRemoved = 0;
var blackRemoved = 0;

var currentPlayerColor = 'white';
var adversaryColor = 'black';

// Event listener para cada circulo
boardPieceCircles.forEach(boardPieceCircle => {
    boardPieceCircle.addEventListener('click', (event) => {
        let currentboardPieceCircleColor = boardPieceCircle.style.backgroundColor;
        // Obtém adjacent boardPieceCircles
        let boardAdjacentCircles = getAdjacentBoardPieceCircles(boardPieceCircle);

        console.log("Current ",currentPlayerColor);
        console.log("Adv ",adversaryColor);
        // Se removeAdversaryPiece flag for true, escolhe uma peça do adversário para remover
        if (removeAdversaryPiece === true) {
            if (currentboardPieceCircleColor === adversaryColor) {
                cleanPiece(boardPieceCircle);
                updateSideBoardWhenRemove();
                removeAdversaryPiece = false;
                togglePlayerTurn();
            }
            else return;
        }

        // mensagem para mover as peças depois que todas as peças dos dois jogadores forem colocadas
        if (positionedBlackPieces + positionedWhitePieces === TOTAL_NUMBER_OF_PIECES - 1){
            if (currentPlayerColor === 'black'){
                document.getElementById("text").innerText="White player : move a piece"
            }
            else {
                document.getElementById("text").innerText="Black player : move a piece"
            }
        }

        // Verifica se todas as peças dos dois jogadores foram colocadas no tabuleiro
        if (positionedBlackPieces + positionedWhitePieces === TOTAL_NUMBER_OF_PIECES){
            if (currentPlayerColor === 'white'){
                document.getElementById("text").innerText="White player : move a piece"
            }
            else {
                document.getElementById("text").innerText="Black player : move a piece"
            }
            // Se for uma ação de Fim de Jogo, dá reset ao estado do tabuleiro, para o inicial (a começar no jogador Branco)
            if (isGameOver()) {
                resetBoard();
                return;
            }

            // Se o boardPieceCircle está occupied e a sua cor for a do currentPlayerColor
            if (boardPieceCircle.getAttribute('occupied') === 'true' && currentboardPieceCircleColor === currentPlayerColor) {
                // Allow for adjacent selection

                // Se o jogador tiver apenas 3 peças, pode fazer movimentos livres para casas que não estejam ocupadas
                let numberOfPiecesByColor = currentPlayerColor === 'white' ? currentWhitePieces : currentBlackPieces;
                console.log(numberOfPiecesByColor);
                if (numberOfPiecesByColor === 3) {
                    wildCardMove = 1;
                    if (currentPlayerColor === 'black'){
                        document.getElementById("text").innerText="White player Free Move: move a piece to any empty cell"
                    }
                    else {
                        document.getElementById("text").innerText="Black player Free Move: move a piece to any empty cell"
                    }
                }

                // Se ambos os jogadores tiverem 3 peças, e em 10 jogadas totais não haver um vencedor dá empate
                if (currentWhitePieces === 3 && currentBlackPieces ===3){
                    counter++;
                    if(counter == 10){
                        draw = true;
                    }
                }

                // Se o previousSelectedCircle for o boardPieceCircle, dá reset ao seu highlight e o highlight das adjancentBoardPiecesHighlight
                if (previousSelectedBoardPieceCircle === boardPieceCircle) {
                    console.log("Reset Highlight");
                    adjacentBoardPieceCirclesHighlight(boardAdjacentCircles, false);
                    previousSelectedBoardPieceCircle = null;
                }
                else {
                    console.log("Highlight");

                    // Dá highlight ao current boardPieceCircle e ao adjacentboardPieceCircles
                    if (wildCardMove === 1) adjacentBoardPieceCirclesHighlight(boardPieceCircles, true);
                    else adjacentBoardPieceCirclesHighlight(boardAdjacentCircles, true);

                    // Armazena o current boardPieceCircle como o previousSelectedCircle
                    previousSelectedBoardPieceCircle = boardPieceCircle;
                }
            }
            else {
                if (previousSelectedBoardPieceCircle === null) return;

                let previousSelectedBoardPieceCircleAdjacentCircles = getAdjacentBoardPieceCircles(previousSelectedBoardPieceCircle);
                // Se o previousSelectedBoardCircle não for null e o boardPieceCircle for um adjacent circle
                if (previousSelectedBoardPieceCircleAdjacentCircles.includes(boardPieceCircle) && boardPieceCircle.getAttribute('occupied') !== 'true'|| wildCardMove === 1) {
                    console.log("Move Piece");
                    // Move a peça para o novo circulo
                    movePiece(previousSelectedBoardPieceCircle, boardPieceCircle);
                    
                    if (wildCardMove === 1) {
                        adjacentBoardPieceCirclesHighlight(boardPieceCircles, false);
                        wildCardMove = 3;
                    }
                    else {
                        // Remove o highlight dos adjacentCircles
                        adjacentBoardPieceCirclesHighlight(boardAdjacentCircles, false);
                    }

                    previousSelectedBoardPieceCircle = null;

                    // Obtém coordinates
                    let boardPieceCircleCoordinates = getCoordinatesFromCircle(boardPieceCircle);

                    // Verifica se a coordenada é um moinho (Mill)
                    if (isCoordinateInMill(boardPieceCircleCoordinates, millPatterns)) {
                        console.log("Coordenada em Mill")
                        removeCoordinateFromMills(boardPieceCircleCoordinates);
                    }

                    // Se houver um moinho (Mill), pede ao currentPlayer para remover um peça do adversário
                    if (findMill(currentPlayerColor, millCoordinates)) {
                        if (currentPlayerColor === 'white'){
                            document.getElementById("text").innerText="White player : Mill found! choose a black piece to remove"
                        }
                        else {
                            document.getElementById("text").innerText="Black player : Mill found! choose a white piece to remove"
                        }
                        console.log("Mill Found 1");
                        console.log(millCoordinates);                        
                        removeAdversaryPiece = true;
                        return;
                    }
                    // Alterna o turno do jogador
                    togglePlayerTurn();
                    if (currentPlayerColor === 'white'){
                        document.getElementById("text").innerText="White player : move a piece"
                    }
                    else {
                        document.getElementById("text").innerText="Black player : move a piece"
                    }
                }
            }
        } else {
            // Se nem todas as peças foram colocadas, continua a colocar

            // Se o boardPieceCircle está ocupado e o player já utilizou todas as peças permitidas
            if (boardPieceCircle.getAttribute('occupied') === 'true' ||
                currentPlayerColor === 'white'  && positionedWhitePieces === NUMBER_OF_PIECES_PER_PLAYER ||
                currentPlayerColor === 'black' && positionedBlackPieces === NUMBER_OF_PIECES_PER_PLAYER) return;

            // Marca a boardPieceCircle como ocupada
            boardPieceCircle.setAttribute('occupied', true);

            // Muda a cor da boardPieceCircle com a cor da currentPlayerColor e aumenta o contador
            boardPieceCircle.style.backgroundColor = currentPlayerColor;
            if (currentPlayerColor === 'white') {positionedWhitePieces++;currentWhitePieces++}
            else {positionedBlackPieces++;currentBlackPieces++;}

            // Obtém as coordenadas
            let boardPieceCircleCoordinates = getCoordinatesFromCircle(boardPieceCircle);

            // Verifica se a coordenada é um moinho
            if (isCoordinateInMill(boardPieceCircleCoordinates, millPatterns))
                removeCoordinateFromMills(boardPieceCircleCoordinates);

            if (findMill(currentPlayerColor, millCoordinates)) {
                console.log("Mill Found 2");
                console.log(millCoordinates);
            }
            // Alterna a vez do jogador para jogar o adversário
            togglePlayerTurn();
            updateSideBoard();
            if (positionedBlackPieces + positionedWhitePieces < TOTAL_NUMBER_OF_PIECES){
                if (currentPlayerColor === 'white'){
                    document.getElementById("text").innerText="White player : place a piece"
                }
                else {
                    document.getElementById("text").innerText="Black player : place a piece"
                }
            }
        }
    });
});

// Adjacency map baseado em cada (row, column) no Nine Men's Morris board
const adjacencyMap = {
    '1-1': ['1-4', '4-1'],
    '1-4': ['1-1', '1-7', '2-4'],
    '1-7': ['1-4', '4-7'],
    '2-2': ['2-4', '4-2'],
    '2-4': ['1-4', '2-2', '2-6', '3-4'],
    '2-6': ['2-4', '4-6'],
    '3-3': ['3-4', '4-3'],
    '3-4': ['2-4', '3-3', '3-5'],
    '3-5': ['3-4', '4-5'],
    '4-1': ['1-1', '4-2', '7-1'],
    '4-2': ['2-2', '4-1', '4-3', '6-2'],
    '4-3': ['3-3', '4-2', '5-3'],
    '4-5': ['3-5', '4-6', '5-5'],
    '4-6': ['2-6', '4-5', '4-7', '6-6'],
    '4-7': ['1-7', '4-6', '7-7'],
    '5-3': ['4-3', '5-4'],
    '5-4': ['5-3', '5-5', '6-4'],
    '5-5': ['4-5', '5-4'],
    '6-2': ['4-2', '6-4'],
    '6-4': ['5-4', '6-2', '6-6', '7-4'],
    '6-6': ['4-6', '6-4'],
    '7-1': ['4-1', '7-4'],
    '7-4': ['6-4', '7-1', '7-7'],
    '7-7': ['4-7', '7-4']
};

const millPatterns = [
        // Rows
        ['1-1', '1-4', '1-7'],
        ['2-2', '2-4', '2-6'],
        ['3-3', '3-4', '3-5'],
        ['4-1', '4-2', '4-3'],
        ['4-5', '4-6', '4-7'],
        ['5-3', '5-4', '5-5'],
        ['6-2', '6-4', '6-6'],
        ['7-1', '7-4', '7-7'],
        
        // Columns
        ['1-1', '4-1', '7-1'],
        ['2-2', '4-2', '6-2'],
        ['3-3', '4-3', '5-3'],
        ['1-4', '2-4', '3-4'],
        ['5-4', '6-4', '7-4'],
        ['3-5', '4-5', '5-5'],
        ['2-6', '4-6', '6-6'],
        ['1-7', '4-7', '7-7']
    ];

// Funçao para obter a contagem de elementos por data-column e filtrar pela background color (branco ou preto)
function getCirclesByBackgroundColor(desiredColor) {
    // Map the color name to the corresponding RGB value
    const colorMap = {
        "black": "rgb(0, 0, 0)",
        "white": "rgb(255, 255, 255)"
    };

    // Select all matching circles that are not occupied
    const allMatches = document.querySelectorAll(`.circle[occupied="false"]`);
    
    // Convert the NodeList to an array and filter by background color
    const filteredCircles = Array.from(allMatches).filter(circle => {
        // Get the computed style of the circle
        const computedStyle = window.getComputedStyle(circle);
        
        // Compare with the desired color converted to RGB
        return computedStyle.backgroundColor === colorMap[desiredColor];
    });
    
    return filteredCircles.length; // Return the count of filtered circles
}



// Função para obter coordenadas de um elemento boardPieceCircle
function getCoordinatesFromCircle(boardPieceCircle) {
    // Ensure the input is a valid HTML element
    if (boardPieceCircle instanceof HTMLElement) {
        // Retrieve the row and column data attributes
        const row = boardPieceCircle.getAttribute('data-row');
        const column = boardPieceCircle.getAttribute('data-column');

        // Check if both row and column are found
        if (row !== null && column !== null) {
            return `${row}-${column}`; // Return the coordinates in "row-column" format
        }
    }
    return null; // Return null if the element is invalid or attributes are missing
}

function cleanPiece(boardPieceCircle) {

    // Obtém a cor
    if (boardPieceCircle.style.backgroundColor == 'white') currentWhitePieces--;
    if (boardPieceCircle.style.backgroundColor == 'black') currentBlackPieces--;
    boardPieceCircle.style.backgroundColor = '';
    boardPieceCircle.setAttribute('occupied', false);
}

function movePiece(previousSelectedCircle, boardPieceCircle) {
    boardPieceCircle.style.backgroundColor = previousSelectedCircle.style.backgroundColor;
    boardPieceCircle.setAttribute('occupied', true);
    previousSelectedCircle.style.backgroundColor = '';
    previousSelectedCircle.setAttribute('occupied', false);

    previousSelectedCircle = null;
}

function togglePlayerTurn() {
    currentPlayerColor = adversaryColor;
    adversaryColor = adversaryColor == 'white' ? 'black' : 'white'
}

function removeAllPieces() {
    // Remove todos os circulos do tabuleiro
    boardPieceCircles.forEach(boardPieceCircle => {
        boardPieceCircle.style.backgroundColor = '';
        boardPieceCircle.setAttribute('occupied', false);
    });
}

function resetBoard() {
    removeAllPieces();
    // Reset the game state
    positionedWhitePieces = 0;
    positionedBlackPieces = 0;
    previousSelectedCircle = null;
    previousAdjacentCircles = [];
    nextMenColor = 'white'; // First color to be placed
}

// Função para obter os circulos adjacentes
function getAdjacentBoardPieceCircles(circle) {
    const row = circle.getAttribute('data-row');
    const column = circle.getAttribute('data-column');
    const key = `${row}-${column}`;

    // Retrieve adjacent positions from the adjacency map
    const adjacentPositions = adjacencyMap[key] || [];

    // Find adjacent circle elements without filtering by occupied status initially
    return adjacentPositions.map(pos => {
        const [adjRow, adjColumn] = pos.split('-');
        return document.querySelector(`.circle[data-row="${adjRow}"][data-column="${adjColumn}"]`);
    }).filter(adjacentCircle => adjacentCircle !== null); // Filter out non-existing circles
}

// Função para dar Highlight aos adjacentCircles , mas apenas se não estiverem ocupados!
function adjacentBoardPieceCirclesHighlight(adjacentCircles, highlight) {
    boardPieceCircles.forEach(boardPieceCircle => {
        boardPieceCircle.setAttribute('adjacent-circle', false);
    });

    // Highlight only the unoccupied adjacent circles
    adjacentCircles.forEach(adjacentCircle => {
        if (adjacentCircle.getAttribute('occupied') === 'false') {
            adjacentCircle.setAttribute('adjacent-circle', highlight ? true : false);
        }
    });
}

// Função para remover uma coordenada de todos os moinhos (Mills)
function removeCoordinateFromMills(coordinate) {
    const [row, column] = coordinate.split('-'); // Split the coordinate into row and column

    for (let i = 0; i < millCoordinates.length; i++) {
        const mill = millCoordinates[i];

        // Find the index of the coordinate in the current mill
        const index = mill.findIndex(pos => {
            const [patternRow, patternColumn] = pos;
            return patternRow === row && patternColumn === column;
        });

        // If the coordinate is found, remove it
        if (index !== -1) {
            mill.splice(index, 1);
            console.log(`Removed ${coordinate} from mill ${i}`);

            // Optional: Remove the mill if it has no coordinates left
            if (mill.length === 0) {
                millCoordinates.splice(i, 1);
                console.log(`Removed mill ${i} as it has no coordinates left`);
                i--; // Adjust the index after removing a mill
            }
        }
    }
}



// Função para verficar se uma determinada coordenada faz parte de um moinho (Mill)
function isCoordinateInMill(coordinate, millPatterns) {
    const [row, column] = coordinate.split('-'); // Split the coordinate into row and column

    // Check each mill pattern to see if the coordinate is part of it
    for (const pattern of millPatterns) {
        const isPartOfMill = pattern.some(position => {
            const [patternRow, patternColumn] = position.split('-');
            return patternRow === row && patternColumn === column;
        });

        // If the coordinate matches any position in the pattern, return true
        if (isPartOfMill) {
            return true;
        }
    }

    return false; // The coordinate is not part of any mill
}


// Função para detetar se um jogodar possui uma linha ou coluna com 3 peças da mesma cor (Mill)
function findMill(color) {
    console.log("Find Mill Function");

    // Check each mill pattern to see if all three circles match the specified color
    for (const pattern of millPatterns) {
        const allMatch = pattern.every(position => {
            const [row, column] = position.split('-');
            const circle = document.querySelector(`.circle[data-row="${row}"][data-column="${column}"]`);
            return circle && circle.getAttribute('occupied') === 'true' && circle.style.backgroundColor === color;
        });

        // If all circles in this pattern match the color, check for existing coordinates
        if (allMatch) {
            // Create an array of new coordinates for the current pattern
            const newCoordinates = pattern.map(position => position.split('-'));

            // Check if the new mill coordinates already exist in millCoordinates
            const isNewMill = !millCoordinates.some(existingMill =>
                existingMill.length === newCoordinates.length &&
                existingMill.every((coord, index) => coord[0] === newCoordinates[index][0] && coord[1] === newCoordinates[index][1])
            );

            console.log(isNewMill);
            // If it's a new mill, store its coordinates
            if (isNewMill) {
                millCoordinates.push(newCoordinates); // Use push to add new mill coordinates
                console.log(`Added new mill:`, newCoordinates);
                return true; // Return found status
            }
        }
    }

    return false; // No mill found
}

// Função para remover os Highlights do adjacentBoardCircles que não estejam ocupados
function clearAllHighlights() {
    boardPieceCircles.forEach(circle => {
        circle.setAttribute('adjacent-circle', false);
    });
}

// Função que deteta se o jogo acabou
function isGameOver() {
    const blackPieces = document.querySelectorAll('.circle[occupied="true"][style*="black"]').length;
    const whitePieces = document.querySelectorAll('.circle[occupied="true"][style*="white"]').length;

    if (draw === true){
        clearAllHighlights();
        giveUp();
        document.getElementById("text").innerText="Draw!! (Maximum of 10 moves exceeded with 3 pieces each)"
        return true;
    } 
    // Check if any player has two or fewer pieces left
    if (((blackPieces <= 2 || whitePieces <= 2))) {
        const winner = blackPieces > whitePieces ? 'Black' : 'White';
        const remainingPieces = blackPieces > whitePieces ? blackPieces : whitePieces;
        // está alternado
        if (winner === 'black'){
            giveUp();
            document.getElementById("text").innerText="White player wins!! (Black player has only 2 pieces left)"
        }
        else{
            giveUp();
            document.getElementById("text").innerText="Black player wins!! (White player has only 2 pieces left)"
        }
        return true;
    }

    // Check if any player has no valid moves left
    let blackMovesAvailable = false;
    let whiteMovesAvailable = false;

    // Loop through each occupied circle to find available moves
    document.querySelectorAll('.circle[occupied="true"]').forEach(circle => {
        const color = circle.style.backgroundColor;
        const adjacentCircles = getAdjacentBoardPieceCircles(circle);

        const hasFreeAdjacent = adjacentCircles.some(adjacentCircle => adjacentCircle.getAttribute('occupied') === 'false');
        // Check if there's at least one available move for each player
        if (color === 'black' && hasFreeAdjacent) blackMovesAvailable = true;
        if (color === 'white' && hasFreeAdjacent) whiteMovesAvailable = true;
    });

    // Determine if the game is over based on available moves
    if (!blackMovesAvailable) {
        giveUp();
        document.getElementById("text").innerText="Draw!! (Black player has no valid moves)"
        return true;
    } else if (!whiteMovesAvailable) {
        giveUp();
        document.getElementById("text").innerText="Draw!! (White player has no valid moves)"
        return true;
    }

    // Return false if no game-over conditions are met
    return false;
}

// alert para quando se clica "give up" button, utilizado no html da página do jogo no onclick
function msgGiveUp(){
    if (currentPlayerColor === 'white'){
        alert(`White player gives up, Black player wins!`);
    }
    else{
        alert(`Black player gives up, White player wins!`);
    }
}

// função para detetar Give UP e dar reset ao jogo
function giveUp(){
    resetBoard();
    updateSideBoardGiveUp(); 
    // Circle and game state variables
    positionedWhitePieces = 0;
    positionedBlackPieces = 0;
    previousSelectedBoardPieceCircle = null;
    previousAdjacentCircles = [];
    millCoordinates = [];
    wildCardMove = 0; // Wildcardmove is a tri state variable 0-disabled 1-enabled 2-disabled forever
    removeAdversaryPiece = false;
    currentBlackPieces = 0;
    currentWhitePieces = 0;
    counter = 0;
    draw = false; 
    whiteRemoved = 0;
    blackRemoved = 0;
    //leftBoardCircles = document.querySelectorAll('.left-board .circleP');
    //rightBoardCircles = document.querySelectorAll('.right-board .circleP');
    if (currentPlayerColor === 'black'){
        togglePlayerTurn();
        nextMenColor = 'black'; // First color to be placed
    }
    document.getElementById("text").innerText="White player : place a piece"
}

// Função para resetar as sideBoards com as peças
function updateSideBoardGiveUp() {
    for (let i = 0; i < 9; i++) {
        leftBoardCircles[i].style.backgroundColor = 'white';
        rightBoardCircles[i].style.backgroundColor = 'black';
    }
}

// Função para atualizar as sideboards quando se remove peças durante o jogo
function updateSideBoardWhenRemove() {
    if (currentPlayerColor === 'white'){
        if (positionedBlackPieces >= 0) {
            rightBoardCircles[positionedBlackPieces-1-blackRemoved].style.backgroundColor = 'black';
        }  
        blackRemoved++;
    }
    console.log(positionedBlackPieces);
    if (currentPlayerColor === 'black'){
        if (positionedWhitePieces >= 0) {
            leftBoardCircles[positionedWhitePieces-1-whiteRemoved].style.backgroundColor = 'white';
        }  
        whiteRemoved++;
    }
    console.log(positionedBlackPieces);
}

// Função para atualizar a cor dos circulos disponíveis na fase de place, na left-board ou na right-board
function updateSideBoard() {
    if (currentPlayerColor === 'white'){
        // Verifica se o número de peças brancas já atingiu o máximo (9 círculos)
        if (positionedBlackPieces <= NUMBER_OF_PIECES_PER_PLAYER) {
            // Altera a cor do próximo círculo para branco
            rightBoardCircles[positionedBlackPieces-1].style.backgroundColor = 'rgb(177, 177, 177)';
        }  
    }
    if (currentPlayerColor === 'black'){
        // Verifica se o número de peças brancas já atingiu o máximo (9 círculos)
        if (positionedWhitePieces <= NUMBER_OF_PIECES_PER_PLAYER) {
            // Altera a cor do próximo círculo para branco
            leftBoardCircles[positionedWhitePieces-1].style.backgroundColor = 'rgb(177, 177, 177)';
        }  
    }
}

// controls the navigation between pages
function switchPage(from_id, to_id, childs=[]) {
	let from_doc = document.getElementById(from_id);
    let to_doc = document.getElementById(to_id);
    childs.forEach(child => {
        console.log(child);
        // Display the child
        // Get the current display property of the child
        let child_doc = document.getElementById(child);

        if (child_doc.style.display == "")
            child_doc.style.display = "block";
        else
            child_doc.style.display = '';
    });
	from_doc.style.display = "none";
	to_doc.style.display = "flex";
}


//------------------------------------------------Minimax----------------------------------------------------
function botMove(difficulty) {
    if (difficulty === 'easy') {
        return randomMove();
    } else {
        const depth = difficulty === 'medium' ? 2 : 4;
        return minimax(boardState, depth, true, -Infinity, Infinity).move;
    }
}

function getLegalMoves(color, phase) {
    const legalMoves = [];
    if(!phase) {
        boardPieceCircles.forEach(circle => {
            if (circle.getAttribute('occupied') === 'false') {
                legalMoves.push({position: getCoordinatesFromCircle(circle) });
            }
        });
    } else {
        boardPieceCircles.forEach(circle => {
            if (circle.style.backgroundColor === color) {
                const adjCircles = getAdjacentBoardPieceCircles(circle);
                adjCircles.forEach(adjCircle => {
                    if (adjCircle.getAttribute('occupied') === 'false') {
                        legalMoves.push({from: getCoordinatesFromCircle(circle), to: getCoordinatesFromCircle(adjCircle) });
                    }
                });
            }
        });
    }
    return legalMoves;
}

function minimax(boardState, depth, isMaximizingPlayer, alpha, beta) {
    if (depth === 0 || isGameOver()) {
        return { score: evaluateBoard() };
    }

    let bestMove;
    if (isMaximizingPlayer) {
        let maxEval = -Infinity;
        getLegalMoves(currentPlayerColor, positionedWhitePieces + positionedBlackPieces < TOTAL_NUMBER_OF_PIECES).forEach(move => {
            makeMove(move);
            const eval = minimax(boardState, depth - 1, false, alpha, beta).score;
            undoMove(move);
            if (eval > maxEval) {
                maxEval = eval;
                bestMove = move;
            }
            alpha = Math.max(alpha, eval);
            if (beta <= alpha) {
                return; // Alpha-beta pruning
            }
        });
        return { score: maxEval, move: bestMove };
    } else {
        let minEval = Infinity;
        getLegalMoves(adversaryColor, positionedWhitePieces + positionedBlackPieces < TOTAL_NUMBER_OF_PIECES).forEach(move => {
            makeMove(move);
            const eval = minimax(boardState, depth - 1, true, alpha, beta).score;
            undoMove(move);
            if (eval < minEval) {
                minEval = eval;
                bestMove = move;
            }
            beta = Math.min(beta, eval);
            if (beta <= alpha) {
                return; // Alpha-beta pruning
            }
        });
        return { score: minEval, move: bestMove };
    }
}

function evaluateBoard() {
    const pieceCount = { white: currentWhitePieces, black: currentBlackPieces };
    score = (pieceCount['black'] - pieceCount['white']) * 20;
    // Favor creating mills
    score -= whiteMillCount * 50;
    score += blackMillCount * 50;
    console.log(score);
    //return score;
}

function randomMove() {
    console.log("sugos");
    if (positionedWhitePieces + positionedBlackPieces < TOTAL_NUMBER_OF_PIECES) {
        // Placement phase: Get a random empty spot for placing a piece
        const legalMoves = getLegalMoves(currentPlayerColor, false);

        // Select a random legal move and return its position
        const randomIndex = Math.floor(Math.random() * legalMoves.length);
        const selectedPlacement = legalMoves[randomIndex];

        console.log(`Placement move coordinates: ${selectedPlacement.position}`);
        //return selectedPlacement.position;
    }
    else {
        // If in the movement phase, get random moves for a randomly chosen piece
        const legalMoves = getLegalMoves(currentPlayerColor, true);

        // Group legal moves by "from" coordinates (pieces that can move)
        const movesByPiece = {};
        legalMoves.forEach(move => {
            const fromKey = `${move.from.row},${move.from.column}`;
            if (!movesByPiece[fromKey]) {
                movesByPiece[fromKey] = [];
            }
            movesByPiece[fromKey].push(move);
        });

        // Select a random piece that can move
        const pieceKeys = Object.keys(movesByPiece);
        const randomPieceKey = pieceKeys[Math.floor(Math.random() * pieceKeys.length)];
        const randomPieceMoves = movesByPiece[randomPieceKey];

        // Select a random move for the chosen piece
        const selectedMove = randomPieceMoves[Math.floor(Math.random() * randomPieceMoves.length)];
        console.log(selectedMove);
        //return selectedMove;  // Returns an object with 'from' and 'to' coordinates
    }
}

function makeMove(move) {
    if (move.type === 'place') {
        const circle = getCircleFromCoordinates(move.position);
        circle.style.backgroundColor = currentPlayerColor;
        circle.setAttribute('occupied', true);
    } else if (move.type === 'move') {
        const fromCircle = getCircleFromCoordinates(move.from);
        const toCircle = getCircleFromCoordinates(move.to);
        movePiece(fromCircle, toCircle);
    }
}

function undoMove(move) {
    if (move.type === 'place') {
        const circle = getCircleFromCoordinates(move.position);
        cleanPiece(circle);
    } else if (move.type === 'move') {
        const fromCircle = getCircleFromCoordinates(move.from);
        const toCircle = getCircleFromCoordinates(move.to);
        movePiece(toCircle, fromCircle);
    }
}