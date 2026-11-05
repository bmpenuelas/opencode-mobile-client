## App name

OpenCode Mobile

## Subtitle

Klien seluler untuk server OpenCode

## Promotional text

Mengobrol dengan agen OpenCode dari ponsel dan lanjutkan percakapan dengan mulus antara komputer dan iPhone.

## Keywords

opencode, mobile, ai, agent, client, pemrograman, kode, server, jarak jauh

## Description

OpenCode Mobile membawa agen OpenCode ke iPhone Anda. Hubungkan aplikasi ke server OpenCode yang berjalan di komputer, lalu lanjutkan bekerja dengan kode dan alat pengembangan Anda dari mana saja.

Beralih dengan mulus antara komputer dan ponsel: lanjutkan sesi yang dimulai di desktop pada iPhone, atau buka kembali percakapan yang dimulai di ponsel dari komputer.

(Ini adalah proyek komunitas sumber terbuka yang independen. Bukan aplikasi resmi dan tidak berafiliasi dengan opencode.ai.)

FITUR:

◆ Terhubung ke server OpenCode mana pun melalui HTTP atau HTTPS, di jaringan lokal maupun dari jauh lewat VPN atau Tailscale.
◆ Buat beberapa profil server dan terhubung otomatis ke server pilihan Anda.
◆ Pasangkan dengan OpenCode v2 dengan memindai kode QR atau menempelkan tautan. Juga berfungsi dengan server yang dilindungi kata sandi dan OpenCode v1.
◆ Kelola server dari dalam aplikasi: tarik ke bawah, segarkan, atau buka menu.
◆ Pemeriksaan kondisi server otomatis dan penyambungan kembali dengan jeda yang makin panjang.
◆ Kata sandi disimpan dengan aman di Keychain.
◆ Tema terang dan gelap yang otomatis mengikuti pengaturan sistem.
◆ Mode pengetikan opsional: Enter membuat baris baru, Shift+Enter mengirim pesan.
◆ SUMBER TERBUKA

Menemukan masalah atau punya ide untuk perbaikan?

Laporkan issue, usulkan fitur, atau kirim pull request di GitHub.

Repositori GitHub:
https://github.com/bmpenuelas/opencode-mobile-client

MULAI CEPAT:

Server OpenCode harus berjalan untuk menggunakan aplikasi ini.

OpenCode Mobile adalah klien yang terhubung ke server web OpenCode yang berjalan di komputer tempat kode dan alat pengembangan Anda berada.

► OpenCode v2

Jalankan dua perintah ini di komputer Anda:

opencode service set hostname 0.0.0.0

opencode pair

Lalu di aplikasi, tambahkan server dan pindai kode QR atau tempelkan tautan. Tautan hanya bisa dipakai sekali dan kedaluwarsa setelah 5 menit.

Menjalankan opencode serve secara langsung? Pilih "Use URL and password instead" dan masukkan kata sandi yang ditampilkan.

► OpenCode v1

Saat menambahkan server, aktifkan "OpenCode v1 server" dan jalankan seperti ini:

► Tanpa autentikasi

opencode web --hostname 0.0.0.0 --port 4096

► Dengan autentikasi

Autentikasi disarankan jika server dapat diakses dari luar jaringan lokal tepercaya Anda.

export OPENCODE_SERVER_PASSWORD="your-secret-password"

opencode serve --hostname 0.0.0.0 --port 4096

Saat autentikasi aktif, nama pengguna default di aplikasi adalah opencode.
