import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './LegalDocuments.css';

const revisionDate = '14 de octubre de 2026';

function DraftNotice() {
  return (
    <aside className="legal-draft-notice">
      <strong>Borrador por completar</strong>
      <p>
        Antes de publicar Conutria para clientes, reemplaza los campos entre
        corchetes y pide una revisión legal. No uses datos reales de pacientes
        mientras estos documentos sigan incompletos.
      </p>
    </aside>
  );
}

function PrivacyNotice() {
  return (
    <>
      <p className="legal-lead">
        Este aviso explica qué información se trata al crear una cuenta y usar
        Conutria, para qué se utiliza y cómo puedes ejercer tus derechos.
      </p>
      <h2>1. Responsable y contacto</h2>
      <p>
        El responsable de los datos de cuenta y facturación de Conutria es{' '}
        <strong>
          [NOMBRE LEGAL O NOMBRE COMPLETO DE QUIEN OPERA Conutria]
        </strong>
        , con domicilio en <strong>[DOMICILIO COMPLETO]</strong>. Para dudas o
        solicitudes de privacidad, escribe a{' '}
        <strong>[CORREO DE PRIVACIDAD]</strong>.
      </p>
      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>
          <strong>Cuenta:</strong> nombre, correo electrónico, contraseña
          protegida mediante hash, actividad de acceso y datos técnicos
          necesarios para mantener la sesión.
        </li>
        <li>
          <strong>Suscripción y soporte:</strong> plan, fechas y estado de la
          suscripción, registros de pagos, solicitudes de soporte y mensajes.
        </li>
        <li>
          <strong>Datos de pacientes que registra el profesional:</strong>{' '}
          nombre, contacto, fecha de nacimiento, sexo, objetivos, alergias,
          antecedentes, notas, citas, consultas, mediciones corporales,
          recordatorios de alimentación, frecuencia de consumo y planes
          alimenticios. Parte de esta información puede revelar el estado de
          salud y se considera sensible.
        </li>
        <li>
          <strong>Pago:</strong> Conutria recibe la confirmación y referencias
          de la transacción. El pago se procesa en Stripe; Conutria no
          solicita en esta aplicación el número completo de tarjeta ni el código
          de seguridad.
        </li>
      </ul>
      <h2>3. Finalidades</h2>
      <p>
        Usamos los datos de cuenta para crear y proteger el acceso, prestar las
        funciones contratadas, administrar pagos y suscripciones, responder a
        soporte, prevenir fraude y atender obligaciones legales. Los datos de
        pacientes se alojan para que el profesional que contrató Conutria
        gestione su consulta, expedientes, citas y seguimiento.
      </p>
      <p>
        Conutria proporciona herramientas de organización; no sustituye el
        criterio clínico ni presta atención nutricional a los pacientes del
        profesional. El profesional que incorpora los datos de sus pacientes
        debe determinar y documentar la base legal, informarles sobre el
        tratamiento y obtener los consentimientos que correspondan, incluidos
        los expresos y por escrito para datos sensibles cuando sean exigibles.
      </p>
      <h2>4. Roles respecto de los expedientes</h2>
      <p>
        Respecto de la cuenta del profesional, quien opera Conutria actúa como
        responsable de los datos necesarios para ofrecer la plataforma. Respecto
        de los expedientes de pacientes, la intención del servicio es que el
        profesional cliente determine las finalidades y opere como responsable,
        y que Conutria trate esos datos por cuenta e instrucciones del
        profesional para alojar y mostrar la información. Esta asignación deberá
        reflejarse en el contrato y en las instrucciones reales del servicio.
      </p>
      <h2>5. Datos sensibles y consentimiento</h2>
      <p>
        Los expedientes pueden incluir datos sensibles de salud. El profesional
        debe contar con las autorizaciones y avisos aplicables antes de
        incorporarlos. El reconocimiento de este aviso por la persona que
        contrata Conutria no sustituye el consentimiento del paciente ni
        autoriza por sí mismo el tratamiento de sus datos sensibles.
      </p>
      <h2>6. Proveedores y comunicaciones</h2>
      <p>
        Para operar el servicio podemos apoyarnos en proveedores de alojamiento
        y base de datos (Render, Aiven y Cloudflare), procesamiento de pagos
        (Stripe) y envío de correo (Resend). Estos proveedores pueden
        procesar información desde la ubicación de sus centros de datos conforme
        a sus servicios y contratos.{' '}
        <strong>
          [CONFIRMAR PROVEEDORES, UBICACIONES, TRANSFERENCIAS Y CONTRATOS ANTES
          DE PUBLICAR]
        </strong>
        .
      </p>
      <p>
        No vendemos datos personales. Solo comunicaremos información cuando sea
        necesario para prestar Conutria, exista una instrucción válida del
        profesional cliente o lo requiera la ley.
      </p>
      <h2>7. Conservación, seguridad y eliminación</h2>
      <p>
        Conservamos los datos mientras la cuenta y sus fines estén vigentes, y
        durante los plazos necesarios para cumplir obligaciones legales o
        resolver responsabilidades. Al terminar el servicio, se definirá el
        procedimiento para que el profesional exporte o solicite la eliminación
        de sus expedientes y el plazo de borrado de copias de respaldo.{' '}
        <strong>[DEFINIR PLAZOS DE RETENCIÓN, RESPALDOS Y ELIMINACIÓN]</strong>.
      </p>
      <p>
        Aplicamos controles de acceso por cuenta, autenticación y medidas
        técnicas razonables. Ningún medio de almacenamiento o transmisión puede
        garantizar seguridad absoluta.
      </p>
      <h2>8. Derechos y solicitudes</h2>
      <p>
        Puedes solicitar acceso, rectificación, cancelación u oposición
        (derechos ARCO), revocar consentimientos cuando proceda o limitar el uso
        de tus datos escribiendo a <strong>[CORREO DE PRIVACIDAD]</strong>.
        Indica tu nombre, correo de cuenta, derecho que deseas ejercer y medios
        para responderte. Para expedientes de pacientes, el profesional
        responsable debe atender la solicitud del paciente y coordinar con
        Conutria cuando sea necesario.
      </p>
      <h2>9. Cookies y sesión</h2>
      <p>
        Conutria utiliza una cookie de sesión necesaria, protegida como
        HTTP-only y, en producción, Secure, para mantener la sesión iniciada. No
        usamos esa cookie para publicidad.{' '}
        <strong>
          [CONFIRMAR SI EL SITIO USA ANALÍTICA, PIXELES U OTRAS COOKIES]
        </strong>
        .
      </p>
      <h2>10. Cambios al aviso</h2>
      <p>
        Publicaremos la versión vigente en esta página e indicaremos aquí la
        fecha de actualización. Si un cambio altera finalidades que requieran
        nuevo consentimiento, lo solicitaremos conforme a la ley.
      </p>
    </>
  );
}

