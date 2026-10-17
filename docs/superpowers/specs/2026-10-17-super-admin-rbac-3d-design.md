# Buxoro SSB Super Admin, RBAC va 3D monitoring — Design Spec

## 1. Maqsad

Mavjud Buxoro SSB dashboardini yagona boshqaruv markaziga aylantirish. Tizimda faqat bitta Super Admin bo‘ladi. Super Admin Oddiy Admin va Nazorat Adminlarni tayinlaydi, ularga scope beradi va butun viloyat bo‘yicha boshqaruvni amalga oshiradi. Muassasa foydalanuvchilari endi boshqa foydalanuvchilarga login/parol bera olmaydi.

Shuningdek, rahbariyat 3D xaritasi vizual va iyerarxik jihatdan to‘g‘rilanadi: pastel hudud ranglari, Buxoro shahri va Kogon shahri aniq ko‘rinishi, ko‘proq uy maketlari, yirik TTB/SHTB binolari va ma’lumot oqimi OP/OShP -> TTB/SHTB -> Buxoro SSB ko‘rinishida bo‘ladi.

## 2. Scope

### 2.1 Rollar

#### Super Admin
- Tizimda faqat 1 ta.
- Butun viloyat bo‘yicha to‘liq boshqaruv.
- Oddiy Admin va Nazorat Admin yaratish, bloklash, faollashtirish va huquqlarini o‘zgartirish.
- Barcha muassasa va foydalanuvchilarni boshqarish.
- DPM foydalanuvchilari uchun login/parol yaratish va reset qilish huquqi faqat Super Adminga tegishli.
- Barcha hududlar, sessiyalar, audit, xavfsizlik va server holatini ko‘rish.
- 3D xarita va iyerarxiya holatini boshqarish.

#### Oddiy Admin
- Faqat 1 ta tuman/shahar hududiga biriktiriladi.
- Faqat o‘z hududidagi muassasalarni ko‘radi va boshqaradi.
- O‘z hududidagi TTB/SHTB, OP, OShP va tegishli muassasalarga login/parol yaratish/reset qilish mumkin.
- DPMlarga kira olmaydi va DPM credentiallarini boshqara olmaydi.
- Boshqa hududlarni ko‘rmaydi.
- Boshqa adminlarni tayinlay olmaydi.

#### Nazorat Admin
Nazorat Admin ikki scope va ikki permission rejimida ishlashi mumkin.

Scope:
- `province` — butun viloyat bo‘yicha.
- `district` — bitta tuman/shahar bo‘yicha.

Permission mode:
- `active` — monitoring + credential yaratish/reset qilish.
- `viewer` — faqat monitoring, credential boshqaruvi yo‘q.

Qoida:
- Viloyat Nazorat Admini DPMlarni ko‘ra oladi va monitoring qiladi.
- Nazorat Admin DPM credentiallarini hech qachon boshqarmaydi.
- Hududiy Nazorat Admin faqat o‘z hududini ko‘radi.
- Viloyat `active` Nazorat Admin DPMlardan tashqari hududiy muassasalar credentiallarini boshqarishi mumkin.

#### Muassasa foydalanuvchisi
- Faqat o‘z kabinetiga kiradi.
- Login/parol yaratish, reset qilish yoki boshqa foydalanuvchini boshqarish huquqi bo‘lmaydi.
- O‘ziga biriktirilmagan muassasa va hududlarni ko‘rmaydi.

## 3. Credential boshqaruv qoidalari

| Resurs | Super Admin | Oddiy Admin | Nazorat Active | Nazorat Viewer | Muassasa |
|---|---|---|---|---|---|
| DPM credential | Ha | Yo‘q | Yo‘q | Yo‘q | Yo‘q |
| O‘z hududidagi TTB/SHTB | Ha | Ha | Ha, scope ichida | Yo‘q | Yo‘q |
| O‘z hududidagi OP/OShP | Ha | Ha | Ha, scope ichida | Yo‘q | Yo‘q |
| Boshqa hudud | Ha | Yo‘q | Faqat province scope | Faqat province scope ko‘rish | Yo‘q |
| Admin yaratish | Ha | Yo‘q | Yo‘q | Yo‘q | Yo‘q |

Har bir credential yaratish/reset/bloklash amali auditga yoziladi.

## 4. Super Admin UI

Chap menyuli boshqaruv markazi.

Menyu:
1. Bosh sahifa
2. Adminlar
3. Foydalanuvchilar
4. Muassasalar
5. Hududlar va iyerarxiya
6. 3D xarita
7. Sessiyalar
8. Xavfsizlik
9. Audit
10. Server holati
11. Sozlamalar

