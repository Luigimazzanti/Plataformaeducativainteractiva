import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.ts";

const app = new Hono();
app.use('*', logger(console.log));
app.use("/*", cors({ origin: "*", allowHeaders: ["Content-Type", "Authorization"], allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], exposeHeaders: ["Content-Length"], maxAge: 600 }));

const supabase = createClient(Deno.env.get('SB_URL')!, Deno.env.get('SB_SERVICE_KEY')!);
const bucketName = 'make-05c2b65f-files';

// Demo users data for demo tokens
const demoUsers: Record<string, any> = {
  'demo_token_demo-teacher-1': {
    id: 'demo-teacher-1',
    email: 'teacher@demo.com',
    name: 'Demo Teacher',
    role: 'teacher'
  },
  'demo_token_demo-student-1': {
    id: 'demo-student-1',
    email: 'student@demo.com',
    name: 'Demo Student',
    role: 'student'
  },
  'demo_token_demo-student-2': {
    id: 'demo-student-2',
    email: 'student2@demo.com',
    name: 'Demo Student 2',
    role: 'student'
  }
};

// Helper function to authenticate user (supports both Supabase and demo tokens)
async function authenticateUser(token: string | undefined) {
  if (!token) {
    return { user: null, error: 'No token provided' };
  }
  
  // Check if admin token
  if (token.startsWith('admin_')) {
    return {
      user: {
        id: 'admin',
        email: 'admin@educonnect.com',
        name: 'Administrator',
        role: 'admin'
      },
      error: null
    };
  }
  
  // Check if demo token
  if (token.startsWith('demo_token_')) {
    const demoUser = demoUsers[token];
    if (demoUser) {
      // Ensure demo user exists in KV store
      const kvUser = await kv.get(`user:${demoUser.id}`);
      if (!kvUser) {
        await kv.set(`user:${demoUser.id}`, demoUser);
      }
      return { user: demoUser, error: null };
    }
    return { user: null, error: 'Invalid demo token' };
  }
  
  // Supabase token
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: error?.message || 'Unauthorized' };
  }
  
  return { user, error: null };
}

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

// Initialize demo users and admin in KV store
let demoDataInitialized = false;
async function ensureDemoData() {
  if (!demoDataInitialized) {
    try {
      // Admin user
      const adminExists = await kv.get('user:admin');
      if (!adminExists) {
        await kv.set('user:admin', {
          id: 'admin',
          email: 'admin@educonnect.com',
          name: 'Administrator',
          role: 'admin',
          createdAt: new Date().toISOString()
        });
      }
      
      // Demo teacher
      const teacherExists = await kv.get('user:demo-teacher-1');
      if (!teacherExists) {
        await kv.set('user:demo-teacher-1', {
          id: 'demo-teacher-1',
          email: 'teacher@demo.com',
          name: 'Demo Teacher',
          role: 'teacher',
          createdAt: new Date().toISOString()
        });
      }
      
      // Demo students
      const student1Exists = await kv.get('user:demo-student-1');
      if (!student1Exists) {
        await kv.set('user:demo-student-1', {
          id: 'demo-student-1',
          email: 'student@demo.com',
          name: 'Demo Student',
          role: 'student',
          createdAt: new Date().toISOString()
        });
        await kv.set('student:demo-student-1:assignments', []);
      }
      
      const student2Exists = await kv.get('user:demo-student-2');
      if (!student2Exists) {
        await kv.set('user:demo-student-2', {
          id: 'demo-student-2',
          email: 'student2@demo.com',
          name: 'Demo Student 2',
          role: 'student',
          createdAt: new Date().toISOString()
        });
        await kv.set('student:demo-student-2:assignments', []);
      }
      
      demoDataInitialized = true;
      console.log('Demo data initialized successfully');
    } catch (error) {
      console.error('Error initializing demo data:', error);
    }
  }
}

app.get("/make-server-05c2b65f/health", async (c) => {
  // Initialize demo data on health check (lazy initialization)
  await ensureDemoData();
  return c.json({ status: "ok" });
});

