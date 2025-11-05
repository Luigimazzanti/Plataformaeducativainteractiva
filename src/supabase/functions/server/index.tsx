import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use('*', logger(console.log));
app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], exposeHeaders: ["Content-Length"], maxAge: 600 }));

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const bucketName = 'make-05c2b65f-files';

// Initialize bucket on first use instead of at startup
let bucketInitialized = false;
async function ensureBucket() {
  if (!bucketInitialized) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some(b => b.name === bucketName)) {
        await supabase.storage.createBucket(bucketName, { public: false });
      }
      bucketInitialized = true;
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }
}

app.get("/make-server-05c2b65f/health", (c) => c.json({ status: "ok" }));

app.post("/make-server-05c2b65f/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password || !name || !role) return c.json({ error: 'Missing fields' }, 400);
    if (role !== 'teacher' && role !== 'student') return c.json({ error: 'Invalid role' }, 400);
    
    const { data, error } = await supabase.auth.admin.createUser({ email, password, user_metadata: { name, role }, email_confirm: true });
    if (error) return c.json({ error: error.message }, 400);
    
    await kv.set(`user:${data.user.id}`, { id: data.user.id, email, name, role, createdAt: new Date().toISOString() });
    if (role === 'student') await kv.set(`student:${data.user.id}:assignments`, []);
    
    return c.json({ user: data.user });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/user", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) return c.json({ error: 'No token' }, 401);
    
    // Check if admin token
    if (token.startsWith('admin_')) {
      return c.json({ 
        user: { 
          id: 'admin', 
          email: 'admin@educonnect.com', 
          name: 'Administrator', 
          role: 'admin' 
        } 
      });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData || user });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.put("/make-server-05c2b65f/user/profile", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const updates = await c.req.json();
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) return c.json({ error: 'User not found' }, 404);
    
    const updated = { ...userData, ...updates };
    await kv.set(`user:${user.id}`, updated);
    return c.json({ user: updated });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/assignments", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const assignment = await c.req.json();
    const id = `assignment:${Date.now()}`;
    const newAssignment = { id, ...assignment, teacherId: user.id, teacherName: userData.name, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    
    await kv.set(id, newAssignment);
    const list = await kv.get(`teacher:${user.id}:assignments`) || [];
    list.push(id);
    await kv.set(`teacher:${user.id}:assignments`, list);
    
    return c.json({ assignment: newAssignment });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/assignments", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role === 'teacher') {
      const ids = await kv.get(`teacher:${user.id}:assignments`) || [];
      const assignments = await kv.mget(ids);
      return c.json({ assignments: assignments.filter(a => a) });
    } else {
      const all = await kv.getByPrefix('assignment:');
      const assigned = [];
      for (const a of all) {
        if (!a) continue;
        const students = await kv.get(`${a.id}:assignedStudents`) || [];
        if (students.includes(user.id)) assigned.push(a);
      }
      return c.json({ assignments: assigned });
    }
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/assignments/:id", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const assignment = await kv.get(c.req.param('id'));
    if (!assignment) return c.json({ error: 'Not found' }, 404);
    return c.json({ assignment });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.put("/make-server-05c2b65f/assignments/:id", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const existing = await kv.get(id);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.teacherId !== user.id) return c.json({ error: 'Not your assignment' }, 403);
    
    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(id, updated);
    return c.json({ assignment: updated });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.delete("/make-server-05c2b65f/assignments/:id", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const assignment = await kv.get(id);
    if (!assignment) return c.json({ error: 'Not found' }, 404);
    if (assignment.teacherId !== user.id) return c.json({ error: 'Not your assignment' }, 403);
    
    await kv.del(id);
    const list = await kv.get(`teacher:${user.id}:assignments`) || [];
    await kv.set(`teacher:${user.id}:assignments`, list.filter(i => i !== id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/submissions", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'student') return c.json({ error: 'Students only' }, 403);
    
    const submission = await c.req.json();
    const id = `submission:${Date.now()}`;
    const newSub = { id, ...submission, studentId: user.id, studentName: userData.name, submittedAt: new Date().toISOString(), status: 'submitted', grade: null, feedback: null };
    
    await kv.set(id, newSub);
    const key = `assignment:${submission.assignmentId}:submissions`;
    const subs = await kv.get(key) || [];
    subs.push(id);
    await kv.set(key, subs);
    return c.json({ submission: newSub });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/assignments/:id/submissions", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const key = `assignment:${c.req.param('id')}:submissions`;
    const ids = await kv.get(key) || [];
    const submissions = await kv.mget(ids);
    return c.json({ submissions: submissions.filter(s => s) });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.put("/make-server-05c2b65f/submissions/:id/grade", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const submission = await kv.get(id);
    if (!submission) return c.json({ error: 'Not found' }, 404);
    
    const { grade, feedback } = await c.req.json();
    const updated = { ...submission, grade, feedback, gradedAt: new Date().toISOString(), gradedBy: user.id, status: 'graded' };
    await kv.set(id, updated);
    return c.json({ submission: updated });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/my-submissions", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const all = await kv.getByPrefix('submission:');
    return c.json({ submissions: all.filter(s => s && s.studentId === user.id) });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/upload", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    await ensureBucket();
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    if (!file) return c.json({ error: 'No file' }, 400);
    
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data, error: uploadError } = await supabase.storage.from(bucketName).upload(fileName, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (uploadError) return c.json({ error: uploadError.message }, 400);
    
    const { data: urlData } = await supabase.storage.from(bucketName).createSignedUrl(fileName, 31536000);
    return c.json({ path: fileName, url: urlData?.signedUrl, name: file.name, type: file.type, size: file.size });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/students", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const all = await kv.getByPrefix('user:');
    const students = all.filter(u => u && u.role === 'student');
    const myIds = await kv.get(`teacher:${user.id}:students`) || [];
    return c.json({ students: students.map(s => ({ ...s, isAssignedToMe: myIds.includes(s.id) })) });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/assign-student", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const { studentId, assign } = await c.req.json();
    if (!studentId) return c.json({ error: 'Missing studentId' }, 400);
    
    const list = await kv.get(`teacher:${user.id}:students`) || [];
    if (assign) {
      if (!list.includes(studentId)) {
        list.push(studentId);
        await kv.set(`teacher:${user.id}:students`, list);
      }
      await kv.set(`student:${studentId}:teacher`, user.id);
    } else {
      await kv.set(`teacher:${user.id}:students`, list.filter(id => id !== studentId));
      const teacher = await kv.get(`student:${studentId}:teacher`);
      if (teacher === user.id) await kv.del(`student:${studentId}:teacher`);
    }
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/my-students", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const ids = await kv.get(`teacher:${user.id}:students`) || [];
    const students = await kv.mget(ids.map(id => `user:${id}`));
    return c.json({ students: students.filter(s => s) });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/assign-task", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const { assignmentId, studentIds } = await c.req.json();
    if (!assignmentId) return c.json({ error: 'Missing assignmentId' }, 400);
    
    const assignment = await kv.get(assignmentId);
    if (!assignment || assignment.teacherId !== user.id) return c.json({ error: 'Not found' }, 403);
    
    await kv.set(`${assignmentId}:assignedStudents`, studentIds || []);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/assignments/:id/assigned-students", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (token?.startsWith('admin_')) {
      const id = c.req.param('id');
      const ids = await kv.get(`${id}:assignedStudents`) || [];
      const students = await kv.mget(ids.map(i => `user:${i}`));
      return c.json({ students: students.filter(s => s), studentIds: ids });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const ids = await kv.get(`${id}:assignedStudents`) || [];
    const students = await kv.mget(ids.map(i => `user:${i}`));
    return c.json({ students: students.filter(s => s), studentIds: ids });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

// Admin endpoints
app.get("/make-server-05c2b65f/admin/users", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token?.startsWith('admin_')) return c.json({ error: 'Admin only' }, 403);
    
    const all = await kv.getByPrefix('user:');
    return c.json({ users: all.filter(u => u) });
  } catch (error) {
    console.error('Error getting users:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/admin/assign-teacher", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token?.startsWith('admin_')) return c.json({ error: 'Admin only' }, 403);
    
    const { teacherId, studentId } = await c.req.json();
    if (!teacherId || !studentId) return c.json({ error: 'Missing fields' }, 400);
    
    const teacherStudents = await kv.get(`teacher:${teacherId}:students`) || [];
    if (!teacherStudents.includes(studentId)) {
      teacherStudents.push(studentId);
      await kv.set(`teacher:${teacherId}:students`, teacherStudents);
    }
    
    await kv.set(`student:${studentId}:teacher`, teacherId);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error assigning teacher:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/admin/unassign-teacher", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token?.startsWith('admin_')) return c.json({ error: 'Admin only' }, 403);
    
    const { teacherId, studentId } = await c.req.json();
    if (!teacherId || !studentId) return c.json({ error: 'Missing fields' }, 400);
    
    const teacherStudents = await kv.get(`teacher:${teacherId}:students`) || [];
    await kv.set(`teacher:${teacherId}:students`, teacherStudents.filter(id => id !== studentId));
    
    const currentTeacher = await kv.get(`student:${studentId}:teacher`);
    if (currentTeacher === teacherId) {
      await kv.del(`student:${studentId}:teacher`);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error unassigning teacher:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.delete("/make-server-05c2b65f/admin/users/:userId", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token?.startsWith('admin_')) return c.json({ error: 'Admin only' }, 403);
    
    const userId = c.req.param('userId');
    
    // Delete user data
    await kv.del(`user:${userId}`);
    await kv.del(`teacher:${userId}:students`);
    await kv.del(`teacher:${userId}:assignments`);
    await kv.del(`student:${userId}:teacher`);
    await kv.del(`student:${userId}:assignments`);
    
    // Delete from Supabase Auth
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.error('Error deleting user from auth:', error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/admin/users/:userId/block", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token?.startsWith('admin_')) return c.json({ error: 'Admin only' }, 403);
    
    const userId = c.req.param('userId');
    const { blocked } = await c.req.json();
    
    const userData = await kv.get(`user:${userId}`);
    if (!userData) return c.json({ error: 'User not found' }, 404);
    
    const updated = { ...userData, blocked };
    await kv.set(`user:${userId}`, updated);
    
    // Update in Supabase Auth metadata
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { ...userData, blocked }
    });
    
    if (error) {
      console.error('Error updating user in auth:', error);
    }
    
    return c.json({ user: updated });
  } catch (error) {
    console.error('Error blocking user:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

// Notes/Materials endpoints
app.post("/make-server-05c2b65f/notes", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      console.error('No token provided for POST /notes');
      return c.json({ error: 'No token provided' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Auth error in POST /notes:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.error('User data not found for:', user.id);
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (userData.role !== 'teacher') {
      return c.json({ error: 'Teachers only' }, 403);
    }
    
    const note = await c.req.json();
    const id = `note:${Date.now()}`;
    const newNote = { 
      id, 
      ...note, 
      teacherId: user.id, 
      teacherName: userData.name, 
      createdAt: new Date().toISOString(), 
      updatedAt: new Date().toISOString() 
    };
    
    await kv.set(id, newNote);
    const list = await kv.get(`teacher:${user.id}:notes`) || [];
    list.push(id);
    await kv.set(`teacher:${user.id}:notes`, list);
    
    return c.json({ note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

app.get("/make-server-05c2b65f/notes", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      console.error('No token provided for /notes');
      return c.json({ error: 'No token provided' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Auth error in /notes:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (!userData) {
      console.error('User data not found for:', user.id);
      return c.json({ error: 'User not found' }, 404);
    }
    
    if (userData.role === 'teacher') {
      const ids = await kv.get(`teacher:${user.id}:notes`) || [];
      const notes = await kv.mget(ids);
      return c.json({ notes: notes.filter(n => n) });
    } else {
      const all = await kv.getByPrefix('note:');
      const assigned = [];
      for (const n of all) {
        if (!n) continue;
        const students = await kv.get(`${n.id}:assignedStudents`) || [];
        if (students.includes(user.id)) {
          const status = await kv.get(`${n.id}:student:${user.id}:status`) || 'new';
          assigned.push({ ...n, status });
        }
      }
      return c.json({ notes: assigned });
    }
  } catch (error) {
    console.error('Error in /notes:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

app.delete("/make-server-05c2b65f/notes/:id", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const note = await kv.get(id);
    if (!note) return c.json({ error: 'Not found' }, 404);
    if (note.teacherId !== user.id) return c.json({ error: 'Not your note' }, 403);
    
    await kv.del(id);
    const list = await kv.get(`teacher:${user.id}:notes`) || [];
    await kv.set(`teacher:${user.id}:notes`, list.filter(i => i !== id));
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/assign-note", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const { noteId, studentIds } = await c.req.json();
    if (!noteId) return c.json({ error: 'Missing noteId' }, 400);
    
    const note = await kv.get(noteId);
    if (!note || note.teacherId !== user.id) return c.json({ error: 'Not found' }, 403);
    
    await kv.set(`${noteId}:assignedStudents`, studentIds || []);
    
    // Set initial status for all assigned students
    for (const studentId of studentIds || []) {
      await kv.set(`${noteId}:student:${studentId}:status`, 'new');
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/notes/:id/mark-read", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    await kv.set(`${id}:student:${user.id}:status`, 'read');
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/notes/:id/mark-opened", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const currentStatus = await kv.get(`${id}:student:${user.id}:status`);
    
    // Only change from 'new' to 'unread', don't overwrite 'read'
    if (currentStatus === 'new') {
      await kv.set(`${id}:student:${user.id}:status`, 'unread');
    }
    
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/notes/:id/assigned-students", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const id = c.req.param('id');
    const ids = await kv.get(`${id}:assignedStudents`) || [];
    const students = await kv.mget(ids.map(i => `user:${i}`));
    return c.json({ students: students.filter(s => s), studentIds: ids });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

// AI Task Generation endpoints
app.post("/make-server-05c2b65f/ai/generate-task", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    if (!token) {
      console.error('No token provided for AI task generation');
      return c.json({ error: 'No token provided' }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.error('Auth error in AI task generation:', error);
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const contentData = await c.req.json();
    const { type, content, fileUrl, videoUrl, spanishLevel, difficulty } = contentData;
    
    console.log('AI task generation request:', { type, spanishLevel, difficulty });
    
    // Get OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiKey) {
      console.error('OpenAI API key not configured');
      return c.json({ error: 'OpenAI API key not configured' }, 500);
    }
    
    // Build difficulty and language level instructions
    const difficultyText = difficulty === 'easy' ? 'fácil (preguntas básicas y directas)' :
                          difficulty === 'hard' ? 'difícil (preguntas complejas y de análisis profundo)' :
                          'normal (equilibrio entre preguntas básicas y analíticas)';
    
    const spanishLevelText = spanishLevel === 'A1-A2' ? 'nivel básico de español (A1-A2), con vocabulario simple y oraciones cortas' :
                            spanishLevel === 'B1-B2' ? 'nivel intermedio de español (B1-B2), con vocabulario moderado y estructuras gramaticales variadas' :
                            spanishLevel === 'C1-C2' ? 'nivel avanzado de español (C1-C2), con vocabulario sofisticado y estructuras complejas' :
                            'nivel estándar de español';
    
    let prompt = '';
    let messages: any[] = [];
    
    if (type === 'text') {
      prompt = `Eres un asistente educativo experto. Analiza el siguiente contenido y genera una tarea educativa estructurada.

IMPORTANTE - Requisitos de dificultad y nivel de español:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Contenido:
${content}

Genera una tarea que incluya:
1. Un título descriptivo y atractivo (adaptado al nivel de español especificado)
2. Una descripción clara de los objetivos de aprendizaje (adaptada al nivel de español)
3. Entre 5-10 preguntas variadas con la dificultad especificada que incluyan:
   - Preguntas de opción múltiple (4 opciones cada una)
   - Preguntas de verdadero/falso
   - Preguntas de respuesta corta
   - Al menos una pregunta de desarrollo/ensayo

IMPORTANTE: Todas las preguntas, opciones y textos deben estar en ${spanishLevelText}.

Formato de respuesta JSON:
{
  "title": "Título de la tarea",
  "description": "Descripción de los objetivos",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|essay",
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"], // solo para multiple-choice
      "correctAnswer": "Respuesta correcta", // para multiple-choice, true-false, short-answer
      "points": 10
    }
  ]
}`;

      messages = [
        { role: 'system', content: 'Eres un asistente educativo experto que genera tareas educativas estructuradas. Siempre respondes en formato JSON válido.' },
        { role: 'user', content: prompt }
      ];
    } else if (type === 'image') {
      messages = [
        { 
          role: 'system', 
          content: 'Eres un asistente educativo experto que analiza imágenes y genera tareas educativas. Siempre respondes en formato JSON válido.' 
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analiza esta imagen educativa y genera una tarea.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea que incluya:
1. Un título descriptivo (adaptado al nivel de español)
2. Una descripción de los objetivos (adaptada al nivel de español)
3. Entre 5-10 preguntas basadas en el contenido visual con la dificultad especificada

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Título",
  "description": "Descripción",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`
            },
            {
              type: 'image_url',
              image_url: { url: fileUrl }
            }
          ]
        }
      ];
    } else if (type === 'video') {
      prompt = `Eres un asistente educativo experto. Analiza el siguiente video educativo (URL: ${videoUrl}) y genera una tarea.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea que incluya:
1. Un título relacionado con el contenido del video (adaptado al nivel de español)
2. Una descripción de los objetivos de aprendizaje (adaptada al nivel de español)
3. Entre 5-10 preguntas sobre el contenido del video con la dificultad especificada

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Título de la tarea",
  "description": "Descripción",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`;

      messages = [
        { role: 'system', content: 'Eres un asistente educativo experto. Siempre respondes en formato JSON válido.' },
        { role: 'user', content: prompt }
      ];
    } else if (type === 'pdf') {
      prompt = `Eres un asistente educativo experto. Se ha cargado un documento PDF educativo.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea educativa que incluya:
1. Un título apropiado (adaptado al nivel de español)
2. Una descripción de objetivos de aprendizaje (adaptada al nivel de español)
3. Entre 5-10 preguntas variadas con la dificultad especificada

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Tarea del Documento",
  "description": "Análisis y comprensión del documento",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`;

      messages = [
        { role: 'system', content: 'Eres un asistente educativo experto. Siempre respondes en formato JSON válido.' },
        { role: 'user', content: prompt }
      ];
    }
    
    // Call OpenAI API
    console.log('Calling OpenAI API...');
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: type === 'image' ? 'gpt-4o' : 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' }
      })
    });
    
    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}));
      console.error('OpenAI API error:', { status: openaiResponse.status, error: errorData });
      
      // Provide more helpful error messages
      let errorMessage = errorData.error?.message || openaiResponse.statusText || 'Error desconocido';
      
      if (openaiResponse.status === 401) {
        errorMessage = 'API key de OpenAI inválida. Verifica que la clave esté configurada correctamente en Supabase.';
      } else if (openaiResponse.status === 429) {
        errorMessage = 'Límite de tasa excedido. Has alcanzado el límite de solicitudes o tu cuenta de OpenAI no tiene créditos.';
      } else if (openaiResponse.status === 500) {
        errorMessage = 'Error del servidor de OpenAI. Intenta de nuevo en unos momentos.';
      }
      
      return c.json({ 
        error: `Error de OpenAI: ${errorMessage}` 
      }, openaiResponse.status);
    }
    
    const result = await openaiResponse.json();
    console.log('OpenAI response received successfully');
    
    const taskData = JSON.parse(result.choices[0].message.content);
    
    // Add metadata that only teacher sees
    taskData.metadata = {
      spanishLevel: spanishLevel || 'standard',
      difficulty: difficulty || 'normal',
      generatedBy: 'AI',
      generatedAt: new Date().toISOString()
    };
    
    return c.json({ task: taskData });
  } catch (error) {
    console.error('Error generating task with AI:', error);
    return c.json({ error: `Error del servidor: ${error.message}` }, 500);
  }
});

app.post("/make-server-05c2b65f/ai/generate-task-pdf", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const task = await c.req.json();
    
    await ensureBucket();
    
    // Generate a simple text-based PDF content
    let pdfContent = `${task.title}\n\n`;
    pdfContent += `${task.description}\n\n`;
    pdfContent += `${'='.repeat(60)}\n\n`;
    
    task.questions.forEach((q: any, idx: number) => {
      pdfContent += `${idx + 1}. ${q.question}\n`;
      if (q.type === 'multiple-choice' && q.options) {
        q.options.forEach((opt: string, optIdx: number) => {
          pdfContent += `   ${String.fromCharCode(65 + optIdx)}. ${opt}\n`;
        });
      }
      if (q.points) {
        pdfContent += `   Puntos: ${q.points}\n`;
      }
      pdfContent += '\n';
    });
    
    // Create a simple text file (in production, you'd want to use a proper PDF library)
    const fileName = `${user.id}/${Date.now()}-task.txt`;
    const encoder = new TextEncoder();
    const data = encoder.encode(pdfContent);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, data, { 
        contentType: 'text/plain',
        upsert: false 
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return c.json({ error: uploadError.message }, 400);
    }
    
    const { data: urlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 31536000);
    
    return c.json({ 
      path: fileName, 
      url: urlData?.signedUrl,
      fileName: `${task.title}.txt`
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return c.json({ error: `Server error: ${error.message}` }, 500);
  }
});

// PDF Annotation endpoints
app.get("/make-server-05c2b65f/pdf-annotations/:assignmentId", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const assignmentId = c.req.param('assignmentId');
    const key = `pdf-annotations:${user.id}:${assignmentId}`;
    const annotations = await kv.get(key);
    
    return c.json({ annotations: annotations || [] });
  } catch (error) {
    console.error('Error loading PDF annotations:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/pdf-annotations/:assignmentId", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const assignmentId = c.req.param('assignmentId');
    const { annotations } = await c.req.json();
    
    const key = `pdf-annotations:${user.id}:${assignmentId}`;
    await kv.set(key, annotations);
    
    return c.json({ success: true, annotations });
  } catch (error) {
    console.error('Error saving PDF annotations:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/pdf-submit/:assignmentId", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const assignmentId = c.req.param('assignmentId');
    
    // Get assignment
    const assignment = await kv.get(assignmentId);
    if (!assignment) return c.json({ error: 'Assignment not found' }, 404);
    
    // Get user's annotations
    const annotationsKey = `pdf-annotations:${user.id}:${assignmentId}`;
    const annotations = await kv.get(annotationsKey) || [];
    
    // For now, we'll import the original PDF and create a data URL with annotations
    // In a full production system, you would use pdf-lib to merge annotations into PDF
    // This is a simplified version that stores the annotation data with the submission
    
    const submissionId = `submission:${Date.now()}`;
    const userData = await kv.get(`user:${user.id}`);
    const submission = {
      id: submissionId,
      assignmentId: assignment.id,
      studentId: user.id,
      studentName: userData?.name || 'Unknown',
      content: JSON.stringify({
        type: 'pdf-annotated',
        originalPdfUrl: assignment.files?.[0]?.url || '',
        annotations: annotations,
        submittedAt: new Date().toISOString()
      }),
      submittedAt: new Date().toISOString(),
      grade: null,
      feedback: null,
    };
    
    await kv.set(submissionId, submission);
    
    // Add to assignment submissions
    const submissionList = await kv.get(`${assignment.id}:submissions`) || [];
    submissionList.push(submissionId);
    await kv.set(`${assignment.id}:submissions`, submissionList);
    
    // Add to student's submissions
    const studentSubmissions = await kv.get(`student:${user.id}:submissions`) || [];
    studentSubmissions.push(submissionId);
    await kv.set(`student:${user.id}:submissions`, studentSubmissions);
    
    return c.json({ 
      success: true, 
      submission,
      message: 'PDF assignment submitted successfully with annotations' 
    });
  } catch (error) {
    console.error('Error submitting PDF assignment:', error);
    return c.json({ error: 'Server error: ' + error.message }, 500);
  }
});

app.get("/make-server-05c2b65f/pdf-flattened/:submissionId", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return c.json({ error: 'Unauthorized' }, 401);
    
    const submissionId = c.req.param('submissionId');
    const submission = await kv.get(submissionId);
    
    if (!submission) return c.json({ error: 'Submission not found' }, 404);
    
    // Parse submission content
    let submissionData;
    try {
      submissionData = JSON.parse(submission.content);
    } catch (e) {
      return c.json({ error: 'Invalid submission data' }, 400);
    }
    
    // Return the original PDF URL and annotations
    // The frontend will handle rendering them together
    return c.json({
      pdfUrl: submissionData.originalPdfUrl,
      annotations: submissionData.annotations || [],
      submittedAt: submissionData.submittedAt
    });
  } catch (error) {
    console.error('Error getting flattened PDF:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

Deno.serve(app.fetch);
