import { Hono } from "npm:hono@4";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";

// ═══════════════════════════════════════════════════════════════════
// EDUCONNECT BACKEND - SERVIDOR PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

const app = new Hono().basePath("/server");

// CORS abierto (necesario para desarrollo)
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "apikey"],
}));

// Logger para debugging
app.use("*", logger());

// Cliente de Supabase para operaciones de backend
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// ═══════════════════════════════════════════════════════════════════
// UTILIDADES DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════

async function authenticateUser(token: string | undefined) {
  if (!token) {
    return { user: null, error: "No token provided" };
  }

  // Check for hardcoded admin token
  if (token.startsWith('admin_')) {
    return {
      user: {
        id: 'admin',
        email: 'admin@educonnect.com',
        user_metadata: {
          name: 'Administrator',
          role: 'admin',
          avatar: 'default',
        },
      },
      error: null,
    };
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return { user: null, error: error?.message || "Invalid token" };
    }
    return { user, error: null };
  } catch (error: any) {
    return { user: null, error: error.message };
  }
}

// ═══════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ═══════════════════════════════════════════════════════════════════

app.get("/health", (c) => {
  return c.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "educonnect-backend"
  });
});

// ═══════════════════════════════════════════════════════════════════
// AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════════

app.post("/login", async (c) => {
  try {
    const { email, password } = await c.req.json();

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return c.json({ error: error.message }, 401);
    }

    return c.json({
      token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
        role: data.user.user_metadata?.role,
        avatar: data.user.user_metadata?.avatar,
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.post("/signup", async (c) => {
  try {
    const { email, password, name, role } = await c.req.json();

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, avatar: "default" },
      email_confirm: true, // Auto-confirm ya que no tenemos servidor de email
    });

    if (error) {
      return c.json({ error: error.message }, 400);
    }

    // Auto login después de signup
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (sessionError) {
      return c.json({ error: sessionError.message }, 500);
    }

    return c.json({
      token: sessionData.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        name,
        role,
        avatar: "default",
      },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

app.get("/user", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    
    if (!token) {
      console.error("[/user] No token provided");
      return c.json({ error: "No token provided" }, 401);
    }

    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      console.error("[/user] Authentication failed:", error);
      return c.json({ error: error || "Unauthorized" }, 401);
    }

    const userData = {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name,
      role: user.user_metadata?.role,
      avatar: user.user_metadata?.avatar,
    };

    console.log("[/user] User authenticated:", userData.email, userData.role);

    return c.json({
      user: userData
    });
  } catch (error: any) {
    console.error("[/user] Unexpected error:", error);
    return c.json({ error: error.message || "Internal server error" }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// GENERADOR DE PREGUNTAS CON IA (GEMINI)
// ═══════════════════════════════════════════════════════════════════

app.post("/generate-questions", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const {
      text,
      taskName,
      spanishLevel,
      difficulty,
      questionCount,
    } = await c.req.json();

    // Validaciones
    if (!text || text.length < 50) {
      return c.json({
        error: "El texto debe tener al menos 50 caracteres"
      }, 400);
    }

    if (!taskName) {
      return c.json({ error: "Debes proporcionar un nombre para la tarea" }, 400);
    }

    const validSpanishLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
    if (!validSpanishLevels.includes(spanishLevel)) {
      return c.json({ error: "Nivel de español inválido" }, 400);
    }

    const validDifficulties = ["Fácil", "Medio", "Difícil"];
    if (!validDifficulties.includes(difficulty)) {
      return c.json({ error: "Dificultad inválida" }, 400);
    }

    const validQuestionCounts = [5, 10, 15, 20];
    if (!validQuestionCounts.includes(questionCount)) {
      return c.json({ error: "Cantidad de preguntas inválida" }, 400);
    }

    // Obtener API key de Gemini
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiKey) {
      return c.json({
        error: "GEMINI_API_KEY no configurada. Ve a Supabase Dashboard → Settings → Secrets y agrega tu API key"
      }, 500);
    }

    // Construir prompt mejorado
    const prompt = `
Eres un profesor de español experto creando ejercicios educativos.

CONTEXTO:
- Nombre de la tarea: "${taskName}"
- Nivel de español: ${spanishLevel} (Marco Común Europeo)
- Dificultad: ${difficulty}
- Cantidad de preguntas: ${questionCount}

TEXTO BASE:
${text}

INSTRUCCIONES:
1. Genera EXACTAMENTE ${questionCount} preguntas de opción múltiple
2. Las preguntas deben ser apropiadas para nivel ${spanishLevel}
3. Dificultad: ${difficulty}
4. Cada pregunta debe tener 4 opciones (A, B, C, D)
5. Solo UNA respuesta correcta por pregunta
6. Las preguntas deben evaluar comprensión del texto
7. Varía la dificultad entre preguntas (literal, inferencial, crítica)

FORMATO DE RESPUESTA (JSON):
{
  "taskName": "${taskName}",
  "spanishLevel": "${spanishLevel}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "Pregunta clara y específica",
      "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
      "correctAnswer": 0,
      "explanation": "Breve explicación de por qué esta es la respuesta correcta"
    }
  ]
}

IMPORTANTE: Responde SOLO con JSON válido, sin texto adicional antes o después.
`;

    // Llamar a Gemini API
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiKey,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Gemini API error:", errorData);
      return c.json({
        error: "Error al conectar con Gemini API. Verifica que tu API key sea válida."
      }, 500);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return c.json({
        error: "No se pudo generar respuesta de la IA"
      }, 500);
    }

    // Extraer JSON (Gemini a veces agrega markdown)
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Response was not valid JSON:", generatedText);
      return c.json({
        error: "La IA no devolvió un formato válido. Intenta de nuevo."
      }, 500);
    }

    const result = JSON.parse(jsonMatch[0]);

    return c.json({
      taskName: result.taskName || taskName,
      spanishLevel: result.spanishLevel || spanishLevel,
      difficulty: result.difficulty || difficulty,
      questions: result.questions,
      generatedAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error("Error generando preguntas:", error);
    return c.json({
      error: "Error del servidor: " + error.message
    }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// TAREAS (ASSIGNMENTS)
// ═══════════════════════════════════════════════════════════════════

// Crear tarea (generada por IA)
app.post("/assignments", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentData = await c.req.json();

    // Guardar en KV store
    const assignmentId = crypto.randomUUID();
    const assignment = {
      id: assignmentId,
      ...assignmentData,
      teacherId: user.id,
      createdAt: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("kv_store")
      .upsert({
        key: `assignment:${assignmentId}`,
        value: assignment,
      });

    return c.json({ id: assignmentId, ...assignment });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener todas las tareas del profesor
app.get("/assignments", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .like("key", "assignment:%");

    if (dbError) {
      return c.json({ error: dbError.message }, 500);
    }

    const assignments = data
      ?.map((row) => row.value)
      .filter((a) => a.teacherId === user.id) || [];

    return c.json({ assignments });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener una tarea específica
app.get("/assignments/:id", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentId = c.req.param("id");
    const { data, error: dbError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .eq("key", `assignment:${assignmentId}`)
      .single();

    if (dbError) {
      return c.json({ error: "Assignment not found" }, 404);
    }

    return c.json({ assignment: data.value });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Actualizar tarea
app.put("/assignments/:id", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentId = c.req.param("id");
    const updates = await c.req.json();

    // Get existing assignment
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .eq("key", `assignment:${assignmentId}`)
      .single();

    if (fetchError) {
      return c.json({ error: "Assignment not found" }, 404);
    }

    // Update assignment
    const updatedAssignment = {
      ...existing.value,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("kv_store")
      .upsert({
        key: `assignment:${assignmentId}`,
        value: updatedAssignment,
      });

    return c.json({ assignment: updatedAssignment });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Eliminar tarea
app.delete("/assignments/:id", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentId = c.req.param("id");

    await supabaseAdmin
      .from("kv_store")
      .delete()
      .eq("key", `assignment:${assignmentId}`);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ══════════════════════════════════════════════════════════════════
// ESTUDIANTES
// ══════════════════════════════════════════════════════════════════

// Obtener mis estudiantes (como profesor)
app.get("/my-students", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Get all users and filter students assigned to this teacher
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    const students = users.users
      .filter((u: any) => 
        u.user_metadata?.role === 'student' && 
        u.user_metadata?.teacherIds?.includes(user.id)
      )
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name,
        role: u.user_metadata?.role,
        avatar: u.user_metadata?.avatar,
        teacherIds: u.user_metadata?.teacherIds || [],
      }));

    return c.json({ students });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener todos los estudiantes (para admin)
app.get("/students", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    const students = users.users
      .filter((u: any) => u.user_metadata?.role === 'student')
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name,
        role: u.user_metadata?.role,
        avatar: u.user_metadata?.avatar,
        teacherIds: u.user_metadata?.teacherIds || [],
      }));

    return c.json({ students });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener todos los profesores (para admin)
app.get("/teachers", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    const teachers = users.users
      .filter((u: any) => u.user_metadata?.role === 'teacher')
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        name: u.user_metadata?.name,
        role: u.user_metadata?.role,
        avatar: u.user_metadata?.avatar,
      }));

    return c.json({ teachers });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Asignar/desasignar estudiante a profesor
app.post("/assign-student", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { studentId, assign } = await c.req.json();
    const teacherId = user.id; // Use the logged-in user (teacher) ID

    // Get student data
    const { data: { user: student } } = await supabaseAdmin.auth.admin.getUserById(studentId);
    
    if (!student) {
      return c.json({ error: "Student not found" }, 404);
    }

    let teacherIds = student.user_metadata?.teacherIds || [];

    if (assign) {
      // Add teacher if not already assigned
      if (!teacherIds.includes(teacherId)) {
        teacherIds.push(teacherId);
      }
    } else {
      // Remove teacher
      teacherIds = teacherIds.filter((id: string) => id !== teacherId);
    }

    // Update student metadata
    await supabaseAdmin.auth.admin.updateUserById(studentId, {
      user_metadata: {
        ...student.user_metadata,
        teacherIds,
      },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// ASIGNACIONES DE TAREAS A ESTUDIANTES
// ═══════════════════════════════════════════════════════════════════

// Asignar tarea a estudiantes
app.post("/assign-task", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { assignmentId, studentIds } = await c.req.json();

    // Store assignment to students mapping
    await supabaseAdmin
      .from("kv_store")
      .upsert({
        key: `assignment_students:${assignmentId}`,
        value: { assignmentId, studentIds },
      });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener estudiantes asignados a una tarea
app.get("/assignments/:id/assigned-students", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentId = c.req.param("id");
    const { data, error: dbError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .eq("key", `assignment_students:${assignmentId}`)
      .single();

    if (dbError) {
      return c.json({ studentIds: [] });
    }

    return c.json({ studentIds: data.value.studentIds || [] });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// ENTREGAS (SUBMISSIONS)
// ═══════════════════════════════════════════════════════════════════

// Entregar tarea
app.post("/submissions", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const submissionData = await c.req.json();
    const submissionId = crypto.randomUUID();
    
    const submission = {
      id: submissionId,
      ...submissionData,
      studentId: user.id,
      submittedAt: new Date().toISOString(),
    };

    await supabaseAdmin
      .from("kv_store")
      .upsert({
        key: `submission:${submissionId}`,
        value: submission,
      });

    return c.json({ submission });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener entregas de una tarea
app.get("/assignments/:id/submissions", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const assignmentId = c.req.param("id");
    const { data, error: dbError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .like("key", "submission:%");

    if (dbError) {
      return c.json({ error: dbError.message }, 500);
    }

    const submissions = data
      ?.map((row) => row.value)
      .filter((s) => s.assignmentId === assignmentId) || [];

    return c.json({ submissions });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Obtener mis entregas (como estudiante)
app.get("/my-submissions", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { data, error: dbError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .like("key", "submission:%");

    if (dbError) {
      return c.json({ error: dbError.message }, 500);
    }

    const submissions = data
      ?.map((row) => row.value)
      .filter((s) => s.studentId === user.id) || [];

    return c.json({ submissions });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Calificar entrega
app.post("/submissions/:id/grade", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const submissionId = c.req.param("id");
    const { grade, feedback } = await c.req.json();

    // Get existing submission
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("kv_store")
      .select("value")
      .eq("key", `submission:${submissionId}`)
      .single();

    if (fetchError) {
      return c.json({ error: "Submission not found" }, 404);
    }

    // Update with grade
    const updatedSubmission = {
      ...existing.value,
      grade,
      feedback,
      gradedAt: new Date().toISOString(),
      gradedBy: user.id,
    };

    await supabaseAdmin
      .from("kv_store")
      .upsert({
        key: `submission:${submissionId}`,
        value: updatedSubmission,
      });

    return c.json({ submission: updatedSubmission });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// MATERIALES
// ═══════════════════════════════════════════════════════════════════

// Subir archivo
app.post("/upload", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Obtener el archivo del form data
    const body = await c.req.parseBody();
    const file = body.file;
    
    if (!file || typeof file === 'string') {
      return c.json({ error: "No file provided" }, 400);
    }

    console.log('📤 [Upload] Procesando archivo:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Límite de 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return c.json({ 
        error: `Archivo demasiado grande. Máximo: ${MAX_SIZE / 1024 / 1024}MB` 
      }, 400);
    }

    // Convertir el archivo a base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    
    // Convertir bytes a base64 de forma más eficiente
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    
    // Crear data URL con el tipo correcto
    const mimeType = file.type || 'application/octet-stream';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    const fileId = crypto.randomUUID();

    console.log('✅ [Upload] Archivo convertido exitosamente:', {
      name: file.name,
      type: mimeType,
      size: bytes.length,
      dataUrlLength: dataUrl.length
    });

    return c.json({ 
      url: dataUrl,
      id: fileId,
      name: file.name || "uploaded-file",
      type: mimeType,
      size: bytes.length
    });
  } catch (error: any) {
    console.error('❌ [Upload] Error:', error);
    return c.json({ 
      error: `Error al subir archivo: ${error.message}` 
    }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// ADMIN - Gestión de usuarios
// ═══════════════════════════════════════════════════════════════════

// Obtener todos los usuarios (admin only)
app.get("/admin/users", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Check if user is admin
    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin only" }, 403);
    }

    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    const userList = users.users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name,
      role: u.user_metadata?.role,
      avatar: u.user_metadata?.avatar,
      teacherIds: u.user_metadata?.teacherIds || [],
      blocked: u.user_metadata?.blocked || false,
      createdAt: u.created_at,
    }));

    return c.json({ users: userList });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Eliminar usuario (admin only)
app.delete("/admin/users/:id", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin only" }, 403);
    }

    const userId = c.req.param("id");
    await supabaseAdmin.auth.admin.deleteUser(userId);

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Bloquear/desbloquear usuario (admin only)
app.post("/admin/users/:id/block", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin only" }, 403);
    }

    const userId = c.req.param("id");
    const { blocked } = await c.req.json();

    const { data: { user: targetUser } } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (!targetUser) {
      return c.json({ error: "User not found" }, 404);
    }

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        ...targetUser.user_metadata,
        blocked,
      },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Asignar profesor a estudiante (admin only)
app.post("/admin/assign-teacher", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    if (user.user_metadata?.role !== 'admin') {
      return c.json({ error: "Forbidden - Admin only" }, 403);
    }

    const { studentId, teacherId } = await c.req.json();

    const { data: { user: student } } = await supabaseAdmin.auth.admin.getUserById(studentId);
    
    if (!student) {
      return c.json({ error: "Student not found" }, 404);
    }

    let teacherIds = student.user_metadata?.teacherIds || [];
    
    if (!teacherIds.includes(teacherId)) {
      teacherIds.push(teacherId);
    }

    await supabaseAdmin.auth.admin.updateUserById(studentId, {
      user_metadata: {
        ...student.user_metadata,
        teacherIds,
      },
    });

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════════════════════════════════

// Actualizar avatar del usuario
app.put("/user/avatar", async (c) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    const { user, error } = await authenticateUser(token);

    if (error || !user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { avatar } = await c.req.json();

    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        avatar,
      },
    });

    return c.json({ success: true, avatar });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// ═══════════════════════════════════════════════════════════════════
// INICIAR SERVIDOR
// ═══════════════════════════════════════════════════════════════════

Deno.serve(app.fetch);