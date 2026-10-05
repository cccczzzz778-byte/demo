# Buxoro viloyati Sog‘liqni saqlash boshqarmasi — Yagona boshqaruv dashboardi

Sana: 2026-10-05
Holat: Design spec, foydalanuvchi tasdig‘iga tayyor

## 1. Maqsad

Buxoro viloyati Sog‘liqni saqlash boshqarmasi uchun KPI, Ona-bola, QR-kod orqali baholash va Murojaatlar tizimlarini bitta markaziy web-platformada birlashtirish. Foydalanuvchi barcha asosiy statistikani bitta dashboardda ko‘radi, alohida modullarga shu portal ichidan kiradi va hudud/muassasa/sana kesimida hisobot oladi.

Yangi ishlab chiqarish muhiti mavjud KPI yoki boshqa production tizimlarini buzmasdan, alohida loyiha sifatida yaratiladi.

## 2. Yangi production nomlash

Tavsiya etilgan GitHub repo: `cccczzzz778-byte/buxoro-ssb-dashboard`
Tavsiya etilgan Railway project/service: `buxoro-ssb-dashboard-production`
Tavsiya etilgan asosiy ilova nomi: `Buxoro viloyati Sog‘liqni saqlash dashboardi`

Mavjud `demo`, KPI, QR, Murojaatlar va Ona-bola productionlari o‘zgartirilmaydi. Yangi portal ulardan ma’lumotlarni integratsiya qiladi yoki keyingi bosqichda ularning modullarini yagona backendga ko‘chiradi.

## 3. Asosiy modullar

### 3.1. Bosh sahifa
- KPI tizimi — jami ko‘rsatkichlar, o‘rtacha ball, bajarilgan/bajarilmagan mezonlar.
- Ona-bola tizimi — jami ayollar, homilador ayollar, 0–3 yosh bolalar, tug‘ruqlar va hudud statistikasi.
- QR-kod tizimi — jami QR, faol/nofaol QR, baholashlar va faollik foizi.
- Murojaatlar tizimi — jami murojaatlar, ko‘rib chiqilgan, jarayondagi, rad etilgan/yopilgan murojaatlar.
- Umumiy oylik dinamika.
- Tizimlar ulushi yoki umumiy ko‘rsatkich diagrammasi.
- Hudud va muassasa filtrlari.
- Sana oralig‘i filtri.

### 3.2. KPI statistikasi
- Mavjud KPI platformasidagi real ko‘rsatkichlardan foydalaniladi.
- Jami ko‘rsatkichlar, bajarilgan, bajarilmagan, qisman bajarilgan.
- Oylik tarix saqlanadi; yangi oy alohida davr sifatida yuritiladi.
- Muassasa va yo‘nalish kesimida drill-down.
- Excel hisobot olish.

### 3.3. Ona-bola statistikasi
- Manba: `https://ona-bola-registry.vercel.app/`.
- Portal ichida yangi Ona-bola statistikasi sahifasi yaratiladi.
- Ma’lumotlar API orqali olinishi afzal; agar API mavjud bo‘lmasa, mavjud Ona-bola loyihasi kodi yoki backendini ulash talab etiladi.
- Portal boshqa saytga redirect qilmasligi kerak.
- Asosiy kartalar: jami ayollar, homilador ayollar, 0–3 yosh bolalar, tug‘ruqlar.
- Hududlar bo‘yicha taqqoslash va oylik dinamika.

### 3.4. QR-kod statistikasi
- Muassasalar uchun QR kodlar.
- Jami, faol, nofaol QR.
- Baholashlar soni va o‘rtacha baho.
- Muassasa/hudud kesimi.
- Davr bo‘yicha dinamika.

### 3.5. Murojaatlar statistikasi
- Jami murojaatlar.
- Yangi, jarayonda, hal qilingan/yopilgan holatlar.
- Muassasa va shifokor kesimi.
- O‘rtacha ko‘rib chiqish vaqti.
- Eng ko‘p murojaat tushgan yo‘nalishlar.

### 3.6. Hisobotlar
- KPI, Ona-bola, QR, Murojaatlar va Umumiy hisobot.
- Sana oralig‘i, hudud, muassasa bo‘yicha filtr.
- Excel format birlamchi.
- PDF format keyingi bosqichda qo‘shiladi.

### 3.7. Sozlamalar va admin
- Tizim nomi va tashkilot nomi.
- Foydalanuvchilar va rollar.
- Muassasalar ro‘yxati.
- Hududlar ro‘yxati.
- Integratsiya endpointlari.
- Audit log.

## 4. Dizayn

Foydalanuvchi yuborgan dashboard namunasi asosiy vizual yo‘nalish sifatida olinadi:
- chapda to‘q ko‘k sidebar;
- tepada sahifa sarlavhasi, sana va hudud filtrlari, admin profili;
- oq fonli statistik kartalar;
- ko‘k, yashil, pushti va to‘q sariq modul aksentlari;
- chiziqli, ustunli va donut diagrammalar;
- responsive desktop/tablet/mobile layout.

