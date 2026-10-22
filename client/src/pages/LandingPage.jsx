import { Link } from 'react-router-dom';
import { useState } from 'react';
import BrandLogo from '../components/Logo';
import './LadingPage.css';

const features = [
  {
    group: 'Evaluación y expediente',
    icon: 'patients',
    items: ['Expediente clínico e historial', 'Consultas y objetivos por paciente', 'Antropometría y composición corporal', 'Registro de evolución'],
  },
  {
    group: 'Planificación nutricional',
    icon: 'plans',
    items: ['Planes de alimentación personalizados', 'Alimentos y porciones por equivalentes SMAE', 'Distribución por tiempos de comida', 'Reporte de consulta listo para exportar'],
  },
  {
    group: 'Gestión del consultorio',
    icon: 'calendar',
    items: ['Agenda y próximas consultas', 'Historial de consultas y mediciones', 'DietoC\u00E1lculo: gasto energ\u00E9tico y macronutrientes', 'Cuenta y suscripción en un solo lugar'],
  },
  {
    group: 'Experiencia del paciente',
    icon: 'care',
    items: ['Invitación de seguimiento por correo', 'Formulario semanal con enlace privado', 'Registro de adherencia, energía y hambre', 'Respuestas disponibles en el expediente'],
  },
];

function FeatureIcon({ name }) {
  const icon = {
    patients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 19v-1.5a5.5 5.5 0 0 1 11 0V19M16 5.5a3 3 0 0 1 0 5.8M17 13a4.5 4.5 0 0 1 3.5 4.4V19" /></>,
    progress: <><path d="M4 17 10 11l4 4 6-8" /><path d="M14 7h6v6" /></>,
    plans: <><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" /><path d="M12 17c-2-2-2.4-4.4-.5-6.5M12 15c.3-2.2 1.4-3.5 3-4" /></>,
    calendar: <><rect x="4" y="5.5" width="16" height="15" rx="2" /><path d="M8 3.5v4M16 3.5v4M4 10h16M8 14h2m3 0h2m-7 3h2m3 0h2" /></>,
    documents: <><path d="M6 3.5h8l4 4V20H6z" /><path d="M14 3.5V8h4M9 12h6m-6 3h6m-6 3h4" /></>,
    care: <><path d="M20 9c0 5-8 10-8 10S4 14 4 9a4 4 0 0 1 8-1 4 4 0 0 1 8 1Z" /><path d="M12 10v5m-2.5-2.5h5" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
  }[name];

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {icon}
    </svg>
  );
}
function Logo() {
  return (
    <Link className="nc-brand" to="/" aria-label="Conutria, inicio">
      <BrandLogo size={42} />
    </Link>
  );
}

