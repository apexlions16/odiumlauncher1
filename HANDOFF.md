# Odium Launcher — Handoff

Son güncelleme: 6 Ağustos 2026  
Depo: `apexlions16/odiumlauncher1`  
Aktif test sürümü: `0.2.0-test.1`

## Projenin amacı

Odium Stüdyo'nun kendi hazırladığı Türkçe dublajları, resmî Steam/Epic oyun kurulumlarına kullanıcı hesabı olmadan uygulayan masaüstü launcher ve bu launcher'ı uzaktan yöneten VDS tabanlı admin/yayın sistemi.

## Tamamlanan aşamalar

### Aşama 0 — Depo ve mimari

**Durum: Tamamlandı**

- Boş depo için monorepo yapısı oluşturuldu.
- Masaüstü launcher için Electron, sunucu için bağımsız Node.js mimarisi seçildi.
- Katalog ve sürüm manifesti JSON şemaları tanımlandı.
- Oyun/haber/sürüm verilerinin EXE içine gömülmemesi kararlaştırıldı.
- Launcher kullanıcıları için hesap sistemi eklenmedi.
- Admin işlemleri `ODIUM_ADMIN_TOKEN` ile ayrıldı.

### Aşama 1 — Launcher çekirdeği ve arayüz

**Durum: Tamamlandı**

- Modern, koyu Odium arayüzü ve dar ekranlara uyarlanan responsive düzen.
- Oyun kütüphanesi, detay sayfası, haberler, ayarlar ve kurulum ilerleme ekranı.
- Steam registry + `libraryfolders.vdf` + `appmanifest_<appid>.acf` tespiti.
- Epic `.item` manifest taraması.
- Uzak katalog ve çevrimdışı katalog önbelleği.
- Sürüm manifesti alma ve güvenli göreli yol doğrulaması.
- Dosya boyutu + SHA-256 ile kurulu/güncel/onarım/güncelleme tespiti.
- Dosya bazında VDS birincil, Hugging Face ikincil kaynak geçişi.
- Staging klasörüne indirme, hash doğrulama, orijinal dosya yedekleme ve güvenli uygulama.
- Dublaj kaldırma ve orijinal dosyaları geri yükleme.
- Oyun doğrulaması dublajı geri aldıktan sonra stale kurulum kaydını otomatik temizleme.
- Launcher'a özel rozet ve uzaktan yönetilen marka vurgu rengi.

### Aşama 2 — Admin paneli ve VDS yayın servisi

**Durum: Tamamlandı**

- Token korumalı responsive web admin paneli.
- Oyun ekleme/düzenleme/silme.
- Steam App ID, Epic App Name, çalıştırılabilir dosya, açıklama, kapak ve hero görseli yönetimi.
- Launcher görünürlüğü ve launcher'a özel rozet yönetimi.
- Haber oluşturma, görsel yükleme, öne çıkarma ve silme.
- Marka adı, site, destek URL'si ve vurgu rengi yönetimi.
- Dublaj klasörünü alt klasör yapısını koruyarak VDS'e yükleme.
- Sunucuda otomatik SHA-256 manifest üretimi.
- Aktif sürümü ve yayın notlarını katalogda yayınlama.
- Hugging Face yedek klasör URL'sini sürüme bağlama.
- Herkese açık katalog, manifest, görsel ve indirme uç noktaları.
- Docker, systemd ve Nginx dağıtım örnekleri.

### Aşama 3 — Test, güvenlik ve dokümantasyon

**Durum: Tamamlandı**

- Node.js yerleşik test sistemiyle 7 çekirdek test.
- Test edilenler: VDF ayrıştırma, yol kaçışı engeli, manifest üretimi, kaynak fallback, kurulum/kaldırma, yedek geri yükleme ve oyun doğrulamasından sonra durum temizleme.
- `npm run check` yerel çalışma ortamında başarıyla tamamlandı.
- Admin sunucusu katalog, dosya yükleme, yayınlama ve manifest indirme akışı yerel entegrasyon testiyle doğrulandı.
- GitHub Actions CI eklendi.
- Mimari, VDS dağıtımı, admin kullanımı, güvenlik/sahiplik sınırları ve yol haritası belgeleri eklendi.

### Aşama 4 — Windows EXE üretimi ve saha test planı

**Durum: Derleme hattı hazır, ilk Windows build sonucu bekleniyor**

