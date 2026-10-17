# Buxoro bitiruvchilari — admin panel va 3D dashboard dizayn spetsifikatsiyasi

## Maqsad

Bitta ishonchli bitiruvchi kartochkasi asosida ta’lim, bandlik va tibbiy holatni yuritish; admin paneldan hamma ma’lumotni tahrirlash; 3D dashboardda faqat kelishilgan real ko‘rsatkichlarni chiqarish.

## Manba fayllar

- `Тоифалар битирувчи 9823 (4)(4).xlsx` — asosiy 9 823 bitiruvchi ro‘yxati. `Жами` listida: 9 823 jami, 3 184 OTM, 3 693 maktab, 2 946 prof/texnikum-litseydagi umumiy guruh. `ОТМ` listida 3 184 OTM bitiruvchisi tasdiqlanadi. `рўйхат` listida F.I.O., JSHSHIR, tug‘ilgan sana, yosh, jins, ta’lim kodi, mahalla, bitiruvchi turi, telefon va bandlik holatlari mavjud.
- `Тоифалар битирувчи 651 Romitan (1).xlsx` / `Тоифалар битирувчи 651 Romitan(1).xlsx` — tibbiy ko‘rik uchun 651 Romitan yozuvi. Ustunlar: tuman, JSHSHIR, F.I.O., tug‘ilgan sana, yosh, jins, ta’lim kodi, mahalla, bitiruvchi turi, telefon, biriktirilgan muassasa, oxirgi ko‘rik sanasi, tashxis, tavsiya, ambulator/statsionar/operativ va sog‘lomlashtirish joylari.
- `555(2).xlsx` — tibbiyot sohasida bitirganlar ro‘yxati. Kelishilgan hisob: 283 nafar, shundan OTM — 210, tibbiyot texnikumi — 73. Bu 283 umumiy 9 823 ichida alohida kesim sifatida yuritiladi, umumiy son ustiga qo‘shilmaydi.
- `Buxoro_viloyati_sabablari_xususiy_OTMga_kirgan(1).xlsx` — OTMga oid qo‘shimcha ma’lumotlar: F.I.Sh., JSHSHIR, telefon, jins, OTM nomi, mulkchilik turi, ta’lim turi/shakli, to‘lov turi, mutaxassislik va boshqa statuslar.

## Asosiy ma’lumot modeli

### 1. Bitiruvchi

Har bir shaxs bitta asosiy yozuv bo‘ladi.

Maydonlar:
- id
- F.I.O.
- JSHSHIR
- telefon
- jins
- tug‘ilgan sana
- yosh
- tuman/shahar
- mahalla
- manzil
- OP/OShP

Dublikatni aniqlash tartibi:
1. JSHSHIR bo‘yicha aniq moslik.
2. JSHSHIR bo‘lmasa F.I.O. + hudud + tug‘ilgan sana kombinatsiyasi.
3. Mos kelmasa yangi yozuv.

### 2. Ta’lim

- ta’lim darajasi: `Maktab`, `Litsey`, `Texnikum`, `OTM`
- oliy ma’lumotli: faqat `OTM` bitirgan bo‘lsa `Ha`
- tibbiyot sohasida o‘qigan: `Ha/Yo‘q`
- tibbiy ta’lim turi: `OTM` yoki `Texnikum`
- ta’lim muassasasi nomi
- mutaxassislik
- diplom/status ma’lumoti mavjud bo‘lsa saqlanadi

Qoidalar:
- OTM bitiruvchisi dashboardda `Oliy ma’lumotli` hisoblanadi.
- Texnikum/litsey/maktab `Oliy ma’lumotli emas` hisoblanadi.
- Bo‘sh yoki aniqlanmagan ta’lim turi hech qaysi guruhga majburan kiritilmaydi.
- Tibbiyot sohasida o‘qiganlar jami 283: OTM 210 + Texnikum 73.

### 3. Bandlik

Asosiy statuslar:
- Ishlaydi
- Ishsiz
- Tadbirkor
- O‘zini o‘zi band qilgan
- Migratsiyada
- Ta’limning keyingi bosqichida
- 2 yoshgacha bola tarbiyasida
- Jarayonda
- Boshqa

Qo‘shimcha maydonlar:
- ish joyi
- lavozim
- buyruq sanasi
- buyruq raqami
- izoh

Dashboard uchun `Ishlaydi` va `Ishsiz` alohida aniq hisoblanadi; boshqa statuslar `Ishlaydi`ga avtomatik qo‘shilmaydi, faqat kelishilgan mapping orqali.

### 4. Tibbiy holat

- tibbiy ko‘rikdan o‘tgan: `Ha/Yo‘q`
- ko‘rik sanasi
- biriktirilgan muassasa
- sog‘liq holati: `Sog‘lom`, `Kasal`, `Aniqlanmagan`
- tashxis
- tavsiya
- ambulator
- statsionar
- operativ
- sog‘lomlashtirish: tuman/shahar, viloyat, respublika

Qoidalar:
- Ko‘rik sanasi mavjud bo‘lsa `Ko‘rikdan o‘tgan`.
- `Sog‘lom` faqat sog‘liq holati aniq sog‘lom deb belgilangan yozuvlardan hisoblanadi.
- `Kasal` faqat kasal/tashxis mavjud yozuvlardan hisoblanadi.
- Bo‘sh ma’lumot `Sog‘lom` yoki `Kasal`ga avtomatik kiritilmaydi.
- Kasallik statistikasi real tashxis matnlaridan olinadi; admin tashxis toifasini tahrirlay oladi.

