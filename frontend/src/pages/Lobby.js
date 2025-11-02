import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogOut, Plus, Users, Trophy, History as HistoryIcon } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const WS_URL = BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export default function Lobby({ token, user, onLogout }) {
  const [roomCode, setRoomCode] = useState('');
  const [ws, setWs] = useState(null);
  const navigate = useNavigate();
  const wsRef = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [token]);

  const connectWebSocket = () => {
    const websocket = new WebSocket(`${WS_URL}/ws/${token}`);
    
    websocket.onopen = () => {
      console.log('WebSocket connected');
      setWs(websocket);
      wsRef.current = websocket;
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'room_created') {
        toast.success(`Phòng đã tạo: ${data.room_code}`);
        navigate(`/game/${data.room_code}`);
      } else if (data.type === 'error') {
        toast.error(data.message);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Lỗi kết nối WebSocket');
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setWs(null);
    };
  };

  const createRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'create_room' }));
    } else {
      toast.error('Chưa kết nối đến server');
    }
  };

  const joinRoom = () => {
    if (!roomCode) {
      toast.error('Vui lòng nhập mã phòng');
      return;
    }
    navigate(`/game/${roomCode.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>Phòng Chờ</h1>
            {user && (
              <p className="text-blue-200" data-testid="user-info">
                Chào mừng, <span className="font-semibold text-cyan-400">{user.username}</span> | 
                Thắng: {user.wins} | Thua: {user.losses}
              </p>
            )}
          </div>
          <Button data-testid="logout-btn" onClick={onLogout} variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <LogOut className="w-4 h-4 mr-2" />
            Đăng Xuất
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Tạo Phòng Mới
              </CardTitle>
              <CardDescription className="text-blue-200">Tạo phòng và mời bạn bè</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                data-testid="create-room-btn"
                onClick={createRoom}
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
              >
                Tạo Phòng
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5" />
                Tham Gia Phòng
              </CardTitle>
              <CardDescription className="text-blue-200">Nhập mã phòng để tham gia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                data-testid="room-code-input"
                type="text"
                placeholder="Nhập mã phòng (VD: ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
              />
              <Button
                data-testid="join-room-btn"
                onClick={joinRoom}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              >
                Tham Gia
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card
            data-testid="leaderboard-card"
            className="bg-white/10 backdrop-blur-md border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => navigate('/leaderboard')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Bảng Xếp Hạng
              </CardTitle>
              <CardDescription className="text-blue-200">Xem top người chơi</CardDescription>
            </CardHeader>
          </Card>

          <Card
            data-testid="history-card"
            className="bg-white/10 backdrop-blur-md border-white/20 cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => navigate('/history')}
          >
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <HistoryIcon className="w-5 h-5 text-blue-400" />
                Lịch Sử Trận Đấu
              </CardTitle>
              <CardDescription className="text-blue-200">Xem các trận đấu đã chơi</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}