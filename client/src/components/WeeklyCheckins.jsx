import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const scaleLabel = (value, low, high) => `${value}/5 · ${value <= 2 ? low : value >= 4 ? high : 'Intermedio'}`;

export default function WeeklyCheckins({ patient }) {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState({});

  async function loadCheckIns() {
    const { data } = await api.get(`/checkins/patients/${patient.id}`);
    setCheckIns(data);
    setReviewDrafts(Object.fromEntries(data.map((item) => [item.id, item.reviewNotes ?? ''])));
  }

  useEffect(() => {
    let active = true;
    api.get(`/checkins/patients/${patient.id}`)
      .then(({ data }) => {
        if (!active) return;
        setCheckIns(data);
        setReviewDrafts(Object.fromEntries(data.map((item) => [item.id, item.reviewNotes ?? ''])));
      })
      .catch(() => { if (active) setError('No se pudo cargar el seguimiento semanal.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [patient.id]);

  const summary = useMemo(() => {
    const recent = checkIns.slice(0, 4);
    if (!recent.length) return null;
    const average = (key) => (recent.reduce((total, item) => total + item[key], 0) / recent.length).toFixed(1);
    const change = (key) => recent.length < 2 ? null : (recent[0][key] - recent[recent.length - 1][key]).toFixed(1);
    return { count: recent.length, adherence: average('adherence'), energy: average('energy'), hunger: average('hunger'), adherenceChange: change('adherence'), energyChange: change('energy'), hungerChange: change('hunger') };
  }, [checkIns]);

  async function sendInvitation() {
    setSending(true);
    setError('');
    setNotice('');
    try {
      await api.post(`/checkins/patients/${patient.id}/invitations`);
      setNotice(`Enviamos la invitación a ${patient.email}. El enlace vence en 7 días.`);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo enviar la invitación.');
    } finally {
      setSending(false);
    }
  }

  async function saveReview(item) {
    setError('');
    try {
      await api.patch(`/checkins/patients/${patient.id}/${item.id}/review`, { reviewNotes: reviewDrafts[item.id] ?? '' });
      await loadCheckIns();
      setNotice('Seguimiento guardado como revisado.');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'No se pudo guardar la revisión.');
    }
  }

  return (
    <section className="space-y-4 rounded bg-white p-4 shadow" aria-labelledby="weekly-checkins-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="weekly-checkins-title" className="font-semibold">Seguimiento semanal</h2>
          <p className="mt-1 text-sm text-gray-500">Envía una invitación breve y revisa las respuestas antes de la consulta.</p>
        </div>
        <button type="button" className="rounded bg-emerald-700 px-4 py-2 text-sm text-white disabled:opacity-50" disabled={!patient.email || sending} onClick={sendInvitation}>
          {sending ? 'Enviando…' : 'Enviar invitación semanal'}
        </button>
      </div>
      {checkIns.some((item) => !item.reviewedAt) && <p className="text-sm font-semibold text-amber-800">{checkIns.filter((item) => !item.reviewedAt).length} respuesta(s) pendiente(s) de revisión.</p>}
      {!patient.email && <p className="text-sm text-amber-700">Agrega un correo al expediente del paciente para enviarle el seguimiento.</p>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {notice && <p className="text-sm text-emerald-800" role="status">{notice}</p>}
      {loading ? <p className="text-sm text-gray-500">Cargando respuestas…</p> : (
        <>
          {summary && (
            <div className="grid gap-3 sm:grid-cols-3" aria-label={`Resumen de las últimas ${summary.count} respuestas`}>
              <Summary label="Adherencia promedio" value={`${summary.adherence}/5`} change={summary.adherenceChange} count={summary.count} />
              <Summary label="Energía promedio" value={`${summary.energy}/5`} change={summary.energyChange} count={summary.count} />
              <Summary label="Hambre promedio" value={`${summary.hunger}/5`} change={summary.hungerChange} count={summary.count} />
            </div>
          )}
          <p className="text-xs text-gray-500">{summary ? `Promedio descriptivo de las ${summary.count} respuestas más recientes. No sustituye la valoración profesional.` : 'Aún no hay respuestas. Envía una invitación para iniciar el seguimiento.'}</p>
          <div className="space-y-3">
            {checkIns.map((item) => (
              <article key={item.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-medium">Respuesta del {new Date(item.submittedAt).toLocaleDateString('es-MX')}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.reviewedAt ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                    {item.reviewedAt ? 'Revisado' : 'Pendiente de revisión'}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <p><b>Adherencia:</b> {scaleLabel(item.adherence, 'Me costó', 'Casi todo')}</p>
                  <p><b>Energía:</b> {scaleLabel(item.energy, 'Muy baja', 'Muy alta')}</p>
                  <p><b>Hambre:</b> {scaleLabel(item.hunger, 'Muy baja', 'Muy alta')}</p>
                </div>
                {item.challenges && <p className="mt-3 whitespace-pre-wrap text-sm"><b>Dificultades:</b> {item.challenges}</p>}
                {item.reviewedAt ? (
                  <div className="mt-3 rounded-xl bg-emerald-50/70 p-3 text-sm">
                    <p className="font-semibold text-emerald-950">Nota de revisión</p>
                    <p className="mt-1 whitespace-pre-wrap text-emerald-950">{item.reviewNotes || 'Revisión completada sin notas.'}</p>
                    <p className="mt-2 text-xs text-emerald-800">Revisado el {new Date(item.reviewedAt).toLocaleDateString('es-MX')}</p>
                  </div>
                ) : (
                  <>
                    <label className="mt-3 grid gap-1 text-sm font-medium">Nota profesional para la siguiente consulta
                      <textarea rows="2" maxLength="1000" value={reviewDrafts[item.id] ?? ''} onChange={(event) => setReviewDrafts((previous) => ({ ...previous, [item.id]: event.target.value }))} placeholder="Notas privadas para tu revisión" />
                    </label>
                    <button type="button" className="mt-3 rounded bg-emerald-700 px-3 py-2 text-sm text-white" onClick={() => saveReview(item)}>
                      Guardar revisión
                    </button>
                  </>
                )}
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function Summary({ label, value, change, count }) {
  const delta = change === null ? null : Number(change);
  const signedDelta = delta === null ? null : `${delta > 0 ? '+' : ''}${delta.toFixed(1)}`;
  return <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-900">{label}</p><p className="mt-1 text-xl font-bold text-emerald-950">{value}</p><p className="mt-1 text-xs text-emerald-900">{signedDelta === null ? 'Una respuesta' : `${signedDelta} desde hace ${count - 1} ${count - 1 === 1 ? 'respuesta' : 'respuestas'}`}</p></div>;
}
