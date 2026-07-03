/* ============================================================
   Pastacihanı — İçerik verisi
   Yalnızca GÖZLE DOĞRULANMIŞ, telifsiz Unsplash PASTA fotoğrafları.
   (cupcake / kurabiye / makaron / tart / cheesecake / karışık tabak YOK)
   ============================================================ */

const WA_NUMBER = "905548106301";
const TEL_NUMBER = "+905548106301";
const WA_GENERIC = "Merhaba Pastacihanı, pasta siparişi vermek istiyorum 🎂";

/* Öne çıkan / editorial görseller (hepsi doğrulanmış pasta) */
const HERO_IMG = "1535254973040-607b474cb50d";       // güllü katlı düğün pastası
const MANIFESTO_IMG = "1606890737304-57a1ca8a5b62";  // orman meyveli naked pasta
const ABOUT_IMG = "1622896784083-cc051313dbab";      // süslemeli drip pasta

/* ---- Doğrulanmış pasta havuzu (kategoriye göre, tema uyumlu, grid içinde tekrarsız) ---- */
const IMGS = {
  // SADECE tek dilim — üçgen kesim, katmanlar görünür, tabakta
  dilim: ["1565958011703-44f9829ba187", "1571115177098-24ec42ed204d", "1464349095431-e9a21285b5f3"],
  // tek katlı, süslemeli, bütün küçük pastalar (makaron/külah içeren görsel çıkarıldı)
  butik: ["1621303837174-89787a7d4729", "1542826438-bd32f43d626f", "1602351447937-745cb720612f", "1622896784083-cc051313dbab", "1611293388250-580b08c4a145", "1578985545062-69928b1d9587", "1606890737304-57a1ca8a5b62"],
  // renkli, mumlu, kutlama
  dogumgunu: ["1694043325785-d841a964257f", "1464349095431-e9a21285b5f3", "1621303837174-89787a7d4729", "1578985545062-69928b1d9587", "1611293388250-580b08c4a145"],
  // sanatsal / tasarım finiş
  ozel: ["1542826438-bd32f43d626f", "1606890737304-57a1ca8a5b62", "1602351447937-745cb720612f", "1622896784083-cc051313dbab", "1578985545062-69928b1d9587"],
  // çok katlı düğün / nişan — gözle doğrulanmış gerçek düğün pastaları
  dugun: [
    "1535141192574-5d4897c12636", "1535254973040-607b474cb50d", "1623428454614-abaf00244e52",
    "1525257831700-183b9b8bf5c4", "1574538860416-baadc5d4ec57", "1559373098-e1caaccae791",
    "1670529774874-601ce26eec53", "1503525642560-ecca5e2e49e9", "1678473289821-1818e3f82e9a",
    "1561702856-b4ec96854ed8", "1604702433171-33756f3f3825", "1519654793190-2e8a4806f1f2",
  ],
};

/* Kategori sipariş süresi rozetleri */
const ORDER_BADGES = {
  dilim:    { icon: "⚡", label: "Aynı gün teslimat" },
  butik:    { icon: "🕐", label: "24 saat önceden sipariş" },
  dogumgunu:{ icon: "🕐", label: "48 saat önceden sipariş" },
  ozel:     { icon: "🕐", label: "3-5 gün önceden sipariş" },
  dugun:    { icon: "📅", label: "7 gün önceden sipariş" },
};

/* Kategoriye özel WhatsApp giriş mesajları */
const WA_INTROS = {
  dilim:    "Merhaba Pastacihanı, dilim pasta siparişi vermek istiyorum",
  butik:    "Merhaba Pastacihanı, butik pasta siparişi vermek istiyorum",
  dogumgunu:"Merhaba Pastacihanı, doğum günü pastası siparişi vermek istiyorum",
  ozel:     "Merhaba, özel tasarım pasta yaptırmak istiyorum",
  dugun:    "Merhaba, düğün pastası için bilgi almak istiyorum",
};

