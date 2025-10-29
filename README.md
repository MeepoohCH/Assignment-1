# Assignment #1
Create an API Server with Node.js &amp; Express.js
 
## 💡 คำอธิบายโค้ด Node.js/Express สำหรับ API Gateway ของโดรน

โค้ดนี้สร้าง **API Gateway** โดยใช้เฟรมเวิร์ก **Express** ใน **Node.js**  
ทำหน้าที่เป็นตัวกลางในการเข้าถึงและจัดการข้อมูลโดรนจากระบบภายนอก 2 ระบบ:

1. **Server1 (Config Server)**  
   - จัดเก็บข้อมูล **Configuration** และ **Status** ของโดรน  
   - ใช้สำหรับดึงข้อมูลตั้งต้น เช่น drone_name, light, country, weight, condition

2. **Server2 (Log Server)**  
   - จัดเก็บข้อมูล **Log** ของโดรน  
   - รองรับการ **บันทึก Log ใหม่** เช่น drone_id, drone_name, created, country, celsius
   - รองรับการ **เรียกดู Log แบบแบ่งหน้า (Pagination)** เพื่อให้ง่ายต่อการนำไปแสดงผล

---
## 🚀 ภาพรวมและส่วนประกอบหลักของโค้ด

### 1. การตั้งค่าและการเชื่อมต่อ (Setup & Config)

  ```javascript
import express from 'express';       // นำเข้า Express framework สำหรับสร้าง Server
import "dotenv/config";              // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
import cors from 'cors';             // ใช้ CORS บน Express.js เพื่อให้ frontend สามารถเรียก API ได้ทั้งใน localhost และบน Vercel

const app = express();
const CONFIG_URL = process.env.URL_Drone_Config;
const LOG_URL = process.env.URL_Drone_Log;
const AUTH_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 8000;

// ===================== 4 Middleware ===================== //

// 1. Body Parser Middleware
app.use(express.json());

// 2. CORS Middleware
const allowedOrigins = [
  'http://localhost:3000',                   // สำหรับ frontend บนเครื่องพัฒนา
  'https://assignment-2-8468.vercel.app' // สำหรับ frontend ที่ deploy บน Vercel
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

// 3. Logging Middleware 
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
  ```
สามารถเรียกใช้ค่าจากไฟล์ `.env` ผ่านตัวแปร `process.env` ได้ดังนี้:

  ```
  const CONFIG_URL = process.env.URL_Drone_Config;
  const LOG_URL = process.env.URL_Drone_Log;
  const AUTH_TOKEN = process.env.API_TOKEN;
  const PORT = process.env.PORT || 8000; # เครื่องหมาย || หมายถึงหากไม่มีการกำหนดค่าจะมีค่าเริ่มต้น 8000
  ```

#### ⚙️ Environment Variables

สร้างไฟล์ชื่อ `.env` ไว้ในโฟลเดอร์หลักของโปรเจกต์ (root directory)  
ไฟล์นี้ใช้สำหรับเก็บค่าการตั้งค่าที่สำคัญ เช่น **API Token**, **URL ของ Server**, และ **Path** ที่ใช้เรียก API Server อื่น ๆ  

##### 🔧 ตัวอย่างไฟล์ `.env`
  ```env
  URL_Drone_Config=https://example.com/api/config
  URL_Drone_Log=https://example.com/api/logs
  API_TOKEN=your_api_token_here
  PORT=8000
  ```
##### 📝 คำอธิบายตัวแปร

| ตัวแปร              | คำอธิบาย |
|--------------------|-----------|
| `URL_Drone_Config` | URL สำหรับเรียกข้อมูลการตั้งค่าจาก **Server1** |
| `URL_Drone_Log`    | URL สำหรับบันทึกหรือดึงข้อมูล **Log** จาก **Server2** |
| `API_TOKEN`        | Token สำหรับการยืนยันตัวตนเมื่อเรียก **API** |
| `PORT`             | พอร์ตที่ใช้รันเซิร์ฟเวอร์ (ค่าเริ่มต้นคือ `8000`) |



#### ⚠️ หมายเหตุ

- ควรเพิ่มไฟล์ `.env` ลงใน `.gitignore` เพื่อป้องกันไม่ให้ข้อมูลสำคัญถูกเผยแพร่สู่สาธารณะ  
- หากมีการแก้ไขค่าใน `.env` ให้ **รีสตาร์ทเซิร์ฟเวอร์** เพื่อโหลดค่าล่าสุด  
- **สำหรับการส่งโปรเจกต์นี้เพื่อการศึกษา**  
  มีการแนบไฟล์ `.env` มาด้วย โดยไม่ได้เพิ่มลงใน `.gitignore` เพื่อความสะดวกต่อการตรวจงานของอาจารย์


 ### 2. Endpoints (เส้นทาง API ที่เปิดให้บริการ)

