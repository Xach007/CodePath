import { useState } from "react";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { HelpCircle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const SUPPORT_MESSAGE_MAX_LENGTH = 2000;

export default function Help() {
  const { data: user, isLoading } = useGetMe();
  const { t } = useTranslation();
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [isSendingSupport, setIsSendingSupport] = useState(false);

  const handleSendSupportMessage = async () => {
    const message = supportMessage.trim();
    const subject = supportSubject.trim();
    if (message.length < 5) {
      toast.error(t("support.messageTooShort"));
      return;
    }

    try {
      setIsSendingSupport(true);
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          message,
          pageUrl: window.location.href,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setSupportSubject("");
        setSupportMessage("");
        toast.success(t("support.sent"));
        return;
      }

      if ((response.status === 503 || response.status === 500) && typeof data.mailto === "string") {
        window.location.href = data.mailto;
        toast.message(t("support.mailClientOpened"));
        return;
      }

      throw new Error(data.error || "Could not send support message");
    } catch {
      toast.error(t("support.failed"));
    } finally {
      setIsSendingSupport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="help-loading">
        <Skeleton className="help-loading-skeleton" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="help-page"
    >
      <Card className="help-card">
        <CardContent className="help-card-content">
          <div className="help-hero">
            <div className="help-hero-icon-wrap">
              <HelpCircle className="help-hero-icon" />
            </div>
            <div>
              <h1 className="help-title">{t("support.title")}</h1>
              <p className="help-subtitle">{t("support.subtitle")}</p>
            </div>
          </div>

          <form
            className="help-form"
            onSubmit={(event) => {
              event.preventDefault();
              handleSendSupportMessage();
            }}
          >
            <div className="help-form-group">
              <label className="help-label" htmlFor="support-subject">
                {t("support.subject")}
              </label>
              <Input
                id="support-subject"
                value={supportSubject}
                onChange={(event) => setSupportSubject(event.target.value.slice(0, 120))}
                placeholder={t("support.subjectPlaceholder")}
                disabled={isSendingSupport}
              />
            </div>

            <div className="help-form-group">
              <label className="help-label" htmlFor="support-message">
                {t("support.message")}
              </label>
              <Textarea
                id="support-message"
                value={supportMessage}
                onChange={(event) => setSupportMessage(event.target.value.slice(0, SUPPORT_MESSAGE_MAX_LENGTH))}
                placeholder={t("support.messagePlaceholder")}
                className="help-message-input"
                disabled={isSendingSupport}
              />
              <div className="help-form-meta">
                <span>{t("support.destination")}</span>
                <span>{supportMessage.length}/{SUPPORT_MESSAGE_MAX_LENGTH}</span>
              </div>
            </div>

            <div className="help-submit-row">
              <Button
                type="submit"
                disabled={supportMessage.trim().length < 5 || isSendingSupport}
                className="help-submit-btn"
              >
                <Send className="help-submit-btn-icon" />
                {isSendingSupport ? t("support.sending") : t("support.send")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
