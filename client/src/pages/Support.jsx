import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

const formatDate = (value) => value
  ? new Date(value).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';
const ticketStatus = { OPEN: 'Abierto', IN_PROGRESS: 'En seguimiento', CLOSED: 'Cerrado' };

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replies, setReplies] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadTickets = useCallback(async () => {
    try {
      const response = await api.get('/auth/support-tickets');
      setTickets(response.data);
      setError('');
    } catch {
      setError('No pudimos cargar tus solicitudes. Intenta actualizar la página.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => active && loadTickets());
    return () => { active = false; };
  }, [loadTickets]);

  useEffect(() => {
    const timer = setInterval(loadTickets, 30000);
    return () => clearInterval(timer);
  }, [loadTickets]);

  async function createTicket(event) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/auth/support-tickets', { subject, message });
      setSubject('');
      setMessage('');
      await loadTickets();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos enviar tu solicitud.');
    } finally {
      setSending(false);
    }
  }

  async function replyTicket(ticketId, event) {
    event.preventDefault();
    const content = replies[ticketId]?.trim();
    if (!content) return;
    setSending(true);
    setError('');
    try {
      await api.post(`/auth/support-tickets/${ticketId}/messages`, { message: content });
      setReplies((current) => ({ ...current, [ticketId]: '' }));
      await loadTickets();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No pudimos enviar tu respuesta.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="account-page support-page">
      <header className="account-heading support-heading">
        <div><p className="account-eyebrow">TE ACOMPAÑAMOS</p><h1>Soporte</h1><p>Envía una solicitud y revisa las respuestas del equipo.</p></div>
      </header>

      {error && <p className="account-error" role="alert">{error}</p>}
      <section className="support-layout">
        <form className="account-card account-ticket-form support-compose" onSubmit={createTicket}>
          <label>Asunto<input required minLength={4} maxLength={160} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Por ejemplo: duda sobre mi suscripción" /></label>
          <label>¿En qué podemos ayudarte?<textarea required minLength={5} maxLength={5000} rows={4} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Cuéntanos qué ocurrió o qué necesitas." /></label>
          <button className="account-ticket-submit" disabled={sending} type="submit">{sending ? 'Enviando…' : 'Enviar solicitud'}</button>
        </form>
        <div className="account-card account-ticket-list support-tickets">
          <div className="support-list-heading"><div><p className="account-eyebrow">SEGUIMIENTO</p><h2>Mis solicitudes</h2></div></div>
          {loading ? <p className="account-muted">Cargando solicitudes…</p> : tickets.length === 0 ? <p className="account-muted">Todavía no has enviado solicitudes.</p> : tickets.map((ticket) => (
            <details className="account-ticket" key={ticket.id}>
              <summary className="account-ticket-title"><strong>{ticket.subject}</strong><span className={`account-status ${ticket.status === 'OPEN' ? 'is-active' : ''}`}>{ticketStatus[ticket.status] ?? ticket.status}</span><span className="support-ticket-chevron" aria-hidden="true">⌄</span></summary>
              <div className="account-ticket-messages">{ticket.messages.map((ticketMessage) => (
                <div className={`account-ticket-message ${ticketMessage.authorRole === 'ADMIN' ? 'is-admin' : ''}`} key={ticketMessage.id}>
                  <div><strong>{ticketMessage.authorRole === 'ADMIN' ? (ticketMessage.author?.name || 'Soporte') : 'Tú'}</strong><time>{formatDate(ticketMessage.createdAt)}</time></div>
                  <p>{ticketMessage.content}</p>
                </div>
              ))}</div>
              {ticket.status === 'CLOSED' && <p className="account-ticket-closed" role="status">Esta solicitud fue cerrada por soporte. Si necesitas más ayuda, puedes crear una nueva solicitud.</p>}
              {ticket.status !== 'CLOSED' && <form className="account-ticket-reply" onSubmit={(event) => replyTicket(ticket.id, event)}><textarea required maxLength={5000} rows={2} value={replies[ticket.id] || ''} onChange={(event) => setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Escribe una respuesta…" /><button type="submit" disabled={sending}>Responder</button></form>}
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
