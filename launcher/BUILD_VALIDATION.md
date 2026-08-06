# Windows EXE Build Validation

Bu dosya `0.2.0-test.1` Windows x64 NSIS ve portable paketlerinin doğrulanması için oluşturulmuştur.

Başarılı doğrulama kriterleri:

- Otomatik çekirdek testleri geçmeli.
- Electron uygulaması paketlenmeli.
- NSIS Setup EXE üretilmeli.
- Portable EXE üretilmeli.
- SHA-256 toplamları oluşturulmalı.
- Üç dosya tek GitHub Actions artifact'ında yayınlanmalı.