## Admin panel

Admin har bir bitiruvchini ochib barcha bloklarni ko‘ra va tahrirlay oladi.

### Ro‘yxat ustunlari

- F.I.O.
- JSHSHIR
- hudud
- mahalla
- ta’lim darajasi
- tibbiyot sohasi belgisi
- bandlik holati
- tibbiy ko‘rik holati
- sog‘liq holati
- OP/OShP

### Tahrirlash oynasi

4 bo‘lim:
1. Shaxsiy ma’lumotlar
2. Ta’lim
3. Bandlik
4. Tibbiy holat

Admin imkoniyatlari:
- qo‘lda yangi bitiruvchi qo‘shish
- mavjud yozuvni tahrirlash
- OP/OShP ni qo‘lda yozish/almashtirish
- tibbiyot yo‘nalishini belgilash
- OTM/texnikum nomi va mutaxassislikni tahrirlash
- bandlik statusini tahrirlash
- ko‘rik va tashxis ma’lumotini tahrirlash
- yozuvni o‘chirish
- Excel import qilish
- import oldidan preview va dublikatlar sonini ko‘rsatish
- faqat tanlangan modul ma’lumotini tozalash
- to‘liq tozalashda `TOZALA` tasdig‘i

## Import logikasi

Import asosiy ro‘yxatni o‘chirib qayta yaratmaydi; mavjud kartochkalar bilan birlashtiradi.

Tartib:
1. `9823` — asosiy shaxslar va ta’lim/bandlik.
2. `651 Romitan` — o‘sha shaxslarga tibbiy ko‘rik ma’lumotini bog‘lash.
3. `555(2)` — tibbiyot sohasida o‘qigan 283 shaxsga medical-education flag va OTM/texnikum ma’lumotini bog‘lash.
4. OTM qo‘shimcha fayli — OTM nomi, mutaxassislik va boshqa mavjud maydonlarni to‘ldirish.

Import paytida JSHSHIR birinchi identifikator bo‘ladi. F.I.O. faqat ikkilamchi moslashtirish uchun ishlatiladi.

## 3D dashboard

3D xarita saqlanadi. Hudud bosilganda shu hudud kesimidagi panel ochiladi.

### Viloyat va hudud uchun ko‘rsatkichlar

- Jami bitiruvchi
- Oliy ma’lumotli
- Oliy ma’lumotli emas
- Ishlaydi
- Ishsiz
- Ko‘rikdan o‘tgan
- Sog‘lom
- Kasal
- Tibbiyot sohasida o‘qiganlar
  - OTM
  - Texnikum

### Kasallik statistikasi

Hudud bo‘yicha:
- kasallik/tashxis nomi
- soni
- kasallar ichidagi ulushi

Tashxislar real bazadan olinadi. Admin xohlasa tashxisni standart toifaga biriktiradi; dashboard shu standart toifalarni guruhlaydi.

## Hisoblash qoidalari

- `Jami` = unikal bitiruvchilar soni.
- `Oliy ma’lumotli` = ta’lim darajasi OTM.
- `Oliy ma’lumotli emas` = Maktab + Litsey + Texnikum, faqat ta’lim darajasi aniq bo‘lsa.
- `Ishlaydi` = bandlik statusi kelishilgan ishlovchi statuslardan biri.
- `Ishsiz` = aniq ishsiz statusi.
- `Ko‘rikdan o‘tgan` = ko‘rik sanasi mavjud.
- `Sog‘lom` = sog‘liq holati aniq `Sog‘lom`.
- `Kasal` = sog‘liq holati aniq `Kasal` yoki tasdiqlangan tashxis mavjud.
- `Tibbiyot sohasi` = medical_education=true; umumiy jami ustiga qo‘shilmaydi.

## Dastlabki nazorat raqamlari

Asosiy Excel bo‘yicha tekshiruv nuqtalari:
- Jami: 9 823
- OTM: 3 184
- Tibbiyot sohasida o‘qiganlar: 283
  - OTM: 210
  - Texnikum: 73

Import yoki migratsiyadan keyin shu nazorat sonlari keskin farq qilsa, admin panel ogohlantirish beradi va avtomatik ravishda noto‘g‘ri kategoriyalashni davom ettirmaydi.

## Xavfsizlik va audit

- Faqat admin shaxsiy ma’lumotni tahrirlaydi.
- Dashboardda F.I.O., JSHSHIR va telefon ko‘rinmaydi; faqat agregat statistika chiqadi.
- Har bir admin tahriri audit logga yoziladi: kim, qachon, qaysi yozuv, eski va yangi qiymat.
- Ommaviy o‘chirish ikki bosqichli tasdiq bilan.

## Qabul mezonlari

1. 9 823 asosiy ro‘yxat dublikatsiyasiz ko‘rinadi.
2. 3 184 OTM dashboardda oliy ma’lumotli sifatida hisoblanadi.
3. 283 tibbiyot sohasida o‘qiganlar alohida ko‘rinadi: 210 OTM + 73 texnikum.
4. 651 Romitan tibbiy ko‘rik ma’lumoti mavjud bitiruvchilarga bog‘lanadi, yangi 650 ta dublikat yaratmaydi.
5. Admin har bir kartochkaning barcha bo‘limlarini tahrirlay oladi.
6. Sog‘lom/kasal faqat real tibbiy ma’lumot asosida hisoblanadi.
7. 3D hudud tanlanganda barcha ko‘rsatkichlar shu hudud bo‘yicha qayta hisoblanadi.
8. Kasallik statistikasi real tashxislardan olinadi.
