import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameRoomService } from './game-room.service';
import { SessionsInterface } from './interfaces/session.interface';
import { playersInterface } from './interfaces/players.interface';
import { GameRoomStatus } from './enums/game-room-status.enum';
import { ROOM_MAX_PLAYERS, ROOM_MIN_PLAYERS } from 'src/constants';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { JwtService } from '@nestjs/jwt';
import packOfCards from './cards/pack-of-cards';
import { PlayersService } from 'src/players/players.service';
import { UpdatePlayerDto } from 'src/players/dto/update-player.dto';
import { CreateGameStateDto } from 'src/game-states/dto/create-game-state.dto';
import { GameStatesService } from 'src/game-states/game-states.service';
import { UpdateGameStateDto } from 'src/game-states/dto/update-game-state.dto';
import { playerCardsCountInterface } from './interfaces/player-cards-count.interface';
import { playerTurnOrderInterface } from './interfaces/player-turn-order.interface';
import { UpdateGameRoomDto } from './dto/update-game-room.dto';
import { Player } from 'src/players/entities/player.entity';

@WebSocketGateway({
  namespace: 'game-room',
  cors: process.env.CLIENT_URL,
  transports: ['websocket'],
})
export class GameRoomGateway {
  @WebSocketServer()
  server: Server;
  private readonly sessions = new Map<string, SessionsInterface>();

  constructor(
    private readonly gameRoomService: GameRoomService,
    private readonly playerService: PlayersService,
    private readonly gameStatesService: GameStatesService,
    private readonly jwtService: JwtService,
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);

    const player = await this.gameRoomService.GetSessionPlayer(result);
    const playerCards: playerCardsCountInterface[] = [];
    let handCards: string[] = [];
    let discardPile: string = '';
    let playableCards: string[] = [];
    let otherPlayers: playerCardsCountInterface[] = [];
    let turnOrder: playerTurnOrderInterface[] = [];
    let orderedPlayers: playerCardsCountInterface[] = [];
    let direction: boolean = true;
    let pause: boolean = false;
    let vote: boolean = false;

    if (player.gameRoom !== null) {
      const isCreator = player.gameRoom.fk_creator_player_id === result.userId;
      const isInProgress = player.gameRoom.status === GameRoomStatus.InProgress;

      if (!this.sessions.has(player.gameRoom.code)) {
        const sessionPlayer: playersInterface = {
          id: client.id,
          isCreator: isCreator,
          username: player.username,
          handCards: player.hand_cards,
        };

        this.sessions.set(player.gameRoom.code, {
          status: player.gameRoom.status,
          players: [sessionPlayer],
        });
      } else {
        const sessionPlayer: playersInterface = {
          id: client.id,
          isCreator: isCreator,
          username: player.username,
        };
        if (!this.sessions.get(player.gameRoom.code).players.includes(sessionPlayer)) {
          sessionPlayer.handCards = player.hand_cards;
          this.sessions.get(player.gameRoom.code).players.push(sessionPlayer);
        }
      }

      const session = this.sessions.get(player.gameRoom.code);

      session.players.forEach(thisPlayer => {
        let playerHand: string[] = player.gameRoom.players.find(
          (player) => player.username === thisPlayer.username,
        ).hand_cards;

        if (playerHand) {
          thisPlayer.handCards = playerHand;

          playerCards.push({
            username: thisPlayer.username,
            cardsCount: playerHand.length,
          });
        }
      });

      if (isInProgress) {
        const gameState = await this.gameStatesService.findOneByGameRoomId(
          player.fk_game_room_id,
        );

        discardPile = gameState.discard_pile.shift();
        turnOrder = gameState.turn_order;
        handCards = player.hand_cards;
        direction = gameState.is_forward_direction;
        pause = player.gameRoom.players.length !== session.players.length;
        vote = pause && player.gameRoom.players.length > ROOM_MIN_PLAYERS;
      }

      session.players.forEach(thisPlayer => {
        if (player.hand_cards) {
          playableCards = this.gameRoomService.getPlayableCards(
            thisPlayer.handCards,
            discardPile,
          );
          otherPlayers = playerCards.filter(
            (player) => player.username !== thisPlayer.username,
          );
          orderedPlayers = isInProgress
            ? this.gameRoomService.getOrderedPlayers(
                turnOrder,
                thisPlayer.username,
                otherPlayers,
              )
            : otherPlayers;
        }

        const joinResponse = {
          status: 'success',
          code: player.gameRoom.code,
          players: this.sessions.get(player.gameRoom.code).players.map(thisPlayer => ({ username: thisPlayer.username, isCreator: thisPlayer.isCreator })),
          joined: true,
          started: isInProgress,
          hand_cards: thisPlayer.handCards,
          played_card: discardPile,
          player_cards: orderedPlayers,
          playable_cards: playableCards,
          turnOrder: turnOrder,
          direction: direction,
          pause: pause,
          vote: vote,
        };

        if (client.id === thisPlayer.id) {
          client.emit('join-response', joinResponse);
        } else {
          client.to(thisPlayer.id).emit('join-response', joinResponse);
        }
      });
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);