| Endpoint        | Method | คำอธิบาย |
|-----------------|--------|-----------|
| `/configs/:id`  | GET    | ดึงข้อมูล **Configuration** ของ drone ตาม `id` |
| `/status/:id`   | GET    | ดึงข้อมูล **condition** ของ drone ตาม `id` |
| `/logs/:id`     | GET    | ดึงข้อมูล **Log ล่าสุด** ของ drone ตาม `id` และรองรับการแบ่งหน้า (Pagination) |
| `/logs`         | POST   | ส่งข้อมูล **Log ใหม่** ไปบันทึกใน **Log Server (Server2)** |


 ### 3. Helper Functions (ฟังก์ชันผู้ช่วย)

| Function                        | หน้าที่ |
|---------------------------------|--------|
| `loadConfig(droneId)`           | เรียก **Server1 (CONFIG_URL)** เพื่อดึง Config ทั้งหมด และกรองหาข้อมูลโดรนตาม `droneId` |
| `loadLog(droneId, page, baseUrl)` | สร้าง **Query Parameter** เพื่อเรียก **Server2 (CONFIG_Log)** แบบมีเงื่อนไข (Filter, Sort, Pagination) และสร้าง **Link สำหรับการนำทาง (navigation)** |
| `createLog(logData)`             | เรียก **Server2 (CONFIG_Log)** ด้วย Method **POST** เพื่อสร้าง Log ใหม่ โดยต้องส่ง **AUTH_TOKEN** ใน Header เพื่อยืนยันตัวตน |
 
---

## 💻 วิธีการรันโค้ด (How to Run)

### 1. ติดตั้ง dependencies
  ```bash
  npm install
  
  # สร้างไฟล์ package.json
  npm init -y
  
  # ติดตั้ง dependencies ที่จำเป็น
  npm install express dotenv cors
  
  ```
### 2. รันเซิร์ฟเวอร์
โปรเจกต์นี้มีสคริปต์ใน `package.json` ดังนี้:
  ```
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "check": "node -v && npm -v && npx -v",
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
  ```
สามารถรันเซิร์ฟเวอร์ได้ด้วยคำสั่ง:
  ```
  # ใช้ nodemon เพื่อรัน server และ reload อัตโนมัติเมื่อมีการแก้ไขไฟล์
  npm run dev
  
  # หรือใช้ node ปกติ
  npm start
  ```
💡 **หมายเหตุ:**

 - แนะนำให้ใช้ `npm run dev` ในการพัฒนา เพราะ `nodemon` จะคอยรีโหลดเซิร์ฟเวอร์ให้อัตโนมัติเมื่อมีการแก้ไขไฟล์
 - หากต้องการรันใน production ให้ใช้ `npm start`
 - Server จะรันที่ http://localhost:8000 (หรือพอร์ตที่กำหนดใน .env)

---

## 🌐 การทดสอบ API (Testing API Endpoints)

เราจะใช้ตัวอย่าง **Drone ID: 66010125** และสมมติว่า Server ของคุณรันอยู่ที่ `http://localhost:8000`

### 1. GET (ดึงข้อมูล) ผ่าน Browser หรือ `curl`

#### 1.1 GET /configs/:id

ดึงข้อมูล Config ของโดรน

- **Browser:** พิมพ์ `http://localhost:8000/configs/66010125` ในช่อง URL
- **curl:**
    ```bash
    curl -X GET "http://localhost:8000/configs/66010125"
    ```
- **Expected Response (ตัวอย่าง):**
    ```json
     {
      "drone_id": 66010125,
      "drone_name": "Reasoned Resistor",
      "light": "off",
      "country": "Bangladesh",
      "weight": 222
    }
     ```

#### 1.2 GET /status/:id

ดึงข้อมูลสถานะของโดรน

- **Browser:** พิมพ์ `http://localhost:8000/status/66010125`
* **curl:**
    ```bash
    curl -X GET "http://localhost:8000/status/66010125"
    ```
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "condition": "good"
    } 
    ```

#### 1.3 GET /logs/:id (พร้อม Pagination)

ดึงข้อมูล Log ของโดรน (ดึงหน้า 2)
* **Drone ID:** 3001
* **Browser:** พิมพ์ `http://localhost:8000/logs/3001?page=2`
* **curl:**
    ```bash
    curl -X GET "http://localhost:8000/logs/3001?page=2"
    ```
💡 **หมายเหตุ:**  
> หากไม่ใส่ `?page=` ระบบ **จะเริ่มที่หน้า 1 อัตโนมัติ** 