function TermsOfUse() {
  return (
    <>
      <p className="legal-lead">
        Estas condiciones regulan el uso de Conutria, una plataforma de
        organización para profesionales de nutrición. Al contratar, la persona
        usuaria acepta estas condiciones.
      </p>
      <h2>1. Quién presta el servicio</h2>
      <p>
        Conutria es operada por{' '}
        <strong>[NOMBRE LEGAL O NOMBRE COMPLETO]</strong>, con domicilio en{' '}
        <strong>[DOMICILIO COMPLETO]</strong> y contacto Conutria2027@gmail.com.{' '}
        <strong>[AGREGAR RFC Y DATOS COMERCIALES QUE CORRESPONDAN]</strong>.
      </p>
      <h2>2. Servicio y cuenta</h2>
      <p>
        Conutria ofrece herramientas para organizar pacientes, expedientes,
        citas, consultas, mediciones, planes alimenticios y soporte. La persona
        titular de la cuenta es responsable de mantener sus credenciales
        seguras, usar información correcta y limitar el acceso a personal
        autorizado.
      </p>
      <h2>3. Planes y pagos</h2>
      <p>
        Los precios se muestran en pesos mexicanos antes de iniciar el pago:
        plan mensual por <strong>$199 MXN por periodo mensual</strong> y plan
        anual por <strong>$1,990 MXN por periodo anual</strong>. El pago se
        realiza mediante Stripe. El importe y las condiciones se muestran
        antes de confirmar el pago.{' '}
        <strong>
          [CONFIRMAR IMPUESTOS, COMPROBANTES/FACTURACIÓN Y SI LOS PRECIOS LOS
          INCLUYEN]
        </strong>
        .
      </p>
      <p>
        La suscripcion se cobra automaticamente al inicio de cada periodo. La renovacion continua hasta que la persona usuaria la cancele desde Cuenta. Al cancelar, se detienen los cargos futuros y se conserva el acceso hasta que termine el periodo ya pagado.
      </p>
      <h2>4. Cancelación y reembolsos</h2>
      <p>
        La persona usuaria puede cancelar desde la sección Cuenta. La
        cancelación detiene la renovación del servicio, pero conserva el acceso
        hasta la fecha de término del periodo ya pagado que aparece en su
        cuenta. La cancelación no genera por sí sola un reembolso ni revierte un
        pago ya procesado. Los derechos de reembolso que correspondan por ley no
        quedan limitados por esta cláusula.{' '}
        <strong>
          [CONFIRMAR QUE LA CUENTA Y EL CONTROL DE ACCESO RESPETEN ESTA REGLA
          ANTES DE PUBLICAR]
        </strong>
        .
      </p>
      <h2>5. Responsabilidad sobre los datos de pacientes</h2>
      <p>
        El profesional es responsable de contar con autorización para registrar
        información de sus pacientes, proporcionarles su aviso de privacidad,
        obtener los consentimientos requeridos y usar Conutria conforme a sus
        obligaciones profesionales. No registres datos de personas sin
        autorización ni información que no sea necesaria para la atención.
      </p>
      <p>
        Conutria es una herramienta administrativa y no diagnostica, prescribe
        ni sustituye la valoración profesional, la consulta clínica ni el juicio
        del nutriólogo.
      </p>
      <h2>6. Uso permitido</h2>
      <p>
        No uses Conutria para actividades ilícitas, acceder a cuentas ajenas,
        intentar comprometer la plataforma, cargar código malicioso o infringir
        derechos de otras personas. Podemos limitar temporalmente una cuenta
        ante un riesgo de seguridad o incumplimiento grave, procurando informar
        el motivo y permitir aclaraciones cuando sea posible.
      </p>
      <h2>7. Disponibilidad y soporte</h2>
      <p>
        Trabajamos para mantener Conutria disponible y atender solicitudes de
        soporte. Puede haber interrupciones por mantenimiento, fallas de
        proveedores o incidentes técnicos. El plan de infraestructura actual
        puede tener periodos de inactividad y no incluye un compromiso de
        disponibilidad continua. Mantén copias de la información que necesites
        conservar y solicita asistencia para exportar datos antes de cerrar una
        cuenta.
      </p>
      <h2>8. Propiedad intelectual</h2>
      <p>
        La plataforma, su marca y sus componentes pertenecen a sus respectivos
        titulares. La persona usuaria conserva los derechos sobre la información
        que incorpora y concede únicamente el permiso técnico necesario para
        alojarla y prestarle el servicio.
      </p>
      <h2>9. Terminación</h2>
      <p>
        La persona usuaria puede dejar de usar el servicio y solicitar el cierre
        de su cuenta. Antes del cierre, debe exportar la información que
        necesite conservar. El tratamiento y eliminación posteriores se
        sujetarán al Aviso de Privacidad y a los plazos legales aplicables.
      </p>
      <h2>10. Cambios y contacto</h2>
      <p>
        Publicaremos cambios a estas condiciones en esta página e indicaremos la
        fecha de actualización. Para soporte o dudas contractuales escribe a{' '}
        <a href="mailto:Conutria2027@gmail.com">Conutria2027@gmail.com</a>.
      </p>
      <h2>11. Legislación aplicable</h2>
      <p>
        Estas condiciones se interpretarán conforme a las leyes aplicables en
        México, respetando los derechos irrenunciables de las personas
        consumidoras.{' '}
        <strong>
          [CONFIRMAR DOMICILIO Y JURISDICCIÓN APLICABLE CON ASESORÍA LEGAL]
        </strong>
        .
      </p>
    </>
  );
}

export default function LegalDocuments({ type }) {
  const isPrivacy = type === 'privacy';
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link to="/" className="legal-brand" aria-label="Conutria, inicio">
          <Logo size={42} />
        </Link>
        <Link className="legal-home-button" to="/">
          Volver a la página principal
        </Link>
      </header>
      <article className="legal-content">
        <span className="legal-eyebrow">Conutria · DOCUMENTO INFORMATIVO</span>
        <h1>{isPrivacy ? 'Aviso de privacidad' : 'Términos de uso'}</h1>
        <p className="legal-date">
          Última revisión del borrador: {revisionDate}
        </p>
        <DraftNotice />
        {isPrivacy ? <PrivacyNotice /> : <TermsOfUse />}
        <footer className="legal-footer">
          <Link to={isPrivacy ? '/terminos-de-uso' : '/aviso-de-privacidad'}>
            {isPrivacy
              ? 'Consultar términos de uso'
              : 'Consultar aviso de privacidad'}
          </Link>
          <Link to="/">Volver a la página principal</Link>
        </footer>
      </article>
    </main>
  );
}