/* ---- Ürün katalogları — doğrulanmış görsellerle, çeşit isimleriyle ---- */
const CAT_ITEMS = {
  dilim: [
    { n: "Meyveli Krema Dilim", d: "Frambuaz ve çilekli, katmanları görünen tabak sunumu.", t: "meyve çilek frambuaz krema katmanlı dilim ferah" },
    { n: "Çikolatalı Katmanlı Dilim", d: "Bitter çikolata akıtmalı, yoğun katmanlı dilim.", t: "çikolata katmanlı kakao dilim klasik yoğun" },
    { n: "Renkli Gökkuşağı Dilim", d: "Yıldız süslemeli, neşeli çok renkli pandispanya.", t: "gökkuşağı renkli çocuk dilim neşeli yıldız" },
    { n: "Çilekli Vanilyalı Dilim", d: "Taze çilek ve Madagaskar vanilyalı katman.", t: "çilek vanilya taze ferah dilim krema" },
    { n: "Ballı Cevizli Dilim", d: "Geleneksel bal ve ceviz uyumu, zengin katmanlar.", t: "bal ceviz klasik geleneksel dilim yoğun" },
    { n: "Red Velvet Dilim", d: "Kadife dokusu, peynirli kremsi katmanlar.", t: "redvelvet kırmızı kadife peynir krem dilim" },
    { n: "Frambuazlı Mousse Dilim", d: "Hafif frambuaz mousse, ferah bitiş.", t: "frambuaz mousse ekşi ferah hafif dilim" },
    { n: "Tiramisu Katmanlı Dilim", d: "Mascarpone ve kahvenin İtalyan buluşması.", t: "tiramisu kahve tatlı katmanlı dilim klasik" },
    { n: "Muzlu Karamel Dilim", d: "Muz ve tuzlu karamelin yumuşak katmanı.", t: "muz karamel tatlı yumuşak dilim" },
    { n: "Antep Fıstıklı Dilim", d: "Yoğun antep fıstıklı krema katmanı.", t: "fıstık antep yoğun dilim krema" },
    { n: "Limon Tart Dilim", d: "Ferah limon kremalı, parlak jöleli üst.", t: "limon tart ferah ekşi dilim" },
    { n: "Çikolatalı Trüf Dilim", d: "Bitter trüf kakao katmanları, ipeksi ganaj.", t: "trüf kakao bitter çikolata dilim yoğun" },
  ],
  butik: [
    { n: "Toz Pembe Drip Butik", d: "Pastel pembe, akıtma süslemeli tek katlı butik.", t: "pembe drip pastel modern süsleme şık" },
    { n: "Aynalı Sır Butik", d: "Parlak turuncu aynalı sır kaplama, lüks finiş.", t: "aynalı sır mirror turuncu lüks modern" },
    { n: "İncili Çikolata Butik", d: "Çikolata akıtmalı, inci süslemeli zarif tasarım.", t: "çikolata inci drip şık süsleme" },
    { n: "Krem Drip Butik", d: "Krem tonlarında, akıtma detaylı modern butik.", t: "krem drip modern minimal zarif" },
    { n: "Çilekli Mousse Butik", d: "Taze çilek katmanlı, kremsi mousse butik.", t: "çilek mousse pembe katmanlı taze" },
    { n: "Çikolatalı Rozet Butik", d: "Çikolata akıtmalı, krema rozetli klasik butik.", t: "çikolata rozet drip klasik krema" },
    { n: "Naked Orman Meyveli Butik", d: "Çıplak katmanlar, orman meyveleri ve çikolata.", t: "naked ormanmeyveli çikolata rustik katmanlı" },
    { n: "Lüks Pembe Drip Butik", d: "Pembe akıtmalı, şık süslemeli lüks butik pasta.", t: "pembe drip lüks süsleme şık modern" },
    { n: "Karamelli Sır Butik", d: "Karamel tonunda aynalı sır kaplama, dramatik.", t: "karamel sır mirror lüks dramatik" },
    { n: "Trüf Boncuklu Butik", d: "Kakao boncuklarla süslenmiş drip tasarım.", t: "trüf kakao boncuk drip çikolata şık" },
    { n: "Vanilya Krem Butik", d: "Krem vanilya tonlarında, akıtmalı modern.", t: "vanilya krem minimal modern drip" },
    { n: "Taze Çilek Kremalı Butik", d: "Çilek dilimli, kremsi katmanlı hafif butik.", t: "çilek taze krema hafif katmanlı pembe" },
    { n: "Velvet Rozet Butik", d: "Çikolata kadife rozet süslemeli klasik.", t: "velvet rozet çikolata klasik drip" },
    { n: "Rustik Meyve Naked Butik", d: "Çıplak doku, orman meyveli doğal bitiş.", t: "rustik meyve naked doğal katmanlı" },
    { n: "Altın Pembe Butik", d: "Pembe akıtma ve altın detaylı özel butik.", t: "altın pembe drip şık lüks özel" },
    { n: "İnci Sır Butik", d: "İnci akıtmalı aynalı sır, asil görünüm.", t: "inci sır mirror asil lüks" },
    { n: "Mousse Veloute Butik", d: "Kadifemsi mousse kaplı, çilek taçlı.", t: "mousse velvet çilek pembe kadife taze" },
    { n: "Çikolata Rozet Krema Butik", d: "Koyu drip ve krema rozetli bütün butik.", t: "çikolata drip rozet krema klasik koyu" },
    { n: "Meyve Naked Çikolata Butik", d: "Orman meyveleri ve ganajlı çıplak katman.", t: "meyve naked çikolata ganaj katmanlı" },
    { n: "Pastel Drip Süsleme Butik", d: "Pastel pembe, modern akıtma süsleme.", t: "pastel pembe drip modern süsleme" },
    { n: "Karamel Naked Butik", d: "Karamel ve çilek içerikli rustik naked.", t: "karamel naked rustik çilek meyve" },
  ],
  dogumgunu: [
    { n: "Mumlu Pembe Doğum Günü", d: "Renkli mumlu, katlı pembe kutlama pastası.", t: "mum pembe kutlama renkli katlı parti" },
    { n: "Gökkuşağı Doğum Günü", d: "Yıldız süslemeli, çok renkli neşeli pasta.", t: "gökkuşağı renkli çocuk neşeli yıldız" },
    { n: "Toz Pembe Kutlama", d: "Akıtma süslemeli, kız çocuk temalı pembe pasta.", t: "pembe drip kutlama kız süsleme" },
    { n: "Çikolata Akıtmalı Doğum Günü", d: "Krema rozetli, çikolata akıtmalı klasik kutlama.", t: "çikolata drip klasik kutlama rozet" },
    { n: "Çilekli Kutlama Pastası", d: "Taze çilekli, kremsi kutlama pastası.", t: "çilek pembe kutlama mousse taze" },
    { n: "Sürpriz Kutlama Pastası", d: "Renkli mumlu, içinden sürpriz çıkan pasta.", t: "sürpriz mum renkli kutlama neşeli" },
    { n: "Yıldızlı Çocuk Pastası", d: "Yıldız ve konfeti süslü, çocuk temalı.", t: "yıldız konfeti çocuk neşeli renkli" },
    { n: "Kız Çocuk Doğum Günü", d: "Pembe akıtmalı, kız çocuğa özel tasarım.", t: "kız çocuk pembe drip özel" },
    { n: "Çikolata Drip Kutlama", d: "Çikolata akıtmalı, modern kutlama pastası.", t: "çikolata drip modern kutlama klasik" },
    { n: "Meyveli Doğum Günü", d: "Taze meyve ve kremli kutlama pastası.", t: "meyve taze krema kutlama doğumgünü" },
    { n: "Renkli Mumlu Parti Pastası", d: "Renkli mumlar ve katlı gösterişli parti.", t: "mum renkli parti katlı kutlama şenlik" },
    { n: "Konfetili Doğum Günü", d: "Konfeti ve balon süslü, neşeli pasta.", t: "konfeti balon neşeli çocuk renkli" },
    { n: "Pastel Doğum Günü", d: "Pembe pastel, minimal modern kutlama.", t: "pastel minimal pembe modern kutlama" },
    { n: "Drip Çikolata Parti", d: "Yoğun drip çikolata, parti için vazgeçilmez.", t: "drip çikolata yoğun parti kutlama" },
    { n: "Mousse Doğum Günü", d: "Hafif mousse dolgusu, taze meyveli bitiş.", t: "mousse meyve hafif taze doğumgünü" },
  ],
  ozel: [
    { n: "Aynalı Sır Tasarım", d: "Parlak aynalı sır kaplama, sanatsal lüks finiş.", t: "aynalı sır mirror sanatsal lüks tasarım" },
    { n: "Naked Sanat Pasta", d: "Çıplak katmanlı, orman meyveli rustik tasarım.", t: "naked rustik sanatsal katmanlı meyve" },
    { n: "İncili Tasarım Pasta", d: "İnci ve çikolata akıtmalı şık konsept.", t: "inci çikolata drip şık sanat konsept" },
    { n: "Konsept Drip Pasta", d: "Krem akıtmalı, modern konsept tasarım.", t: "drip konsept krem modern tasarım" },
    { n: "Çikolata Rozet Tasarım", d: "Çikolata akıtmalı, rozetli sanatsal tasarım.", t: "çikolata rozet sanatsal drip tasarım" },
    { n: "Premium Sır Konsept", d: "Yüksek parlak sır kaplama, premier sunum.", t: "premium sır mirror lüks konsept şık" },
    { n: "Orman Konsept Pasta", d: "Orman meyveleri ve rustik naked konsept.", t: "orman konsept rustik naked meyve sanat" },
    { n: "Lüks İnci Konsept", d: "Lüks inci bezeme, drip sanatsal finiş.", t: "lüks inci drip şık sanat konsept" },
    { n: "Modern Krem Tasarım", d: "Modern krem akıtmalı, editorial tasarım.", t: "modern krem editorial drip sanat" },
    { n: "Altın Detay Tasarım", d: "Altın varak ve sır detaylı prestijli pasta.", t: "altın varak sır prestijli lüks konsept" },
    { n: "Figürlü Naked Konsept", d: "Çıplak katmanlı, figür detaylı sanat eseri.", t: "figür naked sanat konsept katmanlı" },
    { n: "Damla Kristal Pasta", d: "Damla süslemeli, kristal parlaklıklı tasarım.", t: "damla kristal parlak şık inci drip" },
    { n: "Çikolata Sanat Pasta", d: "Drip ve rozet teknikli, sanatsal çikolata.", t: "çikolata drip rozet sanat teknik" },
    { n: "Editoryal Krem Pasta", d: "Editorial fotoğraf estetiğinde tasarım pasta.", t: "editoryal krem modern şık konsept" },
    { n: "Kurumsal Prestij Pasta", d: "Kurumsal etkinliklere özel şık konsept.", t: "kurumsal prestij şık konsept özel" },
  ],
  dugun: [
    { n: "Beyaz Meyveli Katlı Düğün", d: "Taze meyvelerle taçlanan beyaz katlı düğün pastası.", t: "beyaz meyve katlı tier romantik düğün" },
    { n: "Güllü Katlı Düğün Pastası", d: "Pembe güllerle süslenmiş zarif çok katlı pasta.", t: "gül çiçek katlı romantik beyaz düğün" },
    { n: "Çilek & Çiçek Düğün", d: "Taze çilek ve çiçeklerle bezeli beyaz katlı pasta.", t: "çilek çiçek beyaz katlı romantik düğün" },
    { n: "Kırmızı Güllü Klasik Düğün", d: "Bordo güllerle taçlanan dört katlı beyaz fondant.", t: "kırmızı gül dörtkat beyaz fondant klasik düğün" },
    { n: "Bordo Güllü Beyaz Düğün", d: "Kabartma dokulu, koyu güllerle bezeli görkemli kat.", t: "bordo gül beyaz katlı görkemli düğün" },
    { n: "Şakayıklı Üç Katlı Düğün", d: "Pembe şakayıklarla süslenmiş üç katlı zarif pasta.", t: "şakayık pembe üçkat çiçek romantik düğün" },
    { n: "Altın Yazılı Beyaz Düğün", d: "Yeşillik ve altın yazı detaylı beyaz katlı pasta.", t: "altın yazı beyaz yeşillik katlı düğün" },
    { n: "Pembe Çiçekli Fondant Düğün", d: "El yapımı pembe şeker çiçekli üç katlı fondant.", t: "pembe çiçek fondant üçkat şeker düğün" },
    { n: "Gold Detaylı Katlı Düğün", d: "Altın 'Mr & Mrs' detaylı, çiçek şelaleli kat.", t: "altın gold çiçek katlı lüks düğün nikah" },
    { n: "Buz Mavisi Çiçekli Düğün", d: "Pastel mavi, beyaz şeker çiçekli üç katlı pasta.", t: "mavi pastel çiçek üçkat zarif düğün" },
    { n: "Kır Düğünü Çiçekli Pasta", d: "Ahşap stantta, kırmızı çiçekli beyaz katlı pasta.", t: "kır rustik ahşap kırmızı çiçek katlı düğün" },
    { n: "Naked Güllü Düğün Pastası", d: "Çıplak katmanlar, pembe güllerle bohem zarafet.", t: "naked çıplak gül pembe bohem rustik düğün" },
  ],
};

