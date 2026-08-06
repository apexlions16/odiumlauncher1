# Admin Paneli Kullanımı

1. VDS adresini tarayıcıda açın.
2. `ODIUM_ADMIN_TOKEN` değerini girin. Token yalnızca sekmenin `sessionStorage` alanında tutulur.
3. **Oyunlar** bölümünden oyun kimliği, Steam App ID veya Epic App Name, görseller ve açıklamaları ekleyin.
4. **Dublaj Yayınla** bölümünde oyunu ve sürümü seçin.
5. Oyun kök dizinine göre hazırlanmış dublaj klasörünü seçin. Örneğin seçilen klasörün içinde `Content/Paks/...` yapısı bulunmalıdır.
6. Hugging Face'teki aynı klasör yapısının `resolve` URL'sini yedek kaynak olarak yazın.
7. “Yükle ve yayınla” düğmesine basın.

Sunucu dosyaları VDS'e kaydeder, bütün dosyaların SHA-256 değerini üretir, `manifest.json` oluşturur ve oyunun aktif sürümünü katalogda günceller.

## Haberler

Haber başlığı, özet, görsel ve isteğe bağlı ilgili oyun seçilebilir. Katalog yayınlandığı anda launcher'ın Haberler sekmesine gelir.

## Launcher'a özel rozet

Oyun düzenleme ekranındaki “Launcher'a özel rozeti” aktif edildiğinde `launcherExclusive.enabled` açılır. Kullanıcı uygulamasında otomatik olarak özel rozet gösterilir.

## Görseller

Görsel yükleme alanı dosyayı VDS'e gönderir ve oluşan URL'yi panoya kopyalar. Dış CDN URL'leri de doğrudan kullanılabilir.
