import {
  BulbFilled,
  CheckCircleFilled,
  ClockCircleOutlined,
  FlagFilled,
  InfoCircleFilled,
  LockFilled,
  SendOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App, Button, Card, Form, Input, Spin, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {getPlayerFinal, submitFinalAnswer, type FinalResponse} from "../api";
import "./FinalPage.css";

type FinalFormValues = {
  answer: string;
};

function getRemainingSeconds(nextAttemptAt: string | null) {
  if (!nextAttemptAt) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil((new Date(nextAttemptAt).getTime() - Date.now()) / 1000),
  );
}

export function FinalPage() {
  const navigate = useNavigate();
  const {message} = App.useApp();
  const {t} = useTranslation();
  const [form] = Form.useForm<FinalFormValues>();
  const [final, setFinal] = useState<FinalResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clockTick, setClockTick] = useState(() => Date.now());

  const refresh = useCallback(async () => {
    setFinal(await getPlayerFinal());
  }, []);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void refresh(), 0);
    const timer = window.setInterval(() => void refresh(), 3000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingCooldownSeconds = useMemo(() => {
    void clockTick;
    return getRemainingSeconds(final?.nextAttemptAt ?? null);
  }, [clockTick, final?.nextAttemptAt]);

  const isCoolingDown = remainingCooldownSeconds > 0;
  const canSubmit = Boolean(final?.canSubmit && !isCoolingDown);

  return (
    <Card className="final-cipher-card">
      <header className="final-cipher-heading">
        <span className="final-heading-icon" aria-hidden="true">
          <FlagFilled />
        </span>
        <div>
          <Typography.Title level={2}>{t("final.heading")}</Typography.Title>
        </div>
      </header>

      <div className="final-cipher-content">
        {!final ? (
          <section className="final-state-panel final-state-loading">
            <Spin size="large" />
            <div>
              <Typography.Title level={3}>{t("final.loadingTitle")}</Typography.Title>
              <Typography.Text>{t("final.loadingDescription")}</Typography.Text>
            </div>
          </section>
        ) : !final.isOpen ? (
          <section className="final-state-panel final-state-closed">
            <span className="final-state-icon" aria-hidden="true">
              <InfoCircleFilled />
            </span>
            <div>
              <Typography.Title level={3}>
                {t("final.notOpenTitle")}
              </Typography.Title>
              <Typography.Paragraph>
                {t("final.notOpenDescription", {
                  eventEndTime: final.eventEndTime,
                  finalStartsAt: final.finalStartsAt,
                })}
              </Typography.Paragraph>
            </div>
          </section>
        ) : final.blockedByActiveStation ? (
          <section className="final-state-panel final-state-warning">
            <span className="final-state-icon" aria-hidden="true">
              <LockFilled />
            </span>
            <div className="final-state-copy">
              <Typography.Title level={3}>
                {t("final.blockedTitle")}
              </Typography.Title>
              <Typography.Paragraph>
                {t("final.blockedDescription")}
              </Typography.Paragraph>
              {final.activeStationId && (
                <Button
                  type="primary"
                  onClick={() =>
                    navigate(`/stations/${final.activeStationId}`)
                  }>
                  {t("final.continueStation")}
                </Button>
              )}
            </div>
          </section>
        ) : final.teamSubmission ? (
          <section className="final-success-panel">
            <span className="final-success-icon" aria-hidden="true">
              <CheckCircleFilled />
            </span>
            <Typography.Text className="final-success-label">
              {t("final.solved")}
            </Typography.Text>
            <Typography.Title level={2}>{t("final.accepted")}</Typography.Title>
            <div className="final-success-results">
              <div>
                <TrophyFilled />
                <span>{t("common.rank")}</span>
                <strong>{final.teamSubmission.winnerRank ?? "-"}</strong>
              </div>
              <div>
                <span className="final-points-mark">+</span>
                <span>{t("common.bonus")}</span>
                <strong>
                  {final.teamSubmission.pointsAwarded} {t("common.points")}
                </strong>
              </div>
            </div>
          </section>
        ) : (
          <div className="final-play-panel">
            <section className="final-clue">
              <span className="final-clue-icon" aria-hidden="true">
                <BulbFilled />
              </span>
              <div>
                <Typography.Text>{t("final.clue")}</Typography.Text>
                <Typography.Paragraph>
                  {final.clueText || t("final.fallbackClue")}
                </Typography.Paragraph>
              </div>
            </section>

            {final.wrongAttemptCount > 0 && (
              <section
                className={`final-attempt-status ${
                  isCoolingDown ? "is-cooling-down" : ""
                }`}>
                <ClockCircleOutlined />
                <div>
                  <strong>
                    {t("final.wrongAttempt", {count: final.wrongAttemptCount})}
                  </strong>
                  <span>
                    {isCoolingDown ?
                      t("final.tryAgain", {seconds: remainingCooldownSeconds})
                    : t("final.canSubmit")}
                  </span>
                </div>
                {isCoolingDown && (
                  <span className="final-cooldown-count">
                    {remainingCooldownSeconds}
                  </span>
                )}
              </section>
            )}

            <Form
              form={form}
              layout="vertical"
              className="final-answer-form"
              onFinish={async ({answer}) => {
                if (isSubmitting) return;

                setIsSubmitting(true);
                try {
                  const result = await submitFinalAnswer(
                    answer.trim().toUpperCase(),
                  );
                  form.resetFields();
                  await refresh();
                  if (result.isCorrect) {
                    message.success(t("final.acceptedMessage"));
                  } else {
                    message.warning(t("final.wrongMessage"));
                  }
                } catch {
                  await refresh();
                  message.error(
                    t("errors.submitFailed"),
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}>
              <Form.Item
                label={t("final.yourAnswer")}
                name="answer"
                normalize={(value: string | undefined) =>
                  value ? value.toUpperCase() : value
                }
                rules={[{required: true, message: t("final.answerRequired")}]} >
                <Input
                  size="large"
                  autoComplete="off"
                  placeholder={t("final.placeholder")}
                  disabled={!canSubmit || isSubmitting}
                />
              </Form.Item>
              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                icon={<SendOutlined />}
                loading={isSubmitting}
                disabled={!canSubmit}>
                {t("final.submit")}
              </Button>
            </Form>
          </div>
        )}
      </div>
    </Card>
  );
}
