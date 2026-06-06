# Antikoagülasyon Takip

Antikoagülan tedavi gören hastalar için **eğitim** ve **günlük takip** mobil uygulaması.
Hastalar; antikoagülasyon eğitimi alır, günlük ilaç alımını ve semptomlarını kaydeder.
Araştırmacılar (ve yönetici) hasta kayıtlarını oluşturur, raporları ve mesajları takip eder.

- **Mobil**: Expo (React Native + TypeScript) — tek kod tabanı, App Store & Google Play.
- **Backend**: Supabase — Auth, Postgres (RLS), Storage, Edge Functions.
- **Web paneli**: Aynı kod tabanı `expo export -p web` ile statik web olarak Vercel/Netlify'a
  ücretsiz deploy edilebilir (araştırmacı masaüstü paneli).

## Roller

| Rol | Yetki |
|-----|-------|
| **admin** | Sistemi yönetir, araştırmacı oluşturur, **tüm** hastaları/raporları görür, içerik & ayarları düzenler. |
| **researcher** (araştırmacı) | Hasta kaydı oluşturur, **yalnızca kendi** hastalarının rapor ve mesajlarını görür. |
| **patient** (hasta) | Eğitim içerikleri, kayıt günlüğü (ilaç + semptom), soru sor. |

Hastalar **kayıt numarası + şifre** ile giriş yapar. Kayıt numarası dahili olarak
`<kayıtno>@tedavitakip.local` auth e-postasına eşlenir. Hasta hesabını araştırmacı oluşturur;
hasta ilk girişte kendi şifresini belirler.

---

## 1) Gereksinimler

- Node.js 20+ ve npm
- Bir [Supabase](https://supabase.com) projesi (ücretsiz katman yeterli)
- Mobil derleme/yayın için [EAS CLI](https://docs.expo.dev/eas/) (`npm i -g eas-cli`)

## 2) Kurulum

```bash
npm install
cp .env.example .env   # değerleri Supabase projenizden doldurun
```

`.env` içeriği (Supabase → Project Settings → API):

```
EXPO_PUBLIC_SUPABASE_URL=https://<proje-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
EXPO_PUBLIC_PATIENT_EMAIL_DOMAIN=tedavitakip.local
```

## 3) Veritabanı kurulumu

`supabase/` klasöründeki SQL'leri sırayla çalıştırın (Supabase → SQL Editor, ya da
Supabase CLI ile `supabase db push`):

1. `supabase/migrations/0001_init.sql` — tablolar, fonksiyonlar, RLS
2. `supabase/migrations/0002_storage.sql` — `education-media` Storage bucket'ı
3. `supabase/migrations/0003_submit_report.sql` — atomik semptom raporu kaydı (RPC)
4. `supabase/seed.sql` — semptom listesi + örnek eğitim içerikleri + ayarlar

### İlk yönetici (admin) hesabını oluşturma

1. Supabase → **Authentication → Users → Add user** ile bir kullanıcı ekleyin:
   - Email: `admin@tedavitakip.local` (kullanıcı adınız `admin` olur)
   - Password: güçlü bir şifre, **Auto confirm user** açık
2. Oluşan kullanıcının **UID**'sini kopyalayın ve SQL Editor'da çalıştırın:

```sql
insert into public.profiles (id, role, registration_number, full_name, password_set)
values ('<AUTH_USER_UID>', 'admin', 'admin', 'Sistem Yöneticisi', true);
```

Artık uygulamadan kullanıcı adı `admin` ve belirlediğiniz şifre ile giriş yapabilirsiniz.
Araştırmacıları ve hastaları uygulama içinden oluşturursunuz.

## 4) Edge Functions deploy

Service role gerektiren işlemler Edge Functions ile yapılır (anahtar istemciye gitmez):

```bash
# Supabase CLI ile (bir kez): supabase login && supabase link --project-ref <ref>
supabase functions deploy admin-create-patient
supabase functions deploy admin-create-researcher
supabase functions deploy patient-set-password

# Hasta kayıt numarası → e-posta alan adı (uygulamadaki ile AYNI olmalı):
supabase secrets set PATIENT_EMAIL_DOMAIN=tedavitakip.local
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` Edge Functions'a
> Supabase tarafından otomatik sağlanır.

## 5) Eğitim videosu

1. Videoyu Supabase → **Storage → education-media** bucket'ına yükleyin.
2. Public URL'yi kopyalayın.
3. Uygulamada **admin** ile giriş → **İçerik Yönetimi → Eğitim Videosu → Video Bağlantısı**
   alanına yapıştırıp kaydedin.

Eğitim metinlerini de aynı ekrandan düzenleyebilirsiniz.

---

## Geliştirme

```bash
npm run start      # Expo geliştirme sunucusu (Expo Go / dev client)
npm run ios        # iOS simülatör
npm run android    # Android emülatör
npm run web        # Tarayıcıda
npm run typecheck  # TypeScript tip kontrolü
```

## Mobil yayın (App Store & Google Play)

```bash
eas build -p ios --profile production
eas build -p android --profile production
eas submit -p ios --latest
eas submit -p android --latest
```

`app.json` içinde `ios.bundleIdentifier` ve `android.package` = `com.tedavitakip.app`.
Uygulama ikon/splash görselleri `assets/` klasöründedir (placeholder; nihai görsellerle
değiştirin).

> **Gizlilik:** Uygulama sağlık verisi işler. App Store / Google Play, **gizlilik politikası
> URL'si** ve veri kullanım beyanı (App Privacy / Data Safety) ister. Bir gizlilik politikası
> taslağı `PRIVACY.md` dosyasındadır; bunu (örn. Vercel/Netlify'da statik bir sayfa olarak)
> yayınlayıp URL'sini mağaza formlarına girin. KVKK/GDPR kapsamında aydınlatma metni ve açık
> rıza gereklidir.

## Web paneli (ücretsiz)

```bash
npm run export:web   # dist/ klasörü üretir
```

`dist/` çıktısını Vercel veya Netlify'a statik site olarak deploy edin. Araştırmacı/yönetici
aynı kullanıcı adıyla web üzerinden giriş yapıp panelleri masaüstünde kullanabilir.

## Mimari özeti

```
app/                     Expo Router rotaları
  (auth)/                giriş, şifre belirleme
  (patient)/             ana menü, eğitim, video, soru sor, kayıt günlüğü akışı
  (admin)/               dashboard, hastalar, raporlar, mesajlar, araştırmacılar, içerik
src/
  components/            yeniden kullanılabilir UI
  features/              auth, content, diary, messages, admin (veri katmanı)
  lib/                   supabase client, storage, tarih, useAsync
  theme/                 renk/tipografi/spacing
  types/                 DB tipleri
supabase/
  migrations/            şema + RLS + storage
  seed.sql               semptomlar + örnek içerik
  functions/             Edge Functions (Deno)
```
