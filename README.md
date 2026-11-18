# Derin Öğrenme ve Evrişimsel Sinir Ağlarının (CNN) Temel Yapısının İncelenmesi

Bilgisayarlı Görme dersi ödevi. Fashion-MNIST veri seti üzerinde TensorFlow/Keras ile basit bir CNN modeli kurulur, eğitilir ve katman katman incelenir. Ayrıca filtre sayısının modele etkisi deneyle karşılaştırılır.

## İçerik

```
Derin-Ogrenme-Odevi/
├── cnn_odevi.ipynb                  # Ana notebook: kodlar, çıktılar ve soruların cevapları
├── bolum2_cevaplar.md               # 2. Bölüm: temel kavramlar soru-cevap
├── bolum3_filtreler.png             # Konvolüsyon filtrelerinin görselleştirmesi
├── bolum6_egitim_grafikleri.png     # Eğitim / doğrulama accuracy ve loss grafikleri
├── bolum8_deney_karsilastirma.png   # Farklı filtre sayılarının karşılaştırması
└── sunum/                           # Ödevin HTML sunumu
    ├── index.html
    ├── css/  js/  assets/
```

| Bölüm | Konu |
|-------|------|
| 2 | Temel kavramlar: derin öğrenme, yapay nöron, ileri/geri yayılım (`bolum2_cevaplar.md`) |
| 3–5 | Konvolüsyon, kernel/filtreler, havuzlama (pooling), aktivasyon fonksiyonları ve veri setinin hazırlanması |
| 6 | CNN modelinin kurulması ve eğitimi |
| 7 | Model mimarisinin katman katman boyut ve parametre analizi |
| 8 | Deney: ilk katmandaki filtre sayısının doğruluğa ve eğitim süresine etkisi |

**Sonuç (özet):** İlk katmandaki filtre sayısını iki katına çıkarmak test doğruluğunu yaklaşık %86,91'den %87,44'e çıkarmış, buna karşılık eğitim süresini artırmıştır.

## Veri seti

[Fashion-MNIST](https://github.com/zalandoresearch/fashion-mnist) kullanılmıştır (70.000 adet 28×28 gri tonlu kıyafet resmi, 10 sınıf). Veri seti repoda **yer almaz**. Notebook'taki

```python
tf.keras.datasets.fashion_mnist.load_data()
```

satırı ilk çalıştırmada veriyi otomatik olarak indirir (~30 MB) ve `~/.keras/datasets/` altına kaydeder.

## Kurulum

Python **3.12** ile test edilmiştir. (TensorFlow henüz her Python sürümünü desteklemediği için 3.12 önerilir.)

```bash
git clone https://github.com/Baki187/YMG-3.git
cd YMG-3

# Sanal ortam oluştur
python -m venv .venv

# Etkinleştir
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

## Çalıştırma

```bash
jupyter notebook Derin-Ogrenme-Odevi/cnn_odevi.ipynb
```

Notebook'u hücreleri sırayla çalıştırarak baştan sona yürütebilirsiniz. Notebook çıktılarıyla birlikte kaydedildiği için hiçbir şey kurmadan GitHub üzerinden de okunabilir.

> Model eğitimi CPU'da birkaç dakika sürebilir; 8. Bölüm'deki deney birden fazla model eğittiği için daha uzundur.

## Sunum

`Derin-Ogrenme-Odevi/sunum/index.html` dosyasını bir tarayıcıda açmanız yeterlidir; ek kurulum gerekmez.

## Kullanılan kütüphaneler

- TensorFlow / Keras: model kurma ve eğitim
- NumPy: veri işleme
- Matplotlib: grafikler ve görselleştirme
- Jupyter: notebook ortamı
