import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
// DESACTIVADO: import * as kv from "./kv_store.tsx";

const app = new Hono();
app.use('*', logger(console.log));
// ⚠️ CORS CONFIGURADO PARA PERMITIR CUALQUIER ORIGEN (*)
// Esto es necesario para que Figma Make pueda conectarse desde cualquier navegador
app.use("/*", cors({ 
  origin: "*",  // Permite TODOS los orígenes (crítico para Figma online)
  allowHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"], 
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], 
  exposeHeaders: ["Content-Length", "Content-Type"], 
  maxAge: 86400,  // 24 horas de caché para preflight
  credentials: false  // No usar cookies/credentials con origin: "*"
}));

const supabase = createClient(Deno.env.get('SB_URL')!, Deno.env.get('SB_SERVICE_KEY')!);
const bucketName = 'make-05c2b65f-files';

// REEMPLAZO SEGURO Y VACÍO para evitar el crash del servidor
const kv = { 
  get: async (key: string) => null,
  set: async (key: string, value: any) => {},
  del: async (key: string) => {},
  mget: async (keys: string[]) => [],
  mset: async (keys: string[], values: any[]) => {},
  mdel: async (keys: string[]) => {},
  getByPrefix: async (prefix: string) => []
};

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

app.get("/make-server-05c2b65f/health", (c) => {
  return c.json({ status: "ok", message: "Runtime is stable" });
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
    
    if (userData?.role !== 'teacher') {
      console.error('Non-teacher attempted to create note:', user.id);
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
    
    console.log('Creating note:', newNote);
    await kv.set(id, newNote);
    const list = await kv.get(`teacher:${user.id}:notes`) || [];
    list.push(id);
    await kv.set(`teacher:${user.id}:notes`, list);
    console.log('Note created successfully:', id);
    
    return c.json({ note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    return c.json({ error: 'Server error: ' + (error as Error).message }, 500);
  }
});

app.get("/make-server-05c2b65f/notes", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role === 'teacher') {
      const ids = await kv.get(`teacher:${user.id}:notes`) || [];
      const notes = await kv.mget(ids);
      return c.json({ notes: notes.filter(n => n) });
    } else {
      const teacherId = await kv.get(`student:${user.id}:teacher`);
      if (!teacherId) return c.json({ notes: [] });
      
      const ids = await kv.get(`teacher:${teacherId}:notes`) || [];
      const allNotes = await kv.mget(ids);
      const visibleNotes = allNotes.filter(n => n && n.visibility === 'all');
      return c.json({ notes: visibleNotes });
    }
  } catch (error) {
    console.error('Error getting notes:', error);
    return c.json({ error: 'Server error' }, 500);
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
    console.error('Error deleting note:', error);
    return c.json({ error: 'Server error' }, 500);
  }
});

app.put("/make-server-05c2b65f/notes/:id", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const existing = await kv.get(id);
    if (!existing) return c.json({ error: 'Not found' }, 404);
    if (existing.teacherId !== user.id) return c.json({ error: 'Not your note' }, 403);
    
    const updates = await c.req.json();
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    await kv.set(id, updated);
    return c.json({ note: updated });
  } catch (error) {
    console.error('Error updating note:', error);
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

Formato JSON igual que antes.`;
    } else if (type === 'video') {
      prompt = `Genera una tarea educativa basada en un video.

IMPORTANTE - Requisitos:
- Dificultad: ${difficultyText}
- Nivel de español: ${spanishLevelText}
- URL del video: ${videoUrl}

Genera una tarea con:
1. Título y descripción adaptados al nivel
2. EXACTAMENTE 10 ejercicios variados
3. Preguntas que fomenten el análisis crítico del contenido del video

Formato JSON igual que antes.`;
    }
    
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return c.json({ error: 'AI generation failed: ' + errorText }, 500);
    }
    
    const data = await response.json();
    console.log('Gemini response received');
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!generatedText) {
      console.error('No text in Gemini response');
      return c.json({ error: 'AI generation failed: No text generated' }, 500);
    }
    
    // Parse JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response');
      return c.json({ error: 'AI generation failed: Invalid response format' }, 500);
    }
    
    const taskData = JSON.parse(jsonMatch[0]);
    console.log('Task generated successfully');
    
    return c.json({ task: taskData });
  } catch (error) {
    console.error('Error in AI task generation:', error);
    return c.json({ error: 'Server error: ' + (error as Error).message }, 500);
  }
});

// PDF Flattening endpoint
app.get("/make-server-05c2b65f/submissions/:id/flattened-pdf", async (c) => {
  try {
    const token = c.req.header('Authorization')?.split(' ')[1];
    const { user, error } = await authenticateUser(token);
    if (error || !user) return c.json({ error: error || 'Unauthorized' }, 401);
    
    const userData = await kv.get(`user:${user.id}`);
    if (userData?.role !== 'teacher') return c.json({ error: 'Teachers only' }, 403);
    
    const id = c.req.param('id');
    const submission = await kv.get(id);
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
