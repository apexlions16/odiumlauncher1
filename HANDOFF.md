# Odium Launcher — Handoff

Son güncelleme: 6 Ağustos 2026  
Depo: `apexlions16/odiumlauncher1`  
Aktif test sürümü: `0.2.0-test.1`

## Projenin amacı

Odium Stüdyo'nun kendi hazırladığı Türkçe dublajları, resmî Steam/Epic oyun kurulumlarına kullanıcı hesabı olmadan uygulayan masaüstü launcher ve bu launcher'ı uzaktan yöneten VDS tabanlı admin/yayın sistemi.

## Tamamlanan aşamalar

### Aşama 0 — Depo ve mimari

**Durum: Tamamlandı**

- Electron launcher, bağımsız Node.js admin/yayın servisi ve manifest tabanlı güncelleme mimarisi kuruldu.
- Oyun, haber, görsel ve sürüm verileri EXE'den bağımsız uzak katalogdan yönetiliyor.
- Launcher kullanıcıları için login sistemi eklenmedi; admin işlemleri token ile ayrıldı.

### Aşama 1 — Launcher çekirdeği ve arayüz

**Durum: Tamamlandı**

- Modern, koyu ve responsive Odium arayüzü.
- Steam registry, `libraryfolders.vdf` ve `appmanifest_<appid>.acf` tespiti.
- Epic `.item` manifest taraması.
- Uzak katalog ve çevrimdışı önbellek.
- Dosya boyutu + SHA-256 ile kurulum/güncelleme/onarım tespiti.
- Dosya bazında VDS birincil, Hugging Face ikincil kaynak geçişi.
- Staging, hash doğrulama, orijinal dosya yedekleme, kaldırma ve geri yükleme.
- Oyun doğrulaması dublajı geri aldığında stale kurulum kaydını temizleme.

### Aşama 2 — Admin paneli ve VDS yayın servisi

**Durum: Tamamlandı**

- Token korumalı responsive web admin paneli.
- Oyun, Steam/Epic kimlikleri, açıklama, kapak, hero, görünürlük ve launcher'a özel rozet yönetimi.
- Haber ve marka yönetimi.
- Klasör yapısını koruyan dublaj yükleme.
- Sunucuda otomatik SHA-256 manifest üretimi ve aktif sürüm yayınlama.
- Hugging Face yedek URL'sini sürüme bağlama.
- Docker, systemd ve Nginx dağıtım örnekleri.

### Aşama 3 — Test, güvenlik ve dokümantasyon

**Durum: Tamamlandı**

- 7 çekirdek otomatik test geçti.
- VDF ayrıştırma, yol kaçışı engeli, manifest üretimi, kaynak fallback, kurulum/kaldırma, yedek geri yükleme ve doğrulama sonrası durum temizleme test edildi.
- Admin katalog/yükleme/yayınlama akışı yerel entegrasyon testiyle doğrulandı.
- CI, mimari, VDS kurulumu ve admin kullanım belgeleri eklendi.

### Aşama 4 — Windows paketleme sistemi

**Durum: Paketleme yapılandırması hazır; GitHub Actions koşusu oluşmadığı için tam Electron Setup/Portable çıktısı henüz doğrulanmadı**

- Sürüm `0.2.0-test.1` olarak ayrıldı.
- Hedef çıktılar:
  - `Odium-Launcher-0.2.0-test.1-x64-Setup.exe`
  - `Odium-Launcher-0.2.0-test.1-x64-Portable.exe`
- `.github/workflows/build-windows-exe.yml` Windows x64 test, build, SHA-256, artifact ve prerelease yayınlama işlerini içeriyor.
- Push ve PR tetiklemeleri denendi ancak GitHub hiçbir Actions koşusu oluşturmadı. Depo Actions ayarının GitHub arayüzünden etkinleştirilmesi veya workflow'un elle çalıştırılması gerekebilir.
- Actions'a bağımlı olmayan yerel build yolu eklendi:
  - Depo kökündeki `BUILD_WINDOWS_EXE.bat` çift tıklanır.
  - `tools/build-windows-exe.ps1` Node/npm kontrolü, kurulum, otomatik test, Setup/Portable paketleme ve SHA-256 üretimini yürütür.

