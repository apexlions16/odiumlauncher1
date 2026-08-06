# Odium Launcher — Handoff

Son güncelleme: 6 Ağustos 2026

## Aşama 0 — Depo ve mimari

**Durum: Tamamlandı**

- Electron launcher, bağımsız Node.js admin/yayın servisi ve ortak manifest sözleşmeleri kuruldu.
- Oyun, haber, görsel ve yayın bilgileri EXE'den bağımsız bir katalogdan yönetiliyor.

## Aşama 1 — Launcher çekirdeği ve arayüz

**Durum: Tamamlandı**

- Modern, koyu, animasyonlu ve responsive Odium arayüzü hazırlandı.
- Steam kayıt defteri, kütüphane VDF'leri ve uygulama manifestleri taranıyor.
- Epic `.item` manifestleri taranıyor.
- Dosyalar boyut ve SHA-256 ile karşılaştırılıyor.
- İndirme sırası VDS → Hugging Face olarak çalışıyor.
- Dosyalar staging alanında doğrulanıp atomik uygulanıyor.
- Orijinal dosyalar yedekleniyor ve dublaj kaldırıldığında geri yükleniyor.
- Oyun doğrulaması dublajı geri alırsa “Yeniden indir” durumu açılıyor.
- Launcher tarafında kullanıcı hesabı veya login bulunmuyor.

## Aşama 2 — Admin paneli ve yayın servisi

**Durum: Tamamlandı**

- VDS üzerinde bağımsız çalışacak, haricî npm paketine ihtiyaç duymayan Node.js HTTP servisi eklendi.
- Admin yazma uçları Bearer token ve zaman sabitli karşılaştırma ile korunuyor.
- Katalog, oyun, Steam/Epic tanımları, açıklamalar, görseller, etiketler ve görünürlük yönetilebiliyor.
- “Launcher'a Özel” rozeti ve isteğe bağlı bitiş zamanı yönetilebiliyor.
- Haber ekleme, düzenleme, silme, öne çıkarma ve oyunla ilişkilendirme eklendi.
- Marka adı, web sitesi, destek adresi ve vurgu rengi EXE'den bağımsız değiştirilebiliyor.
- Görseller VDS'ye yüklenip doğrudan URL olarak kullanılabiliyor.
- Dublaj klasörü tarayıcıdan klasör yapısı korunarak yükleniyor.
- Sunucu yayın sırasında bütün dosyaları SHA-256 ile tarayıp `manifest.json` üretiyor.
- Yayın tamamlanınca katalogdaki sürüm, boyut, VDS ve Hugging Face kaynakları otomatik güncelleniyor.
- Admin paneli masaüstü, tablet ve dar ekranlara responsive hazırlandı.

### Sahiplik doğrulaması sınırı

Hesap girişi istemeyen üçüncü taraf launcher gerçek hesap lisansını kriptografik olarak doğrulayamaz. Şu an resmî istemci manifesti ve gerçek kurulum klasörü doğrulanır. Steamworks/EOS tabanlı daha güçlü doğrulama ayrı sağlayıcı olarak eklenebilir.

## Sıradaki aşama

Aşama 3: otomatik testler, CI, VDS dağıtım dosyaları, güvenlik/kurulum belgeleri ve üretim handoff'u.
