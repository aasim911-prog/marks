import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Award, TrendingUp, BookOpen } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StudentDashboard = ({ user, onLogout }) => {
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [detailedMarks, setDetailedMarks] = useState([]);
  const [performance, setPerformance] = useState({ semesters: [], cgpa: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [marksResponse, performanceResponse] = await Promise.all([
        axios.get(`${API}/detailed-marks/${user.id}`),
        axios.get(`${API}/performance/${user.id}`)
      ]);
      setDetailedMarks(marksResponse.data);
      setPerformance(performanceResponse.data);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const getSemesterMarks = () => {
    return detailedMarks.filter(mark => mark.semester === selectedSemester);
  };

  const getChartData = () => {
    return getSemesterMarks().map(mark => ({
      subject: mark.subject_code,
      "Internal 1": mark.internal1,
      "Internal 2": mark.internal2,
      "Internal 3": mark.internal3,
      "Final Exam": mark.final_exam,
      Total: mark.total
    }));
  };

  const getSGPAChartData = () => {
    return performance.semesters.map(sem => ({
      semester: `Sem ${sem.semester}`,
      SGPA: sem.sgpa
    }));
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 75) return "text-blue-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="text-2xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2" data-testid="student-dashboard-title">
              Student Dashboard
            </h1>
            <p className="text-gray-600">{user.name} • {user.roll_number}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2"
            data-testid="student-logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* CGPA Card */}
        <Card className="mb-6 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-2xl border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-lg mb-2">Overall Performance</p>
                <h2 className="text-6xl font-bold" data-testid="cgpa-value">{performance.cgpa}</h2>
                <p className="text-white/90 text-xl mt-2">CGPA</p>
              </div>
              <div className="bg-white/20 p-6 rounded-full backdrop-blur-sm">
                <Award className="w-16 h-16" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="marks" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="marks" className="gap-2" data-testid="student-marks-tab">
              <BookOpen className="w-4 h-4" />
              My Marks
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2" data-testid="performance-tab">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          {/* Marks Tab */}
          <TabsContent value="marks">
            <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
              <CardHeader>
                <CardTitle>Select Semester</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={selectedSemester.toString()} onValueChange={(val) => setSelectedSemester(parseInt(val))}>
                  <SelectTrigger className="w-64" data-testid="student-semester-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {getSemesterMarks().length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
                <CardContent className="py-12 text-center text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No marks available for this semester</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Subject-wise Marks Table */}
                <Card className="mb-6 bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
                  <CardHeader>
                    <CardTitle>Subject-wise Marks - Semester {selectedSemester}</CardTitle>
                    <CardDescription>Detailed breakdown of your performance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b-2 border-purple-200">
                            <th className="text-left p-3 font-semibold">Subject</th>
                            <th className="text-center p-3 font-semibold">Int-1</th>
                            <th className="text-center p-3 font-semibold">Int-2</th>
                            <th className="text-center p-3 font-semibold">Int-3</th>
                            <th className="text-center p-3 font-semibold">Final</th>
                            <th className="text-center p-3 font-semibold">Total</th>
                            <th className="text-center p-3 font-semibold">%</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getSemesterMarks().map((mark) => {
                            const percentage = ((mark.total / 140) * 100).toFixed(1);
                            return (
                              <tr key={mark.id} className="border-b border-gray-200 hover:bg-purple-50" data-testid={`marks-row-${mark.subject_code}`}>
                                <td className="p-3">
                                  <div>
                                    <p className="font-medium">{mark.subject_name}</p>
                                    <p className="text-sm text-gray-500">{mark.subject_code}</p>
                                  </div>
                                </td>
                                <td className="text-center p-3">{mark.internal1}/40</td>
                                <td className="text-center p-3">{mark.internal2}/40</td>
                                <td className="text-center p-3">{mark.internal3}/40</td>
                                <td className="text-center p-3">{mark.final_exam}/100</td>
                                <td className="text-center p-3 font-semibold">{mark.total}/140</td>
                                <td className={`text-center p-3 font-semibold ${getGradeColor(percentage)}`}>
                                  {percentage}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Bar Chart */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
                  <CardHeader>
                    <CardTitle>Visual Performance - Semester {selectedSemester}</CardTitle>
                    <CardDescription>Subject-wise marks comparison</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={getChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="subject" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            border: "2px solid #e5e7eb"
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Internal 1" fill="#8b5cf6" />
                        <Bar dataKey="Internal 2" fill="#ec4899" />
                        <Bar dataKey="Internal 3" fill="#3b82f6" />
                        <Bar dataKey="Final Exam" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            {performance.semesters.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
                <CardContent className="py-12 text-center text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No performance data available</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* SGPA Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {performance.semesters.map((sem) => (
                    <Card
                      key={sem.semester}
                      className="bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-200 shadow-lg"
                      data-testid={`sgpa-card-sem${sem.semester}`}
                    >
                      <CardContent className="p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Semester {sem.semester}</p>
                        <h3 className="text-4xl font-bold text-purple-700" data-testid={`sgpa-value-sem${sem.semester}`}>{sem.sgpa}</h3>
                        <p className="text-sm text-gray-600 mt-2">SGPA</p>
                        <p className="text-xs text-gray-500 mt-1">{sem.credits} Credits</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* SGPA Trend Chart */}
                <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-2 border-purple-100">
                  <CardHeader>
                    <CardTitle>SGPA Trend</CardTitle>
                    <CardDescription>Your semester-wise performance trend</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={getSGPAChartData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="semester" stroke="#6b7280" />
                        <YAxis domain={[0, 10]} stroke="#6b7280" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            borderRadius: "8px",
                            border: "2px solid #e5e7eb"
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="SGPA"
                          stroke="#8b5cf6"
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", r: 6 }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;