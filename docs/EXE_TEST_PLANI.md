# Odium Launcher EXE Test Planı

Sürüm: `0.2.0-test.1`

Bu belge, Windows EXE testlerini aşama aşama yürütmek için hazırlanmıştır. Bir aşamada hata görülürse sonraki aşamaya geçmeden ekran görüntüsü, hata metni ve mümkünse `%APPDATA%/odium-launcher` içeriği paylaşılmalıdır.

## Aşama 1 — Dosya güvenliği ve ilk açılış

Önce `Odium-Launcher-0.2.0-test.1-x64-portable.exe` dosyasını deneyin.

1. EXE'yi boş bir klasöre koyun.
2. Windows Defender ile dosyayı taratın.
3. EXE'yi çift tıklayın.
4. Windows SmartScreen uyarısı çıkarsa ekran görüntüsünü alın. Test sürümü kod imzalı olmadığı için bu uyarı beklenebilir.
5. Launcher penceresinin açıldığını ve siyah/modern Odium arayüzünün düzgün göründüğünü doğrulayın.
6. Pencereyi küçültüp büyütün; dar genişlikte kartların taşmadığını kontrol edin.
7. Launcher'ı kapatıp yeniden açın.

Beklenen sonuç: Uygulama çökmeden açılır, arayüz görünür ve ikinci açılışta da çalışır.

## Aşama 2 — Kurulumlu sürüm

`Odium-Launcher-0.2.0-test.1-x64-nsis.exe` dosyasını çalıştırın.

1. Özel kurulum klasörü seçilebildiğini kontrol edin.
2. Masaüstü ve Başlat menüsü kısayollarını kontrol edin.
3. Kısayoldan launcher'ı açın.
4. Windows Ayarlar > Uygulamalar bölümünde Odium Launcher'ın göründüğünü doğrulayın.
5. Uygulamayı kaldırın ve kurulum klasörünün temizlendiğini kontrol edin.

Beklenen sonuç: Kurulum, açılış ve kaldırma işlemleri hatasız tamamlanır.

## Aşama 3 — Steam ve Epic oyun tespiti

Bu test için bilgisayarda resmî Steam veya Epic istemcisinden kurulmuş en az bir oyun gerekir. Oyunun katalogda tanımlı Steam App ID veya Epic App Name bilgisi de admin panelinden eklenmiş olmalıdır.

1. Steam ve/veya Epic Games Launcher'ı açın.
2. Odium Launcher'da Yenile düğmesine basın.
3. Tanımlı oyunun yüklü olarak algılanıp algılanmadığını kontrol edin.
4. Oyun başka bir Steam kütüphanesinde veya farklı diskteyse yolun doğru bulunduğunu kontrol edin.
5. Kurulum klasörünü aç düğmesini deneyin.
6. Oyunu başlat düğmesini deneyin.

Beklenen sonuç: Launcher yalnızca resmî istemci manifesti ve gerçek kurulum klasörü bulunan oyunu yüklü gösterir.

## Aşama 4 — Test dublajı kurulumu

Gerçek oyun dosyalarıyla ilk denemeden önce küçük ve geri alınabilir bir test paketi kullanılması önerilir.

1. Oyun klasöründe kolayca doğrulanabilecek küçük bir test dosyası belirleyin.
2. Dosyanın orijinal kopyasını ayrıca elle yedekleyin.
3. Admin panelinden test sürümünü yayınlayın.
4. Launcher'da katalog yenilemesi yapın.
5. Dublajı indir düğmesine basın.
6. İndirme yüzdesi ve durum mesajlarını takip edin.
7. İşlem sonunda dosyanın beklenen SHA-256 içeriğiyle değiştiğini kontrol edin.
8. Oyunu çalıştırıp test değişikliğini doğrulayın.

Beklenen sonuç: Dosya önce geçici alana iner, hash doğrulanır, orijinali yedeklenir ve ardından oyun klasörüne uygulanır.

## Aşama 5 — Kaldırma ve geri yükleme

1. Launcher'da dublajı kaldır seçeneğini kullanın.
2. Test dosyasının orijinal hâline döndüğünü doğrulayın.
3. Oyunu başlatın ve orijinal içeriğin geri geldiğini kontrol edin.
4. Launcher'ı kapatıp açın; durumun tekrar indirilebilir olduğunu kontrol edin.

Beklenen sonuç: Dublaj kaldırılır ve yedeklenen orijinal dosya geri yüklenir.

## Aşama 6 — Güncelleme tespiti

1. Admin panelinden aynı oyun için daha yüksek sürüm numarasıyla yeni dosya yayınlayın.
2. Launcher'da Yenile düğmesine basın.
3. Güncelle seçeneğinin göründüğünü kontrol edin.
4. Güncellemeyi kurun.
5. Değişmeyen dosyaların tekrar indirilmediğini, değişen/yeni dosyaların indirildiğini kontrol edin.
6. Güncelleme sonrasında sürüm durumunu doğrulayın.

Beklenen sonuç: Manifestte boyutu veya SHA-256 değeri değişen dosyalar güncelleme olarak algılanır.

## Aşama 7 — VDS kesintisi ve Hugging Face yedeği

1. Test sürümünün hem VDS hem Hugging Face URL'sini tanımlayın.
2. VDS kaynağını geçici olarak erişilemez hâle getirin veya test için hatalı VDS URL'si yayınlayın.
3. Dublaj indirmesini başlatın.
4. Launcher'ın dosya bazında Hugging Face yedeğine geçtiğini kontrol edin.
5. İndirme tamamlandıktan sonra kurulum hashlerini doğrulayın.

Beklenen sonuç: VDS başarısız olduğunda işlem tamamen durmaz; Hugging Face kaynağı kullanılır.

## Aşama 8 — Oyun dosyalarını doğrulama senaryosu

1. Dublaj kurulu durumdayken Steam/Epic üzerinden oyun dosyalarını doğrulayın.
2. Launcher'ı yeniden açın veya Yenile düğmesine basın.
3. Değiştirilen dosyalar mağaza istemcisi tarafından geri alındıysa launcher'ın dublajı eksik/eski olarak algıladığını kontrol edin.
4. Yeniden indir seçeneğini deneyin.

Not: Mağaza istemcileri oyuna sonradan eklenen ekstra dosyaları her zaman silmeyebilir. Kesin temiz kaldırma için launcher'ın Dublajı Kaldır düğmesi kullanılmalıdır.

## Hata bildirirken gönderilecekler

- Hangi EXE kullanıldı: portable veya NSIS
- Windows sürümü
- Hangi aşamada hata oluştu
- Tam hata mesajı ve ekran görüntüsü
- Steam/Epic ve oyun adı
- Oyun kurulum yolu
- Katalog ve manifest URL'leri
- Mümkünse `%APPDATA%/odium-launcher` veya ilgili Odium Launcher kullanıcı veri klasöründeki hata durumu

## İlk testte önerilen sıra

`Portable açılış → responsive arayüz → NSIS kurulum/kaldırma → oyun tespiti → küçük test paketi → kaldırma → güncelleme → VDS fallback`
