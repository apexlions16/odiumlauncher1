# Yol Haritası

## Tamamlanan temel

- Steam ve Epic resmî kurulum tespiti.
- Uzak katalogdan oyun, haber, rozet ve sürüm yönetimi.
- VDS birincil + Hugging Face yedek indirme.
- Boyut ve SHA-256 tabanlı değişiklik/güncelleme tespiti.
- Staging, yedekleme, kurulum, onarım ve kaldırma.
- Oyun doğrulamasından sonra stale durum kaydını temizleme.
- Token korumalı admin paneli.
- Klasör yükleme ve otomatik manifest yayınlama.
- CI ve çekirdek testleri.

## Sonraki önerilen aşamalar

1. Windows üzerinde gerçek Steam/Epic oyunlarıyla entegrasyon testi ve gerçek App ID kataloğu.
2. Electron otomatik güncelleyici ve imzalı GitHub Release kanalı.
3. İndirme duraklat/devam ettir, HTTP Range ve paralel parça indirme.
4. Hugging Face'e VDS yayınını otomatik aynalayan sunucu işi.
5. Admin panelinde sürüm geçmişi, geri alma ve dosya diff görünümü.
6. Steamworks/EOS tabanlı isteğe bağlı kesin sahiplik sağlayıcısı.
7. Kod imzalama sertifikası ve Windows SmartScreen dağıtım süreci.
