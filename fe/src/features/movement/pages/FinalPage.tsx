import {
  BulbFilled,
  CheckCircleFilled,
  ClockCircleOutlined,
  InfoCircleFilled,
  LockFilled,
  SendOutlined,
  TrophyFilled,
} from "@ant-design/icons";
import {App, Button, Card, Form, Input, Spin, Typography} from "antd";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useNavigate} from "react-router-dom";
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
          <BulbFilled />
        </span>
        <div>
          <Typography.Title level={2}>Final Cipher</Typography.Title>
        </div>
      </header>

      <div className="final-cipher-content">
        {!final ? (
          <section className="final-state-panel final-state-loading">
            <Spin size="large" />
            <div>
              <Typography.Title level={3}>Loading Final Challenge</Typography.Title>
              <Typography.Text>Checking the event status...</Typography.Text>
            </div>
          </section>
        ) : !final.isOpen ? (
          <section className="final-state-panel final-state-closed">
            <span className="final-state-icon" aria-hidden="true">
              <InfoCircleFilled />
            </span>
            <div>
              <Typography.Title level={3}>
                Final Challenge is not open yet
              </Typography.Title>
              <Typography.Paragraph>
                Stations close at <strong>{final.eventEndTime}</strong>. Final opens at{" "}
                <strong>{final.finalStartsAt}</strong>.
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
                Finish your active station first
              </Typography.Title>
              <Typography.Paragraph>
                Final Cipher is open, but your team must finish the current
                station before entering.
              </Typography.Paragraph>
              {final.activeStationId && (
                <Button
                  type="primary"
                  onClick={() =>
                    navigate(`/stations/${final.activeStationId}`)
                  }>
                  Continue Station
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
              Cipher solved
            </Typography.Text>
            <Typography.Title level={2}>Final answer accepted</Typography.Title>
            <div className="final-success-results">
              <div>
                <TrophyFilled />
                <span>Rank</span>
                <strong>{final.teamSubmission.winnerRank ?? "-"}</strong>
              </div>
              <div>
                <span className="final-points-mark">+</span>
                <span>Bonus</span>
                <strong>{final.teamSubmission.pointsAwarded} pts</strong>
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
                <Typography.Text>Final clue</Typography.Text>
                <Typography.Paragraph>
                  {final.clueText || "Enter the final keyword to solve the cipher."}
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
                    {final.wrongAttemptCount} wrong attempt
                    {final.wrongAttemptCount === 1 ? "" : "s"}
                  </strong>
                  <span>
                    {isCoolingDown ?
                      `Try again in ${remainingCooldownSeconds}s`
                    : "You can submit another answer now"}
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
                    message.success("Final answer accepted");
                  } else {
                    message.warning("Wrong answer. Cooldown applied.");
                  }
                } catch (error) {
                  await refresh();
                  message.error(
                    error instanceof Error ? error.message : "Submit failed",
                  );
                } finally {
                  setIsSubmitting(false);
                }
              }}>
              <Form.Item
                label="Your answer"
                name="answer"
                normalize={(value: string | undefined) =>
                  value ? value.toUpperCase() : value
                }
                rules={[{required: true, message: "Enter the final answer"}]}>
                <Input
                  size="large"
                  autoComplete="off"
                  placeholder="TYPE THE FINAL CIPHER"
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
                Submit Final Answer
              </Button>
            </Form>
          </div>
        )}
      </div>
    </Card>
  );
}
