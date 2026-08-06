# Mimari

## Launcher (`launcher/`)

Electron tabanlı masaüstü istemcidir. İçine oyun, haber veya sürüm bilgisi gömülmez. Açılışta admin/yayın sunucusundaki katalog API'sini okur ve yerel önbelleğe alır.

Ana servisler:

- `CatalogService`: uzak katalog ve çevrimdışı önbellek.
- `SteamDetector`: Registry, `libraryfolders.vdf` ve `appmanifest_<appid>.acf` taraması.
- `EpicDetector`: `%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests\*.item` taraması.
- `ManifestService`: sürüm manifesti doğrulaması ve yol güvenliği.
- `PatchService`: boyut/hash karşılaştırma, kaynak geçişi, staging, yedekleme, kurulum ve kaldırma.
- `StateStore`: her oyun için kurulu sürüm ve orijinal dosya yedekleri.

## Admin/yayın sunucusu (`admin/`)

Haricî paket gerektirmeyen Node.js HTTP servisidir. Yönetim panelini ve halka açık launcher kataloğunu sunar; haber ve oyun meta verisini saklar; görsel ve dublaj dosyalarını servis eder; klasör yapısını koruyarak yükleme kabul eder ve SHA-256 manifesti üretir.

Admin yazma uç noktaları `Authorization: Bearer <ODIUM_ADMIN_TOKEN>` ile korunur. Launcher'ın GET uç noktaları kullanıcı hesabı gerektirmez.

## Hugging Face yedeği

Admin yayın formuna ilgili sürümün Hugging Face `resolve` klasör URL'si yazılır. Launcher her dosyada önce `primaryBaseUrl`, hata veya hash uyuşmazlığı olursa `fallbackBaseUrl` kullanır.

Hugging Face'e yükleme ilk sürümde otomatik değildir. VDS'deki yayın klasörü aynı yollarla Hugging Face'e aynalanmalıdır.

## Güncelleme modeli

Her dublaj sürümünde bir `manifest.json` bulunur. Launcher hedef oyundaki her dosyayı manifestteki boyut ve SHA-256 ile karşılaştırır. Yeni dosya, değişmiş hash, değişmiş boyut veya yeni sürüm otomatik olarak indirme/güncelleme durumuna dönüşür.

## Oyun doğrulaması sonrası durum

Platform doğrulaması değiştirilmiş resmî dosyaları geri yüklerse launcher bir sonraki taramada dublaj hash'lerinin kaybolduğunu görür. Yerel kurulum kaydı temizlenir ve buton “Yeniden indir” olur.

Steam/Epic doğrulamasının oyuna sonradan eklenmiş bilinmeyen dosyaları her zaman sileceği garanti edilemez. Tam kaldırma için launcher'daki “Dublajı kaldır” düğmesi kullanılmalıdır.
