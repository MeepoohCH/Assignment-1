import express from "express";
import "dotenv/config";
import cors from "cors";

const CONFIG_URL = process.env.URL_Drone_Config;
const CONFIG_Log = process.env.URL_Drone_Log;
const AUTH_TOKEN = process.env.API_TOKEN;
const port = process.env.PORT || 8000;

const app = express();

// ===================== 4 Middleware ===================== //

// 1. Body Parser Middleware
app.use(express.json());

// 2. CORS Middleware
const allowedOrigins = [
'http://localhost:3000',                   // สำหรับ frontend บนเครื่องพัฒนา
'https://assignment-1-gray-two.vercel.app' // สำหรับ frontend ที่ deploy บน Vercel
];

app.use(cors({
origin: function(origin, callback) {
  if (!origin) return callback(null, true); // อนุญาต request ที่ไม่มี origin เช่น curl
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  } else {
    return callback(new Error('Not allowed by CORS'));
  }
},
methods: ['GET', 'POST'],
optionsSuccessStatus: 200
}));

// 3. Logging Middleware (Optional)
app.use((req, res, next) => {
console.log(`${req.method} ${req.url}`);
next();
});

// 4. Error Handling Middleware
app.use((err, req, res, next) => {
if (err.message === 'Not allowed by CORS') {
  res.status(403).json({ error: err.message });
} else {
  res.status(500).json({ error: err.message });
}
});

app.listen(port, () => {
  console.log(`Server is running at ${port}`);
});

// ===================== CONFIG ===================== //
app.get("/configs/:id", async (req, res) => {
  const droneId = Number(req.params.id);
  console.log(req.params.id);
  const droneConfig = await loadConfig(droneId);
  if (!droneConfig) {
    return res.status(404).json({ error: "Drone not found" });
  }
  res.json({
    drone_id: droneConfig.drone_id,
    drone_name: droneConfig.drone_name,
    light: droneConfig.light,
    country: droneConfig.country,
    weight: droneConfig.weight,
  });
});

// ===================== STATUS ===================== //
app.get("/status/:id", async (req, res) => {
  const droneId = Number(req.params.id);
  console.log(req.params.id);
  const droneConfig = await loadConfig(droneId);
  if (!droneConfig) {
    return res.status(404).json({ error: "Drone not found" });
  }
  res.json({ condition: droneConfig.condition });
});

// ===================== Logs ===================== //
app.get("/logs/:id", async (req, res) => {
  const droneId = Number(req.params.id);
  const page = Number(req.query.page) || 1;

  const baseUrl = `${req.protocol}://${req.get("host")}${req.path}`;
  const result = await loadLog(droneId, page, baseUrl);

  if (!result) {
    return res.status(404).json({ error: "Drone not found or no logs" });
  }

  res.json(result);
});

// ================= POST /logs ================= //
app.post("/logs", async (req, res) => {
  try {
    const { drone_id, drone_name, country, celsius } = req.body;
    const newLog = await createLog({ drone_id, drone_name, country, celsius });
    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===================== Function ===================== //

// โหลด Config ของ drone จาก Server1
async function loadConfig(droneId) {
  try {
    const response = await fetch(CONFIG_URL);
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const body = await response.json();
    const droneConfigs = body.data;
    return droneConfigs.find((element) => element.drone_id == droneId);
  } catch (err) {
    console.log("Error loadConfig:", err.message);
  }
}

// โหลด Log ของ drone จาก Server2 (มี navigation)
async function loadLog(droneId, page, baseUrl = "") {
  const perPage = 12;
  try {
    const url = new URL(CONFIG_Log);
    url.searchParams.set("filter", `(drone_id=${droneId})`);
    url.searchParams.set("sort", "-created");
    url.searchParams.set("perPage", perPage);
    url.searchParams.set("page", page);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Response status: ${response.status}`);

    const body = await response.json();
    const logs = body.items || [];

    if (logs.length === 0) return null;

    // ดึงเฉพาะ field ที่ต้องการ
    const filteredLogs = logs.map((log) => ({
      drone_id: log.drone_id,
      drone_name: log.drone_name,
      created: log.created,
      country: log.country,
      celsius: log.celsius,
    }));

    // สร้าง URL สำหรับ pagination
    const navigation = {
      first: `${baseUrl}?page=1`,
      prev: page > 1 ? `${baseUrl}?page=${page - 1}` : null,
      next: page < body.totalPages ? `${baseUrl}?page=${page + 1}` : null,
      last: `${baseUrl}?page=${body.totalPages}`,
    };

    // คืน response พร้อม navigation
    return {
      pagination: {
        currentPage: page,
        perPage,
        totalItems: body.totalItems,
        totalPages: body.totalPages,
        navigation,
      },
      data: filteredLogs,
    };
  } catch (err) {
    console.log("Error loadLog:", err.message);
    return null;
  }
}

// สร้าง log ใหม่ใน Server2
async function createLog(logData) {
  try {
    const payload = {
      drone_id: logData.drone_id,
      drone_name: logData.drone_name,
      country: logData.country,
      celsius: logData.celsius,
    };

    const response = await fetch(CONFIG_Log, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`, // <-- ใช้ token จาก .env
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok)
      throw new Error(`Server2 response status: ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error("Error createLog:", err.message);
    throw err;
  }
}
