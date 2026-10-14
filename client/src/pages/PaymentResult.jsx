import { Link, useSearchParams } from 'react-router-dom';
import './CheckoutPages.css';

export default function PaymentResult() {
  const [params] = useSearchParams();
  const status = params.get('status');
  const content = status === 'success'
    ? ['Estamos confirmando tu pago', 'Mercado Pago nos notificará el resultado. Cuando se confirme, recibirás un correo para crear tu contraseña.']
    : status === 'pending'
      ? ['Tu pago está pendiente', 'Te enviaremos el acceso cuando Mercado Pago confirme el pago.']
      : ['No se completó el pago', 'Puedes volver a los planes e intentarlo otra vez.'];

  return (
    <main className="nc-checkout-page">
      <section className="nc-checkout-panel nc-payment-result">
        <span className="nc-pricing-eyebrow">NUTRIA</span>
        <h1>{content[0]}</h1>
        <p>{content[1]}</p>
        <Link className="nc-checkout-submit nc-checkout-button-link" to="/planes">Ver planes</Link>
      </section>
    </main>
  );
}