### 4.1 Bosh sahifa
- Jami foydalanuvchilar
- Faol foydalanuvchilar
- Online sessiyalar
- Jami muassasalar
- Hududlar holati
- So‘nggi xavfsizlik hodisalari
- So‘nggi admin amallari
- Server holati

### 4.2 Adminlar
- Oddiy Admin yaratish
- Nazorat Admin yaratish
- Scope tanlash: province yoki district
- Nazorat Admin mode: active yoki viewer
- Oddiy Admin uchun aynan 1 ta district majburiy
- Bloklash/faollashtirish
- Parol reset
- So‘nggi kirish va faollik

### 4.3 Foydalanuvchilar
- Muassasa foydalanuvchilarini qidirish
- Rol, hudud, muassasa bo‘yicha filter
- Credential yaratish/reset
- Bloklash/faollashtirish
- So‘nggi kirish
- Audit tarixiga o‘tish

### 4.4 Muassasalar
- Muassasa nomi, turi, hududi
- TTB/SHTB -> OP/OShP iyerarxiyasi
- DPMlar alohida viloyat darajasida
- Faol/nofaol holat
- Muassasa kabinetini “ko‘rib chiqish” rejimi

### 4.5 Hududlar va iyerarxiya
- TTB/SHTBga tegishli OP/OShPlarni ko‘rsatish
- Noto‘g‘ri biriktirishlarni tuzatish
- DPMlarni tuman iyerarxiyasidan tashqarida saqlash

### 4.6 Sessiyalar
- Kim online
- Oxirgi aktivlik
- Qurilma/browser ma’lumoti
- Sessiyani majburan tugatish faqat Super Admin uchun

### 4.7 Xavfsizlik
- Noto‘g‘ri login urinishlari
- Rate limit hodisalari
- Bloklangan foydalanuvchilar
- Shubhali faollik
- Xavfsizlik eventlari

### 4.8 Audit
- Kim
- Qachon
- Qaysi obyektni
- Qanday o‘zgartirgan
- Credential qiymati hech qachon auditga ochiq yozilmaydi

### 4.9 Server holati
- App holati
- Database holati
- 5xx xatolar
- So‘nggi deploy holati
- CPU/memory asosiy monitoring

## 5. RBAC modeli

Foydalanuvchi accessi faqat UI darajasida emas, backend API darajasida ham tekshiriladi.

Tavsiya etilgan atributlar:
- `role`: `SUPER_ADMIN | ADMIN | CONTROL_ADMIN | FACILITY`
- `scope_type`: `province | district | facility`
- `district_id`: nullable; ADMIN uchun majburiy
- `facility_id`: FACILITY uchun majburiy
- `control_mode`: `active | viewer` faqat CONTROL_ADMIN uchun
- `active`: boolean

Authorization qarori har bir mutating endpointda server tomonda qayta tekshiriladi.

## 6. 3D xarita redesign

### 6.1 Hudud ranglari
Hozirgi yorqin ranglar o‘rniga past saturation, pastel/neon-soft ranglar qo‘llanadi. Ranglar bir-biridan farq qiladi, lekin ko‘zga qattiq urilmaydi.

Status rangi hudud rangidan alohida qatlamda ko‘rsatiladi:
- Yashil — yaxshi
- Sariq — e’tibor
- Qizil — muammo

### 6.2 Buxoro shahri va Kogon shahri
- Poligon material/opacity va balandlik alohida kalibrlanadi.
- Label har doim ko‘rinadigan qatlamga olinadi.
- Xarita umumiy ko‘rinishida ikkala shahar ham yo‘qolib ketmasligi shart.

### 6.3 TTB/SHTB modeli
- OP/OShPdan ancha yirik administrativ bino.
- `TTB` yoki `SHTB` belgisi.
- Hudud nomi yozuvi.
- Select qilinganda bino va unga tegishli OP/OShPlar ajralib ko‘rinadi.

### 6.4 OP/OShP modeli
- Kichik klinika/ambulatoriya uslubi.
- OP atrofi taxminan 4–6 ta uy.
- OShP atrofi taxminan 3–5 ta uy.
- Uylar hudud poligonidan tashqariga chiqmasligi kerak.

### 6.5 TTB/SHTB atrofi
- Taxminan 8–12 ta uy/mahalla maketi.
- Bino dominant obyekt bo‘lib qoladi.

### 6.6 Ma’lumot oqimi
Eski markazdan tashqariga ketuvchi flow olib tashlanadi.

Yangi iyerarxik flow:
- `OP/OShP -> o‘z TTB/SHTBsi`
- `TTB/SHTB -> Buxoro SSB`

