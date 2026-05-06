const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// SQLite Database Setup
const DB_FILE = path.join(__dirname, 'liderlik.db');
const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('❌ Database bağlantı hatası:', err);
  } else {
    console.log('✅ SQLite database bağlantısı başarılı');
  }
});

// Create table if not exists
db.run(`
  CREATE TABLE IF NOT EXISTS liderlik (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ad TEXT NOT NULL,
    soyad TEXT NOT NULL,
    dogru INTEGER NOT NULL,
    toplam INTEGER NOT NULL,
    tarih TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
  if (err) {
    console.error('❌ Tablo oluşturma hatası:', err);
  } else {
    console.log('✅ Liderlik tablosu hazır');
  }
});

// Leaderboard functions (SQLite)
async function liderlikOku() {
  return new Promise((resolve) => {
    db.all(
      'SELECT ad, soyad, dogru, toplam, tarih FROM liderlik ORDER BY dogru DESC LIMIT 10',
      (err, rows) => {
        if (err) {
          console.error('❌ Liderlik okuma hatası:', err);
          resolve([]);
        } else {
          console.log(`✅ Liderlik okundu: ${rows.length} kayıt`);
          resolve(rows);
        }
      }
    );
  });
}

async function liderlikEkle(kayit) {
  return new Promise((resolve) => {
    db.run(
      'INSERT INTO liderlik (ad, soyad, dogru, toplam, tarih) VALUES (?, ?, ?, ?, ?)',
      [kayit.ad, kayit.soyad, kayit.dogru, kayit.toplam, kayit.tarih],
      function(err) {
        if (err) {
          console.error('❌ Liderlik yazma hatası:', err);
        } else {
          console.log(`✅ Liderlik eklendi: ${kayit.ad} ${kayit.soyad} (${kayit.dogru}/${kayit.toplam})`);
        }
        resolve();
      }
    );
  });
}

// Quiz data - 25 questions (12 discoveries, 7 about mathematicians, 6 general math)
const quizSorulari = [
  // === TEMEL 17 SORU (10. Sınıf Seviyesi) ===
  {
    soru: "Pisagor Teoremi dik üçgenlerde hangi ilişkiyi gösterir?",
    secenekler: ["a + b = c", "a² + b² = c²", "a × b = c", "a - b = c"],
    dogru: 1
  },
  {
    soru: "2x + 5 = 13 denkleminin çözümü x kaçtır?",
    secenekler: ["3", "4", "5", "6"],
    dogru: 1
  },
  {
    soru: "Bir dairenin çevresi = 2πr olarak hesaplanır. Yarıçapı 5 cm olan dairenin çevresi kaç cm'dir?",
    secenekler: ["10π", "15π", "25π", "5π"],
    dogru: 0
  },
  {
    soru: "Hangi sayıyı 3 ile çarpıp 2 eklerseniz 11 elde edersiniz?",
    secenekler: ["2", "3", "4", "5"],
    dogru: 1
  },
  {
    soru: "Bir karenin alanı 64 cm² ise kenar uzunluğu kaç cm'dir?",
    secenekler: ["6", "7", "8", "9"],
    dogru: 2
  },
  {
    soru: "Sisam Adası'nda doğan ünlü antik matematikçi kimdir?",
    secenekler: ["Pisagor", "Öklid", "Arşimed", "Thales"],
    dogru: 0
  },
  {
    soru: "85 ÷ 5 işleminin sonucu kaçtır?",
    secenekler: ["15", "16", "17", "18"],
    dogru: 2
  },
  {
    soru: "3² + 4² = ? (Pisagor örneği)",
    secenekler: ["20", "24", "25", "30"],
    dogru: 2
  },
  {
    soru: "Bir diktörtgenin uzun kenarı 8 cm, kısa kenarı 5 cm ise alanı kaç cm²'dir?",
    secenekler: ["13", "26", "40", "30"],
    dogru: 2
  },
  {
    soru: "15 ile 25'in ortalaması kaçtır?",
    secenekler: ["18", "19", "20", "21"],
    dogru: 2
  },
  {
    soru: "100'ün karekökü kaçtır?",
    secenekler: ["8", "9", "10", "11"],
    dogru: 2
  },
  {
    soru: "200'ün %30'u kaçtır?",
    secenekler: ["50", "60", "70", "80"],
    dogru: 1
  },
  {
    soru: "Bir beşgenin kaç köşesi vardır?",
    secenekler: ["4", "5", "6", "7"],
    dogru: 1
  },
  {
    soru: "2⁵ (2 üzeri 5) kaçtır?",
    secenekler: ["10", "25", "32", "64"],
    dogru: 2
  },
  {
    soru: "√144 kaçtır?",
    secenekler: ["10", "11", "12", "13"],
    dogru: 2
  },
  {
    soru: "1 ile 100 arasında kaç tane asal sayı vardır?",
    secenekler: ["20", "25", "30", "50"],
    dogru: 1
  },
  {
    soru: "2x - 3 = 7 denkleminde x kaçtır?",
    secenekler: ["3", "4", "5", "6"],
    dogru: 2
  },
  // === 8 SORU: Matematikçiler Hakkında ===
  {
    soru: "Cahit Arf'ın portresi kaç TL'lik banknotun üzerindedir?",
    secenekler: ["5 TL", "10 TL", "20 TL", "50 TL"],
    dogru: 1
  },
  {
    soru: "Pisagor'un ünlü teoremi hangi tür üçgenlerle ilgilidir?",
    secenekler: ["İkizkenar", "Dik", "Eşkenar", "Dar açılı"],
    dogru: 1
  },
  {
    soru: "Gauss kimdir?",
    secenekler: ["Mimar", "Matematikçi", "Hekim", "Şarkıcı"],
    dogru: 1
  },
  {
    soru: "Euler hangi ülkede yaşamıştır?",
    secenekler: ["İtalya", "Rusya", "İsviçre", "Almanya"],
    dogru: 2
  },
  {
    soru: "El-Hârizmî'nin adından hangi kelime türemiştir?",
    secenekler: ["Algoritma", "Cebir", "Geometri", "Trigonometri"],
    dogru: 0
  },
  {
    soru: "Öklid'in ünlü kitabı ne adıyla anılır?",
    secenekler: ["Elementler", "Principia", "Summa", "Opus Magnum"],
    dogru: 0
  },
  {
    soru: "Cahit Arf ne ile ünlü bir Türk matematikçidir?",
    secenekler: ["Cebir", "Topoloji", "İstatistik", "Geometri"],
    dogru: 1
  },
  {
    soru: "Pisagor antik hangi uygarlığa ait bir matematikçidir?",
    secenekler: ["Mısır", "Mezopotamya", "Yunan", "Çin"],
    dogru: 2
  }
];

// Mathematician data
const matematikçiler = [
  {
    id: "pisagor",
    isim: "Pisagor (Pythagoras)",
    yasam: "MÖ 570 – MÖ 495",
    ulke: "Antik Yunanistan",
    bayrak: "🇬🇷",
    resim: "pisagor.jpg",
    kisa: "Antik Yunan matematikçi ve filozof. Pisagor teoremi (a² + b² = c²) ile tanınır.",
    biyografi: `Pisagor (Pythagoras), MÖ 570 yılında Sisam Adası'nda doğmuş, Antik Yunan'ın en ünlü matematikçi ve filozoflarından biridir. Matematik tarihine yaptığı katkılar, bugün bile eğitim müfredatlarının temel taşları arasında yer almaktadır.

Pisagor, gençlik yıllarında Mısır ve Babil'e yolculuklar yaparak farklı medeniyetlerin matematik bilgisini öğrenmiştir. Daha sonra Güney İtalya'daki Kroton şehrine yerleşerek kendi okulunu kurmuştur. Bu okul, hem bir eğitim kurumu hem de felsefi bir topluluk olarak faaliyet gösteriyordu.

Pisagor'un en bilinen katkısı, kendi adıyla anılan Pisagor Teoremi'dir. Bu teoreme göre, bir dik üçgende hipotenüsün (en uzun kenarın) karesinin uzunluğu, diğer iki kenarın karelerinin toplamına eşittir. Matematiksel olarak <strong>a² + b² = c²</strong> şeklinde ifade edilir. Örneğin, 3² + 4² = 9 + 16 = 25 = 5² olduğundan, kenarları 3, 4 ve 5 olan bir üçgen dik üçgendir. Bu teorem, geometrinin en temel ilkelerinden biridir ve günümüzde mimarlıktan mühendisliğe kadar pek çok alanda kullanılmaktadır.

Pisagor ayrıca sayılar teorisine de büyük katkılarda bulunmuştur. Tam sayıları, çift-tek sayıları ve asal sayıları sınıflandırmış; sayıların evrendeki düzenin anahtarı olduğuna inanmıştır. "Her şey sayıdır" sözü, onun felsefesinin özeti niteliğindedir.

Müzik alanında da çalışmalar yapan Pisagor, farklı uzunluktaki tellerin farklı sesler çıkardığını keşfetmiş ve müzikal aralıkların matematiksel oranlarla ifade edilebileceğini göstermiştir. Bu keşif, müzik teorisinin matematik ile olan derin bağlantısının ilk kanıtlarından biridir.

Pisagor'un kurduğu okul, yüzyıllar boyunca etkisini sürdürmüş ve birçok matematikçi ile filozofu etkilemiştir. Bugün hâlâ öğretilen Pisagor Teoremi, onun bilime olan mirasının en canlı kanıtıdır.`
  },
  {
    id: "oklid",
    isim: "Öklid (Euclid)",
    yasam: "MÖ 325 – MÖ 265",
    ulke: "Antik Yunanistan (İskenderiye)",
    bayrak: "🇬🇷",
    resim: "oklid.jpg",
    kisa: "Geometrinin babası olarak kabul edilen Antik Yunan matematikçi.",
    biyografi: `Öklid (Euclid), yaklaşık MÖ 325 yılında doğmuş ve "Geometrinin Babası" olarak tarihe geçmiş Antik Yunan matematikçidir. İskenderiye'de yaşamış ve orada matematik öğretmenliği yapmıştır.

Öklid'in en büyük eseri, 13 ciltlik "Elementler" (Elements) adlı kitabıdır. Bu eser, matematik tarihinin en etkili kitaplarından biri olarak kabul edilir. Elementler'de geometri, sayılar teorisi ve matematiksel mantık konuları sistematik bir şekilde ele alınmıştır. Kitap, aksiyom ve postülatlardan yola çıkarak teoremleri ispatlamaya dayanan mantıksal bir yapıya sahiptir.

Öklid geometrisi, düzlem üzerindeki noktalar, doğrular, açılar ve şekiller arasındaki ilişkileri inceler. Beş temel postülat üzerine kurulmuştur. Bu postülatlardan en ünlüsü, paralel doğrular postülatıdır: Bir doğru dışındaki bir noktadan, o doğruya yalnızca bir paralel doğru çizilebilir.

Öklid'in çalışmaları sadece geometri ile sınırlı kalmamıştır. Sayılar teorisine de önemli katkılarda bulunmuştur. Asal sayıların (2, 3, 5, 7, 11, 13, ...) sonsuz olduğunu ispatlayan Öklid, bu ispatıyla matematik tarihinin en zarif kanıtlarından birini ortaya koymuştur. Ayrıca Öklid algoritması olarak bilinen ve iki sayının en büyük ortak bölenini bulan yöntem de ona aittir.

Elementler kitabı, yüzyıllar boyunca dünyanın dört bir yanındaki okulların temel ders kitabı olmuştur. İncil'den sonra en çok basılan kitap olduğu söylenir. Öklid'in mantıksal ve aksiyomatik yaklaşımı, modern matematiğin temelini oluşturmuştur.

Öklid hakkında anlatılan ünlü bir hikâye vardır: Kral Ptolemaios, geometriyi daha kolay öğrenmenin bir yolu olup olmadığını sorduğunda, Öklid "Geometriye giden kraliyet yolu yoktur" demiştir. Bu söz, matematikte başarının yalnızca çalışma ve sebatla mümkün olduğunu vurgulamaktadır.`
  },
  {
    id: "harezmi",
    isim: "El-Hârizmî (Al-Khwarizmi)",
    yasam: "780 – 850",
    ulke: "Abbâsî Halifeliği (Özbekistan)",
    bayrak: "🇺🇿",
    resim: "harezmi.jpg",
    kisa: "Cebirin babası olarak bilinen Müslüman matematikçi ve astronom.",
    biyografi: `Muhammed ibn Musa el-Hârizmî, 780 yılında bugünkü Özbekistan'ın Harezm bölgesinde doğmuş, İslam Altın Çağı'nın en parlak matematikçilerinden biridir. "Cebirin Babası" unvanıyla anılır ve modern matematiğin temellerini atan bilim insanlarından biri olarak kabul edilir.

El-Hârizmî, Bağdat'taki Beytü'l-Hikme'de (Bilgelik Evi) çalışmıştır. Bu kurum, dönemin en büyük bilim ve çeviri merkeziydi. Burada Yunan, Hint ve Fars kaynaklarını incelemiş ve kendi özgün çalışmalarını ortaya koymuştur.

En ünlü eseri "Kitâbu'l-Muhtasar fî Hisâbi'l-Cebr ve'l-Mukâbele" adlı kitabıdır. Bu eser, "cebir" kelimesinin kaynağıdır. Kitapta birinci ve ikinci dereceden denklemlerin sistematik çözüm yöntemleri açıklanmıştır. El-Hârizmî, denklemleri sınıflandırmış ve her tür için adım adım çözüm yolları sunmuştur. Örneğin, x² + 10x = 39 gibi denklemlerin çözümünü sistematik hale getirmiştir. Bu yaklaşım, bugünkü modern cebirin temelini oluşturur.

El-Hârizmî'nin bir diğer büyük katkısı, Hint-Arap rakamlarını (0, 1, 2, 3, 4, 5, 6, 7, 8, 9) ve onluk sayı sistemini İslam dünyasına ve oradan Avrupa'ya tanıtmasıdır. "Algoritma" kelimesi de onun Latince'ye çevrilen adından (Algoritmi) türemiştir. Bu, bilgisayar biliminin en temel kavramlarından birinin kökeninin El-Hârizmî'ye dayandığını göstermektedir.

Astronomi alanında da çalışmalar yapan El-Hârizmî, güneş saatlerinin tasarımı, takvim hesaplamaları ve coğrafi koordinatların belirlenmesi konularında eserler vermiştir. Dünya haritası çiziminde de katkıları bulunmaktadır.

El-Hârizmî'nin eserleri, Orta Çağ Avrupa'sında Latince'ye çevrilmiş ve yüzyıllar boyunca üniversitelerde ders kitabı olarak kullanılmıştır. Onun çalışmaları olmadan bugünkü matematik, bilgisayar bilimi ve mühendislik alanlarının gelişimi çok farklı olabilirdi.`
  },
  {
    id: "gauss",
    isim: "Carl Friedrich Gauss",
    yasam: "1777 – 1855",
    ulke: "Almanya",
    bayrak: "🇩🇪",
    resim: "gauss.jpg",
    kisa: "Matematikçilerin Prensi olarak anılan Alman matematikçi. 1+2+...+100 = 5050 keşfi ile ünlüdür.",
    biyografi: `Carl Friedrich Gauss, 30 Nisan 1777'de Almanya'nın Braunschweig şehrinde doğmuştur. "Matematikçilerin Prensi" (Princeps Mathematicorum) olarak anılır ve tarihinin en büyük matematikçilerinden biri kabul edilir.

Gauss, olağanüstü bir çocukluk dehası olarak bilinir. Henüz üç yaşındayken, babasının hesap defterindeki bir hatayı fark ettiği rivayet edilir. Yedi yaşında okula başladığında, öğretmeni 1'den 100'e kadar olan sayıları toplamalarını istemiş, Gauss saniyeler içinde doğru cevabı bulmuştur: 1 + 2 + 3 + ... + 100 = (100 × 101) / 2 = <strong>5050</strong>. Bu meşhur hikâye, onun matematiksel yeteneklerinin erken yaşta ortaya çıktığının kanıtıdır.

Gauss'un matematik alanındaki katkıları son derece geniş ve derindir. 19 yaşında, pergel ve cetvelle düzgün 17-genin çizilebileceğini ispatlamıştır. Bu keşif, 2000 yılı aşkın süredir çözülemeyen bir geometri probleminin çözümüydü.

En önemli eserlerinden biri, 1801'de yayımladığı "Disquisitiones Arithmeticae" (Aritmetik Araştırmaları) adlı kitabıdır. Bu eser, sayılar teorisini modern bir çerçeveye oturtmuş ve modüler aritmetik kavramını sistematize etmiştir. Kitaptaki kuadratik karşılıklılık yasası, sayılar teorisinin en önemli teoremlerinden biridir.

Gauss, istatistik alanında da çığır açmıştır. Normal dağılım (Gauss dağılımı) kavramı, istatistiğin en temel araçlarından biridir ve doğadaki pek çok olayın modellemesinde kullanılır. Çan eğrisi olarak da bilinen bu dağılım, sosyal bilimlerden doğa bilimlerine kadar her yerde karşımıza çıkar.

Astronomi, jeodezi (yer ölçümü) ve fizik alanlarında da çalışmalar yapan Gauss, manyetizma üzerine önemli keşiflerde bulunmuştur. Manyetik alanın birimi olan "gauss" onun adıyla anılmaktadır.

Gauss, 23 Şubat 1855'te Göttingen'de vefat etmiştir. Hayatı boyunca 400'den fazla bilimsel makale ve kitap yayımlamış, matematiğin neredeyse her dalına katkıda bulunmuştur.`
  },
  {
    id: "euler",
    isim: "Leonhard Euler",
    yasam: "1707 – 1783",
    ulke: "İsviçre",
    bayrak: "🇨🇭",
    resim: "euler.jpg",
    kisa: "Tarihinin en üretken matematikçilerinden biri. e^(iπ) + 1 = 0 formülünün sahibi İsviçreli bilim insanı.",
    biyografi: `Leonhard Euler, 15 Nisan 1707'de İsviçre'nin Basel şehrinde doğmuştur. Matematik tarihinin en üretken ve çok yönlü bilim insanlarından biri olarak kabul edilir. Yaşamı boyunca 800'den fazla makale ve kitap yayımlamış olup, bu rakam hâlâ kırılamamış bir rekor olarak durmaktadır.

Euler, 13 yaşında Basel Üniversitesi'ne girmiştir. Ünlü matematikçi Johann Bernoulli'nin öğrencisi olmuş ve onun rehberliğinde yeteneklerini geliştirmiştir. 20 yaşında, Rusya'daki St. Petersburg Bilimler Akademisi'ne katılmış ve burada uzun yıllar çalışmıştır.

Euler'in matematikteki katkıları inanılmaz derecede geniştir. Analiz, sayılar teorisi, graf teorisi, topoloji, mekanik ve optik gibi pek çok alanda çığır açan çalışmalar yapmıştır. Modern matematik notasyonunun büyük bir kısmı Euler tarafından oluşturulmuştur. Fonksiyon gösterimi için <strong>f(x)</strong>, toplam sembolü <strong>Σ</strong> (sigma), sanal sayı birimi <strong>i = √(-1)</strong>, doğal logaritma tabanı <strong>e ≈ 2.718</strong> ve pi sayısı <strong>π ≈ 3.14159</strong> gibi semboller onun eseridir.

Euler'in en ünlü formülü, "matematiğin en güzel denklemi" olarak adlandırılan Euler özdeşliğidir: <strong>e<sup>iπ</sup> + 1 = 0</strong>. Bu formül, matematiğin beş temel sabitini (e, i, π, 1 ve 0) tek bir denklemde bir araya getirir ve matematikçiler tarafından büyük bir hayranlıkla karşılanır.

Graf teorisinin kurucusu olarak kabul edilen Euler, Königsberg'in Yedi Köprüsü problemini çözerken bu yeni matematik dalının temellerini atmıştır. Ayrıca çokyüzlüler için <strong>V − E + F = 2</strong> (Köşe − Kenar + Yüz = 2) formülünü keşfetmiştir. Bu problem, bir şehirdeki tüm köprülerden yalnızca bir kez geçerek dolaşmanın mümkün olup olmadığını sorguluyordu. Euler, bunun imkânsız olduğunu ispatlamıştır.

Euler, hayatının son yıllarında tamamen kör olmasına rağmen çalışmaya devam etmiştir. Olağanüstü hafızası sayesinde, karmaşık hesaplamaları zihninden yapmaya devam etmiş ve vefat ettiği güne kadar bilime katkıda bulunmuştur.

Euler, 18 Eylül 1783'te St. Petersburg'da vefat etmiştir. Onun mirası, modern matematiğin hemen her köşesinde canlı olarak yaşamaya devam etmektedir.`
  },
  {
    id: "cahitarf",
    isim: "Cahit Arf",
    yasam: "1910 – 1997",
    ulke: "Türkiye",
    bayrak: "🇹🇷",
    resim: "cahitarf.jpg",
    kisa: "Türk matematiğinin gururu. Arf değişmezi ve Hasse–Arf teoremi ile tanınır. Portresi 10 TL banknotunda yer alır.",
    biyografi: `Cahit Arf, 11 Ekim 1910'da Osmanlı Devleti döneminde Selanik'te doğmuştur. Türk matematik tarihinin en önemli isimlerinden biri olup, dünya çapında tanınan çalışmalarıyla Türkiye'nin bilim alanındaki en büyük gurur kaynaklarından biridir.

Arf'ın ailesi, 1912'deki Balkan Savaşı'nın ardından İstanbul'a göç etmiş, ardından İzmir'e yerleşmiştir. İlk eğitimini İzmir'de alan Arf, Türk Milli Eğitim Bakanlığı'ndan aldığı bursla Paris'e giderek eğitimine devam etmiş ve École Normale Supérieure'den mezun olmuştur.

Türkiye'ye döndükten sonra Galatasaray Lisesi'nde matematik öğretmenliği yapan Arf, 1933'te İstanbul Üniversitesi Matematik Bölümü'ne katılmıştır. 1937'de Almanya'ya giderek Göttingen Üniversitesi'nde ünlü matematikçi Helmut Hasse'nin danışmanlığında doktora çalışmasını tamamlamıştır.

Arf'ın en önemli matematiksel katkısı, 1941'de ortaya koyduğu <strong>Arf değişmezi</strong>'dir (Arf invariant). Bu kavram, karakteristiği 2 olan cisimler üzerindeki kuadratik formların sınıflandırılmasında kullanılır ve topoloji, düğüm teorisi ve cerrahi teori gibi alanlarda temel bir araç haline gelmiştir. Arf değişmezi, bir kuadratik formun önemli bir cebirsel özelliğini tek bir sayıyla ifade eden zarif bir kavramdır.

Arf'ın adını taşıyan bir diğer önemli sonuç <strong>Hasse–Arf teoremi</strong>'dir. Bu teorem, cebirsel sayı teorisinde yerel cisimlerin dallanma gruplarının üst numaralandırmasıyla ilgili temel bir sonuçtur. Ayrıca <strong>Arf halkaları</strong> ve <strong>Arf yarıgrupları</strong> kavramları da onun adıyla anılmaktadır.

1962'de Cumhurbaşkanı Cemal Gürsel'in atamasıyla TÜBİTAK'ın kuruluş çalışmalarına katılmış ve 1963'te kurumun kurucu başkanı olmuştur. Daha sonra Robert Kolej, Princeton İleri Araştırmalar Enstitüsü ve California Üniversitesi Berkeley'de çalışmıştır.

Türkiye'ye son dönüşünde Orta Doğu Teknik Üniversitesi (ODTÜ) Matematik Bölümü'ne katılmış ve 1980'deki emekliliğine kadar burada çalışmalarını sürdürmüştür. İnönü Ödülü (1948), TÜBİTAK Bilim Ödülü (1974) ve Fransa Akademik Palmiye Nişanı (1994) gibi pek çok ödül almıştır.

Cahit Arf, 26 Aralık 1997'de İstanbul Bebek'te 87 yaşında vefat etmiştir. Onun portresi, 2009'dan bu yana Türk 10 lira banknotunun arka yüzünde yer almaktadır. ODTÜ her yıl onun anısına "Cahit Arf Dersleri" düzenlemektedir.`
  }
];

