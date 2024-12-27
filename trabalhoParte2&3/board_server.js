module.exports.board_server = class board_server{
	constructor(square, position, startingPlayer) {
		this.square = square;
		this.position = position;
		this.player = startingPlayer;
		this.putPhase = true; // se estivermos na fase put
		this.winner = 0;
		this.playerPieces = [0, 0]; // contagem das peças de cada jogador
		this.board = this.createBoard(square, position);
	}

	// cria um array 2d para representar o jogo
	createBoard(square,position) {
		let board = [];
		for (let i=0;i<square;i++){
			let line = [];
			for (let j=0;j<position;j++){
				line.push(0);
			}
			board.push(line);
		}
		return board;	
	}

	// o jogador pode colocar aqui um peça ?
	CanPut(sqr, pos) {
		//Check is Empty
		if (this.board[sqr][pos] != 0) {
			return false;
		}
		this.board[sqr][pos] = 0;
		return true;
	}
	
	// coloca a peça do jogador no espaço
	Put(sqr,pos){
		this.board[sqr][pos] = this.player;
		if (this.putPhase){this.playerPieces[this.player-1]++;}
		if (this.playerPieces[0] + this.playerPieces[1] == 18){this.putPhase = false;}
	}

	// o jogador pode selecionar o espaço ?
	canPick(sqr, pos) {
		return this.board[sqr][pos] == this.player;
	}

	// move a peça do jogador
	Move(squareselected,posselected,sqr,pos){
		this.board[sqr][pos] = this.player;
		this.board[squareselected][posselected] = 0;
	}

    
	// este movimento cria uma mill ?
    createsLine(square, position) {
        // verifica para uma linha no mesmo quadrado 
        if (this.checkSameSquareLine(square, position)) {
            return true;
        }
        // verifica para uma linha formado por diferentes quadrados na mesma posição
        if (this.checkSamePositionDifferentSquares(square, position)) {
            return true;
        }
        return false;
    }
    
    checkSameSquareLine(square, position) {
        const adjacentPositions = {
            0: [[1, 2],[7,6]],
            1: [0, 2],
			2: [[3, 4],[1,0]],
			3: [2, 4],
			4: [[3, 2],[5, 6]],
            5: [4, 6],
			6: [[5, 4],[7, 0]], 
            7: [6, 0]
        };
        // verifica se a posição atual forma uma linha com os seus adjacentes
		if (position % 2 == 0){
			const [posA, posB] = adjacentPositions[position][0];
			const [posA1, posB1] = adjacentPositions[position][1];
			if  (this.board[square][position] == this.board[square][posA] && this.board[square][posA] == this.board[square][posB] && this.board[square][position]!=0) {
				return true;
			}
			else if (this.board[square][position] == this.board[square][posA1] && this.board[square][posA1] == this.board[square][posB1] && this.board[square][position]!=0) {
				return true;
			}
		}
		else{
			const [posA, posB] = adjacentPositions[position];
			if  (this.board[square][position] == this.board[square][posA] && this.board[square][posA] == this.board[square][posB] && this.board[square][position]!=0) {
				return true;
			}
		}
		return false;
    }
    
    checkSamePositionDifferentSquares(currentSquare, position) {
        let count = 0; 
        for (let square = 0; square < this.square; square++) {
            if (position % 2 != 0 && this.board[square][position] == this.board[currentSquare][position] &&
                this.board[square][position] != 0) {
                count++;
            }
        }
        return count >= 3; 
    }
    
	// pode o jogador fazer esta jogada ?
	CanMove(squareselected, posselected,sqr,pos) {
		if (this.playerPieces[this.player-1] == 3){
			if (this.CanPut(sqr, pos) == true){
				this.board[squareselected][posselected] = this.player;
				return true;
			}
		}
		if ((sqr == squareselected&& Math.abs(pos - posselected) == 1 ) || (pos == posselected && Math.abs(sqr - squareselected) == 1 && pos%2!=0) || ((sqr==squareselected&& ((posselected==7 && pos==0) || (pos==7 && posselected==0))))) {
			this.board[squareselected][posselected] = 0;
			if (this.CanPut(sqr,pos)){
				this.board[squareselected][posselected] = this.player;
				return true;
			}
			this.board[squareselected][posselected] = this.player;
		}
		return false;
	}

	// pode o jogador remover esta peça ?
	CanRemove(sqr,pos){
		return this.board[sqr][pos] == 3 - this.player;
	}

	// remove uma peça do oponente
	Remove(sqr,pos){
		this.board[sqr][pos] = 0;
		this.playerPieces[2-this.player]--;
	}

	changePlayer(){
		this.player = 3-this.player;
	}

	// o jogador têm algum movimento possível ?
	hasMoves() {
		for (let i = 0; i < this.square; i++) {
			for (let j = 0; j < this.position; j++) {
				if (this.board[i][j] == this.player) {
					if (i > 0) {
						if (this.CanMove(i,j,i-1,j)){
							return true;
						}
					}
					if (i < this.square - 1) {
						if (this.CanMove(i,j,i+1,j)){
							return true;
						}
					}
					if (j > 0) {
						if (this.CanMove(i,j,i,j-1)){
							return true;
						}
					}
					if (j < this.position - 1) {
						if (this.CanMove(i,j,i,j+1)){
							return true;
						}
					}
				}
			}
		}
		return false;
	}

	checkWinner() {
		if (
			this.playerPieces[this.player - 1] <= 2 ||
			!this.hasMoves()
		) {
			this.winner = 3 - this.player;
		}
	}
}

module.exports.copy_2darray = function copy_2darray(array) {
	let copy = [];
	for (let i = 0; i < array.length; i++) {
		copy[i] = array[i].slice();
	}
	return copy;
}