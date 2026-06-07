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
| **researcher** (araştırmacı) | Hasta kaydı oluşturur, **tüm** hastaların raporlarını görür. Mesajlaşma kişiye özeldir: araştırmacı yalnızca **kendisinin** taraf olduğu sohbetleri görür. |
| **patient** (hasta) | Eğitim içerikleri, kayıt günlüğü (ilaç + semptom), soru sor. |

Hastalar **kayıt numarası + şifre** ile giriş yapar. Kayıt numarası dahili olarak
`<kayıtno>@tedavitakip.local` auth e-postasına eşlenir. Hasta hesabını araştırmacı oluşturur;
oluşturma sırasında üretilen **tek kullanımlık aktivasyon kodu** hastaya iletilir. Hasta ilk
girişte kayıt numarası + aktivasyon kodu ile kendi şifresini belirler (kod, kayıt numarasını
bilen birinin hesabı ele geçirmesini önler).

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
4. `supabase/migrations/0004_private_messages.sql` — kişiye özel (gizli) mesaj sohbetleri
5. `supabase/migrations/0005_secure_profile_updates.sql` — profil güncellemede yetki kısıtı
6. `supabase/migrations/0006_push_tokens.sql` — push bildirim cihaz token'ları
7. `supabase/migrations/0007_patient_activation_code.sql` — hasta aktivasyon kodu (hesap ele geçirmeyi önler)
8. `supabase/migrations/0008_profile_visibility.sql` — hasta yalnızca araştırmacıları ve sohbet ettiği personeli görür
9. `supabase/migrations/0009_profile_fields.sql` — avatar + telefon gizliliği + maskeli personel görünümü (`staff_public`)
10. `supabase/migrations/0010_avatars_storage.sql` — profil fotoğrafları için `avatars` Storage bucket'ı
11. `supabase/seed.sql` — semptom listesi + örnek eğitim içerikleri + ayarlar

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
supabase functions deploy admin-update-researcher
supabase functions deploy patient-set-password
supabase functions deploy set-username
supabase functions deploy delete-account
supabase functions deploy notify-message

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

## Bildirimler (push & hatırlatıcı)

Uygulama iki tür bildirim gönderir:

- **Yeni mesaj push'u** — bir taraf mesaj gönderince karşı tarafa "mesajınız var"
  bildirimi gider. Cihaz token'ları `push_tokens` tablosunda tutulur; gönderim
  `notify-message` Edge Function'ı üzerinden Expo Push servisiyle yapılır.
- **Günlük tedavi hatırlatıcısı** — hasta kendi saatini seçer (cihazda saklanır).
  Önümüzdeki birkaç gün için önceden zamanlanır; böylece uygulama açılmasa da
  hatırlatıcı sürer. Uygulama her açıldığında liste güncellenir ve hasta bugünkü
  kaydını girdiyse bugünün hatırlatıcısı atlanır.

Gerekenler:

1. **EAS projectId**: push token alabilmek için bir kez `eas init` çalıştırın
   (bu, `app.json` → `extra.eas.projectId` değerini ekler). Yoksa push çalışmaz,
   yerel hatırlatıcılar yine çalışır.
2. **Gerçek build**: push bildirimleri **Expo Go ile test edilemez**; bir EAS
   geliştirme/üretim build'i gerekir. Android push için EAS, FCM kimlik bilgilerini
   yönetir (`eas credentials`). iOS için APNs EAS tarafından otomatik sağlanır.
3. `supabase functions deploy notify-message` ile fonksiyonu yayınlayın.

> Web panelinde push bildirimleri devre dışıdır (yalnızca mobil).

### Uygulama‑içi mesaj bildirimi

Uygulama **açıkken** yeni mesaj gelirse OS bildirimi yerine ekranın üstünde
animasyonlu bir **uygulama‑içi banner** belirir (Supabase Realtime ile). Aynı sohbet
zaten açıksa banner gösterilmez. Uygulama **arka plandayken** normal OS push'u gelir.

## Profil ve Ayarlar

Hasta ve personel, ana ekrandaki profil/ayarlar girişinden:

- Profil fotoğrafı yükler (`avatars` bucket'ı — `0010` migration'ı gerekir),
- Görünen isim, kullanıcı adı (giriş kimliği — `set-username` fonksiyonu auth
  e‑postasını da günceller), telefon ve şifresini değiştirir,
- **Telefon zorunludur.** Personel "telefonumu gizle" ile hastaların numarasını
  görmesini engelleyebilir (hasta tarafında arama butonu/numara gizlenir).
- **Hesabını ve tüm verilerini siler** (iki aşamalı onay; `delete-account` fonksiyonu).

Yönetici, **Araştırmacılar** ekranından bir araştırmacıya dokunup bilgilerini
(ad, telefon, telefon gizliliği, kullanıcı adı, şifre) düzenleyebilir
(`admin-update-researcher` fonksiyonu).

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