// Login endpoint
app.post("/make-server-05c2b65f/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Missing fields' }, 400);
    
    // Check for admin login (special case)
    if (email === 'admin' && password === 'EduConnect@Admin2024') {
      const adminUser = {
        id: 'admin',
        email: 'admin@educonnect.com',
        name: 'Administrator',
        role: 'admin'
      };
      return c.json({ 
        user: adminUser,
        token: 'admin_token_' + Date.now()
      });
    }
    
    // Check for demo users
    const demoCredentials: Record<string, { password: string, userData: any }> = {
      'teacher@demo.com': {
        password: 'demo123',
        userData: {
          id: 'demo-teacher-1',
          email: 'teacher@demo.com',
          name: 'Demo Teacher',
          role: 'teacher'
        }
      },
      'student@demo.com': {
        password: 'demo123',
        userData: {
          id: 'demo-student-1',
          email: 'student@demo.com',
          name: 'Demo Student',
          role: 'student'
        }
      },
      'student2@demo.com': {
        password: 'demo123',
        userData: {
          id: 'demo-student-2',
          email: 'student2@demo.com',
          name: 'Demo Student 2',
          role: 'student'
        }
      }
    };
    
    // Check if it's a demo user
    if (demoCredentials[email]) {
      if (demoCredentials[email].password === password) {
        const userData = demoCredentials[email].userData;
        return c.json({ 
          user: userData,
          token: `demo_token_${userData.id}`
        });
      } else {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
    }
    
    // Try Supabase Auth for real users
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return c.json({ error: error.message }, 401);
    
    // Get user data from KV store
    const userData = await kv.get(`user:${data.user.id}`);
    
    return c.json({ 
      user: userData || { id: data.user.id, email: data.user.email, ...data.user.user_metadata },
      token: data.session.access_token 
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ error: 'Server error: ' + error.message }, 500);
  }
});

app.post("/make-server-05c2b65f/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();
    if (!email || !password || !name || !role) return c.json({ error: 'Missing fields' }, 400);
    if (role !== 'teacher' && role !== 'student') return c.json({ error: 'Invalid role' }, 400);
    
    const { data, error } = await supabase.auth.admin.createUser({ email, password, user_metadata: { name, role }, email_confirm: true });
    if (error) return c.json({ error: error.message }, 400);
    
    const userData = { id: data.user.id, email, name, role, createdAt: new Date().toISOString() };
    await kv.set(`user:${data.user.id}`, userData);
    if (role === 'student') await kv.set(`student:${data.user.id}:assignments`, []);
    
    // Sign in to get token
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) return c.json({ error: signInError.message }, 400);
    
    return c.json({ user: userData, token: signInData.session.access_token });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.get("/make-server-05c2b65f/user", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData || user });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.put("/make-server-05c2b65f/user/profile", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
    const all = await kv.getByPrefix('submission:');
    return c.json({ submissions: all.filter(s => s && s.studentId === user.id) });
  } catch (error) {
    return c.json({ error: 'Server error' }, 500);
  }
});

