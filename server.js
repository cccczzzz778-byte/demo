const express=require("express");
const multer=require("multer");
const fs=require("fs");
const path=require("path");
const app=express();
const PORT=process.env.PORT||3000;
const upload=multer({dest:"uploads/",limits:{fileSize:10*1024*1024}});
const DB=path.join(__dirname,"data.json");

function seed(){
  return {
    institutions:[
      {id:1,name:"Buxoro shahar tibbiyot birlashmasi"},
      {id:2,name:"G‘ijduvon tuman tibbiyot birlashmasi"},
      {id:3,name:"Vobkent tuman tibbiyot birlashmasi"}
    ],
    qr:[
      {id:1,institutionId:1,rating:5,comment:"Xizmat yaxshi",createdAt:new Date().toISOString()},
      {id:2,institutionId:1,rating:4,comment:"Navbat biroz ko‘p",createdAt:new Date().toISOString()},
      {id:3,institutionId:2,rating:4,comment:"Yaxshi",createdAt:new Date().toISOString()}
    ],
    appeals:[
      {id:1,institutionId:1,text:"Qabul vaqtini aniqlashtirish",status:"resolved",createdAt:new Date().toISOString(),resolvedAt:new Date().toISOString()},
      {id:2,institutionId:1,text:"Navbat masalasi",status:"new",createdAt:new Date().toISOString(),resolvedAt:null},
      {id:3,institutionId:2,text:"Dori mavjudligi haqida",status:"resolved",createdAt:new Date().toISOString(),resolvedAt:new Date().toISOString()}
    ],
    authority:[
      {id:1,institutionId:1,score:32,note:"Taqdim etilgan ma’lumotlar asosida",fileName:null,createdAt:new Date().toISOString()},
      {id:2,institutionId:2,score:35,note:"Ijro yaxshi",fileName:null,createdAt:new Date().toISOString()}
    ]
  }
}
function read(){if(!fs.existsSync(DB)) fs.writeFileSync(DB,JSON.stringify(seed(),null,2));return JSON.parse(fs.readFileSync(DB,"utf8"))}
function write(d){fs.writeFileSync(DB,JSON.stringify(d,null,2))}
function calc(d,i){
  const q=d.qr.filter(x=>x.institutionId===i);
  const avg=q.length?q.reduce((s,x)=>s+x.rating,0)/q.length:0;
  const qrScore=+(avg/5*30).toFixed(1);
  const a=d.appeals.filter(x=>x.institutionId===i);
  const resolved=a.filter(x=>x.status==="resolved").length;
  const appealScore=+(a.length?resolved/a.length*30:0).toFixed(1);
  const last=d.authority.filter(x=>x.institutionId===i).sort((x,y)=>y.id-x.id)[0];
  const authorityScore=last?Math.max(0,Math.min(40,+last.score||0)):0;
  return {qrCount:q.length,qrAvg:+avg.toFixed(2),qrScore,appealCount:a.length,resolved,appealScore,authorityScore,total:+(qrScore+appealScore+authorityScore).toFixed(1)}
}
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));
app.get("/api/health",(_,res)=>res.json({ok:true}));
app.get("/api/dashboard",(_,res)=>{const d=read();res.json({institutions:d.institutions.map(i=>({...i,...calc(d,i.id)}))})});
app.get("/api/institutions",(_,res)=>res.json(read().institutions));
app.get("/api/qr/:institutionId", (req,res)=>{const d=read();res.json(d.qr.filter(x=>x.institutionId===+req.params.institutionId).sort((a,b)=>b.id-a.id))});
app.post("/api/qr",(req,res)=>{const d=read();const rating=Math.max(1,Math.min(5,+req.body.rating||0));if(!req.body.institutionId||!rating)return res.status(400).json({error:"Ma'lumot yetarli emas"});d.qr.push({id:Date.now(),institutionId:+req.body.institutionId,rating,comment:String(req.body.comment||"").slice(0,500),createdAt:new Date().toISOString()});write(d);res.json({ok:true})});
app.get("/api/appeals",(req,res)=>{const d=read();let a=d.appeals;if(req.query.institutionId)a=a.filter(x=>x.institutionId===+req.query.institutionId);res.json(a.sort((x,y)=>y.id-x.id))});
app.post("/api/appeals",(req,res)=>{const d=read();if(!req.body.institutionId||!req.body.text)return res.status(400).json({error:"Ma'lumot yetarli emas"});d.appeals.push({id:Date.now(),institutionId:+req.body.institutionId,text:String(req.body.text).slice(0,1000),status:"new",createdAt:new Date().toISOString(),resolvedAt:null});write(d);res.json({ok:true})});
app.post("/api/appeals/:id/resolve",(req,res)=>{const d=read();const a=d.appeals.find(x=>x.id===+req.params.id);if(!a)return res.status(404).json({error:"Topilmadi"});a.status="resolved";a.resolvedAt=new Date().toISOString();write(d);res.json({ok:true})});
app.get("/api/authority",(req,res)=>{const d=read();res.json(d.authority.sort((a,b)=>b.id-a.id))});
app.post("/api/authority",upload.single("file"),(req,res)=>{const d=read();const score=Math.max(0,Math.min(40,+req.body.score||0));if(!req.body.institutionId)return res.status(400).json({error:"Muassasa tanlanmagan"});d.authority.push({id:Date.now(),institutionId:+req.body.institutionId,score,note:String(req.body.note||"").slice(0,1000),fileName:req.file?req.file.originalname:null,storedName:req.file?req.file.filename:null,createdAt:new Date().toISOString()});write(d);res.json({ok:true})});
app.get("*",(_,res)=>res.sendFile(path.join(__dirname,"public","index.html")));
app.listen(PORT,"0.0.0.0",()=>console.log("Unified pilot running",PORT));