- Launcher ve monorepo sürümü `0.2.0-test.1` olarak ayrıldı.
- `windows-latest` üzerinde çalışan `Build Windows EXE` GitHub Actions iş akışı eklendi.
- Her build öncesinde otomatik test ve sözdizimi kontrolleri çalıştırılıyor.
- x64 NSIS kurulum dosyası üretiliyor: `Odium-Launcher-0.2.0-test.1-x64-Setup.exe`.
- x64 taşınabilir dosya üretiliyor: `Odium-Launcher-0.2.0-test.1-x64-Portable.exe`.
- EXE dosyaları için `SHA256SUMS.txt` oluşturuluyor.
- Başarılı build, 30 günlük Actions artifact'ı ve `v0.2.0-test.1` ön sürüm release'i olarak yayınlanacak.
- Kullanıcının adım adım uygulayacağı test rehberi `docs/EXE_TEST_PLANI.md` dosyasına yazıldı.

## Kritik sahiplik kararı

Hesap girişi istemeyen üçüncü taraf bir launcher, yalnızca Steam/Epic'in yerel resmî kurulum manifestlerini doğrulayabilir. Bu, resmî istemci kurulumu için güçlü bir yerel kanıttır fakat kullanıcının lisansını kriptografik olarak kesin doğrulamaz.

Kesin sahiplik istenirse sonraki aşamada:

- Steam OpenID veya Steamworks auth ticket + güvenli sunucuda `CheckAppOwnership`,
- Epic Account Services / EOS entitlement doğrulaması

eklenmelidir. Yayıncı anahtarları kesinlikle launcher EXE içine konulmamalıdır.

## Çalıştırma

### Admin sunucusu

```bash
export ODIUM_PUBLIC_BASE_URL=https://launcher.odiumtr.com
export ODIUM_ADMIN_TOKEN="uzun-rastgele-token"
export ODIUM_DATA_DIR=/var/lib/odium-launcher
node admin/server.js
```

### Launcher geliştirme

```bash
npm install
npm run dev
```

### Windows EXE üretimi

```powershell
npm install
npm run check
npm run dist:win
```

GitHub üzerinde `.github/workflows/build-windows-exe.yml` dosyası aynı işlemi Windows runner'da otomatik gerçekleştirir.

## EXE test sırası

1. Portable EXE ilk açılış ve responsive arayüz.
2. Setup EXE kurulum, kısayol ve kaldırma.
3. Steam/Epic oyun tespiti.
4. Küçük ve geri alınabilir test paketi kurulumu.
5. Dublaj kaldırma ve orijinal dosya geri yükleme.
6. Yeni manifest sürümüyle güncelleme tespiti.
7. VDS kapalıyken Hugging Face fallback.
8. Steam/Epic dosya doğrulamasından sonra yeniden indirme durumu.

Detaylı yönergeler: `docs/EXE_TEST_PLANI.md`.

## Üretimden önce gereken bilgiler

1. VDS'in kesin alan adı veya HTTPS URL'si.
2. İlk eklenecek oyunların Steam App ID ve/veya Epic App Name değerleri.
3. Her oyunun gerçek kurulum köküne göre hazırlanmış dublaj klasörü.
4. Hugging Face yedek depo ve `resolve` klasör URL'leri.
5. Odium logo dosyaları, kapaklar ve hero görselleri.
6. Windows uygulama kod imzalama sertifikası varsa sertifika bilgileri.

## Bilinen sınırlar

- İlk test EXE'leri kod imzalı değildir; Windows SmartScreen uyarısı görülebilir.
- Gerçek Windows Steam/Epic kurulumlarıyla saha testi kullanıcı cihazında yapılacaktır.
- Hugging Face'e otomatik aynalama henüz yok; panel sürüme yedek URL bağlar.
- İndirme duraklat/devam ettir ve paralel parça indirme sonraki aşamaya bırakıldı.
- Steam/Epic “dosyaları doğrula” işlemi sonradan eklenmiş ekstra dosyaları her zaman silmeyebilir. Tam kaldırma için launcher'daki kaldırma düğmesi güvenilir yoldur.

## Sıradaki önerilen çalışma

**Aşama 5: İlk EXE saha testindeki hataları düzeltmek, gerçek VDS adresini bağlamak, ilk oyunu admin paneline eklemek ve gerçek dublaj klasörüyle uçtan uca kurulum testi yapmak.**

Bu dosya her tamamlanan geliştirme aşamasından sonra güncellenmeye devam etmelidir.