* **Expected Response (ตัวอย่าง):**
    ```json
    {
     "pagination": {
      "currentPage": 2,
      "perPage": 12,
      "totalItems": 542,
      "totalPages": 46,
    "navigation": {
      "first": "http://localhost:8000/logs/3001?page=1",
      "prev": "http://localhost:8000/logs/3001?page=1",
      "next": "http://localhost:8000/logs/3001?page=3",
      "last": "http://localhost:8000/logs/3001?page=46"
    }
  },
  "data": [
    {
      "drone_id": 3001,
      "drone_name": "Dot Dot So",
      "created": "2025-10-21 19:33:04.410Z",
      "country": "Bharat",
      "celsius": 98
    },
        // ... Log items 
      ]
    }
    ```
💡 **เพิ่มเติม:**  
> - Response จะส่งกลับ **เป็น JSON Array ของข้อมูล logs** ของ `drone_id` ที่ระบุ  
> - เรียงลำดับจาก `created` ล่าสุดขึ้นก่อน  
> - **จำกัดจำนวนรายการในผลลัพธ์ที่ 12 รายการต่อหน้า**
    

### 2. POST (ส่งข้อมูล) ผ่าน `curl` หรือ Bruno/Postman

#### POST /logs

ส่ง Log ใหม่ไปบันทึก

* **curl:**
    ```bash
    curl -X POST "http://localhost:8000/logs" \
      -H "Content-Type: application/json" \
      -d '{
           "drone_id": 66010125,
            "drone_name": "Meepooh",
            "country": "Thailand",
            "celsius": 30,
            "weight": 55,          
            "condition": "Happy"    
          }'
    ```
💡 **หมายเหตุ:**  
> แม้ส่งข้อมูลหลายฟิลด์ เช่น `weight` หรือ `condition` แต่ระบบ **Response** จะมีเฉพาะ
> `drone_id`, `drone_name`, `created`, `country`, `celsius` เท่านั้น
>   **ไม่ต้องส่ง Authentication เพิ่ม** เพราะระบบใส่ไว้ในโค้ดแล้ว


* **Expected Status:** `201 Created`
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "celsius": 30,
      "collectionId": "ra4yr307291j38v",
      "collectionName": "drone_logs",
      "country": "Thailand",
      "created": "2025-10-28 03:56:20.095Z",
      "drone_id": 66010125,
      "drone_name": "Meepooh",
      "id": "sxqpjqone7jxs1p",
      "updated": "2025-10-28 03:56:20.095Z"
    }
    ```

### 3. การทดสอบด้วย Bruno/Postman

เครื่องมืออย่าง **Bruno** หรือ **Postman** จะเหมาะที่สุดสำหรับการทดสอบ Endpoints ทั้งหมด โดยเฉพาะ `POST` request เพราะช่วยจัดการ JSON Payload และ Header ได้ง่าย

1.  **ตั้งค่า Request Type:** เลือก Method เป็น `GET` หรือ `POST`
2.  **ใส่ URL:** กรอก URL เต็ม เช่น `http://localhost:8000/logs`
3.  **สำหรับ POST /logs:**
    * ไปที่แท็บ **Body** หรือ **Payload**
    * เลือกประเภทเป็น **JSON** (Raw JSON)
    * กรอก JSON Payload ตัวอย่างด้านบน
    * กด **Send**
**ไม่ต้องส่ง Authentication เพิ่ม** เพราะระบบใช้ Token ที่ใส่ไว้ในโค้ดแล้ว

การใช้ Bruno หรือ Postman จะทำให้คุณเห็น Response Code (200, 404, 201) และ Response Body ได้ชัดเจนมากที่สุด

   
---

## ☁️ Deployment บน Vercel

โปรเจกต์นี้สามารถ deploy บน **Vercel** และเรียกใช้งานผ่าน Cloud ได้โดยไม่ต้องใช้ `localhost`

- **ลิงก์ Vercel:** [https://assignment-1-gray-two.vercel.app/]
- **การใช้งาน API ผ่าน Cloud:**  
  เพียงเปลี่ยน URL จาก `http://localhost:8000` เป็น  https://assignment-1-gray-two.vercel.app/

  เช่น:
- GET Configs ของ Drone ID 66010125  
  ```
  https://assignment-1-gray-two.vercel.app/configs/66010125
  ```
- POST Log ใหม่  
  ```
  https://assignment-1-gray-two.vercel.app/logs
  ```

> 💡 **หมายเหตุ:**  
> ระบบทำงานเหมือนกับบน localhost ทุกประการ ไม่ต้องปรับ Authentication เพิ่ม เพราะ Token ถูกกำหนดไว้ในโค้ดแล้ว

## 👩‍💻 Author
#### Chiratchaya Tangnamprasert Student ID: 66010125
