import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import './WeeklyCheckin.css';

const emptyAnswers = { adherence: null, energy: null, hunger: null, challenges: '', consent: false };

export default function WeeklyCheckin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token] = useState(() => searchParams.get('token') ?? '');
  const [patient, setPatient] = useState(null);
  const [answers, setAnswers] = useState(emptyAnswers);
  const [loading, setLoading] = useState(() => Boolean(token));
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(() => token ? '' : 'El enlace no es válido. Pide una nueva invitación a tu nutriólogo.');

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    api.post('/checkins/public/lookup', { token })
      .then(({ data }) => {
        if (!active) return;
        setPatient(data);
        navigate('/seguimiento-semanal', { replace: true });
      })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.error || 'No se pudo validar el enlace.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, navigate]);

  async function submit(event) {
    event.preventDefault();
    setSending(true);
    setError('');
    try {
      await api.post('/checkins/public/submit', { ...answers, token });
      setSent(true);
      navigate('/seguimiento-semanal', { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo enviar tu respuesta.');
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="nc-checkin-page">
      <section className="nc-checkin-card" aria-labelledby="checkin-title">
        <div className="nc-checkin-brand"><img src="/apple-touch-icon.png" alt="" width="40" height="40" /><span>Conutria</span></div>
        {loading ? <p role="status">Validando tu invitación…</p> : sent ? (
          <div className="nc-checkin-success">
            <span className="nc-checkin-success-icon" aria-hidden="true">✓</span>
            <p className="nc-checkin-eyebrow">RESPUESTA ENVIADA</p>
            <h1 id="checkin-title">Gracias por compartir cómo te fue</h1>
            <p>Tu nutriólogo revisará esta información antes de tu próxima consulta.</p>
          </div>
        ) : patient ? (
          <>
            <p className="nc-checkin-eyebrow">SEGUIMIENTO SEMANAL</p>
            <h1 id="checkin-title">Hola, {patient.firstName}</h1>
            <p className="nc-checkin-intro">Cuéntanos brevemente cómo te fue esta semana. Tus respuestas las revisará {patient.nutritionistName}.</p>
            <form onSubmit={submit} className="nc-checkin-form">
              <ScoreQuestion name="adherence" title="¿Qué tan bien pudiste seguir tu plan?" low="Me costó mucho" high="Casi todo" value={answers.adherence} onChange={setAnswers} />
              <ScoreQuestion name="energy" title="¿Cómo estuvo tu energía en general?" low="Muy baja" high="Muy alta" value={answers.energy} onChange={setAnswers} />
              <ScoreQuestion name="hunger" title="¿Cómo estuvo tu sensación de hambre?" low="Muy baja" high="Muy alta" value={answers.hunger} onChange={setAnswers} />
              <label className="nc-checkin-label">¿Hubo alguna dificultad que quieras comentar? <span>Opcional</span>
                <textarea maxLength={500} rows={4} value={answers.challenges} onChange={(event) => setAnswers((current) => ({ ...current, challenges: event.target.value }))} placeholder="Por ejemplo, horarios, alimentos o situaciones que te dificultaron seguir el plan" />
              </label>
              <label className="nc-checkin-consent"><input type="checkbox" checked={answers.consent} onChange={(event) => setAnswers((current) => ({ ...current, consent: event.target.checked }))} /><span>Acepto compartir estas respuestas con {patient.nutritionistName} para que las revise y las incorpore a mi seguimiento nutricional.</span></label>
              {error && <p className="nc-checkin-error" role="alert">{error}</p>}
              <button className="nc-checkin-submit" type="submit" disabled={sending || !answers.consent || [answers.adherence, answers.energy, answers.hunger].some((score) => !Number.isInteger(score))}>{sending ? 'Enviando…' : 'Enviar respuestas'}</button>
            </form>
            <p className="nc-checkin-privacy">Este enlace privado vence el {new Date(patient.expiresAt).toLocaleDateString('es-MX')} y solo se puede usar una vez.</p>
          </>
        ) : (
          <div className="nc-checkin-error-state"><h1 id="checkin-title">No pudimos abrir el seguimiento</h1><p role="alert">{error}</p><p>Pide a tu nutriólogo que te envíe una nueva invitación.</p></div>
        )}
      </section>
    </main>
  );
}

function ScoreQuestion({ name, title, low, high, value, onChange }) {
  return (
    <fieldset className="nc-checkin-scale">
      <legend>{title}</legend>
      <div className="nc-checkin-options">
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className={Number(value) === score ? 'is-selected' : ''}>
            <input type="radio" name={name} value={score} checked={Number(value) === score} onChange={() => onChange((current) => ({ ...current, [name]: score }))} />
            <span>{score}</span>
          </label>
        ))}
      </div>
      <div className="nc-checkin-scale-hints"><span>{low}</span><span>{high}</span></div>
    </fieldset>
  );
}