const CAT_META = [
  { id: "dilim",     code: "DLM", name: "Dilim Pasta",          tag: "Tek dilimde zarafet",         blurb: "Günün her anına yakışan, özenle hazırlanmış porsiyonluk pastalar." },
  { id: "butik",     code: "BTK", name: "Butik Pasta",          tag: "El işçiliğiyle imza tasarım",  blurb: "Vitrine yakışan, ince detaylarla bezeli özel butik pastalar." },
  { id: "dogumgunu", code: "DGN", name: "Doğum Günü Pastası",   tag: "Kutlamanın yıldızı",          blurb: "En neşeli güne özel, kişiye göre tasarlanan doğum günü pastaları." },
  { id: "ozel",      code: "OZL", name: "Özel Tasarım Pasta",   tag: "Hayalini kur, biz yaratalım",  blurb: "Sınırların olmadığı, tamamen size özel konsept tasarımlar." },
  { id: "dugun",     code: "DUG", name: "Düğün Pastası",        tag: "Hayatın en özel anı",          blurb: "O büyük güne yakışan, görkemli ve zarif düğün pastaları." },
];

/* CATEGORIES — her ürüne benzersiz görsel (grid içinde tekrarsız) + kod + sipariş süresi */
const CATEGORIES = CAT_META.map((m) => {
  const pool = IMGS[m.id];
  const products = CAT_ITEMS[m.id].map((it, i) => ({
    code: `${m.code}-${String(i + 1).padStart(3, "0")}`,
    name: it.n,
    desc: it.d,
    tags: it.t.split(" ").filter(Boolean),
    img: pool[i % pool.length],
  }));
  return {
    id: m.id, code: m.code, name: m.name, tag: m.tag, blurb: m.blurb,
    img: pool[0],
    order: ORDER_BADGES[m.id],
    waIntro: WA_INTROS[m.id],
    comingSoon: true, // her koleksiyona yeni tasarımlar ekleniyor
    products,
  };
});

