import { useEffect, useRef, useState } from "react";
import { fetchStressScenarios, sendStressMessage, type ChatMessage, type StressScenario } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";

export function StressSimulatorPage() {
  const { applicant } = useProfile();
  const { t } = useTranslation();

  const [scenarios, setScenarios] = useState<StressScenario[]>([]);
  const [scenario, setScenario] = useState<StressScenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchStressScenarios()
      .then((res) => setScenarios(res.scenarios))
      .catch(() => setScenarios([]));
  }, []);

  function startScenario(s: StressScenario) {
    setScenario(s);
    setMessages([{ role: "assistant", content: s.openingLine }]);
    setEnded(false);
    setError(null);
  }

  function backToPicker() {
    setScenario(null);
    setMessages([]);
    setInput("");
    setEnded(false);
    setError(null);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || sending || !scenario) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await sendStressMessage({
        scenarioId: scenario.id,
        message: text,
        history: messages,
        applicantId: applicant?.id,
      });
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
      if (/what went well/i.test(res.reply)) setEnded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the Stress Simulator.");
    } finally {
      setSending(false);
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  if (!scenario) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>{t("nav.stress")}</h1>
          <p>Practice handling a stressful business situation, and get feedback on how you responded.</p>
        </header>

        <div className="card-grid">
          {scenarios.map((s) => (
            <button key={s.id} className="card scenario-card" type="button" onClick={() => startScenario(s)}>
              <h3>{s.title}</h3>
              <p className="muted">{s.description}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>{scenario.title}</h1>
        <p>{scenario.description}</p>
      </header>

      <div className="card chat-card">
        <div className="chat-list" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={"chat-bubble chat-bubble-" + m.role}>
              {m.content}
            </div>
          ))}
          {sending && <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">Thinking...</div>}
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="chat-suggestions">
          <button type="button" className="chip-btn" onClick={backToPicker}>
            ← Choose a different scenario
          </button>
          {!ended && (
            <button type="button" className="chip-btn" onClick={() => sendMessage("Let's end the simulation — please give me my debrief.")} disabled={sending}>
              End simulation & get feedback
            </button>
          )}
        </div>

        {!ended && (
          <form className="chat-input-row" onSubmit={handleSend}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Respond to the situation..."
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()}>
              {t("common.submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
