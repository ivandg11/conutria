import { useState } from 'react';
import { Link } from 'react-router-dom';
import BrandLogo from '../components/Logo';
import './Contact.css';

const contactEmail = 'conutriaoficial@gmail.com';
const instagramUrl = 'https://www.instagram.com/conutriaoficial/';

export default function Contact() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(form.get('subject'));
    const body = encodeURIComponent(
      `Nombre: ${form.get('name')}\nCorreo: ${form.get('email')}\n\n${form.get('message')}`,
    );
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <main className="nc-contact-page">
      <header className="nc-contact-header">
        <Link to="/" aria-label="Conutria, inicio"><BrandLogo size={42} /></Link>
        <Link className="nc-contact-back" to="/">Volver al inicio</Link>
      </header>
      <section className="nc-contact-layout">
        <div className="nc-contact-info">
          <span className="nc-contact-kicker">ESTAMOS PARA AYUDARTE</span>
          <h1>Contacto</h1>
          <p className="nc-contact-intro">¿Tienes dudas sobre Conutria? Escríbenos y con gusto te ayudamos.</p>
          <a className="nc-contact-email" href={`mailto:${contactEmail}`}>
            <span className="nc-contact-icon" aria-hidden="true">✉</span>
            {contactEmail}
          </a>
          <a className="nc-contact-social" href={instagramUrl} target="_blank" rel="noreferrer">
            <span className="nc-contact-icon" aria-hidden="true">◎</span>
            Síguenos en Instagram
          </a>
          <div className="nc-contact-note">
            <BrandLogo size={34} showName={false} />
            <p>Conutria: más orden para tu consulta y mejor seguimiento para tus pacientes.</p>
          </div>
        </div>
        <form className="nc-contact-form" onSubmit={handleSubmit}>
          <label htmlFor="contact-name">Nombre</label>
          <input id="contact-name" name="name" autoComplete="name" required />
          <label htmlFor="contact-email">Correo electrónico</label>
          <input id="contact-email" name="email" type="email" autoComplete="email" required />
          <label htmlFor="contact-subject">Asunto</label>
          <input id="contact-subject" name="subject" required />
          <label htmlFor="contact-message">Mensaje</label>
          <textarea id="contact-message" name="message" rows="6" required />
          <button type="submit">Enviar mensaje <span aria-hidden="true">→</span></button>
          {sent && <p className="nc-contact-status" role="status">Se abrirá tu aplicación de correo para enviar el mensaje.</p>}
          <p className="nc-contact-hint">El mensaje se prepara en tu aplicación de correo; Conutria no almacena lo que escribas aquí.</p>
        </form>
      </section>
    </main>
  );
}