function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function getEmailConfig(path) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '');
  if (!apiKey || !from || !clientUrl) {
    throw new Error('Falta configurar RESEND_API_KEY, MAIL_FROM o CLIENT_URL.');
  }
  return { apiKey, from, clientUrl, url: `${clientUrl}${path}` };
}

async function sendEmail({ to, subject, html, text }) {
  const { apiKey, from, clientUrl } = getEmailConfig('');
  const logoUrl = `${clientUrl}/apple-touch-icon.png`;
  const brandHeader = `<div style="display:flex;align-items:center;gap:12px;margin-bottom:24px"><img src="${logoUrl}" width="48" height="48" alt="Conutria" style="display:block;border-radius:50%"><span style="color:#0e8060;font-size:18px;font-weight:bold">Conutria</span></div>`;
  const brandedHtml = html.replace(/<p style="color:#0e8060;font-weight:bold">Conutria<\/p>/, brandHeader);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, html: brandedHtml, text }),
  });
  if (!response.ok) {
    const details = await response.text().catch(() => '');
    console.error('Resend email error:', response.status, details);
    throw new Error(`Resend rechazó el correo (${response.status}).`);
  }
}

export async function sendWeeklyCheckInEmail(patient, nutritionistName, rawToken) {
  const { url: baseUrl } = getEmailConfig('/seguimiento-semanal');
  const url = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  const patientName = escapeHtml(patient.firstName);
  const professional = escapeHtml(nutritionistName);
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:560px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1>Seguimiento de tu semana</h1><p>Hola ${patientName}, ${professional} te invita a compartir cómo te fue esta semana.</p><p>Responde unas preguntas breves sobre tu plan, energía y hambre. Tus respuestas estarán disponibles para que tu nutriólogo las revise antes de su próxima consulta.</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Responder seguimiento semanal</a></p><p style="color:#71847c;font-size:13px">Este enlace es privado, se puede usar una sola vez y vence en 7 días.</p><p style="color:#71847c;font-size:12px;word-break:break-all">Si el botón no funciona, abre este enlace: ${url}</p></main></body></html>`;
  const text = `Hola ${patient.firstName}, ${nutritionistName} te invita a compartir cómo te fue esta semana. Responde aquí: ${url}\n\nEl enlace es privado, se puede usar una sola vez y vence en 7 días.`;
  await sendEmail({ to: patient.email, subject: 'Tu seguimiento semanal de Conutria', html, text });
}

export async function sendWelcomeEmail(user, rawToken) {
  const { url: baseUrl } = getEmailConfig('/crear-contrasena');
  const url = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  const name = escapeHtml(user.name);
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:560px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1>¡Te damos la bienvenida!</h1><p>Hola ${name},</p><p>Confirmamos tu suscripción. Crea una contraseña para activar tu cuenta y comenzar a organizar tu consulta nutricional.</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Crear mi contraseña</a></p><p style="color:#71847c;font-size:13px">Este enlace se puede usar una sola vez y vence en 36 horas.</p><p style="color:#71847c;font-size:12px;word-break:break-all">Si el botón no funciona, abre este enlace: ${url}</p></main></body></html>`;
  const text = `Hola ${user.name},\n\nTe damos la bienvenida a Conutria. Confirmamos tu suscripción. Crea una contraseña para activar tu cuenta: ${url}\n\nEl enlace es de un solo uso y vence en 36 horas.`;
  await sendEmail({ to: user.email, subject: 'Te damos la bienvenida a Conutria', html, text });
}

export async function sendPasswordResetEmail(user, rawToken) {
  const { url: baseUrl } = getEmailConfig('/restablecer-contrasena');
  const url = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  const name = escapeHtml(user.name);
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1>Restablece tu contraseña</h1><p>Hola ${name}, recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Crear contraseña nueva</a></p><p style="color:#71847c;font-size:13px">El enlace vence en 30 minutos y solo se puede usar una vez. Si no solicitaste el cambio, ignora este mensaje; tu contraseña seguirá igual.</p><p style="color:#71847c;font-size:12px;word-break:break-all">${url}</p></main></body></html>`;
  const text = `Hola ${user.name}, solicita una contraseña nueva desde este enlace: ${url}\n\nEl enlace vence en 30 minutos y solo se puede usar una vez. Si no pediste este cambio, ignora este correo.`;
  await sendEmail({ to: user.email, subject: 'Restablece tu contraseña de Conutria', html, text });
}
