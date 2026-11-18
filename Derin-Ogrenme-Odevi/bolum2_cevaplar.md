# Temel Kavramların İncelenmesi


## Soru 1. Derin öğrenme nedir?

Derin öğrenme, çok katmanlı yapay sinir ağlarını kullanarak veriden doğrudan öğrenen bir makine öğrenmesi alt alanıdır. 
"Derin" ifadesi, ağın çok sayıda ardışık katmandan oluşmasını anlatır. Diğer bir tanıma göre insan beyninin yapısından ve 
sinir hücrelerinden esinlenerek oluşturulmuş çok katmanlı yapay sinir ağları kullanan bir makine öğrenimi ve 
dolayısıyla bir yapay zeka alt kümesidir.


### Makine öğrenmesi ile derin öğrenme arasındaki fark nedir?

Klasik makine öğrenmesinde özellikler genellikle bizler yani insanlar tarafından elle çıkarılır ve model bu özellikler 
üzerinden karar verir. Derin öğrenmede ise özellik çıkarımı -buna literatürde feature extraction denir.- modelin içindedir; 
ağ ham veriden hangi özelliklerin önemli olduğunu kendisi öğrenir. Bunun karşılığında derin öğrenme çok daha fazla 
veriye ve hesaplama gücüne ihtiyaç duyar.


### Yapay sinir ağları nasıl çalışır?

Yapay sinir ağları, insan beynindeki nöronların birbirine bağlanma ve bilgi işleme biçiminden esinlenen 
matematiksel ve hesaplamalı sistemler ağıdır.

Bir yapay sinir ağı genellikle üç temel katmandan oluşur:
1. Girdi Katmanı (Input Layer): Dış dünyadan veya veri setinden ham bilgiyi alan ilk basamaktır
2. Gizli Katmanlar (Hidden Layers):  Girdi ile çıktı arasında yer alan, gelen veriyi matematiksel süzgeçlerden geçirerek 
   örüntüleri ve karmaşık ilişkileri çıkaran ara basamaklardır. Birden fazla gizli katmana sahip ağlar derin öğrenme
   olarak adlandırılur.
3. Çıktı Katmanı (Output Layer): Tüm işlemlerin sonucunda son kararı, sınıflandırmayı veya tahmini veren son katmandır.

Ağ, katmanlar halinde dizilmiş nöronlardan oluşur. Her nöron girişlerini ağırlıklarla çarpar, bunları toplar, bir bias 
ekler ve sonucu bir aktivasyon fonksiyonundan geçirir. Aşağıdaki gibi:

    y = f(w1·x1 + w2·x2 + ... + wn·xn + b)

Eğitim iki adımın tekrarıyla gerçekleşir:
1. **İleri yayılım (forward pass):** Giriş katman katman ilerler ve bir tahmin üretilir.
2. **Geri yayılım (backpropagation):** Tahmin ile gerçek etiket arasındaki hata bir kayıp fonksiyonuyla ölçülür. 
     Bu hatanın her ağırlığa göre türevi (gradyan) hesaplanır ve ağırlıklar bir optimizasyon algoritmasıyla 
     (ör. Gradient Descent, Adam) hatayı azaltacak yönde güncellenir.


### Bir yapay sinir ağı neden birden fazla katmandan oluşur?

Yapay sinir ağlarının birden fazla katmandan (özellikle gizli katmanlardan) oluşmasının temel nedeni, gerçek dünyadaki 
karmaşık, doğrusal olmayan (non-linear) örüntüleri ve soyut ilişkileri öğrenebilmektir. Temelde yatan sebep budur.

Daha detaylı açıklamak gerekirse;
Tek katmanlı bir ağ yalnızca basit, doğrusal olarak ayrılabilen ilişkileri öğrenebilir. Birden fazla katman, ağın 
problemi hiyerarşik olarak çözmesini sağlar: ilk katmanlar kenar ve köşe gibi basit örüntüleri, sonraki katmanlar 
bunları birleştirerek doku ve parça gibi daha karmaşık özellikleri, son katmanlar ise nesnenin tamamını temsil eden 
soyut özellikleri öğrenir. Katmanlar arasındaki doğrusal olmayan aktivasyon fonksiyonları sayesinde ağ karmaşık 
ilişkileri modelleyebilir.

---

## Soru 2. Konvolüsyon nedir?

Konvolüsyon veya türkçe olarak evrişim, iki fonksiyonu birleştirerek aralarındaki örtüşmeyi veya etkileşimi hesaplayan 
temel bir matematiksel işlemdir.