// Shuffle helper
function shuffle(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Routes
app.get('/', (req, res) => {
  res.render('anasayfa', { aktifSayfa: 'anasayfa' });
});

app.get('/matematik-nedir', (req, res) => {
  res.render('matematik-nedir', { aktifSayfa: 'matematik-nedir' });
});

app.get('/semboller', (req, res) => {
  res.render('semboller', { aktifSayfa: 'semboller' });
});

app.get('/afis', (req, res) => {
  res.render('afis', { aktifSayfa: 'afis' });
});

app.get('/hayat-matematikci', (req, res) => {
  res.render('hayat-matematikci', { aktifSayfa: 'hayat-matematikci' });
});

app.get('/hakkimda', (req, res) => {
  res.render('hakkimda', { aktifSayfa: 'hakkimda' });
});

app.get('/unlu-matematikçiler', (req, res) => {
  res.render('matematikçiler', { matematikçiler, aktifSayfa: 'matematikçiler' });
});

app.get('/unlu-matematikciler', (req, res) => {
  res.render('matematikçiler', { matematikçiler, aktifSayfa: 'matematikçiler' });
});

app.get('/matematikci/:id', (req, res) => {
  const matematikci = matematikçiler.find(m => m.id === req.params.id);
  if (!matematikci) {
    return res.status(404).render('404', { aktifSayfa: '' });
  }
  const paragraflar = matematikci.biyografi.split('\n\n').filter(p => p.trim());
  res.render('matematikci-detay', { matematikci, paragraflar, aktifSayfa: 'matematikçiler' });
});

app.get('/matematikci-olmak', (req, res) => {
  res.render('matematikci-olmak', { aktifSayfa: 'matematikci-olmak' });
});

app.get('/quiz', async (req, res) => {
  const liderlik = (await liderlikOku()).slice(0, 10);
  const kaydedildi = req.query.kaydedildi === '1';
  const kaydedilenSonuc = kaydedildi
    ? {
        ad: req.query.ad || '',
        soyad: req.query.soyad || '',
        dogru: Number(req.query.dogru || 0),
        toplam: Number(req.query.toplam || quizSorulari.length)
      }
    : null;
  // Shuffle answer options for each question
  const sorular = quizSorulari.map((s, index) => {
    const dogruCevap = s.secenekler[s.dogru];
    const karisikSecenekler = shuffle(s.secenekler);
    const yeniDogru = karisikSecenekler.indexOf(dogruCevap);
    return {
      index: index,
      soru: s.soru,
      secenekler: karisikSecenekler,
      dogru: yeniDogru
    };
  });
  res.render('quiz', { sorular, aktifSayfa: 'quiz', liderlik, kaydedildi, kaydedilenSonuc });
});

app.post('/quiz', async (req, res) => {
  const cevaplar = req.body;
  let dogru = 0;
  const sonuclar = quizSorulari.map((s, index) => {
    const kullaniciCevapText = cevaplar[`soru_${index}`];
    const dogruCevapText = s.secenekler[s.dogru];
    const dogruMu = kullaniciCevapText === dogruCevapText;
    if (dogruMu) dogru++;
    const kullaniciIndex = s.secenekler.indexOf(kullaniciCevapText);
    return {
      soru: s.soru,
      secenekler: s.secenekler,
      dogruIndex: s.dogru,
      kullaniciIndex: kullaniciIndex,
      dogruMu
    };
  });

  const liderlik = (await liderlikOku()).slice(0, 10);

  res.render('quiz-sonuc', {
    sonuclar,
    dogru,
    toplam: quizSorulari.length,
    aktifSayfa: 'quiz',
    liderlik,
    kaydedildi: false,
    kaydedilenSonuc: null
  });
});

app.post('/quiz-kaydet', async (req, res) => {
  const { ad, soyad, dogru, toplam } = req.body;
  if (ad && soyad && dogru !== undefined && toplam !== undefined) {
    await liderlikEkle({
      ad: ad.trim().substring(0, 50),
      soyad: soyad.trim().substring(0, 50),
      dogru: parseInt(dogru, 10),
      toplam: parseInt(toplam, 10),
      tarih: new Date().toLocaleDateString('tr-TR')
    });
  }
  const yonlendirme = `/quiz?kaydedildi=1&ad=${encodeURIComponent((ad || '').trim().substring(0, 50))}&soyad=${encodeURIComponent((soyad || '').trim().substring(0, 50))}&dogru=${encodeURIComponent(dogru || 0)}&toplam=${encodeURIComponent(toplam || quizSorulari.length)}`;
  res.redirect(yonlendirme);
});

// Admin route - Liderlik kaydı sil
app.get('/admin/sil/:ad/:soyad', (req, res) => {
  const { ad, soyad } = req.params;
  db.run(
    'DELETE FROM liderlik WHERE ad = ? AND soyad = ?',
    [ad, soyad],
    function(err) {
      if (err) {
        res.status(500).send('Hata: ' + err.message);
        console.error('❌ Silme hatası:', err);
      } else {
        res.send(`✅ ${ad} ${soyad} liderlikten silindi (${this.changes} kayıt silinidi)`);
        console.log(`✅ ${ad} ${soyad} silindi`);
      }
    }
  );
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { aktifSayfa: '' });
});

app.listen(PORT, () => {
  console.log(`Matematik Dünyası http://localhost:${PORT} adresinde çalışıyor`);
});

// Graceful shutdown - app kapanırken veritabanı kapat
process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM alındı, uygulama kapatılıyor...');
  db.close((err) => {
    if (err) {
      console.error('❌ Database kapatma hatası:', err);
    } else {
      console.log('✅ Database kapatıldı');
    }
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT alındı, uygulama kapatılıyor...');
  db.close((err) => {
    if (err) {
      console.error('❌ Database kapatma hatası:', err);
    } else {
      console.log('✅ Database kapatıldı');
    }
    process.exit(0);
  });
});
