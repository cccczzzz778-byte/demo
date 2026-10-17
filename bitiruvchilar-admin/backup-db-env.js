'use strict';
const fs=require('node:fs');const path=require('node:path');const {DatabaseSync}=require('node:sqlite');
const version=String(process.env.DB_BACKUP_VERSION||'').trim();if(!version)process.exit(0);
const dbPath=process.env.DB_PATH||path.join(__dirname,'data.sqlite');if(!fs.existsSync(dbPath))process.exit(0);
const dir=path.join(path.dirname(dbPath),'backups');fs.mkdirSync(dir,{recursive:true});const safe=version.replace(/[^a-zA-Z0-9._-]+/g,'-').slice(0,80);const out=path.join(dir,`bitiruvchilar-${safe}.sqlite`);
if(!fs.existsSync(out)){const db=new DatabaseSync(dbPath);db.exec('PRAGMA wal_checkpoint(FULL)');db.exec(`VACUUM INTO '${out.replace(/'/g,"''")}'`);db.close();console.log('DATABASE BACKUP OK',out)}