Biraz daha detaylandırırsam;
Konvolüsyon, küçük bir ağırlık matrisinin görüntü üzerinde kaydırılarak her konumda yerel bir özellik 
değerinin hesaplandığı işlemdir. CNN'lerde görüntüden özellik çıkarmanın temel yöntemidir.

### Konvolüsyon işlemi görüntü üzerinde nasıl gerçekleştirilir?

1. Çekirdek Hazırlama: İşlevine göre 3x3, 5x5 gibi küçük sayısal değerlere sahip bir matris seçilir.
2. Yerleştirme: Çekirdek, görüntü matrisinin sol üst köşesinden başlayarak piksellerin üzerine yerleştirilir
3. Çarpma ve Toplama: Çekirdek matrisindeki her bir değer, örtüştüğü görüntü pikseli değeri ile çarpılır. Elde edilen 
   tüm çarpım sonuçları birbiriyle toplanır.
4. Merkez Pikseli Güncelleme: Elde edilen toplam değer, çekirdeğin merkezine karşılık gelen yeni piksel değeri olarak 
   yazılır.
5. Kaydırma (Stride): Çekirdek sağa doğru belirlenen adım miktarınca kaydırılarak aynı işlem görüntüdeki tüm pikseller 
   için tekrarlanır.

### Kernel (filtre) nedir?

Kernel, konvolüsyonda kullanılan küçük ağırlık matrisidir (ör. 3×3 gibi tek sayı olur). Değerleri elle belirlenmez, 
eğitim sırasında öğrenilir. Eğitim sonunda her filtre belirli bir örüntüye (yatay kenar, dikey kenar, köşe, doku vb.) 
duyarlı hale gelir.

### 3×3 boyutundaki bir filtrenin kaç ağırlık parametresi vardır?

Tek kanallı yani gri seviye bir girişte 3 × 3 = **9 ağırlık** vardır; eğer bias eklenirse 10 parametre eder.
Genel formül şu şekildedir: `kernel yüksekliği × kernel genişliği × giriş kanal sayısı` ağırlık + 1 bias.
Örneğin 3 kanallı RGB bir girişte 3 × 3 × 3 = 27 ağırlık bulunur.

### Filtre görüntü üzerinde hareket ederken ne yapar?

Her konumda, altındaki bölgenin kendi aradığı örüntüye ne kadar benzediğini ölçer; benzerlik yüksekse çıkış değeri 
büyük olur. Aynı filtre görüntünün her yerinde kullanıldığı için (**ağırlık paylaşımı**) parametre sayısı az kalır 
ve bir özellik görüntünün neresinde olursa olsun yakalanabilir.

Kısaca;
Filtre görüntü üzerinde hareket ederken örtüştüğü piksellerle kendi değerlerini çarpar, sonuçları toplar ve yeni bir 
piksel değeri hesaplar.

### Bir CNN'de neden birden fazla filtre kullanılır?

Her filtre tek bir örüntü türünü öğrenir. Bir görüntüyü tanımak için aynı anda birçok farklı özelliğe 
(farklı yönlerde kenarlar, köşeler, dokular) ihtiyaç vardır. N filtre kullanmak N farklı özellik haritası (çıkış kanalı)
üretir ve modelin görüntüyü çok yönlü temsil etmesini sağlar.

---

## Soru 3. Pooling nedir?

Pooling, özellik haritalarını küçük bölgelere ayırıp her bölgeyi tek bir değerle özetleyerek uzamsal boyutu küçülten 
işlemdir. Öğrenilebilir parametresi yoktur. Zaten türkçeside havuzlama demek oluyor. 

### Max Pooling işleminin amacı nedir?

- Özellik haritasının boyutunu küçülterek hesaplama yükünü ve sonraki katmanlardaki parametre sayısını azaltmak,
- Her bölgedeki en güçlü tepkiyi, yani en belirgin özelliği korumak,
- Özelliğin konumundaki küçük kaymalara karşı modeli daha dayanıklı yapmak buna translation invariance denir,
- Sonraki katmanların görüntünün daha geniş bir alanını görmesini sağlamak yani amaç receptive field'ı büyütmek.

### 2×2 Max Pooling nasıl çalışır?