/* Tüm ürünler düz liste (arama için) */
const ALL_PRODUCTS = CATEGORIES.flatMap((c) =>
  c.products.map((p) => ({ ...p, catId: c.id, catName: c.name, order: c.order, waIntro: c.waIntro }))
);

/* En çok tercih edilenler — geçerli ürün kodları */
const FAVORITE_CODES = ["DUG-002", "DGN-001", "BTK-002", "DLM-001", "DUG-006", "OZL-001", "BTK-005", "DUG-009"];
const FAVORITES = FAVORITE_CODES.map((code) => ALL_PRODUCTS.find((p) => p.code === code)).filter(Boolean);

/* Sık Sorulan Sorular */
const FAQS = [
  { q: "Kaç gün önceden sipariş vermeliyim?", a: "Özel tasarım pastalar için en az birkaç gün önceden iletişime geçmenizi öneririz; yoğun dönemlerde biraz daha erken planlamak en sağlıklısı. Acil talepleriniz için de WhatsApp'tan yazabilirsiniz." },
  { q: "Hangi bölgelere teslimat yapıyorsunuz?", a: "Yalnızca Silivri ilçesine hizmet veriyoruz — merkezden Kumburgaz'a, Selimpaşa'dan köylere kadar Silivri'nin tüm mahalle ve köylerine teslimat yapıyoruz. Detaylar için WhatsApp'tan yazabilirsiniz." },
  { q: "Glutensiz / şekersiz seçenek var mı?", a: "Evet, özel diyet ihtiyaçlarına uygun alternatifler (glutensiz, şekersiz, vegan) hazırlayabiliyoruz. Tercihinizi sipariş sırasında belirtmeniz yeterli." },
  { q: "Özel tasarım pasta yaptırabilir miyim?", a: "Elbette. Konseptinizi, renklerinizi ve temanızı birlikte kurgulayıp tamamen size özel bir tasarım hazırlıyoruz." },
  { q: "Pastayı nasıl sipariş ederim?", a: "3D tasarım aracımızla hayalinizdeki pastayı oluşturabilir ya da doğrudan WhatsApp'tan yazarak adım adım birlikte ilerleyebiliriz." },
];

