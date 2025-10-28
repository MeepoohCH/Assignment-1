# Assignment-1
Create an API Server with Node.js &amp; Express.js

## Drone Monitoring API

โปรเจกต์นี้เป็น **Express.js API** สำหรับดึงข้อมูลและจัดการ **Drone Config และ Drone Logs** ผ่าน Server ภายนอก  

ฟีเจอร์หลัก:
- GET `/configs/:id` → ดึงข้อมูล config ของ drone ตาม `drone_id`
- GET `/status/:id` → ดึงสถานะ `condition` ของ drone
- GET `/logs/:id?page=1` → ดึง logs ของ drone พร้อม pagination
- POST `/logs` → สร้าง log ใหม่ใน Server2

---
## 🚀 ภาพรวมและส่วนประกอบหลักของโค้ด

### 1. การตั้งค่าและการเชื่อมต่อ (Setup & Config)

```javascript
import express from 'express'       // นำเข้า Express framework สำหรับสร้าง Server
import "dotenv/config"               // โหลดตัวแปรสภาพแวดล้อมจากไฟล์ .env
```
สามารถเรียกใช้ค่าจากไฟล์ `.env` ผ่านตัวแปร `process.env` ได้ดังนี้:

```
const CONFIG_URL = process.env.URL_Drone_Config;
const LOG_URL = process.env.URL_Drone_Log;
const AUTH_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 8000; # เครื่องหมาย || หมายถึงหากไม่มีการกำหนดค่าจะมีค่าเริ่มต้น 8000
```

### ⚙️ Environment Variables

สร้างไฟล์ชื่อ `.env` ไว้ในโฟลเดอร์หลักของโปรเจกต์ (root directory)  
ไฟล์นี้ใช้สำหรับเก็บค่าการตั้งค่าที่สำคัญ เช่น **API Token**, **URL ของ Server**, และ **Path** ที่ใช้เรียก API Server อื่น ๆ  

#### 🔧 ตัวอย่างไฟล์ `.env`
```env
URL_Drone_Config=https://example.com/api/config
URL_Drone_Log=https://example.com/api/logs
API_TOKEN=your_api_token_here
PORT=8000
```
#### 📝 คำอธิบายตัวแปร

**URL_Drone_Config:**  
URL สำหรับเรียกข้อมูลการตั้งค่าจาก Server1  

**URL_Drone_Log:**  
URL สำหรับบันทึกหรือดึงข้อมูล Log จาก Server2  

**API_TOKEN:**  
Token สำหรับการยืนยันตัวตนเมื่อเรียก API  

**PORT:**  
พอร์ตที่ใช้รันเซิร์ฟเวอร์ (ค่าเริ่มต้นคือ 8000)


### ⚠️ หมายเหตุ

- ควรเพิ่มไฟล์ `.env` ลงใน `.gitignore` เพื่อป้องกันไม่ให้ข้อมูลสำคัญถูกเผยแพร่สู่สาธารณะ  
- หากมีการแก้ไขค่าใน `.env` ให้ **รีสตาร์ทเซิร์ฟเวอร์** เพื่อโหลดค่าล่าสุด  
- **สำหรับการส่งโปรเจกต์นี้เพื่อการศึกษา**  
  มีการแนบไฟล์ `.env` มาด้วย โดยไม่ได้เพิ่มลงใน `.gitignore` เพื่อความสะดวกต่อการตรวจงานของอาจารย์


  
---

## 💻 การติดตั้งและรัน

### 1. ติดตั้ง dependencies
```bash
npm install
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

## 🌐 การทดสอบ API (Testing API Endpoints)

เราจะใช้ตัวอย่าง **Drone ID: 3001** และสมมติว่า Server ของคุณรันอยู่ที่ `http://localhost:8000`

### 1. GET (ดึงข้อมูล) ผ่าน Browser หรือ `curl`

#### 1.1 GET /configs/:id

ดึงข้อมูล Config ของโดรน

* **Browser:** พิมพ์ `http://localhost:8000/configs/3001` ในช่อง URL
* **curl:**
    ```bash
    curl -X GET "http://localhost:8000/configs/3001"
    ```
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "drone_id": 3001,
      "drone_name": "SkyWalker-123",
      "light": "Red",
      "country": "TH",
      "weight": 5.5
    }
    ```

#### 1.2 GET /status/:id

ดึงข้อมูลสถานะของโดรน

* **Browser:** พิมพ์ `http://localhost:8000/status/123`
* **curl:**
    ```bash
    curl -X GET "http://localhost:8000/status/123"
    ```
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "condition": "Healthy"
    }
    ```

#### 1.3 GET /logs/:id (พร้อม Pagination)

ดึงข้อมูล Log ของโดรน (ดึงหน้า 2)

* **Browser:** พิมพ์ `http://localhost:8000/logs/123?page=2`
* **curl:**
    ```bash
    curl -X GET "http://localhost:8000/logs/123?page=2"
    ```
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "pagination": {
        "currentPage": 2,
        "perPage": 12,
        "totalItems": 45,
        "totalPages": 4,
        "navigation": {
          "first": "http://localhost:8000/logs/123?page=1",
          "prev": "http://localhost:8000/logs/123?page=1",
          "next": "http://localhost:8000/logs/123?page=3",
          "last": "http://localhost:8000/logs/123?page=4"
        }
      },
      "data": [
        {
          "drone_id": 123,
          "drone_name": "SkyWalker-123",
          "created": "2025-10-28T09:00:00Z",
          "country": "TH",
          "celsius": 32.5
        },
        // ... Log items 
      ]
    }
    ```

### 2. POST (ส่งข้อมูล) ผ่าน `curl` หรือ Bruno/Postman

#### POST /logs

ส่ง Log ใหม่ไปบันทึก

* **curl:**
    ```bash
    curl -X POST "http://localhost:8000/logs" \
      -H "Content-Type: application/json" \
      -d '{
            "drone_id": 456,
            "drone_name": "SwiftFly-456",
            "country": "US",
            "celsius": 25.8
          }'
    ```

* **Expected Status:** `201 Created`
* **Expected Response (ตัวอย่าง):**
    ```json
    {
      "id": "new_log_entry_id", 
      "drone_id": 456,
      "drone_name": "SwiftFly-456",
      "country": "US",
      "celsius": 25.8,
      "created": "2025-10-28T09:40:00Z"
    }
    ```

### 3. การทดสอบด้วย Bruno/Postman

เครื่องมืออย่าง **Bruno** หรือ **Postman** จะเหมาะที่สุดสำหรับการทดสอบ Endpoints ทั้งหมด โดยเฉพาะ `POST` request เพราะช่วยจัดการ JSON Payload และ Header ได้ง่าย:

1.  **ตั้งค่า Request Type:** เลือก Method เป็น `GET` หรือ `POST`
2.  **ใส่ URL:** กรอก URL เต็ม เช่น `http://localhost:8000/logs/123`
3.  **สำหรับ POST /logs:**
    * ไปที่แท็บ **Body** หรือ **Payload**
    * เลือกประเภทเป็น **JSON** (Raw JSON)
    * กรอก JSON Payload ตัวอย่างด้านบน
    * กด **Send**

การใช้ Bruno หรือ Postman จะทำให้คุณเห็น Response Code (200, 404, 201) และ Response Body ได้ชัดเจนมากที่สุดครับ

   
