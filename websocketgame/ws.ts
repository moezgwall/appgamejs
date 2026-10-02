import {WebSocketServer,WebSocket} from "ws";


const wss = new WebSocketServer({port: 8080});

interface Player{
    id:string;
    x:number;
    y:number;
    color:string;
}
interface MoveMessage {
    type: 'move';
    x: number;
    y:number;
}
interface ChatMessage{
    type: 'chat';
    msg : string;
}

type pEvent = ChatMessage | MoveMessage;

// player is defined by his {id},{this==player}
const players : Record<string,Player> = {}; 

wss.on('connection',(ws:WebSocket)=>{
    const playerId = Math.random().toString(10).substring(1,6);
    players[playerId] = {
        id: playerId,
        x : Math.floor(Math.random() * 1000) + 1,
        y : Math.floor(Math.random() * 1000) + 1, 
        color: '#'+Math.floor(Math.random() * 1251561).toString(16)
    };
    // in the connection phase we send info like id to other 
    // client to inform that who is that player   
     ws.send(JSON.stringify({type:"init",id:playerId}));   
     // track the updates of all the players
      toAll();
        ws.on('message', (data:string)=>{
            // the loop should continue even if there
            // is some sort of any error 
            try{
                const message  = JSON.parse(data.toString()) as pEvent ;
                if (message.type === 'move'){
                    if (players[playerId]){
                        players[playerId].x += message.x;
                        players[playerId].y += message.y;
                        // update those values to all clients (other players)
                        toAll();
                    }
                }
                if (message.type === 'chat'){
                    console.log(`${playerId} : ${message.msg}`);
                }
            
            }catch(err){
                console.error((err as Error).message);
            }
        
         });
        ws.on('close', ()=>{
            console.log(`player : ${playerId} has left the game.`);
            delete players[playerId];
            toAll();
                
            });
        
    });

  function toAll(){
     const payload = JSON.stringify({type: "state", players}); 
     wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN){
                client.send(payload);
            }});
     }

    