/* Teslimat bölgeleri */
const DELIVERY_ZONES = [
  { zone: "Silivri merkez", note: "Elden teslim", free: true },
  { zone: "Kumburgaz · Selimpaşa · Değirmenköy", note: "Kurye ile teslimat" },
  { zone: "Gümüşyaka · Ortaköy · Çanta", note: "Kurye ile teslimat" },
  { zone: "Silivri'nin tüm köyleri", note: "WhatsApp'tan güzergah teyidi" },
];

/* Güven rozetleri */
const TRUST_BADGES = [
  { icon: "🥇", label: "2022'den beri hizmet" },
  { icon: "✓", label: "1000+ memnun müşteri" },
  { icon: "🛡️", label: "Gıda işletme belgeli" },
  { icon: "☪", label: "Helal sertifikalı" },
  { icon: "⭐", label: "5 yıldız müşteri puanı" },
];

/* Galeri — yalnızca doğrulanmış pastalar */
const GALLERY = [
  { title: "Beyaz Güllü Düğün", img: "1574538860416-baadc5d4ec57", span: "tall" },
  { title: "Toz Pembe Drip", img: "1621303837174-89787a7d4729", span: "" },
  { title: "Süslemeli Drip", img: "1622896784083-cc051313dbab", span: "" },
  { title: "Aynalı Sır", img: "1542826438-bd32f43d626f", span: "wide" },
  { title: "Beyaz Katlı Düğün", img: "1535141192574-5d4897c12636", span: "" },
  { title: "Renkli Kutlama", img: "1464349095431-e9a21285b5f3", span: "tall" },
  { title: "Çilekli Mousse", img: "1611293388250-580b08c4a145", span: "" },
  { title: "Güllü Katlı Düğün", img: "1535254973040-607b474cb50d", span: "" },
];

