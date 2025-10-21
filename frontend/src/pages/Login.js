import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { GraduationCap, BookOpen } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    const initDemoData = async () => {
      try {
        await axios.post(`${API}/init-demo-data`);
      } catch (error) {
        console.log("Demo data init:", error.response?.data?.message || "Ready");
      } finally {
        setInitLoading(false);
      }
    };
    initDemoData();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, {
        email,
        password,
      });

      toast.success("Login successful!");
      onLogin(response.data.user);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role) => {
    if (role === "teacher") {
      setEmail("teacher@aiml.edu");
      setPassword("teacher");
    } else {
      setEmail("rahul@student.edu");
      setPassword("student");
    }
  };

  if (initLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Initializing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-white/95 shadow-2xl" data-testid="login-card">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-4 rounded-2xl">
              <GraduationCap className="w-12 h-12 text-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            AI/ML Department
          </CardTitle>
          <CardDescription className="text-base">
            Student Marks Dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="email-input"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="password-input"
                className="h-11"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-medium"
              disabled={loading}
              data-testid="login-button"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">Quick Login</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => quickLogin("teacher")}
                className="h-11 border-2 border-blue-200 hover:bg-blue-50"
                data-testid="teacher-quick-login"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Teacher
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickLogin("student")}
                className="h-11 border-2 border-cyan-200 hover:bg-cyan-50"
                data-testid="student-quick-login"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Student
              </Button>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-800 text-center">
              <strong>Demo Credentials:</strong><br />
              Teacher: teacher@aiml.edu / teacher<br />
              Student: rahul@student.edu / student
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;