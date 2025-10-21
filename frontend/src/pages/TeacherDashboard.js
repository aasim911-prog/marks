import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus, Trash2, Edit, BookOpen, Users } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TeacherDashboard = ({ user, onLogout }) => {
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(1);
  const [showSubjectDialog, setShowSubjectDialog] = useState(false);
  const [showMarksDialog, setShowMarksDialog] = useState(false);
  const [editingMarks, setEditingMarks] = useState(null);
  
  const [newSubject, setNewSubject] = useState({
    name: "",
    code: "",
    credits: 4,
    semester: 1
  });

  const [marksData, setMarksData] = useState({
    student_id: "",
    subject_id: "",
    internal1: 0,
    internal2: 0,
    internal3: 0,
    final_exam: 0,
    semester: 1
  });

  useEffect(() => {
    fetchSubjects();
    fetchStudents();
  }, [selectedSemester]);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get(`${API}/subjects?semester=${selectedSemester}`);
      setSubjects(response.data);
    } catch (error) {
      toast.error("Failed to fetch subjects");
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`${API}/users?role=student`);
      setStudents(response.data);
    } catch (error) {
      toast.error("Failed to fetch students");
    }
  };

  const handleAddSubject = async () => {
    try {
      await axios.post(`${API}/subjects`, { ...newSubject, semester: selectedSemester });
      toast.success("Subject added successfully");
      setShowSubjectDialog(false);
      setNewSubject({ name: "", code: "", credits: 4, semester: selectedSemester });
      fetchSubjects();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to add subject");
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    
    try {
      await axios.delete(`${API}/subjects/${subjectId}`);
      toast.success("Subject deleted successfully");
      fetchSubjects();
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  const handleUploadMarks = async () => {
    try {
      if (editingMarks) {
        await axios.put(`${API}/marks/${editingMarks.id}`, {
          internal1: marksData.internal1,
          internal2: marksData.internal2,
          internal3: marksData.internal3,
          final_exam: marksData.final_exam
        });
        toast.success("Marks updated successfully");
      } else {
        await axios.post(`${API}/marks`, { ...marksData, semester: selectedSemester });
        toast.success("Marks uploaded successfully");
      }
      setShowMarksDialog(false);
      setEditingMarks(null);
      setMarksData({
        student_id: "",
        subject_id: "",
        internal1: 0,
        internal2: 0,
        internal3: 0,
        final_exam: 0,
        semester: selectedSemester
      });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save marks");
    }
  };

  const openEditMarks = async (studentId, subjectId) => {
    try {
      const response = await axios.get(`${API}/marks?student_id=${studentId}`);
      const mark = response.data.find(m => m.subject_id === subjectId);
      
      if (mark) {
        setEditingMarks(mark);
        setMarksData({
          student_id: studentId,
          subject_id: subjectId,
          internal1: mark.internal1,
          internal2: mark.internal2,
          internal3: mark.internal3,
          final_exam: mark.final_exam,
          semester: selectedSemester
        });
        setShowMarksDialog(true);
      } else {
        setMarksData({
          student_id: studentId,
          subject_id: subjectId,
          internal1: 0,
          internal2: 0,
          internal3: 0,
          final_exam: 0,
          semester: selectedSemester
        });
        setShowMarksDialog(true);
      }
    } catch (error) {
      toast.error("Failed to fetch marks");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2" data-testid="dashboard-title">
              Teacher Dashboard
            </h1>
            <p className="text-blue-700">Welcome, {user.name}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2 border-blue-300 hover:bg-blue-50"
            data-testid="logout-button"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>

        {/* Semester Selector */}
        <Card className="mb-6 bg-white shadow-lg border-2 border-blue-100">
          <CardHeader>
            <CardTitle className="text-xl text-blue-900">Select Semester</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedSemester.toString()} onValueChange={(val) => setSelectedSemester(parseInt(val))}>
              <SelectTrigger className="w-64" data-testid="semester-select">
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

        <Tabs defaultValue="subjects" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-white">
            <TabsTrigger value="subjects" className="gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900" data-testid="subjects-tab">
              <BookOpen className="w-4 h-4" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="marks" className="gap-2 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-900" data-testid="marks-tab">
              <Users className="w-4 h-4" />
              Upload Marks
            </TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card className="bg-white shadow-lg border-2 border-blue-100">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-blue-900">Subjects - Semester {selectedSemester}</CardTitle>
                  <CardDescription>Manage subjects for this semester</CardDescription>
                </div>
                <Dialog open={showSubjectDialog} onOpenChange={setShowSubjectDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900" data-testid="add-subject-button">
                      <Plus className="w-4 h-4" />
                      Add Subject
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subject</DialogTitle>
                      <DialogDescription>Enter subject details for Semester {selectedSemester}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label>Subject Name</Label>
                        <Input
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                          placeholder="e.g., Machine Learning"
                          data-testid="subject-name-input"
                        />
                      </div>
                      <div>
                        <Label>Subject Code</Label>
                        <Input
                          value={newSubject.code}
                          onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                          placeholder="e.g., AIML101"
                          data-testid="subject-code-input"
                        />
                      </div>
                      <div>
                        <Label>Credits</Label>
                        <Input
                          type="number"
                          value={newSubject.credits}
                          onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) })}
                          data-testid="subject-credits-input"
                        />
                      </div>
                      <Button onClick={handleAddSubject} className="w-full bg-blue-600 hover:bg-blue-700" data-testid="save-subject-button">
                        Add Subject
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No subjects added yet for this semester</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {subjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg flex justify-between items-center border border-blue-200"
                        data-testid={`subject-card-${subject.code}`}
                      >
                        <div>
                          <h3 className="font-semibold text-lg text-blue-900">{subject.name}</h3>
                          <p className="text-sm text-blue-700">
                            {subject.code} • {subject.credits} Credits
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteSubject(subject.id)}
                          data-testid={`delete-subject-${subject.code}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Marks Tab */}
          <TabsContent value="marks">
            <Card className="bg-white shadow-lg border-2 border-blue-100">
              <CardHeader>
                <CardTitle className="text-blue-900">Upload/Edit Marks - Semester {selectedSemester}</CardTitle>
                <CardDescription>Click on a cell to add or edit marks</CardDescription>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>Please add subjects first</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p>No students found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b-2 border-blue-200">
                          <th className="text-left p-3 font-semibold text-blue-900">Student</th>
                          {subjects.map((subject) => (
                            <th key={subject.id} className="text-center p-3 font-semibold text-blue-900">
                              {subject.code}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-blue-100 hover:bg-blue-50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium text-blue-900">{student.name}</p>
                                <p className="text-sm text-blue-600">{student.roll_number}</p>
                              </div>
                            </td>
                            {subjects.map((subject) => (
                              <td key={subject.id} className="text-center p-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openEditMarks(student.id, subject.id)}
                                  className="gap-2 border-blue-300 hover:bg-blue-100"
                                  data-testid={`edit-marks-${student.roll_number}-${subject.code}`}
                                >
                                  <Edit className="w-3 h-3" />
                                  Edit
                                </Button>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Marks Dialog */}
        <Dialog open={showMarksDialog} onOpenChange={setShowMarksDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMarks ? "Edit Marks" : "Upload Marks"}</DialogTitle>
              <DialogDescription>Enter marks for all assessments</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Internal 1 (out of 40)</Label>
                  <Input
                    type="number"
                    max="40"
                    value={marksData.internal1}
                    onChange={(e) => setMarksData({ ...marksData, internal1: parseFloat(e.target.value) || 0 })}
                    data-testid="internal1-input"
                  />
                </div>
                <div>
                  <Label>Internal 2 (out of 40)</Label>
                  <Input
                    type="number"
                    max="40"
                    value={marksData.internal2}
                    onChange={(e) => setMarksData({ ...marksData, internal2: parseFloat(e.target.value) || 0 })}
                    data-testid="internal2-input"
                  />
                </div>
                <div>
                  <Label>Internal 3 (out of 40)</Label>
                  <Input
                    type="number"
                    max="40"
                    value={marksData.internal3}
                    onChange={(e) => setMarksData({ ...marksData, internal3: parseFloat(e.target.value) || 0 })}
                    data-testid="internal3-input"
                  />
                </div>
                <div>
                  <Label>Final Exam (out of 100)</Label>
                  <Input
                    type="number"
                    max="100"
                    value={marksData.final_exam}
                    onChange={(e) => setMarksData({ ...marksData, final_exam: parseFloat(e.target.value) || 0 })}
                    data-testid="final-exam-input"
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Best 2 of 3 internal marks will be considered for total calculation
                </p>
              </div>
              <Button onClick={handleUploadMarks} className="w-full bg-blue-600 hover:bg-blue-700" data-testid="save-marks-button">
                {editingMarks ? "Update Marks" : "Upload Marks"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default TeacherDashboard;