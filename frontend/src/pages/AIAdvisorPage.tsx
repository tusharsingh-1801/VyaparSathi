import { useEffect, useRef, useState } from "react";
import { getProactiveInsight, sendAdvisorMessage, type ChatMessage } from "../api/client";
import { useProfile } from "../context/ProfileContext";
import { useTranslation } from "../i18n/LanguageContext";
import { getPageContext } from "../utils/pageContext";

const SUGGESTED_QUESTIONS = [
  "Why is my safe loan smaller than the max loan?",
  "What risks should I watch for?",
  "Is my scheme the best fit for me?",
  "What should I do before I apply for the loan?",
];

export function AIAdvisorPage() {
  const { applicant } = useProfile();
  const { t } = useTranslation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const insightFetched = useRef(false);

  // Proactive: don't wait for the user to ask something — surface one specific insight
  // from their real data automatically as soon as the page opens.
  useEffect(() => {
    if (insightFetched.current) return;
    if (!applicant && !getPageContext()) return;
    insightFetched.current = true;

    setInsightLoading(true);
    getProactiveInsight(applicant?.id, getPageContext() ?? undefined)
      .then((res) => setMessages([{ role: "assistant", content: res.reply }]))
      .catch(() => {
        /* silent — proactive insight is a bonus, not required for the page to work */
      })
      .finally(() => setInsightLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicant]);

  async function sendMessage(text: string) {
    if (!text.trim() || sending) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setSending(true);

    try {
      const res = await sendAdvisorMessage({
        message: text,
        history: messages,
        applicantId: applicant?.id,
        pageContext: getPageContext() ?? undefined,
      });
      setMessages([...nextMessages, { role: "assistant", content: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the AI Advisor.");
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

  return (
    <div className="page">
      <header className="page-header">
        <h1>{t("nav.advisor")}</h1>
        <p>Grounded in your profile and saved analysis — not a generic chatbot.</p>
      </header>

      <div className="card chat-card">
        <div className="chat-list" ref={listRef}>
          {insightLoading && (
            <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">
              Looking at your profile for something worth flagging...
            </div>
          )}
          {!insightLoading && messages.length === 0 && (
            <p className="muted">Ask a question, or tap a suggestion below to get started.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={"chat-bubble chat-bubble-" + m.role}>
              {i === 0 && m.role === "assistant" && <div className="chat-bubble-tag">💡 Proactive insight</div>}
              {m.content}
            </div>
          ))}
          {sending && <div className="chat-bubble chat-bubble-assistant chat-bubble-loading">Thinking...</div>}
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="chat-suggestions">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button key={q} type="button" className="chip-btn" onClick={() => sendMessage(q)} disabled={sending}>
              {q}
            </button>
          ))}
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI Advisor..."
            disabled={sending}
          />
          <button type="submit" disabled={sending || !input.trim()}>
            {t("common.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
