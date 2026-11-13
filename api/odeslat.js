// Vercel funkce: přijme poptávku z webu a pošle ji e-mailem přes Gmail (SMTP, heslo aplikace).
// Přihlašovací údaje jsou jen v nastavení Vercelu (Environment Variables), nikdy ne v kódu webu:
//   GMAIL_EMAIL         = kvetylu@gmail.com
//   GMAIL_APP_PASSWORD  = 16znakové heslo aplikace z Google účtu
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.status(405).json({ ok: false }); return; }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  b = b || {};
  const jmeno = String(b.jmeno || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().slice(0, 200);
  const text = String(b.text || '').trim().slice(0, 8000);
  if (!jmeno || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !text) { res.status(400).json({ ok: false, error: 'neplatná data' }); return; }
  if (b.web) { res.status(200).json({ ok: true }); return; }   // past na roboty (skryté pole)

  const user = process.env.GMAIL_EMAIL, pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) { res.status(500).json({ ok: false, error: 'chybí nastavení' }); return; }
  try {
    const t = nodemailer.createTransport({ host: 'smtp.gmail.com', port: 465, secure: true, auth: { user, pass } });
    await t.sendMail({
      from: '"Web Květy Lu" <' + user + '>',
      to: user,
      replyTo: '"' + jmeno.replace(/"/g, '') + '" <' + email + '>',
      subject: 'Nová poptávka z webu Květy Lu – ' + jmeno,
      text: text + '\n\n—\nOdpovězte přímo na tento e-mail, odpověď půjde zákazníkovi (' + email + ').'
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'odeslání se nepovedlo' });
  }
};