Flow chizig‘ida harakatlanuvchi particle/yorug‘ nuqta ma’lumot yo‘nalishini ko‘rsatadi. Arrow/animation direction faqat pastdan yuqoriga bo‘ladi.

### 6.7 Click focus
- Tuman/shahar bosilganda shu hudud yoritiladi, qolganlari xiralashadi.
- TTB/SHTB bosilganda shu markaz va unga tegishli OP/OShPlar fokusga keladi.
- Home/Umumiy ko‘rinish barcha focuslarni reset qiladi.

## 7. Mavjud funksiyalarni saqlash

Quyidagilar regress qilmasligi shart:
- `/login`
- `/leadership`
- `/admin`
- `/facility`
- mavjud admin credential login
- mobile same-origin login fix
- security headers
- rate limiting
- existing DB tables/data

## 8. Migratsiya

Mavjud foydalanuvchilar o‘chirib tashlanmaydi.

Yangi RBAC uchun kerak bo‘lsa:
- qo‘shimcha columns yoki alohida role/scope table yaratiladi;
- migratsiya idempotent bo‘ladi;
- Super Admin mavjud admin akkauntiga xavfsiz map qilinadi;
- mavjud facility foydalanuvchilari FACILITY roliga normalizatsiya qilinadi.

DB o‘zgarishdan oldin schema tekshiriladi; mavjud column nomlari taxmin qilinmaydi.

## 9. Audit va xavfsizlik

Majburiy audit eventlari:
- admin yaratish/o‘chirish/bloklash
- scope o‘zgartirish
- credential yaratish/reset
- muassasa-hudud biriktirish
- sessiyani tugatish
- 3D xarita iyerarxiya metadata o‘zgarishi

Parollar va hashlar log/audit/UI da ko‘rsatilmaydi.

## 10. Test strategiyasi

### RBAC testlari
- Super Admin barcha scopega kira oladi.
- Oddiy Admin aynan 1 ta district bilan cheklangan.
- Oddiy Admin boshqa district credentialini boshqara olmaydi.
- Oddiy Admin DPMga credential bera olmaydi.
- Province active Control Admin hududiy credentiallarni boshqaradi, DPM credentialini boshqarmaydi.
- Province viewer faqat o‘qiydi.
- District Control Admin boshqa districtga kira olmaydi.
- Facility user credential endpointlariga kira olmaydi.

### 3D testlari
- Buxoro shahri ko‘rinadi.
- Kogon shahri ko‘rinadi.
- Pastel palette yuklanadi.
- TTB/SHTB uy soni OP/OShPdan ko‘p.
- OP/OShP -> TTB/SHTB flow mavjud.
- TTB/SHTB -> SSB flow mavjud.
- Eski SSB -> TTB/SHTB flow yo‘q.
- click focus va home reset ishlaydi.

### Production smoke test
- Login 200
- Super Admin sahifa 200
- Leadership 200
- Facility 200
- RBAC unauthorized testlar 401/403
- Authorized testlar 200
- Railway deployment SUCCESS

## 11. Implementatsiya ketma-ketligi

1. RBAC schema va authorization layer
2. Super Admin UI va admin management
3. Credential permission migration
4. Session/security/audit/server monitoring UI
5. 3D pastel palette va city visibility fix
6. TTB/SHTB 3D model + uylar
7. OP/OShP uylar ko‘paytirish
8. Hierarchical data flow animation
9. Regression + production smoke tests
10. Railway deploy va verifikatsiya

## 12. Qasddan scope tashqarisida

Hozircha quyidagilar qilinmaydi:
- Admin orqali dashboard bloklari/matnlarini erkin konstruktor kabi yaratish
- Muassasa foydalanuvchisiga user management berish
- Ikkinchi Super Admin yaratish
- DPM credentialini Oddiy/Nazorat Adminlarga berish

## 13. Qabul mezonlari

Ish tayyor deb hisoblanishi uchun:
- aynan bitta Super Admin modeli ishlashi;
- Oddiy Admin faqat 1 hududda ishlashi;
- Nazorat Admin province/district va active/viewer kombinatsiyasida ishlashi;
- DPM credentiali faqat Super Adminda qolishi;
- muassasa user managementdan chiqarilishi;
- Super Admin chap menyuli markaz sifatida ishlashi;
- 3D shaharlar ko‘rinishi, pastel hududlar, ko‘proq uylar va yangi iyerarxik flow ishlashi;
- mavjud login/security/facility flowlar regress qilmasligi;
- production smoke testlar muvaffaqiyatli o‘tishi.
