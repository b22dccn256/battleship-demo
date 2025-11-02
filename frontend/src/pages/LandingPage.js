import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Anchor, Ship, Target, Trophy } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export default function LandingPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (isLogin) => {
    if (!username || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? 'login' : 'register';
      const response = await fetch(`${BACKEND_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isLogin ? 'Đăng nhập thành công!' : 'Đăng ký thành công!');
        onLogin(data.access_token);
      } else {
        toast.error(data.detail || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-8 items-center relative z-10">
        <div className="text-white space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <Anchor className="w-12 h-12 text-cyan-400" />
            <h1 className="text-5xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>BattleShip</h1>
          </div>

          <h2 className="text-3xl font-semibold" style={{ fontFamily: 'Playfair Display, serif' }}>Chiến Thuật Hải Chiến</h2>
          <p className="text-lg text-blue-200" style={{ fontFamily: 'Inter, sans-serif' }}>
            Tham gia trận chiến hải quân đầy kịch tính. Đặt tàu chiến, tấn công đối thủ và trở thành chỉ huy hải quân vĩ đại nhất!
          </p>

          <div className="grid grid-cols-1 gap-4 mt-8">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <Ship className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Đặt Tàu Chiến</h3>
                <p className="text-sm text-blue-200">5 loại tàu với kích thước khác nhau</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <Target className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Tấn Công Đối Thủ</h3>
                <p className="text-sm text-blue-200">Bắn trúng và đánh chìm toàn bộ tàu địch</p>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-sm p-4 rounded-lg">
              <Trophy className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Bảng Xếp Hạng</h3>
                <p className="text-sm text-blue-200">Cạnh tranh với người chơi khác</p>
              </div>
            </div>
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white text-2xl">Bắt Đầu Chơi</CardTitle>
            <CardDescription className="text-blue-200">Đăng nhập hoặc tạo tài khoản mới</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/20">
                <TabsTrigger value="login" data-testid="login-tab">Đăng Nhập</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Đăng Ký</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm">Tên đăng nhập</label>
                  <Input
                    data-testid="login-username"
                    type="text"
                    placeholder="Nhập tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm">Mật khẩu</label>
                  <Input
                    data-testid="login-password"
                    type="password"
                    placeholder="Nhập mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth(true)}
                  />
                </div>
                <Button
                  data-testid="login-submit-btn"
                  onClick={() => handleAuth(true)}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
                </Button>
              </TabsContent>
              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <label className="text-white text-sm">Tên đăng nhập</label>
                  <Input
                    data-testid="register-username"
                    type="text"
                    placeholder="Chọn tên đăng nhập"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white text-sm">Mật khẩu</label>
                  <Input
                    data-testid="register-password"
                    type="password"
                    placeholder="Tạo mật khẩu"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                    onKeyDown={(e) => e.key === 'Enter' && handleAuth(false)}
                  />
                </div>
                <Button
                  data-testid="register-submit-btn"
                  onClick={() => handleAuth(false)}
                  disabled={loading}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                >
                  {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}