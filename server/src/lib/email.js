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
  const brandHeader = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;border-collapse:collapse"><tr><td style="padding:0 12px 0 0;vertical-align:middle"><img src="${logoUrl}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border-radius:50%"></td><td style="vertical-align:middle;color:#0e8060;font-size:18px;font-weight:bold">Conutria</td></tr></table>`;
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
  const professionalName = String(nutritionistName ?? '').trim();
  const displayedProfessional = !professionalName || /^usuario$/i.test(professionalName) ? 'tu nutriólogo' : professionalName;
  const professional = escapeHtml(displayedProfessional);
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:16px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%"><main style="box-sizing:border-box;width:100%;max-width:560px;margin:0 auto;padding:28px 24px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1 style="margin:0 0 20px;font-size:30px;line-height:1.2;overflow-wrap:anywhere">Seguimiento de tu semana</h1><p style="font-size:16px;line-height:1.55">Hola ${patientName}, ${professional} te invita a compartir cómo te fue esta semana.</p><p style="font-size:16px;line-height:1.55">Responde unas preguntas breves sobre tu plan, energía y hambre. Tus respuestas estarán disponibles para que tu nutriólogo las revise antes de su próxima consulta.</p><p style="margin:28px 0"><a href="${url}" style="display:block;box-sizing:border-box;width:100%;max-width:360px;margin:0 auto;padding:15px 18px;border-radius:10px;background:#f8cb59;color:#103f34;font-size:16px;line-height:1.4;font-weight:bold;text-align:center;text-decoration:none;white-space:normal;overflow-wrap:anywhere">Responder seguimiento semanal</a></p><p style="color:#71847c;font-size:13px;line-height:1.5">Este enlace es privado, se puede usar una sola vez y vence en 7 días.</p><p style="color:#71847c;font-size:12px;line-height:1.5;overflow-wrap:anywhere;word-break:break-word">Si el botón no funciona, abre este enlace:<br><a href="${url}" style="color:#2674bb;overflow-wrap:anywhere;word-break:break-all">${url}</a></p></main></body></html>`;
  const text = `Hola ${patient.firstName}, ${displayedProfessional} te invita a compartir cómo te fue esta semana. Responde aquí: ${url}\n\nEl enlace es privado, se puede usar una sola vez y vence en 7 días.`;
  await sendEmail({ to: patient.email, subject: 'Tu seguimiento semanal de Conutria', html, text });
}

export async function sendWelcomeEmail(user, rawToken, { trialDays } = {}) {
  const { url: baseUrl } = getEmailConfig('/crear-contrasena');
  const url = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  const name = escapeHtml(user.name);
  const welcomeMessage = trialDays
    ? `Tu prueba gratuita de ${trialDays} días ya está activa. Crea una contraseña para entrar a Conutria y organizar tu consulta nutricional.`
    : 'Confirmamos tu suscripción. Crea una contraseña para activar tu cuenta y comenzar a organizar tu consulta nutricional.';
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:560px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1>¡Te damos la bienvenida!</h1><p>Hola ${name},</p><p>${welcomeMessage}</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Crear mi contraseña</a></p><p style="color:#71847c;font-size:13px">Este enlace se puede usar una sola vez y vence en 36 horas.</p><p style="color:#71847c;font-size:12px;word-break:break-all">Si el botón no funciona, abre este enlace: ${url}</p></main></body></html>`;
  const text = `Hola ${user.name},\n\nTe damos la bienvenida a Conutria. ${welcomeMessage} Crea tu contraseña desde este enlace: ${url}\n\nEl enlace es de un solo uso y vence en 36 horas.`;
  await sendEmail({ to: user.email, subject: trialDays ? 'Activa tu prueba gratis de Conutria' : 'Te damos la bienvenida a Conutria', html, text });
}

export async function sendPasswordResetEmail(user, rawToken) {
  const { url: baseUrl } = getEmailConfig('/restablecer-contrasena');
  const url = `${baseUrl}?token=${encodeURIComponent(rawToken)}`;
  const name = escapeHtml(user.name);
  const html = `<!doctype html><html lang="es"><body style="margin:0;padding:32px;background:#f4f7f3;font-family:Arial,sans-serif;color:#193d35"><main style="max-width:520px;margin:auto;padding:32px;background:#fff;border:1px solid #e0e7de;border-radius:18px"><p style="color:#0e8060;font-weight:bold">Conutria</p><h1>Restablece tu contraseña</h1><p>Hola ${name}, recibimos una solicitud para cambiar la contraseña de tu cuenta.</p><p style="margin:28px 0"><a href="${url}" style="padding:14px 22px;border-radius:10px;background:#f8cb59;color:#103f34;font-weight:bold;text-decoration:none">Crear contraseña nueva</a></p><p style="color:#71847c;font-size:13px">El enlace vence en 30 minutos y solo se puede usar una vez. Si no solicitaste el cambio, ignora este mensaje; tu contraseña seguirá igual.</p><p style="color:#71847c;font-size:12px;word-break:break-all">${url}</p></main></body></html>`;
  const text = `Hola ${user.name}, solicita una contraseña nueva desde este enlace: ${url}\n\nEl enlace vence en 30 minutos y solo se puede usar una vez. Si no pediste este cambio, ignora este correo.`;
  await sendEmail({ to: user.email, subject: 'Restablece tu contraseña de Conutria', html, text });
}
