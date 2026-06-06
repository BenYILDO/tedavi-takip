-- =====================================================================
-- Seed: semptomlar, eğitim içerikleri (örnek), ayarlar
-- Bu dosya tekrar çalıştırılabilir (idempotent) olacak şekilde yazılmıştır.
-- =====================================================================

-- ---------- SEMPTOMLAR (antikoagülasyon — literatür temelli) ----------
insert into public.symptoms (name, description, sort_order) values
  ('Burun kanaması', 'Kendiliğinden veya kolayca başlayan burun kanaması', 1),
  ('Diş eti kanaması', 'Diş fırçalarken veya kendiliğinden diş eti kanaması', 2),
  ('Ciltte morarma / ekimoz', 'Darbe olmadan veya kolayca oluşan morluklar', 3),
  ('Enjeksiyon bölgesinde reaksiyon', 'İğne yerinde kanama, morarma, şişlik veya sertlik', 4),
  ('İdrarda kan', 'Pembe, kırmızı veya çay renginde idrar', 5),
  ('Dışkıda kan / siyah dışkı', 'Dışkıda kırmızı kan veya katran rengi (siyah) dışkı', 6),
  ('Uzun süren kanama', 'Küçük kesik/yaralarda durmayan veya uzun süren kanama', 7),
  ('Adet kanamasında artış', 'Olağandan fazla veya uzun süren adet kanaması', 8),
  ('Kanlı veya kahve telvesi gibi kusma', 'Kusmukta kan veya kahve telvesi görünümü', 9),
  ('Baş ağrısı', 'Şiddetli veya geçmeyen baş ağrısı', 10),
  ('Baş dönmesi / sersemlik', 'Denge kaybı, sersemlik hissi', 11),
  ('Halsizlik / yorgunluk', 'Olağandışı bitkinlik veya güçsüzlük', 12),
  ('Nefes darlığı', 'Soluk almakta zorlanma', 13),
  ('Göğüs ağrısı', 'Göğüste baskı, sıkışma veya ağrı', 14),
  ('Bacakta şişlik / ağrı', 'Tek bacakta şişlik, ağrı, kızarıklık veya ısı artışı', 15)
on conflict do nothing;

-- ---------- EĞİTİM İÇERİKLERİ (örnek/placeholder — panelden düzenlenebilir) ----------
insert into public.education_sections (key, title, body, video_url, sort_order) values
  ('importance', 'Antikoagülasyonun Önemi',
   'Antikoagülan ilaçlar (kan sulandırıcılar) damar içinde pıhtı oluşmasını önleyerek inme, kalp krizi ve akciğer embolisi gibi ciddi durumların önüne geçer.\n\n## Neden düzenli kullanmalısınız?\n- İlacınızı her gün aynı saatte almanız tedavinin etkinliği için önemlidir.\n- Doz atlamak pıhtı riskini artırır.\n- Fazla doz ise kanama riskini yükseltir.\n\nBu metin örnektir; araştırmacı tarafından güncellenecektir.',
   null, 1),
  ('drug_types', 'Antikoagülan İlaç Türleri',
   'Antikoagülan tedavide farklı ilaç grupları kullanılır.\n\n## Başlıca gruplar\n- Düşük molekül ağırlıklı heparinler (subkutan enjeksiyon)\n- K vitamini antagonistleri (varfarin)\n- Yeni nesil oral antikoagülanlar\n\nHekiminizin önerdiği ilacı, önerdiği dozda kullanınız.\n\nBu metin örnektir; araştırmacı tarafından güncellenecektir.',
   null, 2),
  ('precautions', 'Alınması Gereken Önlemler',
   'Antikoagülan tedavi sürecinde kanama riskini azaltmak için bazı önlemlere dikkat edin.\n\n## Günlük yaşam\n- Yumuşak diş fırçası kullanın.\n- Kesici aletlerle dikkatli olun.\n- Düşme riskini azaltın.\n\n## Doktorunuza danışmadan\n- Başka ilaç (ağrı kesici dahil) kullanmayın.\n- Bitkisel ürün almayın.\n\nBu metin örnektir; araştırmacı tarafından güncellenecektir.',
   null, 3),
  ('video', 'Eğitim Videosu',
   'Aşağıdaki videoda subkutan (cilt altı) enjeksiyon uygulamasının adımlarını izleyebilirsiniz. Videoyu izledikten sonra uygulamanızı sakin bir ortamda gerçekleştirin.',
   null, 4),
  ('complications', 'Olası Komplikasyonlar',
   'Antikoagülan tedavi sırasında bazı belirtiler ortaya çıkabilir. Aşağıdaki durumlarda dikkatli olun.\n\n## Hemen başvurmanız gereken durumlar\n- Durmayan veya şiddetli kanama\n- İdrarda/dışkıda kan\n- Şiddetli baş ağrısı, ani görme/konuşma bozukluğu\n- Göğüs ağrısı, nefes darlığı\n\nBu belirtilerden herhangi biri varsa araştırmacınızla iletişime geçin veya acil servise başvurun.\n\nBu metin örnektir; araştırmacı tarafından güncellenecektir.',
   null, 5)
on conflict (key) do nothing;

-- ---------- AYARLAR ----------
insert into public.app_settings (key, value) values
  ('researcher_phone', '')
on conflict (key) do nothing;
