var imports = require('./board_server.js');

module.exports = class game_server{
	constructor(size,positions,game_id,player_1_nick,player_2_nick){
        this.game_id = game_id;
        this.size = size;
        this.positions = positions;
        this.players = {'player 1': player_1_nick};
        this.player_colors = {[player_1_nick]:'blue'};
        this.player_1 = player_1_nick;
        this.player_2 = 0;
		this.startingPlayer=1;
		this.selected = false; // é uma peça selecionada 
		this.remove = false; // pode remover uma peça do adversário
		this.squareselected;
		this.posselected;
        this.board = new imports.board_server(size,positions,this.startingPlayer);
	}

    canDothis(square, position, nick) {
		let player;
    	if (this.players['player 1'] == nick){player=1;}
    	else{player = 2;}
		if (player!=this.board.player){return 'Not your turn to play';}
		if (square<0 || square>=this.squares || position<0 || position>=this.positions || !Number.isInteger(square) || !Number.isInteger(position)){return 'Invalid position';}
    	if (this.board.putPhase){
			if (this.board.board[square][position]!=0)return 'Invalid move: non empty cell';
			if (this.board.CanPut(square,position)){return 'valid';}
		}
		if (!this.selected){
			if (this.board.canPick(square,position)){return 'valid';}
			return 'Not your piece';
		}
		if (!this.remove){
			if (square == this.squareselected && position==this.posselected){return 'valid';}
			if (this.board.board[square][position]!=0)return 'Invalid move: non empty cell';
			if (this.board.CanMove(this.squareselected, this.posselected, square, position)){return 'valid';}
			return 'Invalid move: can only move to neigbouring cells, vertically or horizontally';
		}
		if (this.board.board[square][position]!=3-player)return 'No opponent piece to take';
		return 'valid';
	}

    Dothis(square,position,nick){
		if(this.board.putPhase){this.board.Put(square,position);this.board.changePlayer();return;}
		if(!this.selected){this.Select(square,position);return;}
		if(!this.remove){
			if(square == this.squareselected && position==this.posselected){this.Unselect(square,position);return;}
			this.board.Move(this.squareselected,this.posselected,square,position);
			if (this.board.createsLine(square, position))this.remove=true;
			else{this.board.changePlayer();
				this.selected = false;
				this.board.checkWinner();
			}
			return;
		}
		this.board.Remove(square,position);
		this.board.changePlayer();
		this.selected = false;
		this.remove = false;
		this.board.checkWinner();
    }

    join_player_2(nick){
        this.players['player 2']=nick;
        this.player_colors[[nick]]='red';
        this.player_2 = nick;
    }

    object_to_update(){
        let json = {};
        if (this.board.winner!=0){
            json['winner'] = this.players['player '+this.board.winner];
            let board_json = imports.copy_2darray(this.board.board);
            for (let i=0;i<this.size;i++){
                for(let j=0;j<this.positions;j++){
                    if (board_json[i][j] == 0){board_json[i][j] = 'empty';}
                    else if (board_json[i][j] == 1){board_json[i][j] = 'blue';}
                    else if (board_json[i][j] == 2){board_json[i][j] = 'red';}
                }
            }
            json['board'] = board_json;
            return json;}
        json['turn'] = this.players['player '+this.board.player];
        if (this.board.putPhase){json['phase']='drop';}
        else{json['phase']='move';}
        if (this.selected){
            if (this.remove){json['step']='take';}
            else{json['step']='to';}
        }
        else{json['step']='from';}
        json['players'] = this.player_colors;
        let board_json = imports.copy_2darray(this.board.board);
        for (let i=0;i<this.size;i++){
            for(let j=0;j<this.positions;j++){
                if (board_json[i][j] == 0){board_json[i][j] = 'empty';}
                else if (board_json[i][j] == 1){board_json[i][j] = 'blue';}
                else if (board_json[i][j] == 2){board_json[i][j] = 'red';}
            }
        }
        json['board'] = board_json;
        return json;
    }

	giveUp(nick){
        let player;
		if (this.players['player 1'] == nick){player=1;}
        else{player = 2;}
		this.board.winner = 3-player;
	}

	Select(sqr,pos){
		this.selected = true;
		this.squareselected = sqr;
		this.posselected = pos;
	}
	
	Unselect(sqr,pos){
		this.selected = false;
	}
}
