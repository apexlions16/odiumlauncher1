# VDS Kurulumu

## 1. Dosyaları yerleştirin

```bash
sudo mkdir -p /opt/odium-launcher
sudo chown -R $USER:$USER /opt/odium-launcher
git clone https://github.com/apexlions16/odiumlauncher1.git /opt/odium-launcher
cd /opt/odium-launcher
```

Admin sunucusu haricî npm paketi kullanmadığı için yalnızca Node.js 20+ gerekir.

## 2. Ortam değişkenleri

```bash
export ODIUM_ADMIN_HOST=127.0.0.1
export ODIUM_ADMIN_PORT=4178
export ODIUM_PUBLIC_BASE_URL=https://launcher.odiumtr.com
export ODIUM_ADMIN_TOKEN="uzun-ve-rastgele-bir-deger"
export ODIUM_CORS_ORIGIN="*"
export ODIUM_DATA_DIR=/var/lib/odium-launcher
node admin/server.js
```

`ODIUM_PUBLIC_BASE_URL` dışarıdan erişilen gerçek HTTPS adresi olmalıdır. Manifest ve dosya URL'leri yayın anında bu değerden üretilir.

## 3. systemd

`deploy/odium-admin.service` dosyasını düzenleyip `/etc/systemd/system/odium-admin.service` olarak kopyalayın.

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now odium-admin
sudo systemctl status odium-admin
```

## 4. Nginx ve HTTPS

`deploy/nginx.conf.example` içindeki alan adını değiştirin. Büyük dublaj dosyaları için `client_max_body_size 0` kullanılmıştır.

## 5. Launcher katalog adresi

Launcher > Ayarlar > Katalog adresi:

```text
https://launcher.odiumtr.com/api/public/catalog.json
```

İlk dağıtımda varsayılan yapmak için `launcher/src/services/catalog-service.js` içindeki `DEFAULT_CATALOG_URL` değiştirilip EXE bir kez oluşturulur. Sonraki oyun/haber/sürüm değişiklikleri EXE güncellemesi gerektirmez.

## 6. Windows EXE üretimi

```powershell
npm install
npm run check
npm --workspace launcher run dist
```

Çıktılar `release/` klasöründe NSIS kurucu ve portable EXE olarak oluşur.