Özellik haritası örtüşmeyen 2×2'lik bloklara ayrılır (`stride = 2`). Her bloktaki 4 değerden en büyüğü seçilip çıkışa 
yazılır, diğer 3 değer atılır.

    Giriş (4×4)          Çıkış (2×2)
    1  3 | 2  4
    5  6 | 1  2    →     6  4
    -----+-----          7  9
    7  2 | 8  3
    4  1 | 5  9

### Giriş görüntüsünün boyutunu nasıl değiştirir?

Yükseklik ve genişliği yarıya indirir, kanal sayısını değiştirmez. Örneğin 26×26×8 → 13×13×8. Boyut tek sayıysa aşağı 
yuvarlanır (11×11 → 5×5) ve son satır ile sütun kullanılmaz.

---

## Soru 4. Aktivasyon fonksiyonları


### Aktivasyon fonksiyonları neden kullanılır?

Ağa doğrusal olmayanlık (non-linearity) kazandırmak için gerekli. Aktivasyon olmasaydı her katman yalnızca doğrusal bir 
dönüşüm yapardı ve art arda gelen doğrusal dönüşümler tek bir doğrusal dönüşüme indirgenirdi. Bu durumda katman sayısı 
ne olursa olsun ağ, tek katmanlı doğrusal bir modelden daha güçlü olamazdı.

### ReLU fonksiyonu nasıl çalışır?

    ReLU(x) = max(0, x) 

Tek bir görevi var. Negatif girişleri 0 yapar, pozitif girişleri olduğu gibi bırakır. 
Örneğin `[-5, -2, 0, 2, 4]` → `[0, 0, 0, 2, 4]`.

Avantajları:
- Hesaplaması çok ucuzdur. Maliyet aşırı düşük.
- Pozitif bölgede türevi 1 olduğu için derin ağlarda kaybolan gradyan (vanishing gradient) sorununu azaltır ki bu ciddi bir sorundur.
- Nöronların bir kısmını sıfırlayarak seyrek yani sparse bir temsil oluşturur.

### Softmax fonksiyonu ne işe yarar?

Bir sayı vektörünü -logit denir buna- olasılık dağılımına dönüştürür:

    softmax(z_i) = e^(z_i) / (e^(z_1) + e^(z_2) + ... + e^(z_n))

Tüm çıktılar 0 ile 1 arasındadır ve toplamları 1'dir. Çok sınıflı sınıflandırmada çıkış katmanında, her sınıfın olasılığını 
vermek için kullanılır. Örneğin `[2.0, 1.0, 0.1]` → `[0.659, 0.242, 0.099]`.

### ReLU ile Softmax arasındaki temel fark nedir?

|               | ReLU                            | Softmax                                   |
|---------------|---------------------------------|-------------------------------------------|
| Çalışma şekli | Her değeri **bağımsız** işler   | Vektörün **tamamını birlikte** işler      |
| Çıkış aralığı | 0 ile sonsuz arası              | 0 ile 1 arası, toplam = 1                 |
| Kullanım yeri | Gizli katmanlar                 | Çıkış katmanı (çok sınıflı sınıflandırma) |
| Amacı         | Doğrusal olmayanlık kazandırmak | Çıktıyı olasılığa çevirmek                |

---

## Soru 5. Dense katman

### Dense katman nedir?

Tam bağlantılı yani fully connected katmandır: katmandaki her nöron önceki katmandaki tüm nöronlara bağlıdır. 
Çıkışı `y = f(W·x + b)` ile hesaplanır.

Parametre sayısı: `(giriş sayısı × nöron sayısı) + nöron sayısı`.
Örneğin 400 girişli, 64 nöronlu bir Dense katmanda 400 × 64 + 64 totalde 25.664 parametre vardır.

### Flatten katmanının görevi nedir?

Konvolüsyon ve pooling katmanlarının çok boyutlu çıktısını (ör. 5×5×16) tek boyutlu bir vektöre (5 × 5 × 16 = 400 eleman)
dönüştürür. Dense katmanlar tek boyutlu giriş beklediği için bu dönüşüm gereklidir. Öğrenilebilir parametresi yoktur, 
yalnızca verinin şeklini değiştirir.

### CNN mimarisinde Dense katmanlar neden kullanılır?

Konvolüsyon katmanları yerel özellikleri çıkarır "burada bir kenar var", "burada bir doku var" der. 
Dense katmanlar bu özelliklerin tamamını bir araya getirip birleştirerek nihai kararı verir 
"bu özelliklerin bu birleşimi bir ayakkabıdır" gibisinden. Son Dense katman, sınıf sayısı kadar nöronla her sınıf için
bir skor üretir.