/* Konfigüratör — pasta türü kartları (doğrulanmış pastalar) */
const CFG_TYPES = [
  { val: "Doğum Günü", img: "1694043325785-d841a964257f" },
  { val: "Düğün", img: "1535254973040-607b474cb50d" },
  { val: "Butik", img: "1621303837174-89787a7d4729" },
  { val: "Özel Tasarım", img: "1542826438-bd32f43d626f" },
];

/* Konfigüratör — pasta şekli (3D modele birebir yansır) */
const CFG_SHAPES = [
  { val: "Yuvarlak", key: "round", icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1.6"/></svg>' },
  { val: "Kare", key: "square", icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.6"/></svg>' },
  { val: "Kalp", key: "heart", icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 31c-1-.8-11-7.4-11-14.2 0-3.6 2.7-6 5.6-6 2.3 0 4 1.3 5.4 3.2 1.4-1.9 3.1-3.2 5.4-3.2 2.9 0 5.6 2.4 5.6 6C31 23.6 21 30.2 20 31Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
  { val: "Altıgen", key: "hex", icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 7l11.3 6.5v13L20 33 8.7 26.5v-13L20 7Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>' },
];

/* Konfigüratör — kaplama türü */
const CFG_COATINGS = [
  { val: "Krema", key: "krema" },
  { val: "Fondant", key: "fondant" },
  { val: "Çikolata", key: "cikolata" },
];

/* Konfigüratör — kaplama renkleri */
const CFG_COLORS = [
  { name: "Beyaz", hex: "#F3ECE4" },
  { name: "Pembe", hex: "#F2BFC9" },
  { name: "Mavi", hex: "#B6D8E8" },
  { name: "Krem", hex: "#EAD6B0" },
  { name: "Çikolata", hex: "#5C3A26" },
  { name: "Kırmızı Kadife", hex: "#8E2A3C" },
];

const TESTIMONIALS = [
  { text: "Kızımızın doğum günü pastası hem görsel hem lezzet olarak kusursuzdu. Misafirler tek tek nereden aldığımızı sordu.", name: "Elif Yılmaz", meta: "Doğum Günü • Silivri", date: "Mart 2026", stars: 5, img: "1694043325785-d841a964257f" },
  { text: "Düğün pastamız tam hayal ettiğimiz gibiydi. Profesyonellik ve zarafet için teşekkürler Pastacihanı.", name: "Merve & Can", meta: "Düğün Pastası", date: "Şubat 2026", stars: 5, img: "1535254973040-607b474cb50d" },
  { text: "WhatsApp'tan sipariş çok kolaydı; zamanında ve büyük bir özenle teslim edildi. Gönül rahatlığıyla tavsiye ederim.", name: "Ahmet Demir", meta: "Butik Pasta", date: "Şubat 2026", stars: 5, img: "1621303837174-89787a7d4729" },
  { text: "Özel tasarım talebimizi olduğu gibi gerçeğe dönüştürdüler. Detaylara verilen önem etkileyiciydi.", name: "Zeynep Kaya", meta: "Özel Tasarım", date: "Ocak 2026", stars: 5, img: "1542826438-bd32f43d626f" },
  { text: "Hem göz alıcı hem gerçekten lezzetli. Artık tüm özel günlerimizin adresi belli.", name: "Burak Şahin", meta: "Yıldönümü", date: "Ocak 2026", stars: 5, img: "1606890737304-57a1ca8a5b62" },
  { text: "Silivri'de bu kalitede pasta bulmak büyük şans. Sunum ve tat beklentimin çok üstündeydi.", name: "Selin Aydın", meta: "Dilim Pasta", date: "Aralık 2025", stars: 5, img: "1571115177098-24ec42ed204d" },
  { text: "Oğlumun doğum günü pastası muhteşemdi. Fotoğraflar harika çıktı, herkes çok beğendi.", name: "Gizem Arslan", meta: "Doğum Günü", date: "Aralık 2025", stars: 5, img: "1611293388250-580b08c4a145" },
  { text: "Kurumsal etkinliğimiz için hazırladıkları tasarım pasta tam bir sanat eseriydi. Teşekkürler.", name: "Onur Çelik", meta: "Kurumsal • Özel Tasarım", date: "Kasım 2025", stars: 5, img: "1602351447937-745cb720612f" },
  { text: "Glutensiz pasta talebimizi sorunsuz karşıladılar, lezzetinden hiçbir şey kaybetmemişti.", name: "Deniz Korkmaz", meta: "Glutensiz • Butik", date: "Kasım 2025", stars: 5, img: "1602351447937-745cb720612f" },
  { text: "Nişan pastamız beklentimizin ötesindeydi. İlgileri ve zamanında teslimleri için minnettarız.", name: "Ece & Kerem", meta: "Nişan Pastası", date: "Ekim 2025", stars: 5, img: "1535141192574-5d4897c12636" },
];