UI bir xil design system bilan quriladi. Har bir modul mustaqil ko‘rinsa ham, foydalanuvchi butun tizimni bitta portal deb his qilishi kerak.

## 5. Texnik arxitektura

### Frontend
- React + Vite yoki Next.js asosida SPA/dashboard.
- Chart.js yoki Recharts grafiklar uchun.
- Responsive komponentlar.
- Har modul uchun alohida route.

### Backend
- Node.js/Express yoki Next.js API layer.
- PostgreSQL asosiy persistent DB.
- Tashqi mavjud tizimlar uchun adapter qatlam:
  - KPI adapter
  - Ona-bola adapter
  - QR adapter
  - Murojaatlar adapter

Adapterlar yordamida mavjud tizimlar keyinchalik o‘zgarsa, markaziy dashboardni qayta yozmasdan integratsiyani almashtirish mumkin.

### Database
Yangi portal o‘zining metadata va cached statistikalarini PostgreSQL’da saqlaydi. Mavjud tizimlarning original production ma’lumotlari ruxsatsiz ko‘chirilmaydi.

Minimal jadvallar:
- users
- roles
- institutions
- regions
- integration_sources
- cached_metrics
- report_jobs
- audit_logs

## 6. Ma’lumot oqimi

1. Frontend dashboard backend `/api/dashboard` endpointiga so‘rov yuboradi.
2. Backend kerakli adapterlar orqali KPI, Ona-bola, QR va Murojaat ma’lumotlarini oladi.
3. Backend normalizatsiya qiladi va yagona format qaytaradi.
4. Agar tashqi tizim vaqtincha ishlamasa, oxirgi muvaffaqiyatli cached ko‘rsatkich ko‘rsatiladi va "ma’lumot yangilanmadi" holati aniq belgilanadi.
5. Hisobot endpointi xuddi shu normalizatsiyalangan ma’lumotlardan Excel yaratadi.

## 7. Xavfsizlik

- Admin autentifikatsiyasi.
- Role-based access control.
- Password hash.
- Production secretlar faqat Railway environment variables’da.
- Rate limiting va basic security headers.
- Audit log: admin tomonidan qilingan muhim o‘zgarishlar yozib boriladi.
- Tibbiy/shaxsiy ma’lumotlar dashboardning umumiy statistik sahifalarida chiqarilmaydi; faqat agregat statistika.

## 8. Xatoliklar bilan ishlash

- Har bir tashqi modul mustaqil ishlaydi; bitta integratsiya ishlamasa, qolgan dashboard ochilishi kerak.
- Tashqi API xatosi foydalanuvchiga texnik stacktrace ko‘rinishida chiqarilmaydi.
- Integratsiya statusi admin panelda ko‘rsatiladi.
- DB yozish xatolari transaction/validation bilan boshqariladi.

## 9. Test talablari

- API health test.
- Authentication va role tests.
- Har adapter uchun success/error test.
- Dashboard aggregation test.
- Hisobot generatsiyasi test.
- Responsive smoke test.
- Production health endpoint.

## 10. Bosqichma-bosqich ish

### 1-bosqich — yangi production skeleti
- yangi GitHub repo;
- frontend shell;
- sidebar va dashboard dizayni;
- backend/API skeleton;
- PostgreSQL;
- Railway production deploy.

### 2-bosqich — KPI integratsiyasi
- mavjud KPI production’dan real statistikani ulash;
- KPI sahifasi va drill-down.

### 3-bosqich — Ona-bola integratsiyasi
- Ona-bola loyihasining real data manbasini aniqlash;
- adapter va statistika sahifasi.

### 4-bosqich — QR va Murojaatlar integratsiyasi
- mavjud production manbalarini ulash;
- statistik sahifalar.

### 5-bosqich — hisobot va admin
- Excel eksport;
- sozlamalar;
- foydalanuvchilar;
- monitoring/audit.

## 11. Muhim cheklov

Ona-bola saytining ochiq frontend URL’idan real ma’lumotni ishonchli olish mumkinligi hali tasdiqlanmagan. Real integratsiya uchun uning API endpointi, backend, database yoki source-code accessi kerak bo‘lishi mumkin. API mavjudligi aniqlanmaguncha frontenddagi raqamlarni “real data” deb ko‘rsatish mumkin emas.

## 12. Yakuniy qabul mezonlari

Tizim tayyor hisoblanadi, agar:
- bitta production URL mavjud bo‘lsa;
- 4 modul sidebar orqali portal ichida ochilsa;
- bosh dashboard real yoki aniq belgilangan cached real ma’lumotlarni ko‘rsatsa;
- hudud/sana/muassasa filtrlari ishlasa;
- Excel hisobot yuklansa;
- admin login ishlasa;
- PostgreSQL persistent bo‘lsa;
- mavjud production tizimlari buzilmagan bo‘lsa;
- Railway restart/redeploydan keyin ma’lumotlar saqlanib qolsa.
