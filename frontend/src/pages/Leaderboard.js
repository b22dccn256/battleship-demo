import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trophy, Medal } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function Leaderboard({ token }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-300" />;
    if (index === 2) return <Medal className="w-6 h-6 text-orange-400" />;
    return <span className="text-white font-bold">{index + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-950 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button data-testid="back-btn" onClick={() => navigate('/lobby')} variant="outline" className="border-white/30 text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: 'Playfair Display, serif' }}>Bảng Xếp Hạng</h1>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Top 10 Người Chơi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {leaderboard.length === 0 ? (
              <p className="text-white text-center py-8">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((player, index) => (
                  <div
                    key={player.username}
                    data-testid={`leaderboard-entry-${index}`}
                    className="flex items-center gap-4 bg-white/10 p-4 rounded-lg hover:bg-white/20 transition-colors"
                  >
                    <div className="w-10 flex items-center justify-center">
                      {getRankIcon(index)}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-lg">{player.username}</p>
                      <p className="text-blue-200 text-sm">
                        {player.games_played} trận | Tỷ lệ thắng: {player.win_rate}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{player.wins} thắng</p>
                      <p className="text-red-400 text-sm">{player.losses} thua</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}