app.post("/make-server-05c2b65f/upload", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) {
      console.error('Auth error in POST /notes:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) {
      console.error('Auth error in /notes:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) {
      console.error('Auth error in AI task generation:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const contentData = await c.req.json();
    const { type, content, fileUrl, videoUrl, spanishLevel, difficulty } = contentData;
    
    console.log('AI task generation request:', { type, spanishLevel, difficulty });
    
    // Get Gemini API key
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      console.error('Gemini API key not configured');
      return c.json({ error: 'Gemini API key not configured' }, 500);
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
3. EXACTAMENTE 10 EJERCICIOS VARIADOS con diferentes tipos:
   - 3 preguntas de opción múltiple (4 opciones cada una)
   - 2 preguntas de verdadero/falso
   - 2 preguntas de respuesta corta
   - 2 preguntas de completar espacios (fill-in-blank)
   - 1 pregunta de desarrollo/ensayo

IMPORTANTE: Todas las preguntas, opciones y textos deben estar en ${spanishLevelText}.

Formato de respuesta JSON:
{
  "title": "Título de la tarea",
  "description": "Descripción de los objetivos",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|fill-blank|essay",
      "question": "Texto de la pregunta",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"], // solo para multiple-choice
      "correctAnswer": "Respuesta correcta", // para multiple-choice, true-false, short-answer, fill-blank
      "points": 10
    }
  ]
}`;
    } else if (type === 'image') {
      prompt = `Analiza esta imagen educativa y genera una tarea.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea que incluya:
1. Un título descriptivo (adaptado al nivel de español)
2. Una descripción de los objetivos (adaptada al nivel de español)
3. EXACTAMENTE 10 EJERCICIOS VARIADOS basados en el contenido visual:
   - 3 preguntas de opción múltiple (4 opciones cada una)
   - 2 preguntas de verdadero/falso
   - 2 preguntas de respuesta corta
   - 2 preguntas de completar espacios (fill-in-blank)
   - 1 pregunta de desarrollo/ensayo

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Título",
  "description": "Descripción",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|fill-blank|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`;
    } else if (type === 'video') {
      prompt = `Eres un asistente educativo experto. Analiza el siguiente video educativo (URL: ${videoUrl}) y genera una tarea.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea que incluya:
1. Un título relacionado con el contenido del video (adaptado al nivel de español)
2. Una descripción de los objetivos de aprendizaje (adaptada al nivel de español)
3. EXACTAMENTE 10 EJERCICIOS VARIADOS sobre el contenido del video:
   - 3 preguntas de opción múltiple (4 opciones cada una)
   - 2 preguntas de verdadero/falso
   - 2 preguntas de respuesta corta
   - 2 preguntas de completar espacios (fill-in-blank)
   - 1 pregunta de desarrollo/ensayo

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Título de la tarea",
  "description": "Descripción",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|fill-blank|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`;
    } else if (type === 'pdf') {
      prompt = `Eres un asistente educativo experto. Se ha cargado un documento PDF educativo.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}

Genera una tarea educativa que incluya:
1. Un título apropiado (adaptado al nivel de español)
2. Una descripción de objetivos de aprendizaje (adaptada al nivel de español)
3. EXACTAMENTE 10 EJERCICIOS VARIADOS:
   - 3 preguntas de opción múltiple (4 opciones cada una)
   - 2 preguntas de verdadero/falso
   - 2 preguntas de respuesta corta
   - 2 preguntas de completar espacios (fill-in-blank)
   - 1 pregunta de desarrollo/ensayo

IMPORTANTE: Todas las preguntas y textos deben estar en ${spanishLevelText}.

Formato JSON:
{
  "title": "Tarea del Documento",
  "description": "Análisis y comprensión del documento",
  "questions": [
    {
      "type": "multiple-choice|true-false|short-answer|fill-blank|essay",
      "question": "Pregunta",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "Respuesta",
      "points": 10
    }
  ]
}`;
    }
    
    // Call Gemini API
    console.log('Calling Gemini API...');
    
    // Build the request payload for Gemini
    const geminiPayload: any = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    };
    
    // For images, add inline data (Gemini Flash supports image analysis)
    if (type === 'image' && fileUrl) {
      // Fetch the image and convert to base64
      try {
        const imageResponse = await fetch(fileUrl);
        const imageBlob = await imageResponse.arrayBuffer();
        const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBlob)));
        const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
        
        geminiPayload.contents[0].parts.unshift({
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        });
      } catch (imgError) {
        console.error('Error loading image for Gemini:', imgError);
      }
    }
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload)
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', { status: geminiResponse.status, error: errorData });
      
      // Provide more helpful error messages
      let errorMessage = errorData.error?.message || geminiResponse.statusText || 'Error desconocido';
      
      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        errorMessage = 'API key de Gemini inválida. Verifica que la clave esté configurada correctamente en Supabase.';
      } else if (geminiResponse.status === 429) {
        errorMessage = 'Límite de tasa excedido. Has alcanzado el límite de solicitudes de Gemini.';
      } else if (geminiResponse.status === 500) {
        errorMessage = 'Error del servidor de Gemini. Intenta de nuevo en unos momentos.';
      }
      
      return c.json({ 
        error: `Error de Gemini: ${errorMessage}` 
      }, geminiResponse.status);
    }
    
    const result = await geminiResponse.json();
    console.log('Gemini response received successfully');
    
    if (!result.candidates || result.candidates.length === 0) {
      console.error('Gemini response without candidates:', result);
      return c.json({ error: 'Gemini no generó una respuesta válida' }, 500);
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    const taskData = JSON.parse(responseText);
    
    // Add metadata that only teacher sees
    taskData.metadata = {
      spanishLevel: spanishLevel || 'standard',
      difficulty: difficulty || 'normal',
      generatedBy: 'AI',
      generatedAt: new Date().toISOString()
    };
    
    return c.json({ task: taskData });
  } catch (error: any) {
    console.error('Error generating task with AI:', error);
    return c.json({ error: `Error del servidor: ${error.message}` }, 500);
  }
});

app.post("/make-server-05c2b65f/ai/generate-task-pdf", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
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

// AI Question Generator endpoint
app.post("/make-server-05c2b65f/ai/generate-questions", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) {
      console.error('Auth error in question generation:', error);
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const { text, maxQuestions = 20, includeCompletarBlancos = true } = await c.req.json();
    
    if (!text || text.trim().length < 50) {
      return c.json({ error: 'El texto debe tener al menos 50 caracteres' }, 400);
    }
    
    console.log('Generating questions with Gemini AI for text length:', text.length);
    
    // Get Gemini API key
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiKey) {
      console.error('Gemini API key not configured');
      return c.json({ error: 'La clave de API de Gemini no está configurada' }, 500);
    }
    
    // Build the prompt for Gemini
    const prompt = `Eres un asistente educativo experto especializado en generar preguntas de cuestionario.

Analiza el siguiente texto y genera EXACTAMENTE ${maxQuestions} preguntas educativas de alta calidad.

TEXTO A ANALIZAR:
${text}

INSTRUCCIONES:
1. Genera preguntas variadas y educativas
2. Incluye diferentes tipos de preguntas:
   - Preguntas de definición (¿Qué es...?)
   - Preguntas de propiedad (¿Qué tiene...?, ¿Qué contiene...?)
   - Preguntas de ubicación (¿Dónde está...?)
   - Preguntas temporales (¿Cuándo ocurrió...?)
   - Preguntas de identificación (¿Cómo se llama...?)
   ${includeCompletarBlancos ? '- Preguntas de completar blancos (Completa: ...)' : ''}
3. Las preguntas deben ser claras, precisas y basadas directamente en el texto
4. Las respuestas deben ser concisas pero completas
5. Cada pregunta debe poder responderse con información del texto proporcionado

FORMATO DE RESPUESTA (JSON estricto):
{
  "questions": [
    {
      "pregunta": "Texto de la pregunta",
      "respuesta": "Respuesta correcta",
      "tipo": "definicion|propiedad|ubicacion|temporal|completar|identificar"
    }
  ]
}

IMPORTANTE: 
- Responde SOLO con el JSON, sin texto adicional
- Genera exactamente ${maxQuestions} preguntas
- Todas las preguntas deben estar en español
- Asegúrate de que el JSON sea válido`;

    // Call Gemini API
    const geminiPayload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
        maxOutputTokens: 2048
      }
    };
    
    console.log('Calling Gemini API for question generation...');
    
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(geminiPayload)
      }
    );
    
    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', { status: geminiResponse.status, error: errorData });
      
      let errorMessage = errorData.error?.message || geminiResponse.statusText || 'Error desconocido';
      
      if (geminiResponse.status === 401 || geminiResponse.status === 403) {
        errorMessage = 'Clave de API de Gemini inválida. Verifica la configuración.';
      } else if (geminiResponse.status === 429) {
        errorMessage = 'Límite de solicitudes excedido. Intenta de nuevo en unos momentos.';
      } else if (geminiResponse.status === 500) {
        errorMessage = 'Error del servidor de Gemini. Intenta de nuevo más tarde.';
      }
      
      return c.json({ 
        error: `Error de Gemini AI: ${errorMessage}` 
      }, geminiResponse.status);
    }
    
    const result = await geminiResponse.json();
    console.log('Gemini response received successfully for question generation');
    
    if (!result.candidates || result.candidates.length === 0) {
      console.error('Gemini response without candidates:', result);
      return c.json({ error: 'Gemini no generó una respuesta válida' }, 500);
    }
    
    const responseText = result.candidates[0].content.parts[0].text;
    
    let questionData;
    try {
      questionData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Gemini JSON response:', parseError);
      console.error('Response text:', responseText);
      return c.json({ error: 'Error al procesar la respuesta de Gemini' }, 500);
    }
    
    if (!questionData.questions || !Array.isArray(questionData.questions)) {
      console.error('Invalid question data structure:', questionData);
      return c.json({ error: 'Respuesta de Gemini en formato incorrecto' }, 500);
    }
    
    // Add unique IDs to each question
    const questionsWithIds = questionData.questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      pregunta: q.pregunta || '',
      respuesta: q.respuesta || '',
      tipo: q.tipo || 'identificar',
      oracionOriginal: text.substring(0, 200) + '...' // Store excerpt for reference
    }));
    
    console.log(`Generated ${questionsWithIds.length} questions successfully`);
    
    return c.json({ 
      questions: questionsWithIds,
      metadata: {
        generatedBy: 'Gemini AI',
        generatedAt: new Date().toISOString(),
        textLength: text.length,
        questionCount: questionsWithIds.length
      }
    });
  } catch (error: any) {
    console.error('Error in question generation:', error);
    return c.json({ error: `Error del servidor: ${error.message}` }, 500);
  }
});

Deno.serve(app.fetch);
