# Odium Launcher — Handoff

Son güncelleme: 6 Ağustos 2026

## Aşama 0 — Depo ve mimari

**Durum: Tamamlandı**

- Boş depo için monorepo yapısı kuruldu.
- Launcher için Electron, VDS admin/yayın servisi için bağımsız Node.js mimarisi seçildi.
- Katalog ve dublaj sürümü manifest sözleşmeleri tanımlandı.
- Oyun, haber ve yayın bilgilerinin EXE içine gömülmemesi kararlaştırıldı.

## Aşama 1 — Launcher çekirdeği ve arayüz

**Durum: Tamamlandı**

- Koyu, modern, animasyonlu ve responsive Odium arayüzü oluşturuldu.
- Kütüphane, oyun detayları, haberler, ayarlar ve kurulum ilerleme ekranı eklendi.
- Steam kayıt defteri, `libraryfolders.vdf` ve `appmanifest_*.acf` üzerinden resmî kurulum tespiti eklendi.
- Epic `.item` manifestleri üzerinden resmî kurulum tespiti eklendi.
- Dublaj dosyaları boyut ve SHA-256 ile karşılaştırılıyor.
- Her dosya önce VDS'den, başarısız olursa Hugging Face kaynağından indiriliyor.
- İndirmeler geçici klasörde doğrulanıp daha sonra oyun klasörüne atomik olarak uygulanıyor.
- Değiştirilen orijinal dosyalar kaldırma işlemi için yedekleniyor.
- Steam/Epic dosya doğrulaması dublajı geri alırsa launcher bunu algılayıp “Yeniden indir” durumuna geçiyor.
- Oyun çalıştırma ve kurulum klasörünü açma işlemleri eklendi.
- Launcher kullanıcıları için login sistemi bulunmuyor.

### Sahiplik doğrulaması sınırı

Hesap girişi istemeyen üçüncü taraf bir launcher, Steam/Epic hesabındaki lisansı kriptografik olarak doğrulayamaz. Bu aşama resmî istemci manifestini ve gerçek kurulum klasörünü doğrular. Daha güçlü doğrulama daha sonra Steamworks/EOS kimliğiyle ayrı sağlayıcı olarak eklenebilir.

## Sıradaki aşama

Aşama 2: VDS üzerinde çalışacak admin/yayın servisi, oyun-haber yönetimi, görsel yükleme, klasör halinde dublaj yükleme ve otomatik manifest yayınlama.