function ContactSection() {
  const [sent, setSent] = useState(false);
  const email = 'conutriaoficial@gmail.com';

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(form.get('subject'));
    const body = encodeURIComponent(`Nombre: ${form.get('name')}\nCorreo: ${form.get('email')}\n\n${form.get('message')}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section className="nc-home-contact" id="contacto">
      <div className="nc-home-contact-inner nc-container">
        <div className="nc-home-contact-copy">
          <span className="nc-eyebrow">ESTAMOS PARA AYUDARTE</span>
          <h2>Hablemos de tu consulta.</h2>
          <p>¿Tienes dudas sobre Conutria? Escríbenos y con gusto te ayudamos.</p>
          <a className="nc-home-contact-email" href={`mailto:${email}`}>{email}</a>
          <a className="nc-home-contact-social" href="https://www.instagram.com/conutriaoficial/" target="_blank" rel="noreferrer">Síguenos en Instagram <span aria-hidden="true">↗</span></a>
        </div>
        <form className="nc-home-contact-form" onSubmit={handleSubmit}>
          <div className="nc-home-contact-fields">
            <label>Nombre<input name="name" autoComplete="name" required /></label>
            <label>Correo electrónico<input name="email" type="email" autoComplete="email" required /></label>
          </div>
          <label>Asunto<input name="subject" required /></label>
          <label>Mensaje<textarea name="message" rows="3" required /></label>
          <div className="nc-home-contact-submit">
            <button type="submit">Enviar mensaje <span aria-hidden="true">→</span></button>
            <p>El mensaje se prepara en tu aplicación de correo.</p>
          </div>
          {sent && <p className="nc-home-contact-status" role="status">Se abrirá tu aplicación de correo para enviar el mensaje.</p>}
        </form>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="nc-product-previews" aria-label="Vistas de Conutria en computadora y celular">
      <figure className="nc-product-preview nc-product-preview-desktop">
        <img src="/images/monitor-web.png" alt="Vista de Conutria en computadora con el panel de pacientes" />
        <figcaption>Administra tu consulta desde la web</figcaption>
      </figure>
      <figure className="nc-product-preview nc-product-preview-mobile">
        <img src="/images/app-paciente.png" alt="Vista de Conutria en celular con el formulario de consulta del paciente" />
        <figcaption>Seguimiento tambi?n desde el celular</figcaption>
      </figure>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="nc-landing">
      <header className="nc-navbar nc-container">
        <Logo />

        <div className="nc-nav-actions">
          <Link className="nc-login" to="/login">
            Iniciar sesión
          </Link>
          <Link className="nc-button nc-button-yellow" to="/planes">
            Comenzar <span>→</span>
          </Link>
        </div>
      </header>

      <section className="nc-hero nc-container">
        <div className="nc-hero-copy">
          <span className="nc-eyebrow">TU CONSULTA, MÁS ORGANIZADA</span>

          <h1>
            Dedícate a cuidar.
            <br />
            Nosotros te ayudamos a <span>organizar.</span>
          </h1>

          <p className="nc-hero-description">
            Gestiona tus pacientes, consultas, su progreso y planes de
            alimentación en un solo lugar.
          </p>

          <div className="nc-hero-actions">
            <Link
              className="nc-button nc-button-yellow nc-button-large"
              to="/planes"
            >
              Conocer los Planes de Conutria <span>→</span>
            </Link>

            <Link className="nc-text-link" to="/login">
              Ya tengo una cuenta →
            </Link>
          </div>

          <div className="nc-trust-note">
            <span>→</span>
            Diseñado para acompañar tu consulta nutricional
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section className="nc-benefits nc-container">
        <div>
          <span className="nc-benefit-icon">♧</span>
          <div>
            <strong>Pacientes organizados</strong>
            <p>Información en un solo lugar.</p>
          </div>
        </div>

        <div>
          <span className="nc-benefit-icon">♧</span>
          <div>
            <strong>Seguimiento claro</strong>
            <p>Visualiza su evolución.</p>
          </div>
        </div>

        <div>
          <span className="nc-benefit-icon">♧</span>
          <div>
            <strong>Planes personalizados</strong>
            <p>Adaptados a cada paciente.</p>
          </div>
        </div>
      </section>

      <section className="nc-features nc-container" id="funciones">
        <div className="nc-section-heading">
          <span className="nc-eyebrow">QUÉ INCLUYE</span>
          <h2>Todo lo que necesitas para tu consulta, en un solo sistema.</h2>
          <p>
            Expedientes, planes y seguimiento para acompañar el trabajo diario de tu consultorio.
          </p>
        </div>

        <div className="nc-feature-grid">
          {features.map((feature, index) => (
            <article className={`nc-feature-card nc-feature-card-${index + 1}`} key={feature.group}>
              <span className="nc-feature-tag">{feature.group}</span>
              <ul>
                {feature.items.map((item) => (
                  <li key={item}>
                    <span className="nc-feature-icon"><FeatureIcon name={feature.icon === 'patients' ? 'documents' : feature.icon} /></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="nc-how" id="como-funciona">
        <div className="nc-section-heading">
          <span className="nc-eyebrow">EL RECORRIDO EN TU CONSULTORIO</span>
          <h2>Así acompaña Conutria una consulta real.</h2>
          <p>Desde el registro del paciente hasta el seguimiento de sus avances.</p>
        </div>

        <div className="nc-steps nc-container">
          <article>
            <span>01</span>
            <h3>Registra al paciente</h3>
            <p>
              Organiza su expediente, antecedentes, objetivos y mediciones en un solo lugar.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Diseña su plan</h3>
            <p>
              Arma tiempos de comida con alimentos, porciones y equivalentes adaptados a cada paciente.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Compártelo con el paciente</h3>
            <p>
              Envía una invitación para que el paciente comparta su adherencia, energía y hambre.
            </p>
          </article>
          <article>
            <span>04</span>
            <h3>Da seguimiento</h3>
            <p>
              Revisa consultas, mediciones y reportes para ajustar el acompañamiento en cada etapa.
            </p>
          </article>
        </div>
      </section>

      <section className="nc-privacy nc-container" id="privacidad">
        <div className="nc-privacy-icon">✓</div>
        <div>
          <h2>La confianza también importa.</h2>
          <p>
            La información de tus pacientes merece un manejo responsable.
            Conutria se diseña pensando en la privacidad y el acceso controlado.
          </p>
        </div>
      </section>

      <section className="nc-cta nc-container">
        <div>
          <span className="nc-cta-mark" aria-hidden="true">
            <BrandLogo size={42} showName={false} />
          </span>
          <div>
            <h2>Más orden para ti. Mejor seguimiento para tus pacientes.</h2>
            <p>Descubre una nueva forma de organizar tu consulta.</p>
          </div>
        </div>

        <Link className="nc-button nc-button-yellow" to="/planes">
          Comenzar ahora →
        </Link>
      </section>

      <ContactSection />

      <footer className="nc-footer nc-container">
        <p>Una herramienta para acompañar tu práctica profesional.</p>
        <div className="nc-footer-legal">
          <a href="#contacto">Contacto</a>
          <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>
          <Link to="/terminos-de-uso">Términos de uso</Link>
          <span>© {new Date().getFullYear()} Conutria</span>
        </div>
      </footer>
    </main>
  );
}
