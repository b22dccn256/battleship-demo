import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Trophy, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function History({ token, user }) {
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button data-testid="back-btn" onClick={() => navigate('/lobby')} variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Lịch Sử Trận Đấu</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">20 Trận Đấu Gần Nhất</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-white text-center py-8">Chưa có lịch sử trận đấu</p>
            ) : (
              <div className="space-y-3">
                {history.map((game, index) => {
                  const isWinner = game.winner === user.username;
                  const opponent = game.player1 === user.username ? game.player2 : game.player1;
                  
                  return (
                    <div
                      key={game.id}
                      data-testid={`history-entry-${index}`}
                      className={`flex items-center gap-4 p-4 rounded-lg ${
                        isWinner ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'
                      }`}
                    >
                      <div className="w-10 flex items-center justify-center">
                        {isWinner ? (
                          <Trophy className="w-6 h-6 text-green-400" />
                        ) : (
                          <X className="w-6 h-6 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {isWinner ? 'Thắng' : 'Thua'} vs {opponent}
                        </p>
                        <p className="text-blue-200 text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatDuration(game.duration_seconds)} | {formatDate(game.finished_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}