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

### ⚙️ Environment Variables

สร้างไฟล์ชื่อ `.env` ไว้ในโฟลเดอร์หลักของโปรเจกต์ (root directory)  
ไฟล์นี้ใช้สำหรับเก็บค่าการตั้งค่าที่สำคัญ เช่น **API Token**, **URL ของ Server**, และ **Path** ที่ใช้เรียก API Server อื่น ๆ  

#### 🔧 ตัวอย่างไฟล์ `.env`
```env
URL_Drone_Config=https://example.com/api/config
URL_Drone_Log=https://example.com/api/logs
API_TOKEN=your_api_token_here
PORT=3000
```
# 📝 คำอธิบายตัวแปร

**URL_Drone_Config:**  
URL สำหรับเรียกข้อมูลการตั้งค่าจาก Server1  

**URL_Drone_Log:**  
URL สำหรับบันทึกหรือดึงข้อมูล Log จาก Server2  

**API_TOKEN:**  
Token สำหรับการยืนยันตัวตนเมื่อเรียก API  

**PORT:**  
พอร์ตที่ใช้รันเซิร์ฟเวอร์ (ค่าเริ่มต้นคือ 3000)



### วิธีใช้งานในโค้ด

สามารถเรียกใช้ค่าจากไฟล์ `.env` ผ่านตัวแปร `process.env` ได้ดังนี้:
```
const CONFIG_URL = process.env.URL_Drone_Config;
const LOG_URL = process.env.URL_Drone_Log;
const AUTH_TOKEN = process.env.API_TOKEN;
const PORT = process.env.PORT || 8000; # เครื่องหมาย || หมายถึงหากไม่มีการกำหนดค่าจะมีค่าเริ่มต้น 8000
```

### ⚠️ หมายเหตุ

- ควรเพิ่มไฟล์ `.env` ลงใน `.gitignore` เพื่อป้องกันไม่ให้ข้อมูลสำคัญถูกเผยแพร่สู่สาธารณะ  
- หากมีการแก้ไขค่าใน `.env` ให้ **รีสตาร์ทเซิร์ฟเวอร์** เพื่อโหลดค่าล่าสุด  
- **สำหรับการส่งโปรเจกต์นี้เพื่อการศึกษา**  
  มีการแนบไฟล์ `.env` มาด้วย โดยไม่ได้เพิ่มลงใน `.gitignore` เพื่อความสะดวกต่อการตรวจงานของอาจารย์

  
---

## 💻 การติดตั้งและรัน

```bash
# ติดตั้ง dependencies
npm install

# รัน server
node index.js
```
