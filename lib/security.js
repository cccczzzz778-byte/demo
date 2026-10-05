const LOGIN_RATE_LIMIT=Object.freeze({windowMs:15*60*1000,limit:10});

function resolveJwtSecret(env={}){
  const secret=String(env.JWT_SECRET||'').trim();
  if(env.NODE_ENV==='production'&&!secret){
    throw new Error('JWT_SECRET is required in production');
  }
  return secret||'dmed-development-only-secret';
}

module.exports={LOGIN_RATE_LIMIT,resolveJwtSecret};
