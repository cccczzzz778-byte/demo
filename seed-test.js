const {Pool}=require('pg');
const bcrypt=require('bcryptjs');
const {INSTITUTION_INTEGRITY_SQL}=require('./lib/institution-integrity');

const pool=new Pool({
  connectionString:process.env.DATABASE_URL,
  ssl:process.env.NODE_ENV==='production'?{rejectUnauthorized:false}:false
});

async function run(){
  const username=process.env.TEST_USERNAME;
  const password=process.env.TEST_PASSWORD;
  const institutionName=process.env.TEST_INSTITUTION||'Test muassasa';
  await pool.query(INSTITUTION_INTEGRITY_SQL);
  if(!username||!password){
    console.log('TEST_ACCOUNT_SKIPPED');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS institutions(
      id SERIAL PRIMARY KEY,
      district TEXT NOT NULL,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'birlamchi',
      status TEXT NOT NULL DEFAULT 'pending',
      phone TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','institution')),
      institution_id INTEGER REFERENCES institutions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  const institution=await pool.query(
    `INSERT INTO institutions(district,name,type,status,phone,note)
     VALUES($1,$2,'birlamchi','pending','','Test kabineti')
     ON CONFLICT(name) DO UPDATE SET district=EXCLUDED.district
     RETURNING id`,
    ['Buxoro sh.',institutionName]
  );

  const hash=await bcrypt.hash(password,12);
  await pool.query(
    `INSERT INTO users(username,password_hash,role,institution_id)
     VALUES($1,$2,'institution',$3)
     ON CONFLICT(username) DO UPDATE SET
       password_hash=EXCLUDED.password_hash,
       role='institution',
       institution_id=EXCLUDED.institution_id`,
    [username,hash,institution.rows[0].id]
  );

  console.log('TEST_ACCOUNT_READY');
}

run().then(()=>pool.end()).catch(async e=>{console.error(e);await pool.end();process.exit(1)});
