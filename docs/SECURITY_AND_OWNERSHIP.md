# Güvenlik ve Sahiplik Sınırları

## Steam/Epic lisans kontrolü

Kullanıcıdan Steam/Epic oturumu veya Odium hesabı istemeyen üçüncü taraf bir uygulama, yerel manifestlerden oyunun resmî istemciyle kurulduğunu anlayabilir; fakat hesabın oyuna kesin olarak sahip olduğunu kriptografik biçimde ispatlayamaz.

Bu sürüm şu kanıtları kullanır:

- Steam: Steam registry yolu, kütüphane VDF'si, App ID manifesti ve gerçek kurulum klasörü.
- Epic: Epic Launcher `.item` manifesti, katalog/app kimliği ve gerçek kurulum klasörü.

Daha güçlü kontrol için gelecekte ayrı bir `OwnershipProvider` eklenmelidir:

- Steam OpenID veya Steamworks auth ticket + güvenli sunucuda `CheckAppOwnership`.
- Epic Account Services / EOS Connect + entitlement doğrulaması.

Yayıncı anahtarları veya admin token hiçbir koşulda launcher EXE içine gömülmemelidir.

## Dosya güvenliği

- Manifest yollarında mutlak yol ve `..` geçişi reddedilir.
- İndirilen her dosya hedefe uygulanmadan önce boyut ve SHA-256 ile doğrulanır.
- Dosyalar önce kullanıcı veri dizisindeki staging alanına indirilir.
- Orijinal dosyalar ilk değişiklikte kullanıcı veri dizisine yedeklenir.
- Admin uç noktaları sabit zamanlı token karşılaştırması kullanır.
- Admin token Git'e veya katalog JSON'una yazılmamalıdır.

## Açık VDS dosyaları

Kullanıcının tarifine uygun olarak VDS indirme dosyaları herkese açık GET uç noktalarından sunulur. URL'yi bilen biri dosyayı launcher dışında da indirebilir. Bunu azaltmak için ileride kısa ömürlü imzalı URL ve indirme bileti eklenebilir; kullanıcı kimliği olmadan tam erişim kontrolü sağlanamaz.
