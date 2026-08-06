# Odium Launcher Suite

Odium Stüdyo'nun dublajlarını resmî Steam/Epic kurulumlarına uygulayan, VDS öncelikli ve Hugging Face yedekli içerik dağıtım sistemi.

Bu depo üç parçadan oluşur:

- `launcher/`: Kullanıcının indirdiği masaüstü uygulaması.
- `admin/`: VDS üzerinde çalışan yayın ve yönetim sunucusu.
- `tools/`: Dublaj klasörlerinden SHA-256 manifesti üreten yardımcı araçlar.

## Temel davranış

1. Launcher uzaktaki katalogdan oyunları, haberleri ve güncel sürüm bilgisini çeker.
2. Steam `appmanifest_*.acf` ve Epic `.item` manifestleri taranır.
3. Resmî kurulum bulunursa ilgili dublaj manifesti alınır.
4. Yerel dosyalar boyut ve SHA-256 ile karşılaştırılır.
5. Eksik/değişmiş dosyalar önce VDS'den, hata olursa Hugging Face kaynağından indirilir.
6. Her dosya kurulmadan önce hash doğrulaması yapılır; orijinal dosya ilk kurulumda yedeklenir.
7. Oyun doğrulaması dublaj dosyalarını geri alırsa launcher durumu yeniden tarayıp kurulumu geçersiz sayar ve “Yeniden indir” seçeneğini açar.

## Geliştirme

```bash
npm install
npm run admin
npm run dev
```

Admin sunucusu varsayılan olarak `http://localhost:4178`, launcher katalog adresi de aynı URL'dir. Launcher içinden Ayarlar bölümünde katalog URL'si değiştirilebilir.

## Güvenlik notu

Steam/Epic hesabına giriş istemeyen bir üçüncü taraf launcher, yalnızca yerel resmî istemci manifestlerinden kurulum kanıtı elde edebilir. Kesin lisans/sahiplik doğrulaması için Steamworks/EOS tarafından desteklenen kullanıcı kimliği ve güvenli sunucu doğrulaması gerekir. Kod, daha sonra böyle bir sağlayıcının eklenebilmesi için `ownership` katmanını ayrı tutar.

## Durum ve devam noktası

Her geliştirme aşamasının güncel özeti, kararları ve sıradaki işleri [`HANDOFF.md`](./HANDOFF.md) içinde tutulur.

## Belgeler

- [Mimari](docs/ARCHITECTURE.md)
- [VDS kurulumu](docs/DEPLOYMENT.md)
- [Admin paneli rehberi](docs/ADMIN_GUIDE.md)
- [Güvenlik ve sahiplik sınırları](docs/SECURITY_AND_OWNERSHIP.md)
- [Yol haritası](docs/ROADMAP.md)