    const player = await this.gameRoomService.GetSessionPlayer(result);

    if (player.gameRoom !== null) {
      if (this.sessions.has(player.gameRoom.code)) {
        const session = this.sessions.get(player.gameRoom.code);
        const isInProgress =
          player.gameRoom.status === GameRoomStatus.InProgress;

        session.players.forEach((thisPlayer, index) => {
          if (thisPlayer.username === player.username) {
            session.players.splice(index, 1);
          }
        });

        if (session.players.length === 0) {
          this.sessions.delete(player.gameRoom.code);
        } else {
          if (isInProgress) {
            const playerSession: any = {
              players: this.sessions.get(player.gameRoom.code).players,
              pause: true,
            };
            if (session.players.length === 1) {
              playerSession.vote = false;
            } else {
              playerSession.vote = true;
            }

            session.players.forEach(thisPlayer => {
              client.to(thisPlayer.id).emit('pause', playerSession);
            });
          }

          session.players.forEach(thisPlayer => {
            client.to(thisPlayer.id).emit('leave-response', {
              players: this.sessions.get(player.gameRoom.code).players,
            });
          });
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('create')
  async handleCreateGameRoom(
    client: Socket,
    data: { playerId: number },
  ): Promise<void> {
    const { playerId } = data;
    const { gameRoom, player } = await this.gameRoomService.create(playerId);
    const sessionPlayer: playersInterface = {
      id: client.id,
      isCreator: true,
      username: player.username,
    };

    if (!this.sessions.has(gameRoom.code)) {
      this.sessions.set(gameRoom.code, {
        status: gameRoom.status,
        players: [sessionPlayer],
      });

      client.emit('create-response', {
        message: 'Game room created',
        players: this.sessions.get(gameRoom.code).players,
        code: gameRoom.code,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('join')
  async handleJoinGameRoom(
    client: Socket,
    data: { code: string; playerId: number },
  ): Promise<void> {
    const { code, playerId } = data;

    if (!this.sessions.has(code)) {
      client.emit('join-response', {
        status: 'error',
        message: 'No game room found with this code!',
      });
      return;
    }

    const session = this.sessions.get(code);

    if (session.status !== GameRoomStatus.Open) {
      client.emit('join-response', {
        status: 'error',
        message: 'This game room has already started!',
      });
      return;
    }

    if (session.players.length === ROOM_MAX_PLAYERS) {
      client.emit('join-response', {
        status: 'error',
        message: 'This game room is already full!',
      });
      return;
    }

    const player = await this.gameRoomService.join(code, playerId);

    const sessionPlayer: playersInterface = {
      id: client.id,
      isCreator: false,
      username: player.username,
    };
    const joinResponse = {
      status: 'success',
      code: code,
      players: session.players,
      joined: true,
    };

    session.players.push(sessionPlayer);

    session.players.forEach((player) => {
      client.to(player.id).emit('join-response', joinResponse);
    });

    client.emit('join-response', joinResponse);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leave')
  async handleLeave(client: Socket, data: { code: string; playerId: number }) {
    await this.gameRoomService.leave(data.playerId);

    if (this.sessions.has(data.code)) {
      const session = this.sessions.get(data.code);
      session.players.forEach((thisPlayer, index) => {
        if (thisPlayer.id === client.id) {
          session.players.splice(index, 1);
        }
      });

      if (session.players.length === 0) {
        this.sessions.delete(data.code);
        await this.gameRoomService.delete(data.code);
      } else {
        session.players.forEach(thisPlayer => {
          client.to(thisPlayer.id).emit('leave-response', {
            players: session.players,
          });
        });
      }

      client.emit('leave-response');
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('start')
  async handleGameStart(client: Socket, data: { code: string }) {
    if (this.sessions.has(data.code)) {
      const session = this.sessions.get(data.code);
      const shuffleDeck: string[] = [
        ...packOfCards.sort(() => Math.random() - 0.5),
      ];
      const discardPile: string[] = [];
      const cardsToSkip: string[] = ['changeColorW', 'draw4W'];
      const playerCards: playerCardsCountInterface[] = [];

      const turnOrder: playerTurnOrderInterface[] = [...session.players]
        .sort(() => Math.random() - 0.5)
        .map((player, index) => ({
          username: player.username,
          isPlayerTurn: index === 0,
          hasDrawnThisTurn: false,
        }));

      session.players.forEach(thisPlayer => {
        let playerHand: string[] = [];

        for (let i = 0; i < 7; i++) {
          const drawnCard = shuffleDeck.pop();
          playerHand.push(drawnCard);
        }

        const updatedPlayer: UpdatePlayerDto = { hand_cards: playerHand };
        this.playerService.updateByUsername(thisPlayer.username, updatedPlayer);
        thisPlayer.handCards = playerHand;
        playerCards.push({
          username: thisPlayer.username,
          cardsCount: playerHand.length,
        });
      });

      let firstCardPlayed = shuffleDeck.pop();
      discardPile.push(firstCardPlayed);

      // Prevent beginnnig with a special card (without color)
      while (cardsToSkip.includes(firstCardPlayed)) {
        shuffleDeck.unshift(discardPile.pop());
        firstCardPlayed = shuffleDeck.pop();
        discardPile.push(firstCardPlayed);
      }

      // Set session game data
      session.deck = shuffleDeck;
      session.discardPile = discardPile;

      const player = await this.playerService.findOneByUsername(
        turnOrder[0].username,
      );

      const createGameStateDto: CreateGameStateDto = {
        fk_game_room_id: player.fk_game_room_id,
        deck: shuffleDeck,
        discard_pile: discardPile,
        turn_order: turnOrder,
        is_forward_direction: true,
      };

      this.gameStatesService.create(createGameStateDto);
      this.gameRoomService.start(data.code);

      session.players.forEach(thisPlayer => {
        const playableCards = this.gameRoomService.getPlayableCards(
          thisPlayer.handCards,
          firstCardPlayed,
        );

        const otherPlayers = playerCards.filter(
          (player) => player.username !== thisPlayer.username,
        );
        const orderedPlayers = this.gameRoomService.getOrderedPlayers(
          turnOrder,
          thisPlayer.username,
          otherPlayers,
        );

        const playerSession = {
          started: true,
          hand_cards: thisPlayer.handCards,
          played_card: firstCardPlayed,
          player_cards: orderedPlayers,
          playable_cards: playableCards,
          turnOrder: turnOrder,
          direction: true,
        };

        if (client.id === thisPlayer.id) {
          client.emit('start-response', playerSession);
        } else {
          client.to(thisPlayer.id).emit('start-response', playerSession);
        }
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('play-card')
  async handlePlayCard(client: Socket, data: { card: string }): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);
    const player = await this.gameRoomService.GetSessionPlayer(result);

    if (player.gameRoom !== null) {
      const session = this.sessions.get(player.gameRoom.code);
      const gameState = await this.gameStatesService.findOneByGameRoomId(
        player.gameRoom.id,
      );

      if (gameState) {
        const isPlayerTurn = gameState.turn_order.some(
          thisPlayer => thisPlayer.username === player.username && thisPlayer.isPlayerTurn
        );

        if (isPlayerTurn) {
          let topCard = gameState.discard_pile[0];
          let playedCard = data.card;

          if (this.gameRoomService.getPlayableCard(data.card, topCard)) {
            const cardEffect = this.gameRoomService.getCardEffect(data.card);

            const currentPlayerIndex = gameState.turn_order.findIndex(
              (player) => player.isPlayerTurn,
            );
            let nextPlayerIndex = this.gameRoomService.getNextPlayerIndex(
              currentPlayerIndex,
              gameState,
            );

            const switchPlayerTurn = (
              currentIndex: number,
              nextIndex: number,
            ): void => {
              gameState.turn_order[currentIndex].isPlayerTurn = false;
              gameState.turn_order[currentIndex].hasDrawnThisTurn = false;
              gameState.turn_order[nextIndex].isPlayerTurn = true;
              gameState.turn_order[nextIndex].hasDrawnThisTurn = false;
            };

            switch (cardEffect) {
              case this.gameRoomService.changeColor:
                switchPlayerTurn(currentPlayerIndex, nextPlayerIndex);
                break;

              case this.gameRoomService.reverseTurnOrder:
                gameState.is_forward_direction =
                  !gameState.is_forward_direction;
                nextPlayerIndex = this.gameRoomService.getNextPlayerIndex(
                  currentPlayerIndex,
                  gameState,
                );
                switchPlayerTurn(currentPlayerIndex, nextPlayerIndex);
                break;

              case this.gameRoomService.skipTurn:
                const afterSkippedPlayerIndex =
                  this.gameRoomService.getNextPlayerIndex(
                    nextPlayerIndex,
                    gameState,
                  );
                switchPlayerTurn(currentPlayerIndex, afterSkippedPlayerIndex);
                break;

              case this.gameRoomService.drawTwo:
                const drawTwoCards = this.gameRoomService.getDrawedCards(
                  2,
                  gameState,
                );
                const playerDrawTwo =
                  await this.playerService.findOneByUsername(
                    gameState.turn_order[nextPlayerIndex].username,
                  );
                playerDrawTwo.hand_cards.push(...drawTwoCards);
                const newPlayerDrawTwo =
                  await this.playerService.updateByUsername(
                    playerDrawTwo.username,
                    playerDrawTwo,
                  );
                const afterDrawTwoPlayerIndex =
                  this.gameRoomService.getNextPlayerIndex(
                    nextPlayerIndex,
                    gameState,
                  );
                session.players.find(
                  thisPlayer =>
                    thisPlayer.username === newPlayerDrawTwo.username,
                ).handCards = newPlayerDrawTwo.hand_cards;
                switchPlayerTurn(currentPlayerIndex, afterDrawTwoPlayerIndex);
                break;

              case this.gameRoomService.drawFour:
                const drawFourCards = this.gameRoomService.getDrawedCards(
                  4,
                  gameState,
                );
                const playerDrawFour =
                  await this.playerService.findOneByUsername(
                    gameState.turn_order[nextPlayerIndex].username,
                  );
                playerDrawFour.hand_cards.push(...drawFourCards);
                const newPlayerDrawFour =
                  await this.playerService.updateByUsername(
                    playerDrawFour.username,
                    playerDrawFour,
                  );
                await this.playerService.update(
                  playerDrawFour.id,
                  playerDrawFour,
                );
                session.players.find(thisPlayer =>
                    thisPlayer.username === newPlayerDrawFour.username,
                ).handCards = newPlayerDrawFour.hand_cards;
                switchPlayerTurn(currentPlayerIndex, nextPlayerIndex);
                break;

              case this.gameRoomService.default:
                switchPlayerTurn(currentPlayerIndex, nextPlayerIndex);
                break;
            }

            gameState.discard_pile.unshift(data.card);

            if (['changeColor', 'draw4'].includes(data.card.slice(0, -1))) {
              playedCard = data.card.slice(0, -1) + 'W';
            }

            const cardToRemoveIndex = player.hand_cards.indexOf(playedCard);

            if (cardToRemoveIndex !== -1) {
              player.hand_cards.splice(cardToRemoveIndex, 1);
            }

            const updateGameStateDto: UpdateGameStateDto = {
              discard_pile: gameState.discard_pile,
              turn_order: gameState.turn_order,
              deck: gameState.deck,
              is_forward_direction: gameState.is_forward_direction,
            };

            const updatePlayerDto: UpdatePlayerDto = {
              hand_cards: player.hand_cards,
            };

            const newGameState = await this.gameStatesService.update(
              gameState.id,
              updateGameStateDto,
            );
            const newPlayerState = await this.playerService.updateByUsername(
              player.username,
              updatePlayerDto,
            );

            if (newPlayerState.hand_cards.length === 0) {
              session.status = GameRoomStatus.Open;
              const updateGameRoomDto: UpdateGameRoomDto = {
                status: GameRoomStatus.Open,
              };

              await this.gameRoomService.update(
                player.gameRoom.id,
                updateGameRoomDto,
              );
              await this.gameStatesService.delete(newGameState.id);

              session.players.forEach(async thisPlayer => {
                const updatePlayerDto: UpdatePlayerDto = {
                  hand_cards: null,
                };

                await this.playerService.updateByUsername(
                  thisPlayer.username,
                  updatePlayerDto,
                );

                if (thisPlayer.id === client.id) {
                  client.emit('game-result', { message: 'You win' });
                } else {
                  client
                    .to(thisPlayer.id)
                    .emit('game-result', {
                      message: 'You lose',
                      winner: player.username,
                    });
                }
              });
            }

            session.players.find(
              (player) => player.username === newPlayerState.username,
            ).handCards = newPlayerState.hand_cards;

            session.players.forEach(thisPlayer => {
              if (newGameState && newPlayerState) {
                const playableCards = this.gameRoomService.getPlayableCards(
                  thisPlayer.handCards,
                  newGameState.discard_pile[0],
                );
                let otherPlayers = session.players.map((otherPlayer) => ({
                  username: otherPlayer.username,
                  cardsCount: otherPlayer.handCards.length,
                }));
                otherPlayers = otherPlayers.filter(
                  (player) => player.username !== thisPlayer.username,
                );
                let orderedPlayers = this.gameRoomService.getOrderedPlayers(
                  newGameState.turn_order,
                  thisPlayer.username,
                  otherPlayers,
                );

                let playerSession: any = {
                  played_card: data.card,
                  turnOrder: newGameState.turn_order,
                  playable_cards: playableCards,
                  player_cards: orderedPlayers,
                  direction: newGameState.is_forward_direction,
                };

                if (client.id === thisPlayer.id) {
                  playerSession.hand_cards = newPlayerState.hand_cards;

                  client.emit('play-card-response', playerSession);
                } else {
                  playerSession.hand_cards = thisPlayer.handCards;
                  client
                    .to(thisPlayer.id)
                    .emit('play-card-response', playerSession);
                }
              }
            });
          }
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('draw-card')
  async handleDrawCard(client: Socket): Promise<void> {
    const token = client.handshake.auth.token;
    const result = this.jwtService.decode(token);
    const player = await this.gameRoomService.GetSessionPlayer(result);

    if (player.gameRoom !== null) {
      const session = this.sessions.get(player.gameRoom.code);
      const gameState = await this.gameStatesService.findOneByGameRoomId(
        player.gameRoom.id,
      );
      let newGameState;

      if (gameState) {
        const playerTurnOrderIndex = gameState.turn_order.findIndex(
          thisPlayer =>
            thisPlayer.username === player.username && thisPlayer.isPlayerTurn,
        );
        if (playerTurnOrderIndex !== -1) {
          const playerTurnOrder = gameState.turn_order[playerTurnOrderIndex];
          let topCard = gameState.discard_pile[0];

          if (
            playerTurnOrder.isPlayerTurn &&
            !playerTurnOrder.hasDrawnThisTurn
          ) {
            gameState.turn_order[playerTurnOrderIndex].hasDrawnThisTurn = true;

            const drawnCard = gameState.deck.pop();

            const newPlayerHand = [...player.hand_cards];
            newPlayerHand.push(drawnCard);

            const updatePlayerDto: UpdatePlayerDto = {
              hand_cards: newPlayerHand,
            };

            const newPlayer = await this.playerService.updateByUsername(
              player.username,
              updatePlayerDto,
            );
            const playableCards = this.gameRoomService.getPlayableCards(
              newPlayer.hand_cards,
              topCard,
            );

            if (playableCards.length === 0) {
              gameState.turn_order[playerTurnOrderIndex].hasDrawnThisTurn =
                false;
              const currentPlayerIndex = gameState.turn_order.findIndex(
                (player) => player.isPlayerTurn,
              );
              const nextPlayerIndex = this.gameRoomService.getNextPlayerIndex(
                currentPlayerIndex,
                gameState,
              );

              gameState.turn_order[currentPlayerIndex].isPlayerTurn = false;
              gameState.turn_order[nextPlayerIndex].isPlayerTurn = true;
            }

            if (gameState.deck.length === 0) {
              const newDeck = [...gameState.discard_pile];
              const newDiscardPile = [topCard];

              newDeck.shift();
              newDeck.sort(() => Math.random() - 0.5);

              const updateGameStateDto: UpdateGameStateDto = {
                deck: newDeck,
                discard_pile: newDiscardPile,
                turn_order: gameState.turn_order,
              };

              newGameState = await this.gameStatesService.update(
                gameState.id,
                updateGameStateDto,
              );
            } else {
              const updateGameStateDto: UpdateGameStateDto = {
                deck: gameState.deck,
                turn_order: gameState.turn_order,
              };

              newGameState = await this.gameStatesService.update(
                gameState.id,
                updateGameStateDto,
              );
            }

            session.players.find(
              (player) => player.username === newPlayer.username,
            ).handCards = newPlayer.hand_cards;

            session.players.forEach(thisPlayer => {
              if (newPlayer) {
                let otherPlayers = session.players.map((otherPlayer) => ({
                  username: otherPlayer.username,
                  cardsCount: otherPlayer.handCards.length,
                }));
                otherPlayers = otherPlayers.filter(
                  (player) => player.username !== thisPlayer.username,
                );
                let orderedPlayers = this.gameRoomService.getOrderedPlayers(
                  newGameState.turn_order,
                  thisPlayer.username,
                  otherPlayers,
                );

                let playerSession: any = {
                  player_cards: orderedPlayers,
                  turnOrder: newGameState.turn_order,
                  direction: gameState.is_forward_direction,
                };

                if (client.id === thisPlayer.id) {
                  playerSession.hand_cards = newPlayer.hand_cards;
                  playerSession.playable_cards = playableCards;

                  client.emit('draw-card-response', playerSession);
                } else {
                  client
                    .to(thisPlayer.id)
                    .emit('draw-card-response', playerSession);
                }
              }
            });
          }
        }
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('vote')
  async handleVote(client: Socket, data: { code: string, vote: string }): Promise<void> {
    if (this.sessions.has(data.code)) {
      const voteResponse: any = {};
      const session = this.sessions.get(data.code);
      const player = session.players.find(thisPlayer => thisPlayer.id === client.id);

      if (!session.voteResult) {
        session.voteResult = {
          resume: 0,
          wait: 0,
        };
      }

      switch (data.vote) {
        case 'resume':
          if (!player.hasVotedFor) {
            session.voteResult.resume++;
          } else if (player.hasVotedFor !== 'resume') {
            session.voteResult.wait--;
            session.voteResult.resume++;
          }
          break;

        case 'wait':
          if (!player.hasVotedFor) {
            session.voteResult.wait++;
          } else if (player.hasVotedFor !== 'wait') {
            session.voteResult.resume--;
            session.voteResult.wait++;
          }
          break;
      }

      player.hasVotedFor = data.vote;

      const numberOfVotes: number = session.voteResult.resume + session.voteResult.wait;

      voteResponse.voteResult = session.voteResult;
  
      session.players.forEach(thisPlayer => {
        if (client.id === thisPlayer.id) {
          client.emit('vote-response', voteResponse);
        } else {
          client.to(thisPlayer.id).emit('vote-response', voteResponse);
        }
      });

      console.log(voteResponse);

      if (numberOfVotes === session.players.length) {
        if (session.voteResult.resume > session.voteResult.wait) {
          const players = await this.gameRoomService.getPlayers(data.code);
          const gameState = await this.gameStatesService.findOneByGameRoomId(players[0].fk_game_room_id);
          const missingPlayersCards = [];
          let otherPlayers: playerCardsCountInterface[] = [];
          let orderedPlayers: playerCardsCountInterface[] = [];
          
          const missingPlayers: Player[] = players.filter(thisPlayer => !session.players.some(remainingPlayer => remainingPlayer.username === thisPlayer.username));
          const isMissingPlayersTurn = missingPlayers.filter(thisPlayer => gameState.turn_order.some(remainingPlayer => remainingPlayer.username === thisPlayer.username && remainingPlayer.isPlayerTurn));
          const updatePlayerDto: UpdatePlayerDto = {
            fk_game_room_id: null,
            hand_cards: null,
          };

          session.voteResult = { resume: 0, wait: 0 };

          if (isMissingPlayersTurn.length > 0) {
            const currentPlayerIndex = gameState.turn_order.findIndex(
              thisPlayer => thisPlayer.username === isMissingPlayersTurn[0].username,
            );
            let nextPlayerIndex = this.gameRoomService.getNextPlayerIndex(
              currentPlayerIndex,
              gameState,
            );

            const switchPlayerTurn = (
              currentIndex: number,
              nextIndex: number,
            ): void => {
              gameState.turn_order[currentIndex].isPlayerTurn = false;
              gameState.turn_order[currentIndex].hasDrawnThisTurn = false;
              gameState.turn_order[nextIndex].isPlayerTurn = true;
              gameState.turn_order[nextIndex].hasDrawnThisTurn = false;
            };

            switchPlayerTurn(currentPlayerIndex, nextPlayerIndex);
          }

          missingPlayers.forEach(async missingPlayer => {
            const missingPlayerIndex = gameState.turn_order.findIndex(thisPlayer => thisPlayer.username === missingPlayer.username);
            gameState.turn_order.splice(missingPlayerIndex, 1);
            missingPlayersCards.push(...missingPlayer.hand_cards);
            await this.playerService.update(missingPlayer.id, updatePlayerDto);
          });

          gameState.deck.push(...missingPlayersCards);

          const updateGameStateDto: UpdateGameStateDto = {
            deck: gameState.deck,
            turn_order: gameState.turn_order,
          };

          const newGameState = await this.gameStatesService.update(gameState.id, updateGameStateDto);
          const playerCards: playerCardsCountInterface[] = [];

          session.players.forEach(thisPlayer => {
            playerCards.push({
              username: thisPlayer.username,
              cardsCount: thisPlayer.handCards.length,
            });
          });

          voteResponse.turnOrder = newGameState.turn_order;
          voteResponse.players = session.players.map(thisPlayer => ({ username: thisPlayer.username, isCreator: thisPlayer.isCreator }));
          voteResponse.pause = false;
          voteResponse.vote = false;
          voteResponse.voteResult = { resume: 0, wait: 0 };

          session.players.forEach(thisPlayer => {
            thisPlayer.hasVotedFor = undefined;
            otherPlayers = playerCards.filter(
              (player) => player.username !== thisPlayer.username,
            );
            orderedPlayers = session.players.length > 2
              ? this.gameRoomService.getOrderedPlayers(
                  newGameState.turn_order,
                  thisPlayer.username,
                  otherPlayers,
                )
              : otherPlayers;
            
            voteResponse.playerCards = orderedPlayers;

            if (client.id === thisPlayer.id) {
              client.emit('vote-response', voteResponse);
            } else {
              client.to(thisPlayer.id).emit('vote-response', voteResponse);
            }
          });
        }
      }
    }
  }
}
