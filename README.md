# Employee Management (Frontend)

Aplikasi web untuk melihat dan mengelola data employee dan department. Dibuat dengan React, TypeScript, Tailwind CSS, dan Vite. Halaman login, daftar employee, dashboard, department, serta audit log mengambil data dari **API backend terpisah**. Repo ini hanya berisi frontend; agar bisa login dan melihat data, backend harus tersedia.

## Yang perlu disiapkan

1. **Git** untuk mengunduh kode. Cek dengan `git --version` di Terminal atau PowerShell.
2. **Node.js dan npm**. Vite di proyek ini memerlukan Node.js `20.19.0` atau lebih baru pada seri 20, atau `22.12.0` atau lebih baru pada seri 22 dan seterusnya. Cek dengan `node --version` dan `npm --version`. npm biasanya ikut terpasang bersama Node.js.
3. **Alamat API backend** dan akun untuk login. Minta URL dan akun kepada pengelola backend bila belum punya. Tidak ada akun contoh atau backend di repo ini.

Jika salah satu perintah versi belum dikenali, pasang Git atau Node.js terlebih dahulu, lalu tutup dan buka kembali terminal.

## Dari clone sampai aplikasi berjalan

Jalankan perintah berikut di Terminal (macOS/Linux) atau PowerShell (Windows). Baris yang diawali `#` adalah penjelasan, tidak perlu diketik.

### 1. Unduh proyek dan masuk ke foldernya

```sh
git clone https://github.com/anggitmochammad/employee-react.git
cd employee-react
```

`clone` membuat salinan proyek di komputer. Semua perintah berikut dijalankan dari folder `employee-react`.

### 2. Pasang dependensi

```sh
npm ci
```

Tunggu sampai selesai. Perintah ini memasang paket sesuai `package-lock.json` ke folder `node_modules`; tidak perlu mengunduh paket satu per satu.

### 3. Hubungkan frontend ke backend

Salin contoh konfigurasi menjadi `.env.local`:

```powershell
# Windows PowerShell
Copy-Item .env.example .env.local
```

```sh
# macOS/Linux
cp .env.example .env.local
```

Buka `.env.local` dengan editor teks, lalu isi `VITE_API_BASE_URL` dengan **origin backend** (alamat sampai nomor port, tanpa `/api` di akhir). Contoh jika backend Anda berjalan di port 3000:

```dotenv
VITE_API_BASE_URL=http://localhost:3000
```

Contoh tersebut hanya berlaku jika backend benar-benar berjalan di alamat itu. Gunakan alamat yang diberikan pengelola backend bila berbeda. Misalnya untuk endpoint `http://localhost:3000/api/auth/login`, isi variabel dengan `http://localhost:3000`. Jika frontend dan API disajikan dari origin yang sama, variabel boleh dikosongkan. Saat menjalankan Vite secara lokal di port 5173 dengan backend di port berbeda, variabel ini harus diisi.

Pastikan backend sudah berjalan dan mengizinkan permintaan dari alamat frontend (CORS), misalnya `http://localhost:5173`. File `.env.local` diabaikan Git, sehingga konfigurasi lokal tidak ikut ter-commit. Setelah mengubah file ini saat server frontend sudah berjalan, hentikan dan jalankan ulang `npm run dev`.

### 4. Jalankan frontend

```sh
npm run dev
```

Biarkan terminal ini tetap terbuka. Buka alamat **Local** yang muncul di terminal, biasanya `http://localhost:5173/`. Jika port 5173 sedang dipakai, Vite mungkin menampilkan port lain; gunakan alamat yang benar-benar tercetak.

Halaman login akan tampil. Masuk memakai akun dari backend. Setelah berhasil, Anda dapat membuka dashboard dan data employee. Untuk menghentikan frontend, tekan `Ctrl+C` di terminal.

## Jika ada masalah

| Gejala | Yang perlu diperiksa |
| --- | --- |
| `git`, `node`, atau `npm` tidak dikenali | Pastikan Git/Node.js sudah terpasang, lalu buka terminal baru dan cek perintah versinya. |
| `npm ci` gagal karena versi Node.js | Cocokkan `node --version` dengan syarat versi di atas. |
| Halaman login muncul, tetapi tertulis tidak dapat terhubung ke server | Pastikan backend berjalan, URL di `.env.local` benar, dan frontend sudah dijalankan ulang setelah perubahan konfigurasi. |
| Browser menampilkan kesalahan CORS | Backend perlu mengizinkan origin frontend yang tercetak oleh Vite. Pengaturan ini dilakukan di backend. |
| Login ditolak | Periksa email/password dan pastikan akun tersedia di backend. Jika kredensial benar tetapi tetap gagal, periksa format respons autentikasi seperti dijelaskan di bawah. |
| Bisa masuk tetapi tidak bisa menambah atau mengubah data | Akun `viewer` hanya dapat membaca data. Aksi tulis memerlukan role `admin` dari backend. |

## Perintah lain

| Perintah | Kegunaan |
| --- | --- |
| `npm run build` | Periksa TypeScript dan buat berkas produksi di `dist/`. |
| `npm run preview` | Lihat hasil build secara lokal; jalankan `npm run build` lebih dulu. |
| `npm run lint` | Periksa aturan kode dengan ESLint. |

## Kebutuhan API backend

Frontend mengirim permintaan ke endpoint berawalan `/api/`, termasuk `POST /api/auth/login`, `GET /api/auth/me`, `/api/employees`, `/api/departments`, dan `/api/audit-logs`. Backend perlu menerima permintaan tersebut dan mengizinkan origin frontend melalui CORS jika alamat keduanya berbeda.

Respons login harus menyediakan token JWT pada field `access_token` atau `accessToken`. Respons `/api/auth/me` perlu memuat role `admin` atau `viewer`, baik langsung pada objek respons maupun di dalam objek `user`. Aplikasi menyimpan token di `localStorage` browser agar sesi dapat digunakan pada tab lain di origin yang sama. Jika kontrak backend berbeda, frontend perlu disesuaikan sebelum alur login dan hak akses bekerja.
