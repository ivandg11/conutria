import { Link } from 'react-router-dom';
import Logo from '../components/Logo';
import './LegalDocuments.css';

const revisionDate = '20 de octubre de 2026';

function DraftNotice() {
  return (
    <aside className="legal-draft-notice">
      <strong>Borrador por completar</strong>
      <p>
        Antes de publicar Conutria para clientes, reemplaza los campos entre
        corchetes y pide una revisiÃƒÆ’Ã‚Â³n legal. No uses datos reales de pacientes
        mientras estos documentos sigan incompletos.
      </p>
    </aside>
  );
}

function PrivacyNotice() {
  return (
    <>
      <p className="legal-lead">
        Este aviso explica quÃ© informaciÃ³n se trata al crear una cuenta y usar
        Conutria, para quÃ© se utiliza y cÃ³mo puedes ejercer tus derechos.
      </p>
      <h2>1. Responsable y contacto</h2>
      <p>
        El responsable de los datos de cuenta y facturaciÃ³n de Conutria es{' '}
        <strong>
          Ivan Dominguez Gomez
        </strong>
        , quien opera bajo el nombre comercial Conutria, con domicilio en{' '}
        <strong>Av. Monteverde 3021, El FortÃ­n, Zapopan, Jalisco, C.P. 45066</strong>. Para dudas o
        solicitudes de privacidad, escribe a{' '}
        <a href="mailto:conutriaoficial@gmail.com">conutriaoficial@gmail.com</a>.
      </p>
      <h2>2. Datos que tratamos</h2>
      <ul>
        <li>
          <strong>Seguimiento semanal:</strong> cuando el paciente responde una
          invitaciÃ³n, se guardan sus calificaciones de adherencia, energÃ­a y
          hambre, las dificultades que decida compartir, la fecha de respuesta
          y la aceptaciÃ³n para compartirla con su nutriÃ³logo. El profesional
          puede agregar notas privadas de revisiÃ³n.
        </li>
        <li>
          <strong>Cuenta:</strong> nombre, correo electrÃ³nico, contraseÃ±a
          protegida mediante hash, actividad de acceso y datos tÃ©cnicos
          necesarios para mantener la sesiÃ³n.
        </li>
        <li>
          <strong>SuscripciÃ³n y soporte:</strong> plan, fechas y estado de la
          suscripciÃ³n, registros de pagos, solicitudes de soporte y mensajes.
        </li>
        <li>
          <strong>Datos de pacientes que registra el profesional:</strong>{' '}
          nombre, contacto, fecha de nacimiento, sexo, objetivos, alergias,
          antecedentes, notas, citas, consultas, mediciones corporales,
          recordatorios de alimentaciÃ³n, frecuencia de consumo y planes
          alimenticios. Parte de esta informaciÃ³n puede revelar el estado de
          salud y se considera sensible.
        </li>
        <li>
          <strong>Pago:</strong> Conutria recibe la confirmaciÃ³n y referencias
          de la transacciÃƒÆ’Ã‚Â³n. El pago se procesa en Stripe; Conutria no
          solicita en esta aplicaciÃƒÆ’Ã‚Â³n el nÃºmero completo de tarjeta ni el cÃ³digo
          de seguridad.
        </li>
      </ul>
      <h2>3. Finalidades</h2>
      <p>
        Usamos los datos de cuenta para crear y proteger el acceso, prestar las
        funciones contratadas, administrar pagos y suscripciÃ³nes, responder a
        soporte, prevenir fraude y atender obligaciones legales. Los datos de
        pacientes se alojan para que el profesional que contratÃ³ Conutria
        gestione su consulta, expedientes, citas y seguimiento.
      </p>
      <p>
        Conutria proporciona herramientas de organizaciÃ³n; no sustituye el
        criterio clÃƒÆ’Ã‚Â­nico ni presta atenciÃƒÆ’Ã‚Â³n nutricional a los pacientes del
        profesional. El profesional que incorpora los datos de sus pacientes
        debe determinar y documentar la base legal, informarles sobre el
        tratamiento y obtener los consentimientos que correspondan, incluidos
        los expresos y por escrito para datos sensibles cuando sean exigibles.
      </p>
      <h2>4. Roles respecto de los expedientes</h2>
      <p>
        Respecto de la cuenta del profesional, quien opera Conutria actÃºa como
        responsable de los datos necesarios para ofrecer la plataforma. Respecto
        de los expedientes de pacientes, la intenciÃ³n del servicio es que el
        profesional cliente determine las finalidades y opere como responsable,
        y que Conutria trate esos datos por cuenta e instrucciones del
        profesional para alojar y mostrar la informaciÃ³n. Esta asignaciÃ³n deberÃ¡
        reflejarse en el contrato y en las instrucciones reales del servicio.
      </p>
      <h2>5. Datos sensibles y consentimiento</h2>
      <p>
        Los expedientes pueden incluir datos sensibles de salud. El profesional
        debe contar con las autorizaciones y avisos aplicables antes de
        incorporarlos. El reconocimiento de este aviso por la persona que
        contrata Conutria no sustituye el consentimiento del paciente ni
        autoriza por sÃ­ mismo el tratamiento de sus datos sensibles.
      </p>
      <h2>6. Proveedores y comunicaciones</h2>
      <p>
        Para operar el servicio podemos apoyarnos en proveedores de alojamiento
        y base de datos (Render, Aiven y Cloudflare), procesamiento de pagos
        (Stripe) y envÃƒÆ’Ã‚Â­o de correo (Resend). Estos proveedores pueden
        procesar informaciÃ³n desde la ubicaciÃ³n de sus centros de datos conforme
        a sus servicios y contratos.{' '}
        La API se despliega en Render y la base de datos MySQL se aloja en
        Aiven. La regiÃ³n configurada para esta base debe confirmarse en el panel
        de Aiven; Aiven indica que los datos permanecen en la ubicaciÃ³n elegida
        por el cliente. Render y los demÃ¡s proveedores pueden tratar datos
        conforme a sus condiciones y contratos.
      </p>
      <p>
        No vendemos datos personales. Solo comunicaremos informaciÃ³n cuando sea
        necesario para prestar Conutria, exista una instrucciÃƒÆ’Ã‚Â³n vÃƒÆ’Ã‚Â¡lida del
        profesional cliente o lo requiera la ley.
      </p>
      <h2>7. ConservaciÃƒÆ’Ã‚Â³n, seguridad y eliminaciÃƒÆ’Ã‚Â³n</h2>
      <p>
        Conservamos los datos mientras la cuenta y sus fines estÃ©n vigentes, y
        durante los plazos necesarios para cumplir obligaciones legales o
        resolver responsabilidades. Al terminar el servicio, se definirÃ¡ el
        procedimiento para que el profesional exporte o solicite la eliminaciÃƒÆ’Ã‚Â³n
        de sus expedientes y el plazo de borrado de copias de respaldo.{' '}
        Los plazos especÃ­ficos de conservaciÃƒÆ’Ã‚Â³n y borrado de respaldos deben
        definirse en el procedimiento de retenciÃƒÆ’Ã‚Â³n antes de publicar la versiÃ³n
        definitiva.
      </p>
      <p>
        Aplicamos controles de acceso por cuenta, autenticaciÃ³n y medidas
        tÃ©cnicas razonables. NingÃºn medio de almacenamiento o transmisiÃ³n puede
        garantizar seguridad absoluta.
      </p>
      <h2>8. Derechos y solicitudes</h2>
      <p>
        Puedes solicitar acceso, rectificaciÃƒÆ’Ã‚Â³n, cancelaciÃ³n u oposiciÃƒÆ’Ã‚Â³n
        (derechos ARCO), revocar consentimientos cuando proceda o limitar el uso
        de tus datos escribiendo a{' '}
        <a href="mailto:conutriaoficial@gmail.com">conutriaoficial@gmail.com</a>.
        Indica tu nombre, correo de cuenta, derecho que deseas ejercer y medios
        para responderte. Para expedientes de pacientes, el profesional
        responsable debe atender la solicitud del paciente y coordinar con
        Conutria cuando sea necesario.
      </p>
      <h2>9. Cookies y sesiÃ³n</h2>
      <p>
        Conutria utiliza una cookie de sesiÃ³n necesaria, protegida como
        HTTP-only y, en producciÃƒÆ’Ã‚Â³n, Secure, para mantener la sesiÃ³n iniciada. No
        usamos esa cookie para publicidad.{' '}
        <strong>
          [CONFIRMAR SI EL SITIO USA ANALÃTICA, PIXELES U OTRAS COOKIES]
        </strong>
        .
      </p>
      <h2>10. Cambios al aviso</h2>
      <p>
        Publicaremos la versiÃ³n vigente en esta pÃ¡gina e indicaremos aquÃƒÆ’Ã‚Â­ la
        fecha de actualizaciÃƒÆ’Ã‚Â³n. Si un cambio altera finalidades que requieran
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
        organizaciÃ³n para profesionales de nutriciÃ³n. Al contratar, la persona
        usuaria acepta estas condiciones.
      </p>
      <h2>1. QuiÃ©n presta el servicio</h2>
      <p>
        Conutria es operada por{' '}
        <strong>Ivan Dominguez Gomez</strong>, con domicilio en{' '}
        <strong>Av. Monteverde 3021, El FortÃ­n, Zapopan, Jalisco, C.P. 45066</strong>.{' '}
        Contacto: <a href="mailto:conutriaoficial@gmail.com">conutriaoficial@gmail.com</a>.
      </p>
      <h2>2. Servicio y cuenta</h2>
      <p>
        Conutria ofrece herramientas para organizar pacientes, expedientes,
        citas, consultas, mediciones, planes alimenticios y soporte. La persona
        titular de la cuenta es responsable de mantener sus credenciales
        seguras, usar informaciÃ³n correcta y limitar el acceso a personal
        autorizado.
      </p>
      <h2>3. Planes y pagos</h2>
      <p>
        Los precios se muestran en dÃ³lares estadounidenses antes de iniciar el
        pago: plan de 7 dÃƒÆ’Ã‚Â­as por <strong>$1.99 USD cada 7 dÃƒÆ’Ã‚Â­as</strong>, plan
        mensual por <strong>$7.99 USD por periodo mensual</strong> y plan anual
        por <strong>$79.99 USD por periodo anual</strong>. Los planes se renuevan
        automÃ¡ticamente hasta que se cancelen desde Cuenta. El pago se
        realiza mediante Stripe. El importe y las condiciones se muestran
        antes de confirmar el pago.{' '}
        <strong>
          [CONFIRMAR IMPUESTOS, COMPROBANTES/FACTURACIÃƒÆ’Ã¢â‚¬Å“N Y SI LOS PRECIOS LOS
          INCLUYEN]
        </strong>
        .
      </p>
      <p>
        La suscripciÃ³n se cobra automaticamente al inicio de cada periodo. La renovaciÃ³n continua hasta que la persona usuaria la cancele desde Cuenta. Al cancelar, se detienen los cargos futuros y se conserva el acceso hasta que termine el periodo ya pagado.
      </p>
      <h2>4. CancelaciÃ³n y reembolsos</h2>
      <p>
        La persona usuaria puede cancelar desde la secciÃƒÆ’Ã‚Â³n Cuenta. La
        cancelaciÃ³n detiene la renovaciÃƒÆ’Ã‚Â³n del servicio, pero conserva el acceso
        hasta la fecha de tÃ©rmino del periodo ya pagado que aparece en su
        cuenta. La cancelaciÃ³n no genera por sÃ­ sola un reembolso ni revierte un
        pago ya procesado. Los derechos de reembolso que correspondan por ley no
        quedan limitados por esta clÃƒÆ’Ã‚Â¡usula.{' '}
        <strong>
          [CONFIRMAR QUE LA CUENTA Y EL CONTROL DE ACCESO RESPETEN ESTA REGLA
          ANTES DE PUBLICAR]
        </strong>
        .
      </p>
      <h2>5. Responsabilidad sobre los datos de pacientes</h2>
      <p>
        El profesional es responsable de contar con autorizaciÃ³n para registrar
        informaciÃ³n de sus pacientes, proporcionarles su aviso de privacidad,
        obtener los consentimientos requeridos y usar Conutria conforme a sus
        obligaciones profesionales. No registres datos de personas sin
        autorizaciÃ³n ni informaciÃ³n que no sea necesaria para la atenciÃƒÆ’Ã‚Â³n.
      </p>
      <p>
        Conutria es una herramienta administrativa y no diagnostica, prescribe
        ni sustituye la valoraciÃ³n profesional, la consulta clÃ­nica ni el juicio
        del nutriÃƒÆ’Ã‚Â³logo.
      </p>
      <h2>6. Uso permitido</h2>
      <p>
        No uses Conutria para actividades ilÃ­citas, acceder a cuentas ajenas,
        intentar comprometer la plataforma, cargar cÃ³digo malicioso o infringir
        derechos de otras personas. Podemos limitar temporalmente una cuenta
        ante un riesgo de seguridad o incumplimiento grave, procurando informar
        el motivo y permitir aclaraciones cuando sea posible.
      </p>
      <h2>7. Disponibilidad y soporte</h2>
      <p>
        Trabajamos para mantener Conutria disponible y atender solicitudes de
        soporte. Puede haber interrupciones por mantenimiento, fallas de
        proveedores o incidentes tÃ©cnicos. El plan de infraestructura actual
        puede tener periodos de inactividad y no incluye un compromiso de
        disponibilidad continua. MantÃ©n copias de la informaciÃ³n que necesites
        conservar y solicita asistencia para exportar datos antes de cerrar una
        cuenta.
      </p>
      <h2>8. Propiedad intelectual</h2>
      <p>
        La plataforma, su marca y sus componentes pertenecen a sus respectivos
        titulares. La persona usuaria conserva los derechos sobre la informaciÃ³n
        que incorpora y concede Ãºnicamente el permiso tÃƒÆ’Ã‚Â©cnico necesario para
        alojarla y prestarle el servicio.
      </p>
      <h2>9. TerminaciÃƒÆ’Ã‚Â³n</h2>
      <p>
        La persona usuaria puede dejar de usar el servicio y solicitar el cierre
        de su cuenta. Antes del cierre, debe exportar la informaciÃ³n que
        necesite conservar. El tratamiento y eliminaciÃƒÆ’Ã‚Â³n posteriores se
        sujetarÃ¡n al Aviso de Privacidad y a los plazos legales aplicables.
      </p>
      <h2>10. Cambios y contacto</h2>
      <p>
        Publicaremos cambios a estas condiciones en esta pÃ¡gina e indicaremos la
        fecha de actualizaciÃƒÆ’Ã‚Â³n. Para soporte o dudas contractuales escribe a{' '}
        <a href="mailto:conutriaoficial@gmail.com">conutriaoficial@gmail.com</a>.
      </p>
      <h2>11. LegislaciÃƒÆ’Ã‚Â³n aplicable</h2>
      <p>
        Estas condiciones se interpretarÃ¡n conforme a las leyes aplicables en
        MÃ©xico, respetando los derechos irrenunciables de las personas
        consumidoras.{' '}
        <strong>
          [CONFIRMAR DOMICILIO Y JURISDICCIÃ“N APLICABLE CON ASESORÃA LEGAL]
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
          Volver a la pÃ¡gina principal
        </Link>
      </header>
      <article className="legal-content">
        <span className="legal-eyebrow">Conutria Ã‚· DOCUMENTO INFORMATIVO</span>
        <h1>{isPrivacy ? 'Aviso de privacidad' : 'TÃ©rminos de uso'}</h1>
        <p className="legal-date">
          Ãšltima revisiÃƒÆ’Ã‚Â³n del borrador: {revisionDate}
        </p>
        <DraftNotice />
        {isPrivacy ? <PrivacyNotice /> : <TermsOfUse />}
        <footer className="legal-footer">
          <Link to={isPrivacy ? '/terminos-de-uso' : '/aviso-de-privacidad'}>
            {isPrivacy
              ? 'Consultar tÃ©rminos de uso'
              : 'Consultar aviso de privacidad'}
          </Link>
          <Link to="/">Volver a la pÃ¡gina principal</Link>
        </footer>
      </article>
    </main>
  );
}
