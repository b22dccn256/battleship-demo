import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const SHIPS = [
  { name: 'Carrier', size: 5, label: 'Tàu sân bay (5)' },
  { name: 'Battleship', size: 4, label: 'Tàu chiến (4)' },
  { name: 'Cruiser', size: 3, label: 'Tàu tuần dương (3)' },
  { name: 'Submarine', size: 3, label: 'Tàu ngầm (3)' },
  { name: 'Destroyer', size: 2, label: 'Tàu khu trục (2)' }
];

export default function Game({ token, user }) {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const [ws, setWs] = useState(null);
  const [gamePhase, setGamePhase] = useState('placement'); // placement, ready, playing, finished
  const [myBoard, setMyBoard] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [opponentBoard, setOpponentBoard] = useState(Array(10).fill(null).map(() => Array(10).fill(null)));
  const [placedShips, setPlacedShips] = useState([]);
  const [currentShipIndex, setCurrentShipIndex] = useState(0);
  const [isHorizontal, setIsHorizontal] = useState(true);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [players, setPlayers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [myHits, setMyHits] = useState([]);
  const [opponentHits, setOpponentHits] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token, roomCode]);

  const connectWebSocket = () => {
    const websocket = new WebSocket(`${WS_URL}/ws/${token}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
      wsRef.current = websocket;
      websocket.send(JSON.stringify({ type: 'join_room', room_code: roomCode }));
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'player_joined') {
        setPlayers(data.players);
        toast.success('Đối thủ đã tham gia!');
      } else if (data.type === 'player_ready') {
        toast.info(`${data.player} đã sẵn sàng`);
      } else if (data.type === 'game_start') {
        setGamePhase('playing');
        setCurrentTurn(data.current_turn);
        toast.success('Trò chơi bắt đầu!');
      } else if (data.type === 'attack_result') {
        if (data.attacker === user.username) {
          // My attack
          const newBoard = [...opponentBoard];
          newBoard[data.y][data.x] = data.hit ? 'hit' : 'miss';
          setOpponentBoard(newBoard);
          setMyHits([...myHits, { x: data.x, y: data.y, hit: data.hit }]);
          toast.success(data.hit ? 'Trúng đích!' : 'Trượt!');
          if (data.sunk_ship) {
            toast.success(`Đã đánh chìm ${data.sunk_ship}!`);
          }
        } else {
          // Opponent's attack on my board
          const newBoard = [...myBoard];
          if (data.hit) {
            newBoard[data.y][data.x] = 'hit';
          }
          setMyBoard(newBoard);
          setOpponentHits([...opponentHits, { x: data.x, y: data.y, hit: data.hit }]);
        }
        setCurrentTurn(data.current_turn);
      } else if (data.type === 'game_over') {
        setGamePhase('finished');
        if (data.winner === user.username) {
          toast.success('Bạn đã chiến thắng!');
        } else {
          toast.error('Bạn đã thua!');
        }
      } else if (data.type === 'chat') {
        setChatMessages(prev => [...prev, data]);
      } else if (data.type === 'error') {
        toast.error(data.message);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      setWs(null);
    };
  };

  const placeShip = (row, col) => {
    if (currentShipIndex >= SHIPS.length) return;
    
    const ship = SHIPS[currentShipIndex];
    const coords = [];
    
    for (let i = 0; i < ship.size; i++) {
      const r = isHorizontal ? row : row + i;
      const c = isHorizontal ? col + i : col;
      
      if (r >= 10 || c >= 10 || myBoard[r][c]) {
        toast.error('Không thể đặt tàu ở vị trí này');
        return;
      }
      coords.push({ x: c, y: r });
    }
    
    const newBoard = myBoard.map(row => [...row]);
    coords.forEach(({ x, y }) => {
      newBoard[y][x] = ship.name;
    });
    
    setMyBoard(newBoard);
    setPlacedShips([...placedShips, { name: ship.name, coords }]);
    setCurrentShipIndex(currentShipIndex + 1);
    
    if (currentShipIndex + 1 === SHIPS.length) {
      setTimeout(() => confirmPlacement(), 500);
    }
  };

  const confirmPlacement = () => {
    const ships = {};
    placedShips.forEach(ship => {
      ships[ship.name] = { coords: ship.coords.map(c => ({ ...c, hit: false })) };
    });
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'place_ships', ships }));
      setGamePhase('ready');
      toast.success('Đang chờ đối thủ...');
    }
  };

  const attack = (row, col) => {
    if (gamePhase !== 'playing' || currentTurn !== user.username) return;
    if (opponentBoard[row][col]) return;
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'attack', x: col, y: row }));
    }
  };

  const sendChat = () => {
    if (!chatInput.trim() || !ws) return;
    
    ws.send(JSON.stringify({ type: 'chat', message: chatInput }));
    setChatInput('');
  };

  const renderCell = (row, col, isMyBoard) => {
    const board = isMyBoard ? myBoard : opponentBoard;
    const cell = board[row][col];
    
    let bgColor = 'bg-blue-200/30';
    let content = null;
    
    if (isMyBoard) {
      if (typeof cell === 'string' && cell !== 'hit') {
        bgColor = 'bg-gray-400';
      } else if (cell === 'hit') {
        bgColor = 'bg-red-500';
        content = 'X';
      }
    } else {
      if (cell === 'hit') {
        bgColor = 'bg-red-500';
        content = 'X';
      } else if (cell === 'miss') {
        bgColor = 'bg-blue-400';
        content = '•';
      }
    }
    
    return (
      <div
        key={`${row}-${col}`}
        data-testid={`cell-${isMyBoard ? 'my' : 'opp'}-${row}-${col}`}
        className={`${bgColor} border border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors font-bold text-white`}
        onClick={() => isMyBoard && gamePhase === 'placement' ? placeShip(row, col) : !isMyBoard && attack(row, col)}
      >
        {content}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button data-testid="back-to-lobby-btn" onClick={() => navigate('/lobby')} variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div className="text-white text-center">
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Phòng: {roomCode}</h2>
            {gamePhase === 'playing' && (
              <p data-testid="turn-indicator" className="text-sm text-cyan-400">
                {currentTurn === user.username ? 'Lượt của bạn' : 'Lượt đối thủ'}
              </p>
            )}
          </div>
          <div className="w-24" />
        </div>

        {gamePhase === 'placement' && (
          <div className="mb-6 text-center">
            <p className="text-white text-lg mb-2">Đặt tàu của bạn</p>
            {currentShipIndex < SHIPS.length && (
              <div className="space-y-2">
                <p className="text-cyan-400">{SHIPS[currentShipIndex].label}</p>
                <Button
                  data-testid="rotate-ship-btn"
                  onClick={() => setIsHorizontal(!isHorizontal)}
                  className="bg-cyan-500 hover:bg-cyan-600"
                >
                  Xoay: {isHorizontal ? 'Ngang' : 'Dọc'}
                </Button>
              </div>
            )}
          </div>
        )}

        {gamePhase === 'ready' && (
          <div className="text-center text-white mb-6 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <p>Đang chờ đối thủ sẵn sàng...</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                <h3 className="text-white font-semibold mb-3 text-center" data-testid="my-board-title">Bảng Của Bạn</h3>
                <div className="grid grid-cols-10 gap-1 aspect-square">
                  {Array(10).fill(null).map((_, row) =>
                    Array(10).fill(null).map((_, col) => renderCell(row, col, true))
                  )}
                </div>
              </Card>

              <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                <h3 className="text-white font-semibold mb-3 text-center" data-testid="opponent-board-title">Bảng Đối Thủ</h3>
                <div className="grid grid-cols-10 gap-1 aspect-square">
                  {Array(10).fill(null).map((_, row) =>
                    Array(10).fill(null).map((_, col) => renderCell(row, col, false))
                  )}
                </div>
              </Card>
            </div>
          </div>

          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-4 flex flex-col">
            <h3 className="text-white font-semibold mb-3">Chat</h3>
            <div data-testid="chat-messages" className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-96">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="text-sm">
                  <span className="text-cyan-400 font-semibold">{msg.username}: </span>
                  <span className="text-white">{msg.message}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                data-testid="chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Nhập tin nhắn..."
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
              />
              <Button data-testid="send-chat-btn" onClick={sendChat} className="bg-cyan-500 hover:bg-cyan-600">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {gamePhase === 'finished' && (
          <div className="mt-6 text-center">
            <Button data-testid="return-lobby-btn" onClick={() => navigate('/lobby')} className="bg-cyan-500 hover:bg-cyan-600">
              Quay về Phòng Chờ
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}