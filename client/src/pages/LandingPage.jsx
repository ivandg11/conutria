import { Link } from 'react-router-dom';
import BrandLogo from '../components/Logo';
import './LadingPage.css';

const features = [
  {
    icon: '♧',
    title: 'Gestiona tus pacientes',
    description:
      'Organiza expedientes, objetivos y datos importantes en un solo lugar.',
  },
  {
    icon: '↗',
    title: 'Registra su evolución',
    description:
      'Consulta mediciones e historial para dar seguimiento a cada paciente.',
  },
  {
    icon: '✳',
    title: 'Planes de alimentación',
    description: 'Organiza comidas, porciones e indicaciones personalizadas.',
  },
  {
    icon: '▦',
    title: 'Administra tus consultas',
    description: 'Mantén tus consultas y próximos seguimientos organizados.',
  },
  {
    icon: '▤',
    title: 'Genera documentos',
    description: 'Prepara planes de alimentación con un formato profesional.',
  },
  {
    icon: '♡',
    title: 'Da seguimiento cercano',
    description: 'Mantén visible el progreso y los objetivos de cada paciente.',
  },
];

function Logo() {
  return (
    <Link className="nc-brand" to="/" aria-label="Conutria, inicio">
      <BrandLogo size={42} />
    </Link>
  );
}

function DashboardPreview() {
  return (
    <div className="nc-preview">
      <div className="nc-preview-main">
        <div className="nc-preview-header">
          <BrandLogo />
          <span>● &nbsp; Mi consulta</span>
        </div>

        <div className="nc-preview-body">
          <span className="nc-eyebrow">PANEL PRINCIPAL</span>
          <h3>Hola, nutrióloga 👋</h3>
          <p>Este es el resumen de tu consulta.</p>

          <div className="nc-stats">
            <div>
              <span>→</span>
              <strong>Pacientes</strong>
              <b>Activos</b>
            </div>
            <div>
              <span>→</span>
              <strong>Consultas</strong>
              <b>Organizadas</b>
            </div>
            <div>
              <span>→</span>
              <strong>Progreso</strong>
              <b>Historial</b>
            </div>
          </div>

          <div className="nc-preview-card">
            <strong>Seguimiento de pacientes</strong>
            <p>Control de mediciones y evolución</p>
            <div className="nc-chart">
              {[75, 61, 68, 45, 51, 33, 39].map((height, index) => (
                <div key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
            <div className="nc-chart-labels">
              <span>Consulta 1</span>
              <span>Consulta 7</span>
            </div>
          </div>
        </div>
      </div>

      <div className="nc-floating-card">
        <span className="nc-floating-icon">✓</span>
        <div>
          <strong>Todo organizado</strong>
          <p>Tu consulta, en un solo lugar.</p>
        </div>
      </div>
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
          <Link className="nc-button nc-button-yellow" to="/login">
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
          <span className="nc-eyebrow">TODO EN UN SOLO LUGAR</span>
          <h2>Más orden para tu consulta</h2>
          <p>
            Herramientas sencillas para dedicar más tiempo a lo que realmente
            importa: tus pacientes.
          </p>
        </div>

        <div className="nc-feature-grid">
          {features.map((feature) => (
            <article className="nc-feature-card" key={feature.title}>
              <span className="nc-feature-icon">{feature.icon}</span>
              <div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="nc-how nc-container" id="como-funciona">
        <div className="nc-section-heading">
          <span className="nc-eyebrow">SENCILLO Y PRÁCTICO</span>
          <h2>Tu consulta, paso a paso</h2>
        </div>

        <div className="nc-steps">
          <article>
            <span>01</span>
            <h3>Registra al paciente</h3>
            <p>
              Crea su expediente y guarda la información necesaria para su
              seguimiento.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Planifica su atención</h3>
            <p>
              Registra consultas, mediciones y planes adaptados a sus
              necesidades.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Da seguimiento</h3>
            <p>
              Consulta el historial y revisa los avances en cada nueva visita.
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

        <Link className="nc-button nc-button-yellow" to="/login">
          Comenzar ahora →
        </Link>
      </section>

      <footer className="nc-footer nc-container">
        <p>Una herramienta para acompañar tu práctica profesional.</p>
        <div className="nc-footer-legal">
          <Link to="/aviso-de-privacidad">Aviso de privacidad</Link>
          <Link to="/terminos-de-uso">Términos de uso</Link>
          <span>© {new Date().getFullYear()} Conutria</span>
        </div>
      </footer>
    </main>
  );
}
