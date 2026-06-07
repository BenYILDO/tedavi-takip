# Uygulama‑içi Sesli İletişim — Tasarım (henüz uygulanmadı)

> Durum: **yalnızca planlama.** Bu turda kod yazılmadı. Madde 4'ün fizibilite +
> mimari notudur. Hasta ↔ araştırmacı arasında uygulama‑içi sesli arama hedeflenir.

## Özet karar

**WebRTC (eşler arası ses) + Supabase Realtime (sinyalleşme).** Projenin
"ücretsiz altyapı" çizgisine uyar; aylık sabit ücret yoktur. Tek dış gereksinim,
bazı ağlarda (simetrik NAT) bağlantı için bir **TURN sunucusudur**.

## Bileşenler

| Parça | Teknoloji | Not |
|------|-----------|-----|
| Ses taşıma | `react-native-webrtc` (`RTCPeerConnection`, `getUserMedia` audio) | Expo Go'da **çalışmaz**; dev/prod build gerekir |
| Sinyalleşme | Supabase Realtime **broadcast** kanalı | offer / answer / ICE adayları taşınır |
| Çağrı bildirimi | Yeni edge function `notify-call` (mevcut `notify-message` deseni) | Karşı tarafa "gelen arama" push'u |
| NAT geçişi | STUN (Google public) + **TURN** | TURN: self‑host `coturn` (ücretsiz, sunucu lazım) veya Metered/Twilio TURN (kullanım ücretli) |
| Web | Tarayıcı yerleşik WebRTC | Ayrı kod yolu; aynı sinyalleşme |

## Akış

1. **Arayan** `RTCPeerConnection` kurar, mikrofon akışını ekler, `offer` üretir.
2. `call:<patientId>:<staffId>` Realtime kanalına `offer` broadcast edilir; ayrıca
   `notify-call` ile karşı tarafa push gönderilir (uygulama kapalıysa uyandırır).
3. **Aranan** kabul ederse aynı kanala `answer` broadcast eder.
4. İki taraf **ICE adaylarını** kanaldan değişir; bağlantı kurulunca ses akar.
5. Bitiş: bir taraf `hangup` mesajı yayınlar, iki taraf `pc.close()` çağırır.

Kanal güvenliği: Realtime broadcast kanalı RLS uygulamaz; bu yüzden kanal adı tahmin
edilemez bir oturum kimliği içermeli (örn. `call:<uuid>`) ve `notify-call` yalnızca
gerçek muhataba (mevcut sohbetin iki tarafı) gönderilmelidir. Alternatif: kısa ömürlü
bir `calls` tablosu (RLS ile iki tarafa açık) üzerinden sinyalleşme.

## Platform gereksinimleri

- **iOS** `Info.plist`: `NSMicrophoneUsageDescription`; arka plan ses için
  `UIBackgroundModes: [audio, voip]` (CallKit entegrasyonu opsiyonel ama önerilir).
- **Android**: `RECORD_AUDIO` izni; ön‑plan servis (uzun aramalar için).
- **app.json**: `react-native-webrtc` config plugin'i eklenir; **EAS dev/prod build**
  zorunlu (Expo Go desteklemez).

## İş tahmini / aşamalar

1. Build altyapısı: `react-native-webrtc` + izinler + dev build (yarım gün).
2. Sinyalleşme katmanı (Realtime broadcast veya `calls` tablosu) + `notify-call` (1 gün).
3. Arama UI'ı (gelen/giden arama ekranı, sustur/kapat, sesli/hoparlör) (1–2 gün).
4. TURN sunucusu kurulumu + ağ testleri (yarım–1 gün).
5. CallKit/ConnectionService ile sistem arama arayüzü (opsiyonel, +1–2 gün).

**Toplam:** orta‑büyük; ayrı bir PR/sürüm olarak ele alınması önerilir.

## Daha basit alternatif (gerekirse)

Gerçek zamanlı arama yerine **sesli mesaj (asenkron)**: `expo-av` ile kayıt → bir
`message-audio` bucket'ına yükle → mesaja ek olarak gönder. Çok daha az iş, TURN
gerektirmez, ancak canlı konuşma sağlamaz.