### Aşama 4A — Yerel Windows x64 smoke-test EXE

**Durum: Üretildi ve statik olarak doğrulandı; kullanıcı cihazı testi bekleniyor**

- Dosya: `Odium-Launcher-0.2.0-test.1-x64-SmokeTest.exe`
- SHA-256: `87b9db21aa41292d39ac44f0e16a9cb5691c546f97eb7c298a682de9c29a8d6d`
- PE türü: Windows x64 GUI (`PE32+`, `pei-x86-64`).
- Yalnızca standart Windows DLL'lerini kullanır: `kernel32`, `user32`, `gdi32`, `advapi32`, `shell32`.
- Koyu Odium test arayüzü açar.
- Steam kurulum yolunu Windows kayıt defterinden kontrol eder.
- Ana Steam kütüphanesindeki `appmanifest_*.acf` sayısını gösterir.
- Epic manifest klasörünü ve `.item` sayısını kontrol eder.
- Steam/Epic klasörlerini ve `odiumtr.com` sitesini açan düğmeler içerir.
- Bu smoke-test VDS'ye bağlanmaz, dublaj indirmez ve oyun dosyalarını değiştirmez.
- Çalışma ortamında Windows/Wine bulunmadığından dinamik çalıştırma yapılamadı; mimari, giriş noktası ve import tablosu statik olarak doğrulandı.

## İlk kullanıcı testi

1. Önce smoke-test EXE'yi Windows Defender ile tarat.
2. Açılışta SmartScreen çıkarsa ekran görüntüsü al; sürüm kod imzalı değildir.
3. Arayüz, yazılar ve pencere büyütme/küçültmeyi kontrol et.
4. Steam/Epic yollarının doğru bulunup bulunmadığını kontrol et.
5. `Yeniden Tara`, `Steam Klasörü`, `Epic Manifestleri` ve `odiumtr.com` düğmelerini dene.
6. Sonucu ve ekran görüntüsünü paylaş.
7. Bu test geçince gerçek Electron paketi için `BUILD_WINDOWS_EXE.bat` çalıştırılacak veya GitHub Actions etkinleştirilecek.

Detaylı tam launcher testleri: `docs/EXE_TEST_PLANI.md`.

## Kritik sahiplik kararı

Hesap girişi istemeyen üçüncü taraf launcher yalnızca Steam/Epic'in yerel resmî kurulum manifestlerini doğrulayabilir. Bu, resmî istemci kurulumu için güçlü yerel kanıttır ancak hesabın lisansını kriptografik olarak kesin kanıtlamaz. Kesin doğrulama istenirse Steamworks/OpenID veya Epic Account Services doğrulaması güvenli sunucu tarafında eklenmelidir.

## Üretimden önce gereken bilgiler

1. VDS'in kesin HTTPS adresi.
2. İlk oyunların Steam App ID ve/veya Epic App Name değerleri.
3. Kurulum köküne göre hazırlanmış gerçek dublaj klasörü.
4. Hugging Face yedek `resolve` URL'leri.
5. Odium logo, kapak ve hero görselleri.
6. Varsa Windows kod imzalama sertifikası.

## Bilinen sınırlar

- Smoke-test final launcher değildir; yalnızca Windows açılışı ve istemci tespitini doğrular.
- İlk EXE kod imzalı değildir, bu nedenle SmartScreen uyarısı görülebilir.
- Gerçek Steam/Epic saha testi kullanıcı cihazında yapılacaktır.
- Hugging Face'e otomatik aynalama henüz yoktur; panel yedek URL bağlar.
- İndirme duraklat/devam ettir ve paralel parça indirme sonraki aşamadadır.

## Sıradaki çalışma

**Aşama 5: Smoke-test sonucuna göre Windows uyumluluk sorunlarını düzeltmek; ardından gerçek Electron Setup/Portable EXE'lerini üretip ilk oyunu VDS ve Hugging Face kaynaklarıyla uçtan uca test etmek.**

Bu dosya her tamamlanan geliştirme aşamasından sonra güncellenmeye devam etmelidir.
